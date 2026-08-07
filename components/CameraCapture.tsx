"use client";

/**
 * Live camera capture modal. Requests camera permission via getUserMedia, shows
 * a preview, and returns a captured JPEG File. Stops the stream on close.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError(t("photo.cameraError"));
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [t]);

  function stop() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        }
        stop();
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }

  function close() {
    stop();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={close}
    >
      {/* Announced as a modal so assistive tech reports it as a layer over the
          page rather than as inert content appended to it (L3). */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("photo.capture")}
        className="w-full max-w-md space-y-3 rounded-xl bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {error ? (
          <p role="alert" className="py-8 text-center text-sm text-red-600">
            {error}
          </p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label={t("photo.capture")}
            className="aspect-[3/4] w-full rounded-lg bg-black object-cover"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={close}>
            {t("photo.cancel")}
          </Button>
          {!error && (
            <Button size="sm" className="bg-teal hover:bg-teal-600" onClick={capture}>
              {t("photo.capture")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
