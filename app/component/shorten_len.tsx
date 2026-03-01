// ShortTextWithTooltip.tsx
import React from "react";

interface ShortTextProps {
  text: string;
  max?: number;
}

const ShortTextWithTooltip: React.FC<ShortTextProps> = ({ text, max = 20 }) => {
  const displayText = text.length > max ? text.slice(0, max) + "…" : text;
  return <span title={text}>{displayText}</span>;
};

export default ShortTextWithTooltip;
