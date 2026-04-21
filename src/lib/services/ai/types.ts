export interface AIServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface ImageGenerationService {
  generateImage(prompt: string, options?: { aspect_ratio?: string }): Promise<string>; // Returns Image URL
}

export interface VideoGenerationService {
  generateVideo(imageUrl: string, prompt?: string): Promise<string>; // Returns Video URL
}

export interface TTSService {
  generateSpeech(text: string, voice?: string): Promise<ArrayBuffer>; // Returns Audio ArrayBuffer
}

export interface AIRegistry {
  image: ImageGenerationService;
  video: VideoGenerationService;
  tts: TTSService;
}
