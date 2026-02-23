/**
 * Extracts frames from a video file using an HTMLVideoElement + Canvas.
 * Runs in the browser main thread (called from the Web Worker via a
 * OffscreenCanvas approach or from the main thread before posting to worker).
 *
 * Usage:
 *   const extractor = new FrameExtractor(videoFile);
 *   const { frames, fps, durationMs } = await extractor.extract(targetFps, onProgress);
 *   // frames: ImageData[] — each frame as raw pixel data
 */

export interface ExtractedFrames {
  frames: ImageData[];
  fps: number;
  durationMs: number;
  width: number;
  height: number;
}

export const FRAME_WIDTH  = 640;
export const FRAME_HEIGHT = 360;

export class FrameExtractor {
  private url: string;

  constructor(file: File) {
    this.url = URL.createObjectURL(file);
  }

  async extract(
    targetFps = 60,
    maxFrames = 600,
    onProgress?: (n: number, total: number) => void
  ): Promise<ExtractedFrames> {
    return new Promise((resolve, reject) => {
      const video    = document.createElement("video");
      video.muted    = true;
      video.preload  = "auto";
      video.src      = this.url;
      video.crossOrigin = "anonymous";

      const canvas  = document.createElement("canvas");
      canvas.width  = FRAME_WIDTH;
      canvas.height = FRAME_HEIGHT;
      const ctx     = canvas.getContext("2d", { willReadFrequently: true })!;

      video.addEventListener("error", () => reject(new Error("Failed to load video")));

      video.addEventListener("loadedmetadata", async () => {
        const durationS  = video.duration;
        const durationMs = durationS * 1000;

        // Detect actual video FPS from duration + expected frames
        // We target the requested fps but cap at what the video likely has
        const effectiveFps = Math.min(targetFps, 60);
        const intervalS    = 1 / effectiveFps;
        const estimated    = Math.min(Math.floor(durationS / intervalS), maxFrames);

        const frames: ImageData[] = [];
        let timeS = 0;

        const seekAndCapture = () => {
          if (timeS > durationS || frames.length >= maxFrames) {
            URL.revokeObjectURL(this.url);
            resolve({ frames, fps: effectiveFps, durationMs, width: FRAME_WIDTH, height: FRAME_HEIGHT });
            return;
          }

          video.currentTime = timeS;
        };

        video.addEventListener("seeked", () => {
          ctx.drawImage(video, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
          frames.push(ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT));
          onProgress?.(frames.length, estimated);
          timeS += intervalS;
          seekAndCapture();
        }, { once: false });

        // Override to re-add listener per seek (once:false handles this)
        seekAndCapture();
      });
    });
  }

  destroy() {
    URL.revokeObjectURL(this.url);
  }
}
