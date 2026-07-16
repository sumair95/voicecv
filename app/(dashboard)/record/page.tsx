"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { UpsellModal } from "@/components/UpsellModal";
import { useLanguage } from "@/components/LanguageProvider";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import type { Language, QAPair, QuestionRow } from "@/types/cv";
import { OUTPUT_LANGUAGES } from "@/types/cv";
import { LANGUAGES } from "@/lib/i18n";

type Stage = "language" | "recording" | "processing" | "done" | "error";

const PROCESSING_STEPS = [
  "rec.processing.transcribing",
  "rec.processing.understanding",
  "rec.processing.writing",
] as const;

export default function RecordPage() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("language");
  const [pickedLang, setPickedLang] = useState<Language>(lang);
  // Language the finished CV is written in (independent of recording language).
  const [outputLang, setOutputLang] = useState<Language>(lang === "it" ? "it" : "en");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QAPair[]>([]);
  const [procStep, setProcStep] = useState(0);
  const [cvId, setCvId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    if (stage !== "recording" || questions.length > 0) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("language", pickedLang)
        .order("order_index", { ascending: true });
      setQuestions((data as QuestionRow[]) ?? []);
    })();
  }, [stage, pickedLang, questions.length]);

  useEffect(() => {
    if (stage !== "processing") return;
    const id = setInterval(() => {
      setProcStep((s) => Math.min(PROCESSING_STEPS.length - 1, s + 1));
    }, 3500);
    return () => clearInterval(id);
  }, [stage]);

  const progressPct = useMemo(
    () => (questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0),
    [currentIndex, questions.length],
  );

  function startRecording() {
    track("record_started", { lang: pickedLang, output: outputLang });
    setLang(pickedLang);
    setStage("recording");
  }

  function handleAnswer(_audio: Blob, transcript: string) {
    advance(transcript);
  }

  function handleSkip() {
    advance("");
  }

  function advance(answer: string) {
    const q = questions[currentIndex];
    const next: QAPair = {
      question: q.question_text,
      answer,
      field_key: q.field_key,
    };
    const updated = [...answers, next];
    setAnswers(updated);

    if (currentIndex + 1 >= questions.length) {
      submitAll(updated);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  // Step back to re-answer the previous question. Drops its recorded answer so
  // re-answering re-appends it in order; the recorder remounts fresh.
  function goBack() {
    if (currentIndex === 0) return;
    setAnswers((prev) => prev.slice(0, -1));
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  async function submitAll(qa: QAPair[]) {
    setStage("processing");
    setProcStep(0);
    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qaPairs: qa, language: pickedLang, outputLanguage: outputLang }),
      });
      // Free CV limit reached → offer the upsell instead of a hard error.
      if (res.status === 402) {
        setStage("error");
        setErrorMsg(t("upsell.title"));
        setUpsellOpen(true);
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      const { cvId: id } = (await res.json()) as { cvId: string };
      setCvId(id);
      setStage("done");
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14B8A6", "#0F172A", "#10B981"],
        });
      }, 200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Generation failed");
      setStage("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 text-muted-foreground"
      >
        <ArrowLeft className="me-2 h-4 w-4" />
        {t("common.back")}
      </Button>

      <AnimatePresence mode="wait">
        {stage === "language" && (
          <motion.div
            key="lang"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <Card className="border-border/60">
              <CardContent className="p-8">
                <h1 className="text-2xl font-bold text-foreground">{t("onb.title")}</h1>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {LANGUAGES.map((l) => {
                    const active = pickedLang === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          const code = l.code as Language;
                          setPickedLang(code);
                          // Suggest a matching CV language; user can override below.
                          setOutputLang(code === "it" ? "it" : "en");
                        }}
                        className={`rounded-xl border-2 p-5 transition ${
                          active
                            ? "border-teal bg-teal/5"
                            : "border-border hover:border-teal/40"
                        }`}
                        dir={l.dir}
                      >
                        <div className="text-xl font-bold text-foreground">{l.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{l.english}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("rec.outputLang.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("rec.outputLang.desc")}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {LANGUAGES.filter((l) => OUTPUT_LANGUAGES.includes(l.code)).map((l) => {
                      const active = outputLang === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => setOutputLang(l.code)}
                          className={`rounded-xl border-2 p-4 text-start transition ${
                            active
                              ? "border-teal bg-teal/5"
                              : "border-border hover:border-teal/40"
                          }`}
                          dir={l.dir}
                        >
                          <div className="font-bold text-foreground">{l.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{l.english}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="mt-8 w-full bg-teal hover:bg-teal-600"
                  size="lg"
                  onClick={startRecording}
                >
                  {t("onb.continue")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "recording" && questions.length === 0 && (
          <motion.div key="loading" className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal" />
          </motion.div>
        )}

        {stage === "recording" && questions.length > 0 && (
          <motion.div
            key={`q-${currentIndex}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("rec.questionOf", { n: currentIndex + 1, total: questions.length })}</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <VoiceRecorder
              question={questions[currentIndex].question_text}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              onComplete={handleAnswer}
              onSkip={handleSkip}
            />
            {currentIndex > 0 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-teal-700"
                >
                  <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                  {t("rec.previous")}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-border/60">
              <CardContent className="space-y-6 p-12 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal/10">
                  <Loader2 className="h-10 w-10 animate-spin text-teal" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t(PROCESSING_STEPS[procStep])}
                </h2>
                <div className="mx-auto flex max-w-md flex-col gap-3 text-start">
                  {PROCESSING_STEPS.map((key, i) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 ${
                        i <= procStep ? "text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {i < procStep ? (
                        <CheckCircle2 className="h-5 w-5 text-teal" />
                      ) : i === procStep ? (
                        <Loader2 className="h-5 w-5 animate-spin text-teal" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                      <span>{t(key)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-border/60">
              <CardContent className="space-y-6 p-12 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal text-white">
                  <Sparkles className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {t("rec.processing.done")}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
                    <Link href={cvId ? `/cv/${cvId}` : "/dashboard"}>
                      {t("rec.viewCv")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard">{t("dashboard.myCvs")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-red-200">
              <CardContent className="space-y-4 p-8 text-center">
                <h2 className="text-xl font-semibold text-red-700">Something went wrong</h2>
                <p className="text-muted-foreground">{errorMsg}</p>
                <Button
                  onClick={() => {
                    setAnswers([]);
                    setCurrentIndex(0);
                    setStage("recording");
                  }}
                  variant="outline"
                >
                  {t("common.retry")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
}
