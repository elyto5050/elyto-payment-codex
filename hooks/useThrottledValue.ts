"use client";

import { useEffect, useRef, useState } from "react";

export default function useThrottledValue<T>(value: T, delay = 250) {
  const [throttled, setThrottled] = useState<T>(value);
  const last = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = delay - (now - last.current);

    if (remaining <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      last.current = now;
      setThrottled(value);
    } else {
      timeoutRef.current = window.setTimeout(() => {
        last.current = Date.now();
        setThrottled(value);
        timeoutRef.current = null;
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return throttled;
}
