"use client";
import { useEffect } from "react";

export function ScrollbarCompensation() {
  useEffect(() => {
    const setCompensation = () => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const hasVerticalScroll = document.body.scrollHeight > window.innerHeight;
      if (!hasVerticalScroll) {
        document.body.style.paddingRight = `${scrollbarWidth || 16}px`;
      } else {
        document.body.style.paddingRight = '';
      }
    };
    setCompensation();
    window.addEventListener('resize', setCompensation);
    return () => {
      document.body.style.paddingRight = '';
      window.removeEventListener('resize', setCompensation);
    };
  }, []);
  return null;
} 