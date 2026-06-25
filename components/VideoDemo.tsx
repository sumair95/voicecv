"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Landing-page demo video.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TO GO LIVE: paste your video's EMBED url below (YouTube/Vimeo).  │
 * │  • YouTube: https://www.youtube.com/embed/VIDEO_ID                │
 * │  • Vimeo:   https://player.vimeo.com/video/VIDEO_ID               │
 * │  Leave it empty and this whole section stays hidden.              │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * We host on YouTube/Vimeo (free, no app bandwidth) and only load the
 * iframe after the user clicks play, so it never slows the initial page.
 */
const DEMO_VIDEO_EMBED: string = "";

export function VideoDemo() {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);

  if (!DEMO_VIDEO_EMBED) return null;

  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
          {t("landing.video.title")}
        </h2>
        <p className="mt-3 text-navy-400">{t("landing.video.subtitle")}</p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-navy-100/60 bg-navy-900 shadow-xl">
          {playing ? (
            <iframe
              src={`${DEMO_VIDEO_EMBED}${DEMO_VIDEO_EMBED.includes("?") ? "&" : "?"}autoplay=1`}
              title={t("landing.video.title")}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={t("landing.video.title")}
              className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-navy-900 to-navy-600"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-teal text-white shadow-lg shadow-teal/40 transition group-hover:scale-105">
                <Play className="ms-1 h-9 w-9 fill-current" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
