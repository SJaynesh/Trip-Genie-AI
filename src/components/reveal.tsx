"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type RevealProps = {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  children: React.ReactNode;
  threshold?: number;
  once?: boolean;
  animation?: "slide-up" | "fade-in";
  delayMs?: number;
};

export function Reveal({
  as: Comp = "div",
  className,
  children,
  threshold = 0.15,
  once = true,
  animation = "slide-up",
  delayMs = 0,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current as Element | null;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(e.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <Comp
      ref={ref as any}
      className={cn(
        "transition-all will-change-transform",
        !inView && "opacity-0 translate-y-3",
        inView && (animation === "slide-up" ? "animate-slide-up" : "animate-fade-in"),
        delayMs ? `[animation-delay:${delayMs}ms]` : "",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export default Reveal;
