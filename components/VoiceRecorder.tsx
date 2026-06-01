"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, RotateCcw, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";

type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "recorded"
  | "submitting"
  | "error";

const MAX_SECONDS = 120;
const BAR_COUNT = 24;

interface Props {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onComplete: (audioBlob: Blob, transcript: string) => void;
}

export function VoiceRecorder({
  question,
  questionNumber,
  totalQuestions,
  onComplete,
}: Props) {
  const { t, lang } = useLanguage();

  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.2));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (audioUrl) return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  function tickWaveform() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    const next = Array.from({ length: BAR_COUNT }, (_, i) => {
      const start = Math.floor((i * buf.length) / BAR_COUNT);
      const end = Math.floor(((i + 1) * buf.length) / BAR_COUNT);
      let sum = 0;
      for (let j = start; j < end; j++) sum += buf[j];
      const avg = sum / Math.max(1, end - start) / 255;
      return Math.max(0.1, avg);
    });
    setBars(next);
    setSeconds(Math.floor((performance.now() - startTimeRef.current) / 1000));
    rafRef.current = requestAnimationFrame(tickWaveform);
  }

  async function startRecording() {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(t("rec.unsupported"));
      setState("error");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        streamRef.current = null;
        audioCtxRef.current = null;
        analyserRef.current = null;
      };
      mediaRecorderRef.current = mr;
      mr.start();
      startTimeRef.current = performance.now();
      setState("recording");
      tickWaveform();
    } catch (err) {
      console.error(err);
      setError(t("rec.micDenied"));
      setState("error");
      cleanup();
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  useEffect(() => {
    if (state !== "recording") return;
    if (seconds >= MAX_SECONDS) stopRecording();
  }, [seconds, state]);

  async function submit() {
    if (!audioBlob) return;
    setState("submitting");
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "recording.webm");
      fd.append("language", lang);

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Transcribe failed (${res.status})`);
      const { transcript } = (await res.json()) as { transcript: string };
      onComplete(audioBlob, transcript);
      setState("idle");
      setAudioBlob(null);
      setAudioUrl(null);
      setBars(Array(BAR_COUNT).fill(0.2));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Transcription failed");
      setState("error");
    }
  }

  function reset() {
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);
    setBars(Array(BAR_COUNT).fill(0.2));
    setError(null);
    setState("idle");
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Card className="border-navy-100/60">
      <CardContent className="p-8">
        <div className="text-xs font-medium uppercase tracking-wider text-teal-700">
          {t("rec.questionOf", { n: questionNumber, total: totalQuestions })}
        </div>
        <p className="mt-3 text-xl font-semibold leading-relaxed text-navy-900 md:text-2xl">
          {question}
        </p>

        <div
          aria-live="polite"
          className="mt-8 flex flex-col items-center justify-center gap-6"
        >
          {state === "recording" && (
            <div className="flex h-16 items-end gap-1">
              {bars.map((v, i) => (
                <span
                  key={i}
                  className="w-2 rounded-full bg-teal transition-all duration-75"
                  style={{ height: `${Math.max(8, v * 64)}px` }}
                />
              ))}
            </div>
          )}

          {state === "recorded" && audioUrl && (
            <audio src={audioUrl} controls className="w-full max-w-md" />
          )}

          {(state === "idle" || state === "requesting" || state === "recording") && (
            <motion.button
              onClick={state === "recording" ? stopRecording : startRecording}
              whileTap={{ scale: 0.95 }}
              disabled={state === "requesting"}
              className={`relative grid h-24 w-24 place-items-center rounded-full text-white shadow-lg transition ${
                state === "recording" ? "bg-red-500 shadow-red-500/40" : "bg-teal shadow-teal/40 hover:bg-teal-600"
              }`}
              aria-label={state === "recording" ? t("rec.stop") : t("rec.start")}
            >
              {state === "recording" && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-500/40" />
              )}
              {state === "recording" ? (
                <Square className="h-9 w-9 fill-current" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </motion.button>
          )}

          {state === "recording" && (
            <div className="font-mono text-lg tabular-nums text-navy-900">
              {mm}:{ss}
            </div>
          )}

          {state === "recorded" && (
            <div className="flex gap-3">
              <Button onClick={reset} variant="outline">
                <RotateCcw className="me-2 h-4 w-4" />
                {t("rec.rerecord")}
              </Button>
              <Button onClick={submit} className="bg-teal hover:bg-teal-600">
                <Check className="me-2 h-4 w-4" />
                {t("rec.next")}
              </Button>
            </div>
          )}

          {state === "submitting" && (
            <div className="flex items-center gap-2 text-navy-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("rec.processing.transcribing")}
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={reset} variant="outline">
                {t("common.retry")}
              </Button>
            </div>
          )}

          {state === "idle" && (
            <p className="text-sm text-navy-400">{t("rec.start")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
