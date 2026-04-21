import { ImageGenerationService, TTSService, AIServiceConfig } from "./types";

export class OpenAIService implements ImageGenerationService, TTSService {
  private apiKey: string;

  constructor(config?: AIServiceConfig) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || "";
    if (!this.apiKey) throw new Error("OpenAI API Key is missing");
  }

  async generateImage(prompt: string, options?: { aspect_ratio?: string }): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: options?.aspect_ratio === "16:9" ? "1792x1024" : (options?.aspect_ratio === "9:16" ? "1024x1792" : "1024x1024"),
        quality: "standard",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to generate image with OpenAI");
    }

    return data.data[0].url;
  }

  async generateSpeech(text: string, voice: string = "alloy"): Promise<ArrayBuffer> {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to generate speech: ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
