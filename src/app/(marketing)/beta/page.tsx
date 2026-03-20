"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

const ACTUAL_PRICE = 4999;
const ORIGINAL_PRICE = 12499;
const MIN_GUESS = 5000;
const MAX_GUESS = 40000;

export default function BetaPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guess, setGuess] = useState(20000);
  const [submitted, setSubmitted] = useState(false);

  const closeness = Math.max(
    0,
    100 - Math.round((Math.abs(guess - ACTUAL_PRICE) / (MAX_GUESS - MIN_GUESS)) * 100)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  useEffect(() => {
    if (submitted) {
      const end = Date.now() + 2500;
      const colors = ["#1A1A1A", "#888888", "#E5E5E3", "#FFD700", "#FF6B6B"];
      const fire = () => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.5 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.5 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="pb-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        <div className="lg:w-1/2">
          {/* Closeness result */}
          <div className="mb-10">
            <p className="text-[#AAAAAA] text-sm font-sans uppercase tracking-wider mb-4">
              Your guess
            </p>
            <p className="text-[#1A1A1A] text-[48px] font-serif leading-[1.1] mb-3">
              {closeness}% close
            </p>
            <p className="text-[#888888] text-[16px] leading-[1.65] font-sans">
              You guessed{" "}
              <span className="text-[#1A1A1A] font-medium">
                &#8377;{guess.toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          {/* Reveal */}
          <div className="border-t border-[#E5E5E3] pt-10 mb-10">
            <p className="text-[#AAAAAA] text-sm font-sans uppercase tracking-wider mb-6">
              Early Adopter Offer
            </p>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-[#1A1A1A] text-[40px] sm:text-[48px] font-serif leading-[1]">
                &#8377;4,999
              </span>
              <span className="text-[#AAAAAA] text-[20px] font-sans line-through">
                &#8377;12,499
              </span>
            </div>
            <div className="inline-block bg-[#1A1A1A] text-white text-[13px] font-sans font-medium px-3 py-1.5 rounded-full mb-6">
              60% OFF
            </div>
            <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-8">
              Claim your pre-order offer today as an early adopter. Lock in this
              price before we launch publicly.
            </p>
            <a
              href="https://rzp.io/rzp/Cp0Hx08m"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto px-8 py-3.5 bg-[#1A1A1A] text-white text-[15px] font-sans font-medium rounded-lg hover:bg-[#333333] transition-colors duration-200 text-center"
            >
              Claim Pre-Order — &#8377;4,999
            </a>
          </div>

          {/* Confirmation */}
          <div className="border-t border-[#E5E5E3] pt-8">
            <p className="text-[#888888] text-[14px] leading-[1.65] font-sans">
              Thanks, {name.split(" ")[0]}. We&apos;ll send order details to{" "}
              <span className="text-[#1A1A1A]">{email}</span>.
            </p>
          </div>
        </div>

        {/* Right side — Pendant image */}
        <div className="lg:w-1/2 flex items-center justify-center">
          <img
            src="/synapse-pendant.jpeg"
            alt="Synapse Pendant"
            className="w-full max-w-[400px] rounded-xl"
          />
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <h1 className="text-[#1A1A1A] text-[36px] sm:text-[48px] font-normal leading-[1.1] font-serif mb-8 max-w-[520px]">
        Join the Waitlist
      </h1>

      <p className="text-[#888888] text-[17px] leading-[1.65] font-sans mb-12 max-w-[520px]">
        Be among the first to experience Synapse. Sign up and guess the price of
        the Synapse Pendant to unlock an exclusive early adopter offer.
      </p>

      <form onSubmit={handleSubmit} className="max-w-[480px]">
        {/* Name */}
        <div className="mb-6">
          <label className="block text-[#1A1A1A] text-[14px] font-sans font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            className="w-full px-4 py-3 text-[15px] font-sans bg-white border border-[#E5E5E3] rounded-lg outline-none focus:border-[#1A1A1A] transition-colors duration-200 placeholder:text-[#CCCCCC]"
          />
        </div>

        {/* Email */}
        <div className="mb-8">
          <label className="block text-[#1A1A1A] text-[14px] font-sans font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 text-[15px] font-sans bg-white border border-[#E5E5E3] rounded-lg outline-none focus:border-[#1A1A1A] transition-colors duration-200 placeholder:text-[#CCCCCC]"
          />
        </div>

        {/* Price Guess Slider */}
        <div className="border-t border-[#E5E5E3] pt-8 mb-8">
          <label className="block text-[#1A1A1A] text-[14px] font-sans font-medium mb-2">
            Guess the price of Synapse Pendant
          </label>
          <p className="text-[#AAAAAA] text-[13px] font-sans mb-6">
            Drag the slider to your best guess
          </p>

          <div className="mb-4">
            <p className="text-[#1A1A1A] text-[32px] font-serif leading-[1] mb-6">
              &#8377;{guess.toLocaleString("en-IN")}
            </p>
            <input
              type="range"
              min={MIN_GUESS}
              max={MAX_GUESS}
              step={500}
              value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E5E5E3] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#1A1A1A] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[#AAAAAA] text-[12px] font-sans">
                &#8377;5,000
              </span>
              <span className="text-[#AAAAAA] text-[12px] font-sans">
                &#8377;40,000
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 bg-[#1A1A1A] text-white text-[15px] font-sans font-medium rounded-lg hover:bg-[#333333] transition-colors duration-200"
        >
          Reveal the Price
        </button>
      </form>
    </div>
  );
}
