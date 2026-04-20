"use client";

import { useEffect } from "react";
import { MiraOrb } from "@/components/preview/mira-orb";
import { MiraPanel } from "@/components/preview/mira-panel";
import { useMiraSession } from "@/components/preview/mira-session";

export default function PreviewPage() {
  const {
    status,
    muted,
    transcript,
    cards,
    userAmpRef,
    modelAmpRef,
    start,
    end,
    toggleMute,
  } = useMiraSession();

  const live = status === "live";
  const busy = status === "requesting-mic" || status === "connecting";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && live) end();
      if (e.code === "Space" && live && muted) {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, muted, end, toggleMute]);

  useEffect(() => {
    if (!live) return;
    let hideTimer: number | null = null;
    const onVis = () => {
      if (document.hidden) {
        hideTimer = window.setTimeout(() => end(), 60_000);
      } else if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (hideTimer !== null) window.clearTimeout(hideTimer);
    };
  }, [live, end]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 pt-[6vh] pb-24">
      <div className="flex-1 flex flex-col items-center text-center min-w-0">
        <h1 className="text-[#1A1A1A] text-[32px] sm:text-[40px] font-normal leading-[1.12] font-serif mb-4">
          Meet MIRA
        </h1>
        <p className="text-[#888888] text-[15px] font-sans max-w-[420px] mb-16">
          A proactive relationship assistant. Speak naturally — MIRA listens, remembers, and replies in real time.
        </p>

        <div className="mb-10">
          <MiraOrb
            live={live}
            muted={muted}
            userAmpRef={userAmpRef}
            modelAmpRef={modelAmpRef}
          />
        </div>

        <div className="min-h-[72px] max-w-[540px] w-full px-4 mb-10" aria-live="polite">
          {transcript.length === 0 ? (
            <p className="text-[#AAAAAA] text-[14px] font-sans">
              {live ? "Listening…" : "Press start to begin."}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {transcript.slice(-2).map((line) => (
                <p
                  key={line.id}
                  className={
                    "text-[15px] font-sans leading-[1.6] " +
                    (line.speaker === "mira" ? "text-[#1A1A1A]" : "text-[#888888]")
                  }
                >
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {status === "mic-denied" && (
          <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
            MIRA needs your microphone. Enable it in your browser settings and reload the page.
          </div>
        )}
        {status === "rate-limited" && (
          <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
            Demo limit reached for this connection. Please come back later.
          </div>
        )}
        {status === "error" && (
          <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
            Couldn&apos;t start the session. Please try again.
          </div>
        )}

        <div className="flex items-center gap-3">
          {live ? (
            <>
              <button
                onClick={toggleMute}
                className={
                  "px-5 h-10 rounded-full text-[14px] font-sans font-medium transition-colors duration-200 " +
                  (muted
                    ? "bg-[#1A1A1A] text-white hover:bg-[#333333]"
                    : "border border-[#E5E5E3] bg-white text-[#1A1A1A] hover:border-[#AAAAAA]")
                }
              >
                {muted ? "Muted" : "Mute"}
              </button>
              <button
                onClick={end}
                className="px-5 h-10 rounded-full bg-[#1A1A1A] text-white text-[14px] font-sans font-medium hover:bg-[#333333] transition-colors duration-200"
              >
                End
              </button>
            </>
          ) : (
            <button
              onClick={start}
              disabled={busy}
              className="px-6 h-11 rounded-full bg-[#1A1A1A] text-white text-[14px] font-sans font-medium hover:bg-[#333333] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {busy ? "Connecting…" : status === "idle" ? "Start conversation" : "Start again"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 lg:mt-0 lg:pt-[calc(6vh+56px)] w-full lg:w-auto">
        <MiraPanel cards={cards} />
      </div>
    </div>
  );
}
