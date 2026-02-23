import type { PoseKeypoint, PoseScores, CameraAngle, BallDetection } from "@/types";

/**
 * Loads MoveNet Lightning via TensorFlow.js and runs pose estimation.
 * Works in browser main thread — called before posting heavy work to worker.
 *
 * NOTE: TF.js model loading is lazy and cached after first load.
 */

// MoveNet keypoint indices
const KP = {
  NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14, LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

export const KEYPOINT_NAMES = [
  "nose","left_eye","right_eye","left_ear","right_ear",
  "left_shoulder","right_shoulder","left_elbow","right_elbow",
  "left_wrist","right_wrist","left_hip","right_hip",
  "left_knee","right_knee","left_ankle","right_ankle",
];

let detector: any = null;

export async function loadMoveNet(): Promise<void> {
  if (detector) return;
  const poseDetection = await import("@tensorflow-models/pose-detection");
  const tf            = await import("@tensorflow/tfjs");
  await tf.ready();

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: false,
    }
  );
}

export async function estimatePose(imageData: ImageData): Promise<PoseKeypoint[]> {
  if (!detector) await loadMoveNet();

  // Create an ImageBitmap for TF.js (it accepts HTMLImageElement, HTMLVideoElement, or ImageBitmap)
  const bitmap = await createImageBitmap(imageData);
  const poses  = await detector.estimatePoses(bitmap);
  bitmap.close();

  if (!poses || poses.length === 0) return [];

  return poses[0].keypoints.map((kp: any, i: number) => ({
    name:  KEYPOINT_NAMES[i] ?? `kp_${i}`,
    x:     kp.x / imageData.width,
    y:     kp.y / imageData.height,
    score: kp.score ?? 0,
  }));
}

/**
 * Score spike form from pose keypoints.
 * Returns scores 0–100 for each dimension.
 */
export class PoseAnalyzer {
  private readonly CONF_THRESHOLD = 0.25;

  score(
    keypoints: PoseKeypoint[],
    cameraAngle: CameraAngle,
    ballDetection: BallDetection | null
  ): PoseScores {
    const kp = Object.fromEntries(keypoints.map((k) => [k.name, k]));

    const wristSnap     = this.scoreWristSnap(kp, cameraAngle);
    const armExtension  = this.scoreArmExtension(kp);
    const contactPoint  = this.scoreContactPoint(kp, ballDetection);

    // Sideline camera: form accuracy is reduced, so downweight wrist snap
    const wWeight = cameraAngle === "sideline" ? 0.20 : 0.30;
    const eWeight = cameraAngle === "sideline" ? 0.50 : 0.40;
    const cWeight = 0.30;

    const overall = Math.round(
      wristSnap * wWeight + armExtension * eWeight + contactPoint * cWeight
    );

    return { overall, wristSnap, armExtension, contactPoint };
  }

  private get(kp: Record<string, PoseKeypoint>, name: string): PoseKeypoint | null {
    const k = kp[name];
    return k && k.score >= this.CONF_THRESHOLD ? k : null;
  }

  private scoreWristSnap(kp: Record<string, PoseKeypoint>, angle: CameraAngle): number {
    // Use the arm with higher wrist confidence
    const rw = kp["right_wrist"], lw = kp["left_wrist"];
    const re = kp["right_elbow"], le = kp["left_elbow"];
    const useRight = (rw?.score ?? 0) >= (lw?.score ?? 0);

    const wrist = useRight ? this.get(kp, "right_wrist") : this.get(kp, "left_wrist");
    const elbow = useRight ? this.get(kp, "right_elbow") : this.get(kp, "left_elbow");
    if (!wrist || !elbow) return 50;

    // Angle of elbow→wrist vector
    const dy = wrist.y - elbow.y;
    const dx = wrist.x - elbow.x;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    // Good spike: wrist snapping downward, angle ≈ -90° to -45°
    const ideal = -67;
    const dev   = Math.abs(angleDeg - ideal);
    return Math.round(Math.max(0, 100 - (dev / 90) * 100));
  }

  private scoreArmExtension(kp: Record<string, PoseKeypoint>): number {
    const rw = this.get(kp, "right_wrist"), re = this.get(kp, "right_elbow"), rs = this.get(kp, "right_shoulder");
    const lw = this.get(kp, "left_wrist"),  le = this.get(kp, "left_elbow"),  ls = this.get(kp, "left_shoulder");

    // Try dominant arm first
    const w = rw ?? lw, e = re ?? le, s = rs ?? ls;
    if (!w || !e || !s) return 50;

    const angle = this.angleBetween(
      { x: s.x, y: s.y },
      { x: e.x, y: e.y },
      { x: w.x, y: w.y }
    );

    if (angle >= 165) return 100;
    if (angle >= 140) return 75 + ((angle - 140) / 25) * 25;
    if (angle >= 110) return 40 + ((angle - 110) / 30) * 35;
    return Math.max(0, Math.round((angle / 110) * 40));
  }

  private scoreContactPoint(kp: Record<string, PoseKeypoint>, ball: BallDetection | null): number {
    if (!ball) return 50;
    const rw = this.get(kp, "right_wrist") ?? this.get(kp, "left_wrist");
    if (!rw) return 50;

    // ball.x and ball.y are in pixel space (640×360), kp in normalized (0–1)
    const ballNx = ball.x / 640;
    const ballNy = ball.y / 360;
    const dist   = Math.hypot(rw.x - ballNx, rw.y - ballNy);

    // 0 dist = 100, 0.25 (quarter of frame) = 0
    return Math.round(Math.max(0, 100 - (dist / 0.25) * 100));
  }

  private angleBetween(a: { x: number; y: number }, v: { x: number; y: number }, b: { x: number; y: number }): number {
    const v1x = a.x - v.x, v1y = a.y - v.y;
    const v2x = b.x - v.x, v2y = b.y - v.y;
    const dot  = v1x * v2x + v1y * v2y;
    const mag1 = Math.hypot(v1x, v1y), mag2 = Math.hypot(v2x, v2y);
    if (mag1 === 0 || mag2 === 0) return 0;
    return (Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180) / Math.PI;
  }
}
