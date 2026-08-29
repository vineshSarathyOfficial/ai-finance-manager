"use client";

/** Minimal formatting: **bold**, line breaks, `code` */
export function AiMessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      {content.split("\n\n").map((paragraph, pi) => (
        <p key={pi} className="body-sm text-inherit leading-relaxed whitespace-pre-wrap">
          {paragraph.split("\n").map((line, li, arr) => (
            <span key={li}>
              {formatInline(line)}
              {li < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function formatInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-inherit">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded-[var(--radius-xs)] bg-black/5 text-[13px] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{token}</span>;
  });
}
