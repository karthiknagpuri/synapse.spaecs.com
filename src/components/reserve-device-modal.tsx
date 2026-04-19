"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import confetti from "canvas-confetti";

const ACTUAL_PRICE = 4999;
const MIN_GUESS = 5000;
const MAX_GUESS = 40000;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ReserveDeviceModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guess, setGuess] = useState(20000);
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const closeness = Math.max(
    0,
    100 -
      Math.round((Math.abs(guess - ACTUAL_PRICE) / (MAX_GUESS - MIN_GUESS)) * 100)
  );

  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/waitlist", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.count === "number") {
          setCount(data.count);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!submitted || !open || prefersReducedMotion.current) return;
    const colors = [
      "#FF3B30",
      "#FF9500",
      "#FFCC00",
      "#34C759",
      "#5AC8FA",
      "#007AFF",
      "#AF52DE",
      "#FF2D55",
    ];
    const duration = 2200;
    const end = Date.now() + duration;
    let raf = 0;
    const frame = () => {
      confetti({
        particleCount: 5,
        startVelocity: 28,
        spread: 55,
        ticks: 260,
        gravity: 0.95,
        scalar: 0.9,
        drift: 0.6,
        origin: { x: Math.random(), y: -0.05 },
        angle: 270,
        colors,
        shapes: ["square", "circle"],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 3,
        startVelocity: 22,
        spread: 80,
        ticks: 300,
        gravity: 0.8,
        scalar: 1.05,
        drift: -0.4,
        origin: { x: Math.random(), y: -0.05 },
        angle: 270,
        colors,
        shapes: ["square", "circle"],
        disableForReducedMotion: true,
      });
      if (Date.now() < end) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [submitted, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, guess, hp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setErrorMsg("Too many attempts. Please try again later.");
        } else if (data?.error === "invalid_email") {
          setErrorMsg("Please enter a valid email address.");
        } else {
          setErrorMsg("Something went wrong. Please try again.");
        }
        return;
      }

      if (typeof data?.count === "number") setCount(data.count);
      setSubmitted(true);
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[380px] max-h-[92vh] overflow-y-auto bg-[#F5F5F3] rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full text-[#888888] hover:text-[#1A1A1A] hover:bg-[#E5E5E3] transition-colors duration-200"
        >
          <X size={14} />
        </button>

        <div className="px-6 py-6">
          {submitted ? (
            <>
              <p className="text-[#AAAAAA] text-[10px] font-sans uppercase tracking-wider mb-1.5">
                Your guess
              </p>
              <div className="relative inline-block mb-1">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(26,26,26,0.10)_0%,rgba(26,26,26,0)_65%)] animate-[synapse-glow_900ms_ease-out_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1A1A] opacity-0 animate-[synapse-spark-a_1200ms_ease-out_120ms_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1A1A] opacity-0 animate-[synapse-spark-b_1200ms_ease-out_180ms_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#888888] opacity-0 animate-[synapse-spark-c_1200ms_ease-out_240ms_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1A1A] opacity-0 animate-[synapse-spark-d_1200ms_ease-out_300ms_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#888888] opacity-0 animate-[synapse-spark-e_1200ms_ease-out_360ms_both]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1A1A] opacity-0 animate-[synapse-spark-f_1200ms_ease-out_420ms_both]"
                />
                <p
                  id="reserve-modal-title"
                  className="relative text-[#1A1A1A] text-[28px] font-serif leading-[1.1] animate-[synapse-pop_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
                >
                  {closeness}% close
                </p>
              </div>
              <div className="mb-1"></div>
              <p className="text-[#888888] text-[12px] leading-[1.55] font-sans mb-5">
                You guessed{" "}
                <span className="text-[#1A1A1A] font-medium">
                  &#8377;{guess.toLocaleString("en-IN")}
                </span>
                {count !== null && (
                  <>
                    {" "}· joined{" "}
                    <span className="text-[#1A1A1A] font-medium">
                      {count.toLocaleString("en-IN")}
                    </span>{" "}
                    other{count === 1 ? "" : "s"}
                  </>
                )}
              </p>

              <div className="border-t border-[#E5E5E3] pt-4 mb-4">
                <p className="text-[#AAAAAA] text-[10px] font-sans uppercase tracking-wider mb-2.5">
                  Early Adopter Offer
                </p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[#1A1A1A] text-[26px] font-serif leading-[1]">
                    &#8377;4,999
                  </span>
                  <span className="text-[#AAAAAA] text-[13px] font-sans line-through">
                    &#8377;9,499
                  </span>
                  <span className="bg-[#1A1A1A] text-white text-[10px] font-sans font-medium px-2 py-0.5 rounded-full">
                    47% OFF
                  </span>
                </div>
                <p className="text-[#888888] text-[12px] leading-[1.55] font-sans mb-4">
                  Claim your pre-order today. Lock in this price before we
                  launch publicly.
                </p>
                <a
                  href="https://rzp.io/rzp/Cp0Hx08m"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2.5 bg-[#1A1A1A] text-white text-[13px] font-sans font-medium rounded-lg hover:bg-[#333333] transition-colors duration-200 text-center"
                >
                  Claim Pre-Order — &#8377;4,999
                </a>
              </div>

              <p className="text-[#888888] text-[11px] leading-[1.55] font-sans">
                Thanks, {name.split(" ")[0]}. Details sent to{" "}
                <span className="text-[#1A1A1A]">{email}</span>.
              </p>
            </>
          ) : (
            <>
              <h2
                id="reserve-modal-title"
                className="text-[#1A1A1A] text-[22px] font-serif leading-[1.15] mb-1"
              >
                Reserve your device — free
              </h2>
              <p className="text-[#888888] text-[12px] leading-[1.55] font-sans mb-1">
                Guess the price to unlock an early adopter offer.
              </p>
              <p className="text-[#AAAAAA] text-[11px] font-sans mb-5 h-[14px]">
                {count !== null && (
                  <>
                    <span className="text-[#1A1A1A] font-medium">
                      {count.toLocaleString("en-IN")}
                    </span>{" "}
                    {count === 1 ? "person has" : "people have"} guessed
                  </>
                )}
              </p>

              <form onSubmit={handleSubmit}>
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-10000px",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                  }}
                >
                  <label>
                    Leave this field empty
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={hp}
                      onChange={(e) => setHp(e.target.value)}
                    />
                  </label>
                </div>

                <div className="mb-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    className="w-full px-3 py-2 text-[13px] font-sans bg-white border border-[#E5E5E3] rounded-md outline-none focus:border-[#1A1A1A] transition-colors duration-200 placeholder:text-[#AAAAAA]"
                  />
                </div>

                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-3 py-2 text-[13px] font-sans bg-white border border-[#E5E5E3] rounded-md outline-none focus:border-[#1A1A1A] transition-colors duration-200 placeholder:text-[#AAAAAA]"
                  />
                </div>

                <div className="border-t border-[#E5E5E3] pt-4 mb-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-[#1A1A1A] text-[12px] font-sans font-medium">
                      Guess the price
                    </label>
                    <span className="text-[#1A1A1A] text-[18px] font-serif leading-[1]">
                      &#8377;{guess.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={MIN_GUESS}
                    max={MAX_GUESS}
                    step={500}
                    value={guess}
                    onChange={(e) => setGuess(Number(e.target.value))}
                    aria-valuetext={`₹${guess.toLocaleString("en-IN")}`}
                    className="w-full h-1 bg-[#E5E5E3] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#1A1A1A] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[#AAAAAA] text-[10px] font-sans">
                      &#8377;5K
                    </span>
                    <span className="text-[#AAAAAA] text-[10px] font-sans">
                      &#8377;40K
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <p
                    role="alert"
                    className="text-[#C0392B] text-[12px] font-sans mb-3"
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#1A1A1A] text-white text-[13px] font-sans font-medium rounded-lg hover:bg-[#333333] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Reveal the Price"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
