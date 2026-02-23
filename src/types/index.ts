// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  video_storage_preference: "always" | "never" | "ask";
  created_at: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────
export type SessionMode   = "spike" | "block";
export type CameraAngle   = "sideline" | "behind_court";

export interface Session {
  id: string;
  user_id: string;
  mode: SessionMode;
  camera_angle: CameraAngle;
  recorded_at: string;
  clip_duration_ms: number | null;
  speed_kmh: number | null;
  peak_speed_kmh: number | null;
  speed_confidence: number | null;
  used_cloud_fallback: boolean;
  form_score: number | null;
  wrist_snap_score: number | null;
  arm_extension_score: number | null;
  contact_point_score: number | null;
  calibration_px_per_meter: number | null;
  calibration_confidence: number | null;
  video_path: string | null;
  video_stored: boolean;
  created_at: string;
}

// ─── CV ───────────────────────────────────────────────────────────────────────
export interface CalibrationData {
  ballDiameterPx: number;
  pixelsPerMeter: number;
  confidence: number;
}

export interface BallDetection {
  x: number; y: number; radius: number; confidence: number;
}

export interface TrajectoryPoint {
  frame: number;
  x: number | null; y: number | null;
  displacement: number;
  speedKmh: number;
}

export interface SpeedResult {
  speedKmh: number;
  peakSpeedKmh: number;
  confidence: number;
  usedCloudFallback: boolean;
}

export interface PoseKeypoint {
  name: string; x: number; y: number; score: number;
}

export interface PoseScores {
  overall: number;
  wristSnap: number;
  armExtension: number;
  contactPoint: number;
}

export interface AnalysisResult {
  speedKmh: number;
  peakSpeedKmh: number;
  speedConfidence: number;
  formScore: number;
  wristSnapScore: number;
  armExtensionScore: number;
  contactPointScore: number;
  contactFrameIndex: number;
  trajectory: TrajectoryPoint[];
  keypoints: PoseKeypoint[];
  frameCount: number;
  fps: number;
  usedCloudFallback: boolean;
  cameraAngle: CameraAngle;
  calibrationConfidence: number;
  pixelsPerMeter: number;
}

// ─── Worker messages ──────────────────────────────────────────────────────────
export interface WorkerProgressMessage {
  type: "progress";
  stage: string;
  percent: number;
}
export interface WorkerResultMessage {
  type: "result";
  result: AnalysisResult;
}
export interface WorkerErrorMessage {
  type: "error";
  message: string;
}
export type WorkerMessage = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage;

// ─── Trend ────────────────────────────────────────────────────────────────────
export interface TrendDay {
  day: string;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  avg_form_score: number;
  session_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getConfidenceMeta(score: number) {
  if (score >= 0.8) return { label: "High",   color: "#00E5A0", bg: "rgba(0,229,160,0.12)"   };
  if (score >= 0.6) return { label: "Medium", color: "#FFD166", bg: "rgba(255,209,102,0.12)" };
  return               { label: "Low",    color: "#FF6B6B", bg: "rgba(255,107,107,0.12)"  };
}

export function getScoreColor(score: number) {
  if (score >= 80) return "#00E5A0";
  if (score >= 60) return "#FFD166";
  return "#FF6B6B";
}

export function formatSpeed(kmh: number) {
  return `${kmh.toFixed(1)} km/h`;
}
