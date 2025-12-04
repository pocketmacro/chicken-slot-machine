"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
}

export default function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Ready to spin!");
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  return (
    <div className="text-center">
      <p className="text-sm text-white/90 mb-2">Next spin available in:</p>
      <p className="text-3xl font-bold text-white font-mono">{timeLeft}</p>
    </div>
  );
}
