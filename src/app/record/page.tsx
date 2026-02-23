"use client";

import { useEffect, useRef, useState } from "react";
import { BallDetector } from "@/lib/cv/ballDetector";
import { OpticalFlowTracker } from "@/lib/cv/opticalFlow";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function RecordPage() {
  const [isGuest, setIsGuest] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [framesCount, setFramesCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const liveLoopRef = useRef<number | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number | null>(null);

  const detectorRef = useRef<BallDetector | null>(null);
  const flowRef = useRef<OpticalFlowTracker | null>(null);
  const prevGrayRef = useRef<Float32Array | null>(null);
  const prevPosRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      stopStream();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopLiveLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
        // initialize detectors for live overlay
        detectorRef.current = new BallDetector();
        flowRef.current = new OpticalFlowTracker();
        prevGrayRef.current = null;
        prevPosRef.current = null;
        startLiveLoop();
      }
    } catch (e) {
      console.error("Camera error:", e);
      alert("Unable to access camera. Check permissions.");
    }
  }

  function stopStream() {
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    stopLiveLoop();
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  function stepCapture() {
    if (!recording) return;
    const data = captureFrame();
    if (data) {
      framesRef.current.push(data);
      setFramesCount(framesRef.current.length);
    }
    // capture roughly every 100ms
    rafRef.current = window.setTimeout(stepCapture, 100) as unknown as number;
  }

  // Live tracking loop: compute approximate speed in km/h and update overlay
  function startLiveLoop() {
    if (liveLoopRef.current) return;
    const SAMPLE_MS = 100; // sample every 100ms => 10Hz
    const FPS = 1000 / SAMPLE_MS;
    const pxPerMeterFallback = 45 / 0.21; // fallback scale used elsewhere

    async function loop() {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = 640, h = 360;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);

      try {
        const detector = detectorRef.current!;
        const flow = flowRef.current!;
        let detection = null as any;
        try { detection = detector.detect(frame); } catch (e) { detection = null; }

        const currGray = flow.toGrayscale(frame);
        let pos: { x: number; y: number } | null = null;
        if (detection) pos = { x: detection.x, y: detection.y };
        else if (prevPosRef.current && prevGrayRef.current) {
          const p = prevPosRef.current;
          const res = flow.track(prevGrayRef.current, currGray, w, h, p.x, p.y);
          if (res.found) pos = { x: res.x, y: res.y };
        }

        if (pos && prevPosRef.current) {
          const dx = pos.x - prevPosRef.current.x;
          const dy = pos.y - prevPosRef.current.y;
          const disp = Math.hypot(dx, dy); // px per sample
          const speedMs = (disp / pxPerMeterFallback) * FPS;
          const speedKmh = Math.round(speedMs * 3.6 * 10) / 10;
          setLiveSpeed(speedKmh);
        }

        if (pos) prevPosRef.current = pos;
        prevGrayRef.current = currGray;
      } catch (e) {
        console.warn("Live CV error", e);
      }

      liveLoopRef.current = window.setTimeout(loop, SAMPLE_MS) as unknown as number;
    }

    loop();
  }

  function stopLiveLoop() {
    if (liveLoopRef.current) { clearTimeout(liveLoopRef.current); liveLoopRef.current = null; }
    setLiveSpeed(null);
    detectorRef.current = null;
    flowRef.current = null;
    prevGrayRef.current = null;
    prevPosRef.current = null;
  }

  function startRecording() {
    framesRef.current = [];
    setFramesCount(0);
    setRecording(true);
    stepCapture();
  }

  function stopRecording() {
    setRecording(false);
    // save to sessionStorage for results page to consume
    try {
      sessionStorage.setItem("lastRecording", JSON.stringify(framesRef.current));
    } catch (e) {
      console.warn("Could not save recording to sessionStorage", e);
    }
    router.push("/results");
  }

  return (
    <div className="min-h-screen bg-vt-bg pb-28">
      <Navbar isGuest={isGuest} />

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl font-black mb-2">📹 Record Spike</h1>
          <p className="text-vt-muted">Use your device camera to capture a spike. Recording happens locally in your browser.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {/* Live speed overlay */}
              <div className="absolute top-3 left-3 bg-black/40 px-3 py-1 rounded-md text-white font-semibold">
                {liveSpeed !== null ? `${liveSpeed} km/h` : "— km/h"}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {!streamActive ? (
                <button onClick={startStream} className="flex-1 bg-vt-mint text-white h-12 rounded-xl font-semibold">Enable Camera</button>
              ) : (
                <button onClick={stopStream} className="flex-1 bg-white/5 border border-white/10 text-white h-12 rounded-xl font-semibold">Stop Camera</button>
              )}

              {!recording ? (
                <button onClick={startRecording} disabled={!streamActive} className="bg-vt-coral text-white px-4 h-12 rounded-xl font-semibold">Start Recording</button>
              ) : (
                <button onClick={stopRecording} className="bg-vt-blue text-white px-4 h-12 rounded-xl font-semibold">Stop & Analyze</button>
              )}
            </div>

            <div className="mt-3 text-sm text-vt-muted">Captured frames: {framesCount}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ol className="text-sm text-vt-muted list-decimal pl-5 space-y-2">
              <li>Allow camera access.</li>
              <li>Press <strong>Start Recording</strong> and perform a spike.</li>
              <li>Press <strong>Stop & Analyze</strong> to view results (local only).</li>
            </ol>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Tips</h4>
              <ul className="text-sm text-vt-muted space-y-1">
                <li>Record in landscape for best results.</li>
                <li>Place the camera to capture the full jump and arm swing.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
