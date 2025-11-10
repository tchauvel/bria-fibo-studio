import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for file uploads
});

// Types
export interface Preset {
  id?: string;
  name: string;
  summary?: string;
  prompt: string;
  negativePrompt?: string;
  controls?: {
    background?: string;
    camera?: string;
    lighting?: string;
    color?: string;
    tone?: string;
  };
  render?: {
    steps?: number;
    guidance?: number;
    seed?: number;
    resolution?: string;
  };
  film?: {
    lut?: string;
    grain?: number;
    halation?: number;
    bloom?: number;
  };
  expansion?: {
    environments?: string[];
    angles?: string[];
  };
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PreviewResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: string[];
  error?: string;
}

// Bria API Structured Prompt - matches Bria's /structured_prompt/generate response
// See: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
export interface StructuredPrompt {
  seed: number;
  structured_prompt: string; // JSON string describing the image
  imageIndex?: number;
}

// Style Profile - Collection of structured prompts from multiple images
export interface StyleProfile {
  name?: string;
  createdAt?: string;
  images: StructuredPrompt[]; // Array of structured prompts from source images
  aggregated?: any; // Optional combined/averaged style analysis
  processedImages: number;
  errors?: Array<{
    imageIndex: number;
    error: string;
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

// API functions
export const presetsApi = {
  list: async (page = 1, limit = 20) => {
    const response = await api.get('/api/presets', { params: { page, limit } });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/api/presets/${id}`);
    return response.data;
  },
  create: async (preset: Preset) => {
    const response = await api.post('/api/presets', preset);
    return response.data;
  },
  update: async (id: string, preset: Preset) => {
    const response = await api.post('/api/presets', { ...preset, id });
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/api/presets/${id}`);
  },
};

export const previewApi = {
  generate: async (preset: Preset, prompt?: string, negativePrompt?: string): Promise<PreviewResponse> => {
    const response = await api.post('/api/preview', { preset, prompt, negativePrompt });
    return response.data;
  },
};

export const styleExtractApi = {
  extract: async (images: File[], profileName?: string): Promise<StyleProfile> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    if (profileName) {
      formData.append('profile_name', profileName);
    }
    
    try {
      const response = await api.post('/api/style-extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      console.error('Style extract API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

export const batchApi = {
  create: async (items: Array<{ preset: Preset; prompt: string; negativePrompt?: string }>): Promise<BatchResponse> => {
    const response = await api.post('/api/batch', { items });
    return response.data;
  },
  getStatus: async (jobId: string): Promise<BatchResponse> => {
    const response = await api.get(`/api/batch/${jobId}`);
    return response.data;
  },
};

export interface StyleDNA {
  lighting?: string | object;
  color_palette?: string[] | object;
  colors?: string[] | object;
  mood?: string;
  atmosphere?: string;
  tone?: string;
  technical?: {
    depth_of_field?: string;
    focus?: string;
    lens?: string;
    aperture?: string;
  };
  artistic_style?: string;
  photographic_style?: string;
  time_of_day?: string;
  season?: string;
  weather?: string;
}

export interface ImageGenerateRequest {
  structured_prompt: string;
  prompt?: string;
  seed?: number;
  use_style_dna_parser?: boolean;
}

export interface ImageGenerateResponse {
  image_url: string;
  seed: number;
  request_id?: string;
  style_dna?: StyleDNA;
}

export const imageGeneratorApi = {
  generate: async (request: ImageGenerateRequest): Promise<ImageGenerateResponse> => {
    try {
      const response = await api.post('/api/generate-image', request);
      return response.data;
    } catch (error: any) {
      console.error('Image generation API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

