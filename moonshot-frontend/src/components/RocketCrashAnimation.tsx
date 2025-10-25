"use client";

import { useEffect, useRef, useState } from "react";

interface RocketCrashAnimationProps {
  finalMultiplier: number;
  onAnimationComplete: () => void;
}

const ROCKET_FRAMES = [
  "/images/rocket/1.png",
  "/images/rocket/2.png",
  "/images/rocket/3.png",
  "/images/rocket/4.png",
  "/images/rocket/5.png",
  "/images/rocket/6.png",
];

const CRASH_FRAMES = [
  "/images/crash/1.png",
  "/images/crash/2.png",
  "/images/crash/3.png",
  "/images/crash/4.png",
  "/images/crash/5.png",
  "/images/crash/6.png",
  "/images/crash/7.png",
  "/images/crash/8.png",
  "/images/crash/9.png",
];

export function RocketCrashAnimation({
  finalMultiplier,
  onAnimationComplete,
}: RocketCrashAnimationProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [rocketFrame, setRocketFrame] = useState(0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [crashFrame, setCrashFrame] = useState(0);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    hasStartedRef.current = false;
    setCurrentMultiplier(1.0);
    setRocketFrame(0);
    setIsCrashed(false);
    setCrashFrame(0);
  }, [finalMultiplier]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    console.log("[v0] Starting rocket animation to", finalMultiplier, "x");

    const startTime = Date.now();
    const duration = 3000;
    const crashDisplayTime = 2000;

    const frameInterval = setInterval(() => {
      setRocketFrame((prev) => (prev + 1) % ROCKET_FRAMES.length);
    }, 100);

    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easedProgress = Math.pow(progress, 3);
        const newMultiplier = 1.0 + (finalMultiplier - 1.0) * easedProgress;
        setCurrentMultiplier(newMultiplier);
      } else {
        setCurrentMultiplier(finalMultiplier);
        clearInterval(animationInterval);
        clearInterval(frameInterval);

        console.log(
          "[v0] Rocket animation reached final multiplier:",
          finalMultiplier,
          "x"
        );

        setIsCrashed(true);

        let crashFrameIndex = 0;
        const crashFrameInterval = setInterval(() => {
          crashFrameIndex = (crashFrameIndex + 1) % CRASH_FRAMES.length;
          setCrashFrame(crashFrameIndex);
        }, 150);

        setTimeout(() => {
          clearInterval(crashFrameInterval);
          console.log("[v0] Calling animation complete callback");
          onCompleteRef.current();
        }, crashDisplayTime);
      }
    }, 16);

    return () => {
      clearInterval(animationInterval);
      clearInterval(frameInterval);
    };
  }, [finalMultiplier]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="relative">
        <img
          src={
            isCrashed ? CRASH_FRAMES[crashFrame] : ROCKET_FRAMES[rocketFrame]
          }
          alt={isCrashed ? "Crash" : "Rocket"}
          className="w-48 h-48 object-contain transition-transform duration-100"
          style={{
            transform: isCrashed
              ? "scale(1.2) rotate(15deg)"
              : `translateY(${-currentMultiplier * 2}px) scale(${
                  1 + currentMultiplier * 0.05
                })`,
          }}
        />

        {!isCrashed && (
          <div
            className="absolute inset-0 blur-2xl opacity-50 -z-10"
            style={{
              background: `radial-gradient(circle, rgba(234, 179, 8, ${
                currentMultiplier / finalMultiplier
              }) 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      <div className="text-center">
        <div
          className={`text-8xl font-bold transition-all duration-100 ${
            isCrashed ? "text-red-500 animate-pulse" : "text-yellow-400"
          }`}
          style={{
            textShadow: isCrashed
              ? "0 0 30px rgba(239, 68, 68, 0.8)"
              : "0 0 30px rgba(234, 179, 8, 0.8)",
            transform: `scale(${
              1 + (currentMultiplier / finalMultiplier) * 0.2
            })`,
          }}
        >
          {currentMultiplier.toFixed(2)}x
        </div>

        {isCrashed && (
          <div className="text-3xl font-bold text-red-400 mt-4 animate-bounce">
            CRASHED!
          </div>
        )}
      </div>

      {!isCrashed && currentMultiplier > 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30"
              style={{
                top: `${20 + i * 15}%`,
                left: "-100%",
                width: "200%",
                animation: `slideRight ${0.5 + i * 0.1}s linear infinite`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideRight {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(50%);
          }
        }
      `}</style>
    </div>
  );
}
