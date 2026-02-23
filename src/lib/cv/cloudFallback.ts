/**
 * Cloud fallback — calls the Railway Python/YOLOv8 API
 * when browser-side CV confidence is below the threshold.
 *
 * The Python API runs YOLOv8 which is significantly more accurate
 * than the browser Hough circles implementation.
 *
 * Set NEXT_PUBLIC_API_URL in your Vercel environment variables
 * to your Railway deployment URL (e.g. https://volleytrack-api.railway.app)
 */

import type { AnalysisResult, CameraAngle } from "@/types";

const API_URL    = process.env.NEXT_PUBLIC_API_URL;
const API_KEY    = process.env.NEXT_PUBLIC_API_SECRET_KEY;

// Use cloud fallback if browser confidence is below this
export const CLOUD_FALLBACK_THRESHOLD = 0.6;

export async function analyzeWithCloud(
  file: File,
  cameraAngle: CameraAngle,
  onProgress?: (msg: string) => void
): Promise<Partial<AnalysisResult> | null> {
  if (!API_URL) {
    console.warn("NEXT_PUBLIC_API_URL not set — skipping cloud fallback");
    return null;
  }

  onProgress?.("Sending to cloud analysis…");

  const formData = new FormData();
  formData.append("video", file);
  formData.append("camera_angle", cameraAngle);
  formData.append("target_fps", "60");

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Cloud analysis failed (${res.status})`);
  }

  onProgress?.("Processing cloud results…");
  const data = await res.json();

  return {
    speedKmh:           data.speed_kmh,
    peakSpeedKmh:       data.peak_speed_kmh,
    speedConfidence:    data.speed_confidence,
    usedCloudFallback:  true,
    calibrationConfidence: data.calibration_confidence,
    pixelsPerMeter:     data.calibration_px_per_meter,
    contactFrameIndex:  data.contact_frame_index,
    frameCount:         data.frame_count,
    fps:                data.fps,
    trajectory: data.trajectory_frame_indices?.map((f: number, i: number) => ({
      frame:        f,
      x:            data.trajectory_x?.[i] ?? null,
      y:            data.trajectory_y?.[i] ?? null,
      displacement: 0,
      speedKmh:     data.trajectory_speeds?.[i] ?? 0,
    })) ?? [],
  };
}

export function shouldUseCloudFallback(browserConfidence: number): boolean {
  return !!API_URL && browserConfidence < CLOUD_FALLBACK_THRESHOLD;
}
