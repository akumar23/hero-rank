import React, { useState } from "react";

export interface TruncatedTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

/**
 * Component for truncating long text with expand/collapse functionality.
 * Maintains card dimensions and provides accessibility support.
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLines = 3,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple heuristic: if text is longer than ~150 chars, it likely needs truncation
  // This is a rough estimate - CSS line-clamp will handle the actual truncation
  const needsTruncation = text.length > 150;

  if (!needsTruncation) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className={className}>
      <div
        className={isExpanded ? "" : "line-clamp-2"}
        style={
          isExpanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        <span className="break-words">{text}</span>
      </div>
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click from triggering vote
            setIsExpanded(!isExpanded);
          }}
          className="font-mono text-xs text-signal hover:underline mt-1"
          type="button"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

