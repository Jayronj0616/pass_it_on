"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StatusTag } from "@/components/items/StatusTag";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

// The actual item lifecycle from SYSTEM.md §2 — not generic "1. Sign up 2.
// Connect 3. Done" copy. Each step names the real status and what happens.
const STEPS: {
  status: "available" | "reserved" | "completed";
  title: string;
  body: string;
}[] = [
  {
    status: "available",
    title: "Someone posts it",
    body: "A photo, a title, a short description. It's visible to everyone browsing — no login needed to look.",
  },
  {
    status: "reserved",
    title: "You ask, they choose",
    body: "Send an inquiry. The donor reviews everyone who's asked and picks who gets it — not whoever clicked first.",
  },
  {
    status: "completed",
    title: "You work out the handoff",
    body: "Once approved, you get their contact info and arrange pickup yourselves. The app steps out of the way.",
  },
];

export function LandingSections({ signupHref }: { signupHref: string }) {
  return (
    <>
      <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
        >
          How it actually works
        </motion.h3>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.status}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="card-shadow rounded-2xl border border-border bg-surface p-6"
            >
              <StatusTag status={step.status} />
              <p className="mt-4 text-lg font-bold text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
        >
          Ready to pass something on?
        </motion.h3>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={signupHref}
            className="rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Give something away
          </Link>
          <Link
            href="/browse"
            className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-page"
          >
            Browse items
          </Link>
        </motion.div>
      </section>
    </>
  );
}
