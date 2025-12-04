"use client";

import Image from "next/image";
import DemoSlotMachine from "./DemoSlotMachine";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen" style={{ background: '#17759B' }}>
      <nav className="bg-black/20 shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-6">
            <div className="flex items-center gap-6">
              <Image
                src="/pocket-macro-logo.png"
                alt="Pocket Macro"
                width={110}
                height={110}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold text-white mb-6">
            🐔 Win Amazing Prizes! 🐔
          </h2>
          <p className="text-2xl text-white/90 mb-4">
            Spin our Chicken Slot Machine every 2 hours for a chance to win!
          </p>
          <p className="text-xl text-white/75">
            Match 3 chickens and claim your prize
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 mb-16">
          <div className="flex-shrink-0">
            <DemoSlotMachine />
          </div>

          <div className="max-w-md space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">
                How It Works
              </h3>
              <ul className="space-y-3 text-white/90">
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
                  <span>Claim your prize</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onGetStarted}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl p-6 shadow-lg font-bold text-2xl transition-all transform hover:scale-105"
            >
              🎰 Ready to Play? Click Here! 🎰
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
