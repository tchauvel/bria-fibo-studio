import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { retryWithBackoff } from '../utils/retry';
import { Preset } from '../schemas/preset';

export interface BriaApiConfig {
  apiKey: string;
  baseURL: string;
}

export interface PreviewRequest {
  preset: Preset;
  prompt?: string;
  negativePrompt?: string;
}

export interface PreviewResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: string[];
  error?: string;
}

export interface StyleExtractRequest {
  images: Buffer[];
}

export interface StyleExtractResponse {
  seed: number;
  structured_prompt: string; // JSON string from Bria API
  imageIndex?: number;
}

export interface ImageGenerateRequest {
  structured_prompt?: string; // Optional - not needed when using Style DNA parser
  prompt?: string;
  seed?: number;
  sync?: boolean;
}

export interface ImageGenerateResponse {
  image_url: string;
  seed: number;
  request_id?: string;
  status_url?: string;
}

export interface BatchRequest {
  items: Array<{
    preset: Preset;
    prompt: string;
    negativePrompt?: string;
  }>;
}

export interface BatchResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems?: number;
  completedItems?: number;
  failedItems?: number;
  downloadUrl?: string;
  manifestUrl?: string;
}

export class BriaApiClient {
  private client: AxiosInstance;

  constructor(config: BriaApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'api_token': config.apiKey, // Bria API uses 'api_token' header, not 'Authorization: Bearer'
        // Content-Type will be set by FormData for file uploads or application/json
      },
      timeout: 120000, // 120 seconds for file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }

