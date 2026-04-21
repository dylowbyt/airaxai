import { VideoGenerationService, AIServiceConfig } from "./types";

export class RunwayService implements VideoGenerationService {
  private apiKey: string;

  constructor(config?: AIServiceConfig) {
    this.apiKey = config?.apiKey || process.env.RUNWAY_API_KEY || "";
    if (!this.apiKey) throw new Error("Runway API Key is missing");
  }

  async generateVideo(imageUrl: string, prompt?: string): Promise<string> {
    // Note: Runway API Gen-3 Alpha implementation
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "X-Runway-Version": "2024-09-13"
      },
      body: JSON.stringify({
        promptImage: imageUrl,
        seed: Math.floor(Math.random() * 1000000),
        model: "gen3a_turbo",
        promptText: prompt || "High quality animation, smooth motion",
        watermark: false
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || "Failed to start Runway video generation");
    }

    const taskId = data.id;

    // Polling for completion
    let videoUrl = "";
    let attempts = 0;
    while (!videoUrl && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Runway-Version": "2024-09-13"
        }
      });
      const pollData = await pollRes.json();
      
      if (pollData.status === "SUCCEEDED") {
        videoUrl = pollData.output[0];
        break;
      } else if (pollData.status === "FAILED") {
        throw new Error("Runway video generation failed.");
      }
    }

    if (!videoUrl) {
      throw new Error("Video generation timed out.");
    }

    return videoUrl;
  }
}
