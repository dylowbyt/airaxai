import { AIRegistry } from "./types";
import { OpenAIService } from "./openai-service";
import { RunwayService } from "./runway-service";

class AIAdapterRegistry implements AIRegistry {
  image: OpenAIService;
  video: RunwayService;
  tts: OpenAIService;

  constructor() {
    this.image = new OpenAIService();
    this.video = new RunwayService();
    this.tts = new OpenAIService();
  }
}

// Export singleton instance
export const ai = new AIAdapterRegistry();
