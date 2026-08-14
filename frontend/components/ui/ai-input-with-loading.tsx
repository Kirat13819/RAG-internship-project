"use client";

import { useEffect, useRef, useState } from "react";

interface AIInputWithLoadingProps {
  onSubmit: (value: string) => void | Promise<void>;
  placeholder?: string;
  /** Minimum time the loading state stays visible, so it never flashes. */
  loadingDuration?: number;
  autoFocus?: boolean;
  className?: string;
}

const MAX_TEXTAREA_HEIGHT = 160;

export function AIInputWithLoading({
  onSubmit,
  placeholder = "Type a message...",
  loadingDuration = 400,
  autoFocus = false,
  className = "",
}: AIInputWithLoadingProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setValue("");
    setLoading(true);
    const startedAt = Date.now();

    try {
      await onSubmit(trimmed);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < loadingDuration) {
        await new Promise((r) => setTimeout(r, loadingDuration - elapsed));
      }
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className={`flex items-end gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-sm transition-colors focus-within:border-brand ${className}`}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        disabled={loading}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="flex-1 resize-none bg-transparent py-1.5 text-[0.98rem] leading-6 text-ink outline-none placeholder:text-ink-faint disabled:opacity-60"
      />

      <button
        type="submit"
        aria-label="Send"
        disabled={loading || value.trim() === ""}
        className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
      >
        {loading ? (
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 19V5M5 12l7-7 7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </form>
  );
}
