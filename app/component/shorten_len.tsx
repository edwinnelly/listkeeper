// ShortTextWithTooltip.tsx
import React from "react";

interface ShortTextProps {
  text: string | null;  // Allow null
  max?: number;
}

const ShortTextWithTooltip: React.FC<ShortTextProps> = ({ text, max = 20 }) => {
  // Handle null or undefined
  if (!text) {
    return <span>-</span>; // or return empty string: <span></span>
  }
  
  const displayText = text.length > max ? text.slice(0, max) + "…" : text;
  return <span title={text}>{displayText}</span>;
};

export default ShortTextWithTooltip;