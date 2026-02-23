"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type CameraState = "idle" | "requesting" | "active" | "recording" | "stopped" | "error";

export interface UseCameraReturn {
  state:        CameraState;
  error:        string | null;
  videoRef:     React.RefObject<HTMLVideoElement | null>;
  recordedBlob: Blob | null;
  recordedUrl:  string | null;
  startCamera:  () => Promise<void>;
  stopCamera:   () => void;
  startRecording: () => void;
  stopRecording:  () => void;
  resetRecording: () => void;
  duration:     number; // seconds recorded so far
}

export function useCamera(): UseCameraReturn {
  const [state, setState]             = useState<CameraState>("idle");
  const [error, setError]             = useState<string | null>(null);
  const [recordedBlob, setBlob]       = useState<Blob | null>(null);
  const [recordedUrl, setUrl]         = useState<string | null>(null);
  const [duration, setDuration]       = useState(0);

  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const recorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",      // Rear camera on mobile
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState("active");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      const friendly =
        msg.includes("Permission denied") || msg.includes("NotAllowedError")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : msg.includes("NotFoundError")
          ? "No camera found on this device."
          : `Camera error: ${msg}`;
      setError(friendly);
      setState("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setDuration(0);

    // Pick the best supported format
    const mimeType = [
      "video/mp4;codecs=h264",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(streamRef.current, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 8_000_000, // 8 Mbps for quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      const url  = URL.createObjectURL(blob);
      setBlob(blob);
      setUrl(url);
      setState("stopped");
    };

    recorder.start(100); // 100ms chunks for smooth data collection
    recorderRef.current = recorder;
    setState("recording");

    // Duration counter
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setBlob(null);
    setUrl(null);
    setDuration(0);
    chunksRef.current = [];
    // Go back to active (camera still on) if stream is live
    if (streamRef.current) {
      setState("active");
    } else {
      setState("idle");
    }
  }, [recordedUrl]);

  return {
    state, error, videoRef,
    recordedBlob, recordedUrl,
    startCamera, stopCamera,
    startRecording, stopRecording, resetRecording,
    duration,
  };
}
