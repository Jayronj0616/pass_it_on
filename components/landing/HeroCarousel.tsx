"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const STATIC_SLIDES: { src: string; alt: string }[] = [
  { src: "/landing/furniture.jpg", alt: "Secondhand furniture" },
  { src: "/landing/giving box.jpg", alt: "Handing over a wrapped box" },
  { src: "/landing/thrift.jpg", alt: "A rack of thrifted clothes" },
];

type Slide = {
  src: string;
  alt: string;
  href?: string;
};

const AUTO_ADVANCE_MS = 5000;

export function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(STATIC_SLIDES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadItemPhotos() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("items")
        .select("id, title, photo_url")
        .eq("status", "available")
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error || cancelled) return;

      const itemSlides: Slide[] = (data ?? [])
        .filter((item) => item.photo_url)
        .map((item) => ({
          src: item.photo_url as string,
          alt: item.title,
          href: `/items/${item.id}`,
        }));

      if (itemSlides.length > 0) {
        setSlides([...STATIC_SLIDES, ...itemSlides]);
      }
    }

    loadItemPhotos();
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = useCallback(
    (i: number) => setIndex((i + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const safeIndex = index % slides.length;
  const current = slides[safeIndex];

  return (
    <div
      className="card-shadow relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-gray-bg sm:aspect-square"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {current && (
        <>
          {current.href ? (
            <Link href={current.href} className="absolute inset-0">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover"
                priority={safeIndex === 0}
              />
            </Link>
          ) : (
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover"
              priority={safeIndex === 0}
            />
          )}
        </>
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => goTo(safeIndex - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => goTo(safeIndex + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? "w-5 bg-surface" : "w-1.5 bg-surface/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
