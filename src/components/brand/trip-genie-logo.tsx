"use client";

import React from "react";

type Props = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  title?: string;
};

export function TripGenieLogo({
  className,
  size = 28,
  withWordmark = false,
  wordmarkClassName,
  title = "TripGenie",
}: Props) {
  return (
    <div className={["flex items-center gap-2 select-none", className].filter(Boolean).join(" ")}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={title}
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="tg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
          <radialGradient id="tg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent) / 0.35)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        {/* Glow */}
        <circle cx="12" cy="12" r="11" fill="url(#tg-glow)" />
        {/* Badge */}
        <circle cx="12" cy="12" r="9" fill="url(#tg-grad)" />
        {/* Simple genie swirl mark */}
        <path
          d="M6 13c2.5-3.5 9.5-3.5 12 0 0 0-1.4 4-6 4s-6-4-6-4Zm3.5-3.2c.9-1.1 3.6-1.1 4.5 0M16.8 12.4c1.2-.1 2.2-.6 3.2-1.6-1.4-.1-2.3-.6-3.1-1.9-.5 1.1-.7 2.2-.1 3.5Z"
          fill="#fff"
          fillOpacity={0.9}
        />
        {/* Sparkles */}
        <circle cx="6" cy="7" r="0.8" fill="#fff" opacity="0.9" />
        <circle cx="18" cy="6" r="0.6" fill="#fff" opacity="0.85" />
        <circle cx="19" cy="16" r="0.5" fill="#fff" opacity="0.8" />
      </svg>
      {withWordmark && (
        <span
          className={[
            "font-headline text-lg font-extrabold tracking-tight bg-clip-text text-transparent",
            "bg-gradient-to-r from-primary via-accent to-secondary",
            "drop-shadow-sm",
            wordmarkClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          TripGenie
        </span>
      )}
    </div>
  );
}

export default TripGenieLogo;
