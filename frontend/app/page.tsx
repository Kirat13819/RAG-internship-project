"use client";

import { useEffect, useRef, useState } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { AnswerText } from "@/components/answer-text";
import { Logo } from "@/components/logo";
import { askQuestion, checkHealth } from "@/lib/api";

const SUGGESTED_QUERIES = [
  "How many sick days do I get?",
  "Is SMS-based MFA still allowed?",
  "Can I recover a deleted task?",
  "What's the home office reimbursement limit?",
];

interface Entry {
  question: string;
  answer?: string;
  error?: string;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasAsked = entries.length > 0;

  useEffect(() => {
    checkHealth().then(setOnline);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries]);

  const ask = async (question: string) => {
    const index = entries.length;
    setEntries((prev) => [...prev, { question }]);

    try {
      const data = await askQuestion(question);
      setEntries((prev) =>
        prev.map((e, i) => (i === index ? { ...e, answer: data.answer } : e))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setEntries((prev) =>
        prev.map((e, i) => (i === index ? { ...e, error: message } : e))
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-[1.05rem] font-semibold tracking-tight">
            Northlane
          </span>
        </div>
        <span
          title={
            online === null
              ? "Connecting…"
              : online
                ? "Connected"
                : "Backend unreachable"
          }
          className={`size-[7px] rounded-full ${
            online ? "bg-green-500" : "bg-ink-faint"
          }`}
        />
      </nav>

      <main
        className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 ${
          hasAsked ? "pb-6 pt-8" : "justify-center pb-24"
        }`}
      >
        {!hasAsked && (
          <div className="mb-7 text-center">
            <h1 className="mb-1.5 text-[2.1rem] font-semibold tracking-tight">
              Ask Northlane
            </h1>
            <p className="text-ink-muted">
              Search the company&apos;s internal knowledge base
            </p>
          </div>
        )}

        {hasAsked && (
          <div className="flex-1 space-y-9">
            {entries.map((entry, i) => (
              <article key={i}>
                <h2 className="mb-3 text-[1.15rem] font-semibold tracking-tight">
                  {entry.question}
                </h2>

                {entry.answer ? (
                  <AnswerText text={entry.answer} />
                ) : entry.error ? (
                  <p className="text-[0.92rem] text-danger">
                    Something went wrong: {entry.error}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-pulse rounded-full bg-ink-faint"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div className={hasAsked ? "sticky bottom-5 mt-8" : ""}>
          <AIInputWithLoading
            onSubmit={ask}
            autoFocus
            placeholder={
              hasAsked
                ? "Ask a follow-up..."
                : "Ask anything about IT, HR, onboarding, or the product..."
            }
          />
        </div>

        {!hasAsked && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTED_QUERIES.map((query) => (
              <button
                key={query}
                onClick={() => ask(query)}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.82rem] text-ink-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
