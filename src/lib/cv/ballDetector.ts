import type { BallDetection } from "@/types";

/**
 * Detects a volleyball in an ImageData frame.
 *
 * Approach: Circular Hough Transform approximation using edge detection.
 * 1. Convert to grayscale
 * 2. Apply Sobel edge detection
 * 3. Vote for circle centers using gradient direction
 * 4. Find peak in accumulator — that's the ball center
 *
 * Volleyballs are 20–22cm diameter. At typical filming distances:
 *  - Close (2m):  ~100–120px radius
 *  - Medium (4m): ~50–70px radius
 *  - Far (6m):    ~25–40px radius
 */
export class BallDetector {
  private readonly WIDTH  = 640;
  private readonly HEIGHT = 360;
  private readonly MIN_RADIUS = 10;
  private readonly MAX_RADIUS = 120;

  detect(frame: ImageData): BallDetection | null {
    const gray    = this.toGrayscale(frame);
    const edges   = this.sobelEdges(gray);
    const circles = this.houghCircles(gray, edges);
    return circles.length > 0 ? circles[0] : null;
  }

  /** Detect the ball in a still frame for calibration purposes. */
  detectForCalibration(frames: ImageData[]): number | null {
    const radii: number[] = [];
    for (const frame of frames) {
      const d = this.detect(frame);
      if (d && d.confidence > 0.4) radii.push(d.radius);
    }
    if (radii.length < 2) return null;
    radii.sort((a, b) => a - b);
    return radii[Math.floor(radii.length / 2)]; // median radius
  }

  private toGrayscale(frame: ImageData): Float32Array {
    const gray = new Float32Array(this.WIDTH * this.HEIGHT);
    for (let i = 0; i < gray.length; i++) {
      const p = i * 4;
      gray[i] = 0.299 * frame.data[p] + 0.587 * frame.data[p + 1] + 0.114 * frame.data[p + 2];
    }
    return gray;
  }

  private sobelEdges(gray: Float32Array): Float32Array {
    const edges = new Float32Array(this.WIDTH * this.HEIGHT);
    const W = this.WIDTH, H = this.HEIGHT;

    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = y * W + x;
        // Sobel X
        const gx =
          -gray[(y-1)*W+(x-1)] + gray[(y-1)*W+(x+1)]
          - 2*gray[y*W+(x-1)] + 2*gray[y*W+(x+1)]
          - gray[(y+1)*W+(x-1)] + gray[(y+1)*W+(x+1)];
        // Sobel Y
        const gy =
           gray[(y-1)*W+(x-1)] + 2*gray[(y-1)*W+x] + gray[(y-1)*W+(x+1)]
          - gray[(y+1)*W+(x-1)] - 2*gray[(y+1)*W+x] - gray[(y+1)*W+(x+1)];

        edges[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return edges;
  }

  private houghCircles(gray: Float32Array, edges: Float32Array): BallDetection[] {
    const W = this.WIDTH, H = this.HEIGHT;
    const edgeThreshold = 40;

    // Accumulator: downsampled by 4 for performance
    const scale  = 4;
    const accW   = Math.ceil(W / scale);
    const accH   = Math.ceil(H / scale);
    const accR   = Math.ceil((this.MAX_RADIUS - this.MIN_RADIUS) / scale) + 1;
    const acc    = new Float32Array(accW * accH * accR);

    // Collect edge points
    const edgePoints: [number, number][] = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (edges[y * W + x] > edgeThreshold) {
          edgePoints.push([x, y]);
        }
      }
    }

    // Vote
    for (const [ex, ey] of edgePoints) {
      for (let r = this.MIN_RADIUS; r <= this.MAX_RADIUS; r += scale) {
        const ri = Math.floor((r - this.MIN_RADIUS) / scale);
        // Vote along circle perimeter
        for (let angle = 0; angle < 360; angle += 10) {
          const rad = (angle * Math.PI) / 180;
          const cx  = Math.round(ex - r * Math.cos(rad));
          const cy  = Math.round(ey - r * Math.sin(rad));
          if (cx >= 0 && cx < W && cy >= 0 && cy < H) {
            const ai = Math.floor(cy / scale) * accW * accR +
                       Math.floor(cx / scale) * accR + ri;
            acc[ai] += 1;
          }
        }
      }
    }

    // Find peaks
    const candidates: BallDetection[] = [];
    let maxVotes = 0;
    for (let i = 0; i < acc.length; i++) {
      if (acc[i] > maxVotes) maxVotes = acc[i];
    }

    const threshold = maxVotes * 0.65;
    for (let ai = 0; ai < acc.length; ai++) {
      if (acc[ai] < threshold) continue;
      const ri = ai % accR;
      const ci = Math.floor(ai / accR) % accW;
      const cy_scaled = Math.floor(ai / (accR * accW));
      candidates.push({
        x:          ci * scale,
        y:          cy_scaled * scale,
        radius:     this.MIN_RADIUS + ri * scale,
        confidence: acc[ai] / maxVotes,
      });
    }

    // Sort by confidence and de-duplicate nearby circles
    candidates.sort((a, b) => b.confidence - a.confidence);
    const deduped: BallDetection[] = [];
    for (const c of candidates) {
      const tooClose = deduped.some(
        (d) => Math.hypot(d.x - c.x, d.y - c.y) < c.radius
      );
      if (!tooClose) deduped.push(c);
      if (deduped.length >= 3) break;
    }

    return deduped;
  }
}
