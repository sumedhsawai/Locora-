"use client";

import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Locora — motion helpers                                            */
/* ------------------------------------------------------------------ */

/** Fades children in when they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** 3D pointer-tilt wrapper — children lean toward the cursor. */
export function Tilt({
  children,
  max = 10,
  className = "",
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.classList.remove("tilting");
    el.style.setProperty("--tilt-x", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(px * max).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("tilting");
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className={`tilt-scene ${className}`}>
      <div ref={ref} className="tilt-card h-full" onPointerMove={onMove} onPointerLeave={onLeave}>
        {children}
      </div>
    </div>
  );
}

/** Parallax layer — shifts subtly with pointer position. */
export function Parallax({
  children,
  strength = 18,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${(-px * strength).toFixed(1)}px, ${(-py * strength).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ transition: "transform 0.25s ease-out" }}>
      {children}
    </div>
  );
}

/** Counts up to a number when scrolled into view. */
export function CountUp({ to, suffix = "", duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [val, setVal] = React.useState(0);
  const started = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
