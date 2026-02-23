import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/analyze — create a new session record before CV runs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "guest-" + Date.now();

    const body = await request.json();
    const { mode, cameraAngle } = body;

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        user_id:      userId,
        mode:         mode ?? "spike",
        camera_angle: cameraAngle ?? "sideline",
        recorded_at:  new Date().toISOString(),
        video_stored: false,
      })
      .select("id")
      .single();

    if (error || !session) {
      console.error(error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/analyze — save CV results after client-side processing completes
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? request.cookies.get("guest-session-id")?.value;
    if (!userId) return NextResponse.json({ error: "Session required" }, { status: 401 });

    const body = await request.json();
    const { sessionId, ...fields } = body;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    // Save main session data
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({
        clip_duration_ms:         fields.clipDurationMs,
        speed_kmh:                fields.speedKmh,
        peak_speed_kmh:           fields.peakSpeedKmh,
        speed_confidence:         fields.speedConfidence,
        used_cloud_fallback:      fields.usedCloudFallback ?? false,
        form_score:               fields.formScore,
        wrist_snap_score:         fields.wristSnapScore,
        arm_extension_score:      fields.armExtensionScore,
        contact_point_score:      fields.contactPointScore,
        calibration_px_per_meter: fields.calibrationPxPerMeter,
        calibration_confidence:   fields.calibrationConfidence,
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (sessionError) {
      console.error(sessionError);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    // Save trajectory snapshot
    if (fields.trajectoryFrameIndices?.length > 0) {
      await supabase.from("trajectory_snapshots").upsert({
        session_id:      sessionId,
        frame_indices:   fields.trajectoryFrameIndices,
        speeds_kmh:      fields.trajectorySpeeds,
        positions_x:     fields.trajectoryX,
        positions_y:     fields.trajectoryY,
        total_frames:    fields.frameCount,
        fps:             fields.fps,
        contact_frame_index: fields.contactFrameIndex,
      });
    }

    // Save pose keypoints
    if (fields.keypointNames?.length > 0) {
      await supabase.from("pose_keypoints").upsert({
        session_id:          sessionId,
        keypoint_names:      fields.keypointNames,
        positions_x:         fields.keypointsX,
        positions_y:         fields.keypointsY,
        scores:              fields.keypointScores,
        contact_frame_index: fields.contactFrameIndex,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
