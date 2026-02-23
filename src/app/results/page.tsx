"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { runPipeline } from "@/lib/cv/pipeline";

export default function ResultsPage() {
  const [frames, setFrames] = useState<string[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{stage:string,percent:number}|null>(null);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastRecording");
      if (raw) setFrames(JSON.parse(raw));
    } catch (e) {
      setFrames(null);
    }
  }, []);

  const hasFrames = Array.isArray(frames) && frames.length > 0;

  async function decodeToImageData(urls: string[]) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const out: ImageData[] = [];
    for (const u of urls) {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u;
      });
      const w = 640, h = 360; canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
      out.push(ctx.getImageData(0,0,w,h));
    }
    return out;
  }

  async function analyze() {
    if (!hasFrames || analyzing) return;
    setAnalyzing(true);
    setProgress({stage:'Starting', percent:0});
    const urls = frames!;
    try {
      const imgs = await decodeToImageData(urls);
      const pxOverrideRaw = sessionStorage.getItem('calibration_px_per_meter');
      const pxOverride = pxOverrideRaw ? parseFloat(pxOverrideRaw) : undefined;

      const res = await runPipeline(imgs, {
        fps: 30,
        cameraAngle: 'sideline',
        onProgress: (s,p) => setProgress({stage:s, percent:p}),
        pxPerMeterOverride: pxOverride,
      } as any);

      setResult(res);
    } catch (e) {
      console.error(e);
      alert('Analysis failed');
    } finally {
      setAnalyzing(false);
      setProgress(null);
    }
  }

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black mb-6 text-center">⚡ Analysis Results</h1>

          {hasFrames ? (
            <div className="grid gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="font-semibold mb-3">Captured Frames ({frames!.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {frames!.slice(0, 12).map((src, i) => (
                    <img key={i} src={src} className="w-full h-24 object-cover rounded-md" alt={`frame-${i}`} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button disabled={analyzing} onClick={analyze} className="px-4 py-2 rounded-md bg-vt-mint text-black font-semibold">Run Analysis</button>
                <button onClick={() => { sessionStorage.removeItem('lastRecording'); setFrames(null); }} className="px-4 py-2 rounded-md bg-white/5">Clear</button>
                {progress && <div className="ml-4 text-sm text-vt-muted">{progress.stage} — {progress.percent}%</div>}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
              <p className="text-vt-muted">No local recording found — try recording from the Record page.</p>
            </div>
          )}

          {/* Show results if available */}
          {result && (
            <div className="bg-gradient-to-br from-vt-mint/10 to-vt-blue/10 border border-vt-outline rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-3">Analysis Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl text-center">
                  <div className="text-3xl font-black text-vt-mint">{result.peakSpeedKmh}</div>
                  <div className="text-sm text-vt-muted">Peak km/h</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center">
                  <div className="text-3xl font-black">{result.speedKmh}</div>
                  <div className="text-sm text-vt-muted">Avg km/h</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center">
                  <div className="text-3xl font-black">{Math.round(result.speedConfidence*100)}%</div>
                  <div className="text-sm text-vt-muted">Confidence</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
