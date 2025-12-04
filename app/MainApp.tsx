"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import ChickenSlotMachine from "@/components/ChickenSlotMachine";
import CountdownTimer from "@/components/CountdownTimer";
import { getCurrentUser } from "aws-amplify/auth";
import Image from "next/image";

const client = generateClient<Schema>();

interface Prize {
  id: string;
  name: string;
  color: string;
  redirectUrls: string[];
  imageUrl?: string;
  weight: number;
  quantity: number;
  initialQuantity: number; // Track original quantity to calculate which URL to use
}

const SPIN_COOLDOWN_HOURS = 2;

interface MainAppProps {
  onSignOut: () => void;
  userEmail?: string;
}

export default function MainApp({ onSignOut, userEmail }: MainAppProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [nextSpinTime, setNextSpinTime] = useState<Date | null>(null);

  useEffect(() => {
    loadPrizes();
    checkSpinEligibility();
  }, []);

  const loadPrizes = async () => {
    try {
      const { data } = await client.models.Prize.list({
        filter: { isActive: { eq: true } },
      });
      setPrizes(
        data
          .filter((p) => (p.quantity ?? 0) > 0) // Only show prizes with quantity available
          .map((p) => ({
            id: p.id,
            name: p.name || "",
            color: p.color || "",
            redirectUrls: p.redirectUrls || [],
            imageUrl: p.imageUrl || undefined,
            weight: p.weight ?? 10,
            quantity: p.quantity ?? 1,
            initialQuantity: (p.redirectUrls?.length ?? 1), // Initial quantity = number of URLs
          }))
      );
    } catch (error) {
      console.error("Error loading prizes:", error);
    }
  };

  const checkSpinEligibility = async () => {
    try {
      const user = await getCurrentUser();
      setUserId(user.userId);

      const { data } = await client.models.UserSpin.list({
        filter: { userId: { eq: user.userId } },
      });

      const validRecords = data.filter((record) => record && record.lastSpinTime);

      if (validRecords.length === 0) {
        setCanSpin(true);
        setNextSpinTime(null);
      } else {
        const lastSpin = validRecords[0];
        const lastSpinTime = new Date(lastSpin.lastSpinTime || "");
        const now = new Date();
        const hoursSinceLastSpin = (now.getTime() - lastSpinTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastSpin >= SPIN_COOLDOWN_HOURS) {
          setCanSpin(true);
          setNextSpinTime(null);
        } else {
          setCanSpin(false);
          const nextSpin = new Date(lastSpinTime.getTime() + SPIN_COOLDOWN_HOURS * 60 * 60 * 1000);
          setNextSpinTime(nextSpin);
        }
      }
    } catch (error) {
      console.error("Error checking spin eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    try {
      const now = new Date().toISOString();

      const { data: existingSpins } = await client.models.UserSpin.list({
        filter: { userId: { eq: userId } },
      });

      const validRecords = existingSpins.filter((record) => record && record.id && record.lastSpinTime);

      if (validRecords.length > 0) {
        const existingSpin = validRecords[0];
        await client.models.UserSpin.update({
          id: existingSpin.id,
          lastSpinTime: now,
        });
      } else {
        await client.models.UserSpin.create({
          userId,
          lastSpinTime: now,
          prizesWon: [],
        });
      }

      setCanSpin(false);
      const nextSpin = new Date(new Date(now).getTime() + SPIN_COOLDOWN_HOURS * 60 * 60 * 1000);
      setNextSpinTime(nextSpin);
    } catch (error) {
      console.error("Error recording spin:", error);
    }
  };

  const handleWin = async (prize: Prize) => {
    try {
      const { data: existingSpins } = await client.models.UserSpin.list({
        filter: { userId: { eq: userId } },
      });

      const validRecords = existingSpins.filter((record) => record && record.id && record.lastSpinTime);

      if (validRecords.length > 0) {
        const existingSpin = validRecords[0];
        await client.models.UserSpin.update({
          id: existingSpin.id,
          prizesWon: [...(existingSpin.prizesWon || []), prize.id],
        });
      }

      // Calculate which URL to use based on remaining quantity
      // If initial quantity was 5 and current quantity is 3, we want URL index 2 (the 3rd URL that was given out)
      const urlIndex = prize.initialQuantity - prize.quantity;
      const redirectUrl = prize.redirectUrls[urlIndex] || prize.redirectUrls[0];

      // Decrement the quantity
      const newQuantity = prize.quantity - 1;
      await client.models.Prize.update({
        id: prize.id,
        quantity: newQuantity,
        // Auto-disable if quantity reaches 0
        isActive: newQuantity > 0,
      });

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    } catch (error) {
      console.error("Error recording win:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#17759B' }}>
      <nav className="bg-black/20 shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-6">
              <Image
                src="/pocket-macro-logo.png"
                alt="Pocket Macro"
                width={110}
                height={110}
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/90">
                Welcome, {userEmail}
              </span>
              <button
                onClick={onSignOut}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            🐔 Chicken Slot Machine! 🐔
          </h2>
          <p className="text-xl text-white/90">
            Match 3 chickens to win! Spin every 2 hours!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-white/90">
              No prizes available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {!canSpin && nextSpinTime && (
              <CountdownTimer
                targetTime={nextSpinTime}
                onComplete={() => {
                  setCanSpin(true);
                  setNextSpinTime(null);
                }}
              />
            )}
            <ChickenSlotMachine prizes={prizes} onWin={handleWin} onSpin={handleSpin} canSpin={canSpin} nextSpinTime={nextSpinTime} />
          </div>
        )}
      </main>
    </div>
  );
}
