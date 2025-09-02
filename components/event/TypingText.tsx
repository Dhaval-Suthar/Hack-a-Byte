"use client";

import React, { useState, useEffect } from "react";
import { TypingTextProps } from "@/types/event";

const TypingText = ({ text, speed = 20, className = "", onComplete = () => {} }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!completed) {
      setCompleted(true);
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, text, speed, completed]); // Removed onComplete to prevent potential infinite loop

  return <span className={className}>{displayedText}</span>;
};

export default TypingText;
