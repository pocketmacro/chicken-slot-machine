"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import ChickenSlotMachine from "@/components/ChickenSlotMachine";
import CountdownTimer from "@/components/CountdownTimer";
import LandingPage from "@/components/LandingPage";
import { getCurrentUser } from "aws-amplify/auth";
import Image from "next/image";

const client = generateClient<Schema>();

interface Prize {
  id: string;
  name: string;
  color: string;
  redirectUrl: string;
}

const SPIN_COOLDOWN_HOURS = 2;

export default function Home() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [nextSpinTime, setNextSpinTime] = useState<Date | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        data.map((p) => ({
          id: p.id,
          name: p.name || "",
          color: p.color || "",
          redirectUrl: p.redirectUrl || "",
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

      // Filter out records with old schema (no lastSpinTime)
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

      // Filter out records with old schema
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

      // Filter out records with old schema
      const validRecords = existingSpins.filter((record) => record && record.id && record.lastSpinTime);

      if (validRecords.length > 0) {
        const existingSpin = validRecords[0];
        await client.models.UserSpin.update({
          id: existingSpin.id,
          prizesWon: [...(existingSpin.prizesWon || []), prize.id],
        });
      }

      await client.models.Prize.update({
        id: prize.id,
        isActive: false,
      });

      setTimeout(() => {
        window.location.href = prize.redirectUrl;
      }, 2000);
    } catch (error) {
      console.error("Error recording win:", error);
    }
  };

  return (
    <Authenticator
      components={{
        SignIn: {
          Header() {
            return (
              <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 -m-8">
                <nav className="bg-white shadow-sm border-b">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-16">
                      <div className="flex items-center gap-3">
                        <Image
                          src="/pocket-macro-logo.png"
                          alt="Pocket Macro"
                          width={50}
                          height={50}
                          className="object-contain"
                        />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Prize Wheel
                        </h1>
                      </div>
                    </div>
                  </div>
                </nav>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                  <div className="text-center mb-12">
                    <h2 className="text-6xl font-bold text-gray-900 mb-6">
                      🐔 Win Amazing Prizes! 🐔
                    </h2>
                    <p className="text-2xl text-gray-600 mb-4">
                      Spin our Chicken Slot Machine every 2 hours for a chance to win!
                    </p>
                    <p className="text-xl text-gray-500">
                      Match 3 chickens and claim your prize
                    </p>
                  </div>

                  <div className="flex flex-col lg:flex-row items-center justify-center gap-12 mb-16">
                    <div className="flex-shrink-0">
                      <DemoSlotMachine />
                    </div>

                    <div className="max-w-md space-y-6">
                      <div className="bg-white rounded-xl p-6 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          How It Works
                        </h3>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start gap-3">
                            <span className="text-2xl">1️⃣</span>
                            <span>Register for free with your email</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-2xl">2️⃣</span>
                            <span>Spin the slot machine every 2 hours</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-2xl">3️⃣</span>
                            <span>Match 3 chickens to win prizes!</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-2xl">🎁</span>
                            <span>Get redirected to claim your prize</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">Ready to Play?</h3>
                        <p className="text-lg mb-4">Sign in below to start spinning!</p>
                        <div className="text-sm opacity-90">
                          ⬇️ Use the sign-in form below ⬇️
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            );
          },
        },
      }}
    >
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <Image
                    src="/pocket-macro-logo.png"
                    alt="Pocket Macro"
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Prize Wheel
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.signInDetails?.loginId}
                  </span>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-gray-900 mb-4">
                🐔 Chicken Slot Machine! 🐔
              </h2>
              <p className="text-xl text-gray-600">
                Match 3 chickens to win! Spin every 2 hours!
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : prizes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl text-gray-600">
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
                <ChickenSlotMachine prizes={prizes} onWin={handleWin} onSpin={handleSpin} canSpin={canSpin} />
              </div>
            )}
          </main>
        </div>
      )}
    </Authenticator>
  );
}
