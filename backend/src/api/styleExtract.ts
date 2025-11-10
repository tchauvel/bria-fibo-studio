import { Router, Request, Response } from 'express';
import multer from 'multer';
import { BriaApiClient } from '../services/briaApi';
import { generateProfileName } from '../utils/profileNameGenerator';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 20, // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common image MIME types and also check file extension as fallback
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/x-png', // Some browsers send this for PNG
      'image/pjpeg', // Some browsers send this for JPEG
    ];
    
    // Get file extension from original name
    const fileExt = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    // Accept if MIME type is allowed OR extension is allowed
    if (allowedTypes.includes(file.mimetype) || (fileExt && allowedExtensions.includes(fileExt))) {
      console.log('File accepted:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: fileExt,
      });
      cb(null, true);
    } else {
      console.error('File rejected:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: fileExt,
      });
      cb(new Error(`Invalid file type: ${file.mimetype || 'unknown'}. Only JPEG, PNG, and WebP are allowed.`));
    }
  },
});

// Initialize Bria API client
const getBriaClient = (): BriaApiClient => {
  const apiKey = process.env.BRIA_API_KEY;
  // Bria API v2 base URL from official documentation
  // See: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
  const apiUrl = process.env.BRIA_API_URL || 'https://engine.prod.bria-api.com/v2';

  if (!apiKey) {
    throw new Error('BRIA_API_KEY is not configured');
  }

  console.log('Bria API Client initialized:', {
    baseURL: apiUrl,
    hasApiKey: !!apiKey,
    authHeader: 'api_token',
    version: 'v2',
  });

  return new BriaApiClient({ apiKey, baseURL: apiUrl });
};

// Multer error handler
const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 10MB per file.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files allowed.' });
    }
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// POST /api/style-extract - Upload 5 images, returns StyleProfile JSON
router.post('/', upload.array('images', 5), handleMulterError, async (req: Request, res: Response) => {
  // Set a longer timeout for file processing
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  
  try {
    const files = req.files as Express.Multer.File[];

    console.log('Style extract request received:', {
      fileCount: files?.length || 0,
      hasFiles: !!files,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Note: Bria API v2 currently supports only 1 image per request
    // See: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
    // We'll process images one at a time and combine results
    if (files.length < 1) {
      return res.status(400).json({ error: 'At least 1 image is required' });
    }
    
    if (files.length > 20) {
      return res.status(400).json({ error: `Maximum 20 images allowed, received ${files.length}` });
    }

    // Validate file buffers
    const imageBuffers: Buffer[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ error: `File ${i + 1} (${file.originalname}) has no data or is corrupted` });
      }
      if (file.buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: `File ${i + 1} (${file.originalname}) exceeds 10MB limit` });
      }
      imageBuffers.push(file.buffer);
    }

    console.log('Files validated, calling Bria API for style extraction...', {
      imageCount: imageBuffers.length,
      totalSize: imageBuffers.reduce((sum, buf) => sum + buf.length, 0),
    });

    const client = getBriaClient();
    
    // Bria API v2 supports only 1 image per request
    // Process images one at a time and combine results into a StyleProfile
    const structuredPrompts = [];
    const errors = [];
    
    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`Processing image ${i + 1} of ${imageBuffers.length}...`);
      try {
        const result = await client.extractStyle([imageBuffers[i]]);
        
        // Log the actual structured_prompt to understand its format
        console.log(`[Image ${i}] Raw structured_prompt:`, result.structured_prompt);
        
        // Try to parse it to see the JSON structure
        try {
          const parsed = JSON.parse(result.structured_prompt);
          console.log(`[Image ${i}] Parsed structured_prompt keys:`, Object.keys(parsed));
          console.log(`[Image ${i}] Full structure:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`[Image ${i}] structured_prompt is not JSON:`, result.structured_prompt.substring(0, 200));
        }
        
        structuredPrompts.push({
          ...result,
          imageIndex: i,
        });
      } catch (error: any) {
        console.error(`Error processing image ${i + 1}:`, error.message);
        errors.push({
          imageIndex: i,
          error: error.message,
        });
      }
    }

    console.log('Style extraction completed', {
      total: imageBuffers.length,
      successful: structuredPrompts.length,
      failed: errors.length,
    });

    // Generate profile name
    let profileName: string;
    
    // 1. Use custom name if provided by user
    if (req.body.profile_name && req.body.profile_name.trim()) {
      profileName = req.body.profile_name.trim();
      console.log('Using custom profile name:', profileName);
    }
    // 2. Auto-generate from style attributes
    else if (structuredPrompts.length > 0) {
      profileName = generateProfileName(structuredPrompts);
      console.log('Auto-generated profile name:', profileName);
    }
    // 3. Fallback to timestamp
    else {
      profileName = `Style Profile - ${new Date().toISOString()}`;
      console.log('Using fallback profile name:', profileName);
    }
    
    // Return StyleProfile with all structured prompts
    res.json({
      name: profileName,
      createdAt: new Date().toISOString(),
      images: structuredPrompts,
      processedImages: imageBuffers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Style extract error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // If it's a 400 error from Bria API, return 400 with the error message
    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = error.response?.data || {};
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: errorDetails,
      briaApiError: errorDetails,
    });
  }
});

export default router;

