import { Fragment, type ReactNode } from "react";

/** Splits "**bold**" spans out of a line into React nodes. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.+?\*\*)/g).map((part, i) => {
    const bold = part.match(/^\*\*(.+?)\*\*$/);
    return bold ? <strong key={i}>{bold[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Gemini replies in light markdown (**bold**, "-"/"*" bullets, often with no
 * blank line before a list). Renders that into paragraphs and lists.
 */
export function AnswerText({ text }: { text: string }) {
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "") continue;

    const bullet = line.match(/^[-*]\s+(.*)/);
    const type = bullet ? "ul" : "p";
    const content = bullet ? bullet[1] : line;
    const last = blocks[blocks.length - 1];

    if (last && last.type === type) {
      last.lines.push(content);
    } else {
      blocks.push({ type, lines: [content] });
    }
  }

  return (
    <div className="text-[0.98rem] leading-7 text-ink">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">
            {block.lines.map((line, j) => (
              <li key={j}>{renderInline(line)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mb-3 last:mb-0">
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        )
      )}
    </div>
  );
}
