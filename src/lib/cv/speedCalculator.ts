import type { TrajectoryPoint, SpeedResult } from "@/types";

export interface TrackingResult {
  positions: ({ x: number; y: number } | null)[];
  displacements: number[];
  peakFrameIndex: number;
  trackingConsistency: number;
}

export class SpeedCalculator {
  /**
   * Convert tracked positions to a speed result.
   * @param tracking   - raw tracking output
   * @param pxPerMeter - calibration: pixels per real-world meter
   * @param fps        - frames per second of the video
   */
  calculate(
    tracking: TrackingResult,
    pxPerMeter: number,
    fps: number,
    calibrationConfidence: number
  ): SpeedResult & { trajectory: TrajectoryPoint[] } {
    const { positions, displacements, peakFrameIndex, trackingConsistency } = tracking;

    // Build trajectory array
    const trajectory: TrajectoryPoint[] = positions.map((pos, i) => {
      const disp  = displacements[i] ?? 0;
      const speedMs = (disp / pxPerMeter) * fps;
      return {
        frame: i,
        x:     pos?.x ?? null,
        y:     pos?.y ?? null,
        displacement: disp,
        speedKmh: parseFloat((speedMs * 3.6).toFixed(1)),
      };
    });

    // Smooth around peak for reported speed (5-frame window)
    const win = trajectory.slice(
      Math.max(0, peakFrameIndex - 2),
      Math.min(trajectory.length, peakFrameIndex + 3)
    ).filter((t) => t.displacement > 0);

    const avgDisp    = win.reduce((s, t) => s + t.displacement, 0) / Math.max(win.length, 1);
    const avgSpeedMs = (avgDisp / pxPerMeter) * fps;
    const speedKmh   = parseFloat((avgSpeedMs * 3.6).toFixed(1));

    const peakDisp    = displacements[peakFrameIndex] ?? 0;
    const peakSpeedMs = (peakDisp / pxPerMeter) * fps;
    const peakSpeedKmh = parseFloat((peakSpeedMs * 3.6).toFixed(1));

    // Confidence = tracking consistency × smoothness × calibration confidence
    const validSpeeds = trajectory.filter((t) => t.speedKmh > 0).map((t) => t.speedKmh);
    const smoothness  = validSpeeds.length > 2
      ? 1 - Math.min(this.coefficientOfVariation(validSpeeds), 1)
      : 0.5;
    const confidence  = Math.min(
      trackingConsistency * 0.4 + smoothness * 0.4 + calibrationConfidence * 0.2,
      1.0
    );

    return {
      speedKmh:    Math.max(0, Math.min(speedKmh, 200)),
      peakSpeedKmh: Math.max(0, Math.min(peakSpeedKmh, 200)),
      confidence:   parseFloat(confidence.toFixed(2)),
      usedCloudFallback: false,
      trajectory,
    };
  }

  private coefficientOfVariation(values: number[]): number {
    const mean  = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance) / mean;
  }
}
