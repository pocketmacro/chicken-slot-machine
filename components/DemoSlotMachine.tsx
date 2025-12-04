"use client";

import { useState, useRef, useEffect } from "react";

const CHICKEN_EMOJIS = ["🐔", "🐓", "🐣", "🐤", "🐥", "🥚", "🍗"];
const REEL_COUNT = 3;

export default function DemoSlotMachine() {
  const [reels, setReels] = useState<string[]>([
    CHICKEN_EMOJIS[0],
    CHICKEN_EMOJIS[0],
    CHICKEN_EMOJIS[0],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Watch the demo!");
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const autoSpinInterval = useRef<NodeJS.Timeout>();

  const getRandomChicken = () => {
    return CHICKEN_EMOJIS[Math.floor(Math.random() * CHICKEN_EMOJIS.length)];
  };

  const spinSlots = () => {
    if (spinning) return;

    setSpinning(true);
    setMessage("Spinning...");

    // Clear any existing intervals
    intervalRefs.current.forEach(clearInterval);
    intervalRefs.current = [];

    // Start spinning each reel
    const newReels = [...reels];
    for (let i = 0; i < REEL_COUNT; i++) {
      const interval = setInterval(() => {
        newReels[i] = getRandomChicken();
        setReels([...newReels]);
      }, 100);
      intervalRefs.current.push(interval);
    }

    // Determine if this demo wins (50% chance for demo purposes)
    const willWin = Math.random() < 0.5;

    // Stop reels one by one
    const stopDelays = [1000, 1500, 2000];

    stopDelays.forEach((delay, index) => {
      setTimeout(() => {
        clearInterval(intervalRefs.current[index]);

        if (willWin) {
          newReels[index] = CHICKEN_EMOJIS[0];
        } else {
          if (index === REEL_COUNT - 1) {
            let lastChicken = getRandomChicken();
            while (lastChicken === newReels[0] && lastChicken === newReels[1]) {
              lastChicken = getRandomChicken();
            }
            newReels[index] = lastChicken;
          } else {
            newReels[index] = getRandomChicken();
          }
        }
        setReels([...newReels]);

        if (index === REEL_COUNT - 1) {
          setTimeout(() => {
            setSpinning(false);
            if (willWin) {
              setMessage("🎉 Winner!");
            } else {
              setMessage("Try again!");
            }
          }, 300);
        }
      }, delay);
    });
  };

  // Auto-spin every 4 seconds
  useEffect(() => {
    autoSpinInterval.current = setInterval(() => {
      spinSlots();
    }, 4000);

    // Initial spin
    setTimeout(() => spinSlots(), 500);

    return () => {
      if (autoSpinInterval.current) {
        clearInterval(autoSpinInterval.current);
      }
      intervalRefs.current.forEach(clearInterval);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-4 rounded-2xl shadow-xl border-4 border-yellow-700 w-full max-w-sm">
      <div className="bg-gradient-to-b from-red-600 to-red-800 p-3 rounded-xl mb-3">
        <h3 className="text-xl font-bold text-yellow-300 text-center tracking-wider">
          🐔 DEMO 🐔
        </h3>
      </div>

      <div className="flex gap-2 mb-3 justify-center">
        {reels.map((chicken, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-inner border-2 border-gray-800 w-20 h-24 flex items-center justify-center relative overflow-hidden"
          >
            <div
              className={`text-5xl transition-all ${
                spinning ? "animate-bounce" : ""
              }`}
            >
              {chicken}
            </div>
            {spinning && (
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-900 rounded-lg p-2 text-center">
        <p className="text-yellow-100 text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}