  async preview(request: PreviewRequest): Promise<PreviewResponse> {
    return retryWithBackoff(async () => {
      try {
        // Map Preset to FIBO JSON format
        const fiboPayload = this.mapPresetToFIBO(request.preset, request.prompt, request.negativePrompt);
        
        const response = await this.client.post('/fibo/generate', fiboPayload);
        
        // Poll for status
        const requestId = response.data.request_id || response.data.id;
        return await this.pollPreviewStatus(requestId);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Bria API error: ${error.response?.data?.message || error.message}`);
        }
        throw error;
      }
    });
  }

  async pollStyleExtractStatus(requestId: string, statusUrl?: string): Promise<StyleExtractResponse> {
    const maxPolls = 30;
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxPolls; i++) {
      try {
        const url = statusUrl || `/status/${requestId}`;
        const response = await this.client.get(url);
        const status = response.data.status;

        if (status === 'COMPLETED') {
          const result = response.data.result || response.data;
          return {
            seed: result.seed || 0,
            structured_prompt: result.structured_prompt || JSON.stringify(result),
          };
        }

        if (status === 'ERROR') {
          throw new Error(response.data.error?.message || 'Style extraction failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (i === maxPolls - 1) {
          throw new Error('Polling timeout for style extraction');
        }
      }
    }

    throw new Error('Polling timeout for style extraction');
  }

  async pollPreviewStatus(requestId: string): Promise<PreviewResponse> {
    const maxPolls = 30;
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxPolls; i++) {
      try {
        const response = await this.client.get(`/fibo/status/${requestId}`);
        const status = response.data.status;

        if (status === 'completed') {
          return {
            requestId,
            status: 'completed',
            images: response.data.images || [],
          };
        }

        if (status === 'failed') {
          return {
            requestId,
            status: 'failed',
            error: response.data.error || 'Generation failed',
          };
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (i === maxPolls - 1) {
          throw new Error('Polling timeout');
        }
      }
    }

    throw new Error('Polling timeout');
  }

  async extractStyle(images: Buffer[]): Promise<StyleExtractResponse> {
    return retryWithBackoff(async () => {
      try {
        console.log('Creating request for style extraction...', {
          imageCount: images.length,
          baseURL: this.client.defaults.baseURL,
        });

        // According to Bria API docs: Images should be Base64-encoded in JSON format
        // Per docs: "do not include the Base64 headers (e.g., data:image/png;base64,)"
        // The API expects only the raw encoded string
        const base64Images = images.map((buffer, index) => {
          if (!buffer || buffer.length === 0) {
            throw new Error(`Image ${index + 1} is empty or invalid`);
          }
          // Convert to Base64 without data URI prefix (as per Bria docs)
          return buffer.toString('base64');
        });

        // Bria API v2 format: JSON with Base64 images
        // Per docs: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
        // The 'images' parameter supports "Currently supports a single image" (<= 1 items)
        // So we only process one image at a time
        if (base64Images.length !== 1) {
          throw new Error('Bria API v2 supports only 1 image per request. Please send images one at a time.');
        }

        // Use /structured_prompt/generate endpoint to extract style from image
        // This endpoint can take an image and generate a structured prompt
        const jsonPayload = {
          images: [base64Images[0]], // Single image as array
          sync: false, // Use async processing (default in V2)
        };

        console.log('Sending JSON request with Base64 image to Bria API:', {
          endpoint: '/structured_prompt/generate',
          imageCount: 1,
          imageSize: images[0].length,
          baseURL: this.client.defaults.baseURL,
          format: 'Base64 JSON',
        });

        const response = await this.client.post('/structured_prompt/generate', jsonPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        console.log('Bria API response received:', {
          status: response.status,
          hasData: !!response.data,
          hasRequestId: !!response.data.request_id,
          hasStatusUrl: !!response.data.status_url,
        });

        // Handle async response (V2 default)
        if (response.status === 202 && response.data.status_url) {
          // Async request - need to poll status
          const requestId = response.data.request_id;
          const statusUrl = response.data.status_url;
          
          console.log('Async request initiated, polling for status...', {
            requestId,
            statusUrl,
          });
          
          // Poll for completion
          return await this.pollStyleExtractStatus(requestId, statusUrl);
        }

        // Synchronous response (if sync=true was used)
        const result = response.data.result || response.data;
        return {
          seed: result.seed || 0,
          structured_prompt: result.structured_prompt || JSON.stringify(result),
        };
      } catch (error) {
        console.error('Style extraction API error:', {
          isAxiosError: axios.isAxiosError(error),
          message: error instanceof Error ? error.message : String(error),
          response: axios.isAxiosError(error) ? {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          } : undefined,
        });

        if (axios.isAxiosError(error)) {
          // Handle DNS/network errors
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('Network error connecting to Bria API:', {
              code: error.code,
              message: error.message,
              hostname: error.config?.url || 'unknown',
              baseURL: this.client.defaults.baseURL,
            });
            throw new Error(`Cannot connect to Bria API: ${error.message}. Please check your internet connection and API URL configuration.`);
          }
          
          const errorData = error.response?.data;
          const errorMessage = errorData?.message 
            || errorData?.error
            || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData))
            || error.message;
          const statusCode = error.response?.status;
          
          // Log full error response for debugging
          console.error('Full Bria API error response:', {
            status: statusCode,
            statusText: error.response?.statusText,
            data: errorData,
            headers: error.response?.headers,
          });
          
          throw new Error(`Bria API error (${statusCode}): ${errorMessage}`);
        }
        throw error;
      }
    });
  }

  async generateImage(request: ImageGenerateRequest): Promise<ImageGenerateResponse> {
    return retryWithBackoff(async () => {
      try {
        console.log('Creating image generation request...', {
          hasStructuredPrompt: !!request.structured_prompt,
          hasPrompt: !!request.prompt,
          hasSeed: !!request.seed,
          baseURL: this.client.defaults.baseURL,
        });

        // Bria API v2 /image/generate endpoint
        // See: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
        // 
        // Two modes:
        // 1. WITH structured_prompt: Uses full scene description (may recreate original subjects)
        // 2. WITHOUT structured_prompt: Uses only prompt + seed (pure style transfer)
        const payload: any = {
          sync: request.sync !== false, // Default to synchronous for simpler handling
        };

        // Only add structured_prompt if provided
        // When DNA parser is enabled, this should be undefined to avoid subject recreation
        if (request.structured_prompt) {
          payload.structured_prompt = request.structured_prompt;
        }

        if (request.prompt) {
          payload.prompt = request.prompt;
        }

        // IMPORTANT: Seed must be included for style consistency
        if (request.seed !== undefined) {
          payload.seed = request.seed;
        }

        console.log('Sending image generation request to Bria API:', {
          endpoint: '/image/generate',
          mode: payload.structured_prompt ? 'WITH structured_prompt (full scene)' : 'WITHOUT structured_prompt (style transfer only)',
          hasStructuredPrompt: !!payload.structured_prompt,
          hasPrompt: !!payload.prompt,
          seed: payload.seed,
          sync: payload.sync,
          promptPreview: payload.prompt?.substring(0, 150),
        });

        const response = await this.client.post('/image/generate', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes for image generation
        });

        console.log('Bria API image generation response received:', {
          status: response.status,
          hasData: !!response.data,
          hasImageUrl: !!response.data.result?.image_url || !!response.data.image_url,
          hasRequestId: !!response.data.request_id,
          hasStatusUrl: !!response.data.status_url,
          returnedSeed: response.data.result?.seed || response.data.seed,
          requestedSeed: request.seed,
        });

        // Handle async response (202)
        if (response.status === 202 && response.data.status_url) {
          const requestId = response.data.request_id;
          const statusUrl = response.data.status_url;
          
          console.log('Async request initiated, polling for status...', {
            requestId,
            statusUrl,
          });
          
          return await this.pollImageGeneration(requestId, statusUrl);
        }

        // Synchronous response (200)
        const result = response.data.result || response.data;
        return {
          image_url: result.image_url || result.images?.[0],
          seed: result.seed || request.seed || 0,
          request_id: response.data.request_id,
        };
      } catch (error) {
        console.error('Image generation API error:', {
          isAxiosError: axios.isAxiosError(error),
          message: error instanceof Error ? error.message : String(error),
          response: axios.isAxiosError(error) ? {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          } : undefined,
        });

        if (axios.isAxiosError(error)) {
          // Handle DNS/network errors
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            throw new Error(`Cannot connect to Bria API: ${error.message}. Please check your internet connection and API URL configuration.`);
          }
          
          const errorData = error.response?.data;
          const statusCode = error.response?.status;
          
          // Log the full error data for debugging
          console.error('🚨 Bria API Error Details:');
          console.error('Status:', statusCode);
          console.error('Error Data:', errorData);
          console.error('Error Data Type:', typeof errorData);
          if (errorData && typeof errorData === 'object') {
            console.error('Error Data Keys:', Object.keys(errorData));
            console.error('Error Field:', errorData.error);
            console.error('Message Field:', errorData.message);
          }
          
          let errorMessage = '';
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            // error field might be a string or object
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (typeof errorData.error === 'object') {
              errorMessage = JSON.stringify(errorData.error, null, 2);
            }
          } else {
            errorMessage = error.message;
          }
          
          throw new Error(`Bria API error (${statusCode}): ${errorMessage}`);
        }
        throw error;
      }
    });
  }

  async pollImageGeneration(requestId: string, statusUrl?: string): Promise<ImageGenerateResponse> {
    const maxPolls = 60; // 2 minutes max
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxPolls; i++) {
      try {
        const url = statusUrl || `/status/${requestId}`;
        const response = await this.client.get(url);
        const status = response.data.status;

        console.log(`Polling attempt ${i + 1}/${maxPolls}:`, {
          status,
          requestId,
        });

        if (status === 'COMPLETED' || status === 'completed') {
          const result = response.data.result || response.data;
          return {
            image_url: result.image_url || result.images?.[0],
            seed: result.seed || 0,
            request_id: requestId,
          };
        }

        if (status === 'ERROR' || status === 'failed') {
          throw new Error(response.data.error?.message || 'Image generation failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (i === maxPolls - 1) {
          throw new Error('Polling timeout for image generation');
        }
        // If it's an error response, throw it
        if (axios.isAxiosError(error) && error.response?.status) {
          throw error;
        }
      }
    }

    throw new Error('Polling timeout for image generation');
  }

  async createBatch(request: BatchRequest): Promise<BatchResponse> {
    return retryWithBackoff(async () => {
      try {
        const payload = {
          items: request.items.map(item => ({
            ...this.mapPresetToFIBO(item.preset, item.prompt, item.negativePrompt),
          })),
        };

        const response = await this.client.post('/fibo/batch', payload);
        
        return {
          jobId: response.data.job_id || response.data.id,
          status: 'pending',
          totalItems: request.items.length,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Bria API error: ${error.response?.data?.message || error.message}`);
        }
        throw error;
      }
    });
  }

  async getBatchStatus(jobId: string): Promise<BatchResponse> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.client.get(`/fibo/batch/${jobId}`);
        
        return {
          jobId,
          status: response.data.status || 'pending',
          totalItems: response.data.total_items,
          completedItems: response.data.completed_items,
          failedItems: response.data.failed_items,
          downloadUrl: response.data.download_url,
          manifestUrl: response.data.manifest_url,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Bria API error: ${error.response?.data?.message || error.message}`);
        }
        throw error;
      }
    });
  }

  private mapPresetToFIBO(preset: Preset, prompt?: string, negativePrompt?: string): any {
    // Map Preset schema to FIBO JSON format
    return {
      prompt: prompt || preset.prompt,
      negative_prompt: negativePrompt || preset.negativePrompt || '',
      controls: preset.controls || {},
      render: {
        steps: preset.render?.steps || 30,
        guidance: preset.render?.guidance || 7.5,
        seed: preset.render?.seed,
        resolution: preset.render?.resolution || '1024x1024',
      },
      film: preset.film || {},
      expansion: preset.expansion || {},
    };
  }
}

