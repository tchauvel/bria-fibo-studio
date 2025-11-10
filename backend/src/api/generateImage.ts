import { Router, Request, Response } from 'express';
import { BriaApiClient } from '../services/briaApi';
import { parseStructuredPrompt, createStyleTransferPrompt, createStyleOnlyStructuredPrompt, StyleDNA } from '../utils/styleDnaParser';

const router = Router();

// Initialize Bria API client
const getBriaClient = (): BriaApiClient => {
  const apiKey = process.env.BRIA_API_KEY;
  const apiUrl = process.env.BRIA_API_URL || 'https://engine.prod.bria-api.com/v2';

  if (!apiKey) {
    throw new Error('BRIA_API_KEY is not configured');
  }

  return new BriaApiClient({ apiKey, baseURL: apiUrl });
};

// POST /api/generate-image - Generate image using structured prompt
router.post('/', async (req: Request, res: Response) => {
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);

  try {
    const { structured_prompt, prompt, seed, use_style_dna_parser } = req.body;

    console.log('Image generation request received:', {
      hasStructuredPrompt: !!structured_prompt,
      hasPrompt: !!prompt,
      hasSeed: !!seed,
      useStyleDnaParser: use_style_dna_parser,
    });

    // Validation - need at least one of structured_prompt or prompt
    if (!structured_prompt && !prompt) {
      return res.status(400).json({ 
        error: 'Either structured_prompt or prompt is required' 
      });
    }

    if (structured_prompt && typeof structured_prompt !== 'string') {
      return res.status(400).json({ 
        error: 'structured_prompt must be a string' 
      });
    }

    let finalPrompt = prompt;
    let finalStructuredPrompt = structured_prompt;
    let styleDNA: StyleDNA | null = null;

    // If style DNA parsing is enabled, extract style attributes and create enhanced text prompt
    // NOTE: Bria API requires ALL fields in structured_prompt (short_description, objects, etc.)
    // We can't send a partial structured_prompt, so we use text-only approach instead
    if (use_style_dna_parser && structured_prompt) {
      console.log('🧬 Style DNA Parser ENABLED - Text-only approach (Bria requires all fields in structured_prompt)');
      console.log('📥 Input structured_prompt:', structured_prompt.substring(0, 200));
      
      try {
        styleDNA = parseStructuredPrompt(structured_prompt);
        console.log('🔍 Extracted StyleDNA:', JSON.stringify(styleDNA, null, 2));
        
        // Create enhanced text prompt with extracted style
        if (styleDNA && Object.keys(styleDNA).length > 1) {
          finalPrompt = createStyleTransferPrompt(prompt || '', styleDNA);
          finalStructuredPrompt = undefined; // Don't send structured_prompt
          console.log('✨ Enhanced text prompt:', finalPrompt);
          console.log('⚠️  NOT sending structured_prompt (would require scene fields)');
        } else {
          console.warn('⚠️  No style attributes extracted');
          finalPrompt = prompt;
          finalStructuredPrompt = undefined;
        }
      } catch (parseError: any) {
        console.error('❌ Error parsing structured_prompt:', parseError.message);
        // Fallback: use simple prompt
        finalPrompt = prompt;
        finalStructuredPrompt = undefined;
      }
    } else {
      console.log('🔄 Style DNA Parser DISABLED - Using raw structured_prompt');
      // This will recreate similar scenes but with strong style transfer
    }

    const client = getBriaClient();
    
    // Build request payload
    const requestPayload: any = {
      prompt: finalPrompt,
      seed,
      sync: true,
    };
    
    // Only include structured_prompt if DNA parser is disabled
    if (finalStructuredPrompt) {
      requestPayload.structured_prompt = finalStructuredPrompt;
      console.log('📦 Sending WITH structured_prompt');
      console.log('📦 Structured prompt length:', finalStructuredPrompt.length, 'chars');
    } else {
      console.log('📦 Sending WITHOUT structured_prompt');
    }
    
    console.log('🚀 Full request to Bria:', JSON.stringify(requestPayload, null, 2));
    
    const result = await client.generateImage(requestPayload);

    console.log('Image generation successful:', {
      hasImageUrl: !!result.image_url,
      seed: result.seed,
      usedStyleDNA: !!styleDNA,
    });

    res.json({
      ...result,
      style_dna: styleDNA, // Include extracted style DNA in response
    });
  } catch (error: any) {
    console.error('❌ Image generation error:');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Stack:', error.stack);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = error.response?.data || {};
    
    // Better error formatting for frontend
    let formattedError = '';
    try {
      formattedError = typeof errorDetails === 'object' 
        ? JSON.stringify(errorDetails, null, 2)
        : String(errorDetails);
    } catch (e) {
      formattedError = 'Could not format error details';
    }

    // Create a detailed error message
    const detailedMessage = statusCode === 422 
      ? `Bria validation error: ${formattedError || 'Invalid request format'}`
      : `${errorMessage}${formattedError ? ': ' + formattedError : ''}`;

    res.status(statusCode).json({
      error: detailedMessage,
      details: errorDetails,
      briaApiError: errorDetails,
      statusCode,
      originalMessage: errorMessage,
    });
  }
});

export default router;

