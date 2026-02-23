import { BallDetector } from "./ballDetector";
import { OpticalFlowTracker } from "./opticalFlow";
import { SpeedCalculator } from "./speedCalculator";
import { PoseAnalyzer, estimatePose } from "./poseAnalyzer";
import type { AnalysisResult, CameraAngle, PoseKeypoint } from "@/types";

interface TrackingResult {
  positions: ({ x: number; y: number } | null)[];
  displacements: number[];
  peakFrameIndex: number;
  trackingConsistency: number;
}

export interface PipelineOptions {
  fps: number;
  cameraAngle: CameraAngle;
  onProgress: (stage: string, percent: number) => void;
}

export const VOLLEYBALL_DIAMETER_M = 0.21;

/**
 * Full CV analysis pipeline.
 * Runs in the browser main thread (not a worker) to allow TF.js + canvas access.
 *
 * Steps:
 * 1. Calibration — detect volleyball diameter from first 30 frames
 * 2. Ball detection — find ball in every frame
 * 3. Optical flow — track ball center frame-to-frame
 * 4. Speed calculation — displacement → km/h
 * 5. Pose estimation — MoveNet on contact frame
 * 6. Form scoring — wrist snap, arm extension, contact point
 */
export async function runPipeline(
  frames: ImageData[],
  { fps, cameraAngle, onProgress }: PipelineOptions
): Promise<AnalysisResult> {
  const detector   = new BallDetector();
  const flowTracker = new OpticalFlowTracker();
  const speedCalc  = new SpeedCalculator();
  const poseAnalyzer = new PoseAnalyzer();

  // ── Step 1: Calibration ────────────────────────────────────────────────
  onProgress("Calibrating scale…", 5);
  const calibFrames = frames.slice(0, Math.min(30, frames.length));
  const medianRadius = detector.detectForCalibration(calibFrames);

  let pixelsPerMeter: number;
  let calibrationConfidence: number;

  if (medianRadius && medianRadius > 5) {
    // 2 × radius = diameter in px; VOLLEYBALL_DIAMETER_M = 0.21m
    pixelsPerMeter       = (medianRadius * 2) / VOLLEYBALL_DIAMETER_M;
    calibrationConfidence = 0.9;
  } else {
    // Fallback: assume camera is ~3m away, ball ≈ 45px diameter at 640px wide
    pixelsPerMeter       = 45 / VOLLEYBALL_DIAMETER_M;
    calibrationConfidence = 0.4;
    console.warn("Ball not detected for calibration — using fallback scale");
  }

  // ── Step 2: Ball detection on every frame ──────────────────────────────
  onProgress("Detecting ball…", 15);
  const detections = frames.map((frame, i) => {
    if (i % 30 === 0) onProgress(`Detecting ball… (${i}/${frames.length})`, 15 + (i / frames.length) * 20);
    return detector.detect(frame);
  });

  // ── Step 3: Optical flow tracking ─────────────────────────────────────
  onProgress("Tracking trajectory…", 35);
  const positions: ({ x: number; y: number } | null)[] = [];
  const displacements: number[] = [];
  let prevGray: Float32Array | null = null;
  let consecutiveLost = 0;

  for (let i = 0; i < frames.length; i++) {
    const detection = detections[i];
    const currGray  = flowTracker.toGrayscale(frames[i]);

    let pos: { x: number; y: number } | null = null;

    if (detection) {
      // Seed from detection
      pos = { x: detection.x, y: detection.y };
      consecutiveLost = 0;
    } else if (prevGray && positions[i - 1] && consecutiveLost < 8) {
      // Try optical flow from last known position
      const prev = positions[i - 1]!;
      const flow = flowTracker.track(prevGray, currGray, 640, 360, prev.x, prev.y);
      if (flow.found) {
        pos = { x: flow.x, y: flow.y };
        consecutiveLost = 0;
      } else {
        consecutiveLost++;
      }
    } else {
      consecutiveLost++;
    }

    positions.push(pos);

    const prev = positions[i - 1];
    const disp = pos && prev
      ? Math.hypot(pos.x - prev.x, pos.y - prev.y)
      : 0;
    displacements.push(disp);

    prevGray = currGray;
  }

  const trackedCount = positions.filter(Boolean).length;
  const consistency  = trackedCount / frames.length;
  const smoothed     = smoothArray(displacements, 3);
  const peakIdx      = smoothed.indexOf(Math.max(...smoothed));

  const tracking: TrackingResult = {
    positions,
    displacements,
    peakFrameIndex: peakIdx,
    trackingConsistency: consistency,
  };

  // ── Step 4: Speed calculation ──────────────────────────────────────────
  onProgress("Calculating speed…", 60);
  const speedResult = speedCalc.calculate(tracking, pixelsPerMeter, fps, calibrationConfidence);

  // ── Step 5: Pose estimation on contact frame ───────────────────────────
  onProgress("Running pose estimation…", 72);
  const contactFrame = frames[peakIdx] ?? frames[frames.length - 1];
  let keypoints: PoseKeypoint[] = [];
  try {
    keypoints = await estimatePose(contactFrame);
  } catch (e) {
    console.warn("Pose estimation failed:", e);
  }

  // ── Step 6: Form scoring ───────────────────────────────────────────────
  onProgress("Scoring form…", 90);
  const contactBall = detections[peakIdx];
  const poseScores  = poseAnalyzer.score(keypoints, cameraAngle, contactBall ?? null);

  onProgress("Done!", 100);

  return {
    speedKmh:           speedResult.speedKmh,
    peakSpeedKmh:       speedResult.peakSpeedKmh,
    speedConfidence:    speedResult.confidence,
    formScore:          poseScores.overall,
    wristSnapScore:     poseScores.wristSnap,
    armExtensionScore:  poseScores.armExtension,
    contactPointScore:  poseScores.contactPoint,
    contactFrameIndex:  peakIdx,
    trajectory:         speedResult.trajectory,
    keypoints,
    frameCount:         frames.length,
    fps,
    usedCloudFallback:  false,
    cameraAngle,
    calibrationConfidence,
    pixelsPerMeter,
  };
}

function smoothArray(arr: number[], window: number): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - window);
    const end   = Math.min(arr.length, i + window + 1);
    const slice = arr.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
