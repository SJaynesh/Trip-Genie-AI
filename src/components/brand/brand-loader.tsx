"use client";

import React from "react";
import { PlaneTakeoff, Sparkles, Hotel } from "lucide-react";
import { TripGenieLogo } from "./trip-genie-logo";

export type BrandLoaderProps = {
  label?: string;
  sublabel?: string;
  fullscreen?: boolean;
  variant?: "genie" | "flight" | "hotel";
};

export function BrandLoader({ label = "Loading", sublabel, fullscreen = false, variant = "genie" }: BrandLoaderProps) {
  const IconA = variant === "hotel" ? Hotel : PlaneTakeoff;
  const IconB = variant === "flight" ? Sparkles : (variant === "hotel" ? Sparkles : PlaneTakeoff);
  const content = (
    <div className="relative mx-4 w-full max-w-md rounded-2xl border bg-card/90 p-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/30 blur-xl" />
          <TripGenieLogo size={28} />
        </div>
        <div>
          <div className="font-semibold text-foreground/90">{label}</div>
          {sublabel && <div className="text-sm text-muted-foreground">{sublabel}</div>}
        </div>
      </div>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-shimmer" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <IconA className="h-3.5 w-3.5 text-primary animate-float" />
        <span>{variant === 'hotel' ? 'Finding cozy stays' : variant === 'flight' ? 'Warming up engines' : 'Warming up engines'}</span>
        <IconB className="h-3.5 w-3.5 text-accent animate-float [animation-delay:200ms]" />
        <span>{variant === 'hotel' ? 'Checking amenities' : 'Adding some magic'}</span>
      </div>
    </div>
  );

  if (!fullscreen) return <div className="mx-auto w-full max-w-md">{content}</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md">
      {content}
    </div>
  );
}

export default BrandLoader;
