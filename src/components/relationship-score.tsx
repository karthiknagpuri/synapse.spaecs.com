"use client";

import { useMemo } from "react";

interface RelationshipScoreProps {
  score: number;
  variant?: "inline" | "compact";
}

function getScoreConfig(score: number) {
  if (score >= 81) {
    return {
      label: "Inner Circle",
      color: "#7C3AED",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      ringColor: "stroke-purple-500",
      trackColor: "stroke-purple-100",
    };
  }
  if (score >= 61) {
    return {
      label: "Close",
      color: "#22C55E",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      ringColor: "stroke-green-500",
      trackColor: "stroke-green-100",
    };
  }
  if (score >= 41) {
    return {
      label: "Familiar",
      color: "#3B82F6",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      ringColor: "stroke-blue-500",
      trackColor: "stroke-blue-100",
    };
  }
  if (score >= 21) {
    return {
      label: "Acquaintance",
      color: "#F59E0B",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      ringColor: "stroke-amber-500",
      trackColor: "stroke-amber-100",
    };
  }
  return {
    label: "New",
    color: "#9CA3AF",
    bgColor: "bg-gray-50",
    textColor: "text-gray-500",
    ringColor: "stroke-gray-300",
    trackColor: "stroke-gray-100",
  };
}

export function RelationshipScore({
  score,
  variant = "inline",
}: RelationshipScoreProps) {
  const config = useMemo(() => getScoreConfig(score), [score]);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  if (variant === "compact") {
    return (
      <div className="group relative inline-flex items-center gap-1.5">
        <svg
          width="20"
          height="20"
          viewBox="0 0 36 36"
          className="flex-shrink-0"
        >
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            className={config.trackColor}
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            className={config.ringColor}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        {/* Tooltip */}
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
            <span className="font-medium">{score}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-400">100</span>
            <span className="text-gray-400 mx-1.5">-</span>
            <span>{config.label}</span>
          </div>
          <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 bg-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 36 36"
        className="flex-shrink-0"
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className={config.trackColor}
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className={config.ringColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="18"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-700"
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          {score}
        </text>
      </svg>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </span>
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
          Relationship Strength:{" "}
          <span className="font-medium">{score}</span>/100
        </div>
        <div className="mx-auto mt-[-1px] h-1.5 w-1.5 rotate-45 bg-gray-900" />
      </div>
    </div>
  );
}
