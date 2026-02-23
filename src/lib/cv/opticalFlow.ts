import type { BallDetection } from "@/types";

export interface FlowPoint {
  x: number; y: number; found: boolean;
}

/**
 * Sparse Lucas-Kanade optical flow.
 * Tracks the ball center from frame to frame using the brightness gradient
 * within a search window around the known position.
 *
 * This is a simplified LK implementation suitable for browser use:
 * - No pyramid (single scale) — fast enough at 640×360
 * - 5×5 window for gradient accumulation
 * - Falls back to detection-based position when flow fails
 */
export class OpticalFlowTracker {
  private readonly WIN = 7;    // Half-window size
  private readonly ITER = 10;  // LK iterations per frame

  /**
   * Track a point from prevFrame to currFrame starting at (px, py).
   * Returns new estimated position or null if tracking failed.
   */
  track(
    prevGray: Float32Array,
    currGray: Float32Array,
    width: number,
    height: number,
    px: number,
    py: number
  ): FlowPoint {
    let nx = px, ny = py;
    const W = width, H = height;
    const WIN = this.WIN;

    for (let iter = 0; iter < this.ITER; iter++) {
      let sumIx2 = 0, sumIy2 = 0, sumIxIy = 0;
      let sumIxIt = 0, sumIyIt = 0;

      for (let dy = -WIN; dy <= WIN; dy++) {
        for (let dx = -WIN; dx <= WIN; dx++) {
          const x0 = Math.round(px + dx), y0 = Math.round(py + dy);
          const x1 = Math.round(nx + dx), y1 = Math.round(ny + dy);

          if (x0 < 1 || x0 >= W-1 || y0 < 1 || y0 >= H-1) continue;
          if (x1 < 1 || x1 >= W-1 || y1 < 1 || y1 >= H-1) continue;

          const Ix = (prevGray[y0*W + x0+1] - prevGray[y0*W + x0-1]) * 0.5;
          const Iy = (prevGray[(y0+1)*W + x0] - prevGray[(y0-1)*W + x0]) * 0.5;
          const It = currGray[y1*W + x1] - prevGray[y0*W + x0];

          sumIx2  += Ix * Ix;
          sumIy2  += Iy * Iy;
          sumIxIy += Ix * Iy;
          sumIxIt += Ix * It;
          sumIyIt += Iy * It;
        }
      }

      const det = sumIx2 * sumIy2 - sumIxIy * sumIxIy;
      if (Math.abs(det) < 1e-6) break;

      const vx = -(sumIy2 * sumIxIt - sumIxIy * sumIyIt) / det;
      const vy = -(sumIx2 * sumIyIt - sumIxIy * sumIxIt) / det;

      nx += vx;
      ny += vy;

      // Converged
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) break;
    }

    // Sanity check: new position shouldn't be outside the frame or too far
    const maxDrift = 150; // px per frame — a fast spike won't exceed this
    const drifted  = Math.hypot(nx - px, ny - py) > maxDrift;
    const outOfBounds = nx < 0 || nx >= width || ny < 0 || ny >= height;

    return { x: nx, y: ny, found: !drifted && !outOfBounds };
  }

  toGrayscale(frame: ImageData): Float32Array {
    const gray = new Float32Array(frame.width * frame.height);
    for (let i = 0; i < gray.length; i++) {
      const p = i * 4;
      gray[i] = 0.299 * frame.data[p] + 0.587 * frame.data[p+1] + 0.114 * frame.data[p+2];
    }
    return gray;
  }
}
