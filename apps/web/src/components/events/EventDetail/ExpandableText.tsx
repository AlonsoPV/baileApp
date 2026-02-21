import React, { useState } from "react";

export interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
}

export function ExpandableText({
  text,
  maxLines = 4,
  expandLabel = "Ver más",
  collapseLabel = "Ver menos",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n").filter(Boolean);
  const isLong = lines.length > maxLines || text.length > 200;

  return (
    <div className="eds-expandable">
      <p
        className={`eds-expandable__text ${!expanded && isLong ? "eds-expandable__text--collapsed" : ""}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          className="eds-expandable__toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
}
