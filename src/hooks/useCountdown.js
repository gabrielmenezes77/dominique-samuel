/**
 * useCountdown
 *
 * Custom hook that ticks every second and returns zero-padded countdown
 * values until the given target date.
 *
 * As-Is reference:
 *   startCountdown() in webapp/assets/js/app.js
 *
 * The pure `calculateCountdown(target, now)` function is exported separately
 * so it can be unit-tested without mounting a component (see task 17.3).
 *
 * Requirements: 9.1, 3.4
 */

import { useState, useEffect } from "react";

/**
 * Pure calculation function — exported for unit testing.
 *
 * @param {Date}   target  - The target date object
 * @param {number} now     - Current timestamp in milliseconds (Date.now())
 * @returns {{ days: string, hours: string, mins: string, secs: string }}
 */
export function calculateCountdown(target, now) {
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  const diff = target - now;

  if (diff <= 0) {
    return { days: "00", hours: "00", mins: "00", secs: "00" };
  }

  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
    secs: pad(Math.floor((diff % 60000) / 1000)),
  };
}

/**
 * useCountdown hook
 *
 * @param {string} targetIso - ISO date string, e.g. "2026-06-20T08:00:00"
 * @returns {{ days: string, hours: string, mins: string, secs: string }}
 */
export default function useCountdown(targetIso) {
  const target = new Date(targetIso);

  const [countdown, setCountdown] = useState(() =>
    calculateCountdown(target, Date.now()),
  );

  useEffect(() => {
    // Tick immediately on mount so the display is correct before the first
    // interval fires (matches As-Is behaviour where tick() is called once
    // before setInterval).
    setCountdown(calculateCountdown(target, Date.now()));

    const id = setInterval(() => {
      setCountdown(calculateCountdown(target, Date.now()));
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);

  return countdown;
}
