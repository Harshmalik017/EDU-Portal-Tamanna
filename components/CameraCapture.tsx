"use client";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";

const ASPECT = 924 / 1300;

export function CameraCapture({ title, onCapture, onClose }: { title: string; onCapture: (pages: [File, File]) => void; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState<1 | 2>(1);
  const [first, setFirst] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stream: MediaStream | undefined; let cancelled = false;
    const devices = navigator.mediaDevices;
    if (!devices?.getUserMedia) setErr("Camera unavailable. Allow access or upload a file.");
    else devices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } } })
      .then((s) => { if (cancelled) return s.getTracks().forEach((t) => t.stop()); stream = s; if (ref.current) ref.current.srcObject = s; })
      .catch(() => { if (!cancelled) setErr("Camera unavailable. Allow access or upload a file."); });
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  function snap() {
    const v = ref.current!;
    const vw = v.videoWidth, vh = v.videoHeight;
    const [sw, sh] = vw / vh > ASPECT ? [vh * ASPECT, vh] : [vw, vw / ASPECT];
    const c = document.createElement("canvas");
    c.width = sw; c.height = sh;
    c.getContext("2d")!.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, sw, sh);
    c.toBlob((b) => {
      if (!b) return setErr("Could not capture the page. Try again.");
      const file = new File([b], `answer-sheet-page-${page}.jpg`, { type: "image/jpeg" });
      if (page === 1) {
        setFirst(file);
        setPage(2);
      } else if (first) onCapture([first, file]);
    }, "image/jpeg", 0.92);
  }

  return (
    <Dialog compact title={`${title} · Page ${page} of 2`} onClose={onClose}>
        {err ? <p className="py-10 text-center font-semibold">{err}</p> : (
          <div className="relative mx-auto max-h-[60dvh] overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: String(ASPECT) }}>
            <video ref={ref} autoPlay playsInline muted aria-label={`Camera preview for page ${page}`} onLoadedMetadata={() => setReady(true)} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-dashed border-white/90" />
          </div>
        )}
        <p className="text-center text-sm">{page === 2 ? "Page 1 captured. Fit page 2 inside the frame." : "Fit page 1 inside the frame."}</p>
        <Button className="w-full" onClick={snap} disabled={!!err || !ready}><Camera size={18} aria-hidden="true" /> Capture page {page}</Button>
    </Dialog>
  );
}
