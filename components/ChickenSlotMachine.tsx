"use client";

import { useState, useRef, useEffect } from "react";

interface Prize {
  id: string;
  name: string;
  color: string;
  redirectUrls: string[];
  imageUrl?: string;
  weight: number;
  quantity: number;
  initialQuantity: number;
}

interface SlotMachineProps {
  prizes: Prize[];
  onWin: (prize: Prize) => void;
  onSpin: () => void;
  canSpin: boolean;
  nextSpinTime?: Date | null;
}

const CHICKEN_EMOJIS = ["🐔", "🐓", "🐣", "🐤", "🐥", "🥚", "🍗"];
const SPIN_DURATION = 3000;
const REEL_COUNT = 3;

const LOSS_MESSAGES = [
  "🐔 The chickens flew the coop! Better luck next time!",
  "🥚 No chickens hatched today! Try again later!",
  "🐓 Cock-a-doodle-don't! Maybe next spin!",
  "🍗 Looks like the chickens crossed the road... away from you!",
  "🐤 These chicks aren't aligned! Come back in 2 hours!",
  "🐥 The hen house is closed! Swing by later!",
  "🐔 Chickened out! The prize escaped!",
  "🥚 Your eggs are scrambled, not matched!",
  "🐓 Ruffled feathers, no prize! Try again soon!",
  "🍗 The Colonel is keeping his secrets today!",
];

export default function ChickenSlotMachine({
  prizes,
  onWin,
  onSpin,
  canSpin,
  nextSpinTime,
}: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>([
    CHICKEN_EMOJIS[0],
    CHICKEN_EMOJIS[0],
    CHICKEN_EMOJIS[0],
  ]);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  const getRandomChicken = () => {
    return CHICKEN_EMOJIS[Math.floor(Math.random() * CHICKEN_EMOJIS.length)];
  };

  const selectWeightedPrize = (availablePrizes: Prize[]): Prize => {
    // Calculate total weight
    const totalWeight = availablePrizes.reduce((sum, prize) => sum + prize.weight, 0);

    // Random number between 0 and total weight
    let random = Math.random() * totalWeight;

    // Select prize based on weight
    for (const prize of availablePrizes) {
      random -= prize.weight;
      if (random <= 0) {
        return prize;
      }
    }

    // Fallback (should never reach here)
    return availablePrizes[0];
  };

  const spinSlots = () => {
    if (!canSpin || spinning || prizes.length === 0) return;

    setSpinning(true);
    setMessage("");

    // Record the spin immediately
    onSpin();

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

    // Determine if player wins (1% chance)
    const willWin = Math.random() < 0.01 && prizes.length > 0;

    // Stop reels one by one
    const stopDelays = [1500, 2000, 2500];

    stopDelays.forEach((delay, index) => {
      setTimeout(() => {
        clearInterval(intervalRefs.current[index]);

        if (willWin) {
          // Make all reels show the same chicken for a win
          newReels[index] = CHICKEN_EMOJIS[0];
        } else {
          // Random chicken for loss
          if (index === REEL_COUNT - 1) {
            // Make sure the last one is different to prevent accidental win
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

        // After last reel stops
        if (index === REEL_COUNT - 1) {
          setTimeout(() => {
            setSpinning(false);
            if (willWin) {
              // Use weighted random selection
              const selectedPrize = selectWeightedPrize(prizes);
              setMessage(`🎉 WINNER! You won ${selectedPrize.name}! 🎉`);
              setTimeout(() => {
                onWin(selectedPrize);
              }, 1000);
            } else {
              const randomLossMessage = LOSS_MESSAGES[Math.floor(Math.random() * LOSS_MESSAGES.length)];
              setMessage(randomLossMessage);
            }
          }, 500);
        }
      }, delay);
    });

    // Safety cleanup after total duration
    setTimeout(() => {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
    }, SPIN_DURATION + 1000);
  };

  useEffect(() => {
    if (!nextSpinTime) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(nextSpinTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("");
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
  }, [nextSpinTime]);

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(clearInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-8 rounded-3xl shadow-2xl border-8 border-yellow-700 w-full max-w-2xl">
        <div className="bg-gradient-to-b from-red-600 to-red-800 p-6 rounded-2xl mb-6">
          <h2 className="text-4xl font-bold text-yellow-300 text-center tracking-wider drop-shadow-lg">
            🐔 CHICKEN SLOTS 🐔
          </h2>
        </div>

        <div className="flex gap-4 mb-6 justify-center px-4">
          {reels.map((chicken, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-inner border-4 border-gray-800 w-[180px] h-40 flex items-center justify-center relative overflow-hidden flex-shrink-0"
            >
              <div
                className={`text-8xl leading-none ${
                  spinning ? "animate-bounce" : ""
                }`}
                style={{ width: "100%", textAlign: "center" }}
              >
                {chicken}
              </div>
              {spinning && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-yellow-900 rounded-lg p-4 mb-4 min-h-[60px] flex items-center justify-center">
          {message ? (
            <p className="text-white text-xl font-bold text-center animate-pulse">
              {message}
            </p>
          ) : (
            <p className="text-yellow-300 text-center">
              Match 3 chickens to win a prize! 🐔🐔🐔
            </p>
          )}
        </div>

        <button
          onClick={spinSlots}
          disabled={!canSpin || spinning || prizes.length === 0}
          className={`w-full px-8 py-4 rounded-full text-2xl font-bold transition-all transform ${
            canSpin && !spinning && prizes.length > 0
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          {spinning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🎰</span>
              SPINNING...
            </span>
          ) : canSpin ? (
            "🎰 PULL THE LEVER! 🎰"
          ) : timeLeft ? (
            `Try again in ${timeLeft}`
          ) : (
            "Loading..."
          )}
        </button>

        <div className="mt-4 text-center text-yellow-200 text-sm">
          {prizes.length > 0 ? (
            <p>{prizes.length} prize{prizes.length !== 1 ? 's' : ''} available!</p>
          ) : (
            <p>No prizes available</p>
          )}
        </div>
      </div>

      <div className="text-center text-white/80 text-sm max-w-md">
        <p>
          🐔 Match all 3 chickens to win!
          <br />
          Good luck! 🍀
        </p>
      </div>

      {/* Prize Images Gallery */}
      {prizes.some(p => p.imageUrl) && (
        <div className="mt-8">
          <h3 className="text-white text-2xl font-bold text-center mb-4">
            🎁 Available Prizes 🎁
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {prizes.filter(p => p.imageUrl).map((prize) => (
              <div
                key={prize.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:scale-105 transition-transform"
              >
                <img
                  src={prize.imageUrl}
                  alt={prize.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <p className="text-white text-sm font-semibold text-center">
                  {prize.name}
                </p>
                <p className="text-white/70 text-xs text-center">
                  {prize.weight <= 5 ? "⭐ Very Rare" : prize.weight <= 20 ? "✨ Rare" : prize.weight <= 50 ? "💫 Uncommon" : "🌟 Common"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
