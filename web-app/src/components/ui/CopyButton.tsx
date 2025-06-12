/**
 * CopyButton.tsx
 * 
 * Reusable copy-to-clipboard button for code blocks
 * 
 * Usage: <CopyButton value={codeString} />
 */
import React, { useState } from 'react';

interface CopyButtonProps {
  value: string;
  className?: string;
}

/**
 * CopyButton component
 * @param {string} value - The string to copy
 * @param {string} [className] - Optional additional classes
 * @returns {JSX.Element}
 */
export const CopyButton: React.FC<CopyButtonProps> = ({ value, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 z-10 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded transition-colors duration-150 shadow ${className || ''}`}
      title="Copy code"
      aria-label="Copy code block"
      type="button"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}; 