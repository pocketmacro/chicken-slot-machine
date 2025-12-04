"use client";

import { useState, useRef, useEffect } from "react";

interface Prize {
  id: string;
  name: string;
  color: string;
  redirectUrl: string;
}

interface PrizeWheelProps {
  prizes: Prize[];
  onWin: (prize: Prize) => void;
  canSpin: boolean;
}

export default function PrizeWheel({ prizes, onWin, canSpin }: PrizeWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [prizes]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const arc = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((prize, index) => {
      const angle = index * arc;

      ctx.beginPath();
      ctx.fillStyle = prize.color || `hsl(${(index * 360) / prizes.length}, 70%, 60%)`;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px Arial";
      ctx.fillText(prize.name, radius / 2, 0);
      ctx.restore();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const spinWheel = () => {
    if (!canSpin || spinning || prizes.length === 0) return;

    setSpinning(true);
    const spins = 5 + Math.random() * 5;
    const degrees = spins * 360;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + degrees + extraDegrees;

    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const arc = 360 / prizes.length;
      const adjustedRotation = (360 - normalizedRotation + 90) % 360;
      const winningIndex = Math.floor(adjustedRotation / arc) % prizes.length;
      const winningPrize = prizes[winningIndex];

      setSpinning(false);
      onWin(winningPrize);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderTop: "40px solid #f59e0b",
          }}
        />

        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="rounded-full shadow-2xl"
          />
        </div>
      </div>

      <button
        onClick={spinWheel}
        disabled={!canSpin || spinning || prizes.length === 0}
        className={`px-8 py-4 rounded-full text-xl font-bold transition-all ${
          canSpin && !spinning && prizes.length > 0
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        {spinning ? "Spinning..." : canSpin ? "SPIN THE WHEEL!" : "Come back tomorrow!"}
      </button>
    </div>
  );
}
