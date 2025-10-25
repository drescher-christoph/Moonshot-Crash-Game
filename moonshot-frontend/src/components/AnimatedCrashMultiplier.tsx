"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"

interface AnimatedCrashMultiplierProps {
  finalMultiplier: number
  onAnimationComplete?: () => void
}

export function AnimatedCrashMultiplier({ finalMultiplier, onAnimationComplete }: AnimatedCrashMultiplierProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(100) // Start at 1.00x
  const [isAnimating, setIsAnimating] = useState(true)
  const [hasCrashed, setHasCrashed] = useState(false)

  useEffect(() => {
    if (!isAnimating) return

    console.log("[v0] Starting crash animation to", finalMultiplier / 100, "x")

    const startMultiplier = 100 // 1.00x
    const endMultiplier = finalMultiplier
    const duration = 4000 // 4 seconds for more suspense
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Exponential easing: starts slow, accelerates dramatically
      const exponentialProgress = Math.pow(progress, 2.5)

      // Calculate current value with exponential growth
      const range = endMultiplier - startMultiplier
      let currentValue = startMultiplier + range * exponentialProgress

      // Add slight jitter for realism (less jitter as we approach the end)
      const jitterAmount = (1 - progress) * 3
      const jitter = (Math.random() - 0.5) * jitterAmount
      currentValue = Math.max(100, currentValue + jitter)

      setCurrentMultiplier(currentValue)

      // Continue animation or stop at crash point
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Reached crash point
        setCurrentMultiplier(endMultiplier)
        setIsAnimating(false)
        setHasCrashed(true)

        console.log("[v0] Crash animation reached final multiplier:", endMultiplier / 100, "x")

        // Show crash for 2 seconds before completing
        setTimeout(() => {
          console.log("[v0] Calling animation complete callback")
          onAnimationComplete?.()
        }, 2000)
      }
    }

    requestAnimationFrame(animate)
  }, [finalMultiplier, isAnimating, onAnimationComplete])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/98 backdrop-blur-md">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Multiplier Display */}
        <div className="relative">
          <div
            className={`text-[12rem] font-bold font-mono transition-all duration-300 ${
              hasCrashed ? "text-destructive scale-125 animate-pulse" : "text-primary"
            }`}
            style={{
              textShadow: hasCrashed
                ? "0 0 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.4)"
                : "0 0 40px rgba(34, 197, 94, 0.5)",
              lineHeight: 1,
            }}
          >
            {(currentMultiplier / 100).toFixed(2)}x
          </div>

          {/* Pulsing icon */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <TrendingUp
              className={`w-20 h-20 transition-all duration-300 ${
                hasCrashed ? "text-destructive animate-bounce" : "text-primary animate-pulse"
              }`}
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-3">
          {isAnimating ? (
            <>
              <p className="text-3xl font-bold text-primary animate-pulse">🚀 Moonshot in Progress...</p>
              <p className="text-lg text-muted-foreground">Watch the multiplier climb!</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold text-destructive animate-in zoom-in duration-300">💥 CRASHED!</p>
              <p className="text-2xl text-muted-foreground">Final multiplier: {(finalMultiplier / 100).toFixed(2)}x</p>
            </>
          )}
        </div>

        {/* Animated background effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className={`absolute inset-0 transition-all duration-1000 ${
              hasCrashed
                ? "bg-gradient-to-br from-destructive/30 to-destructive/10"
                : "bg-gradient-to-br from-primary/30 to-primary/10"
            }`}
          />
          {/* Radial pulse effect */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
              hasCrashed ? "bg-destructive/20 scale-150" : "bg-primary/20 scale-100 animate-pulse"
            }`}
          />
        </div>
      </div>
    </div>
  )
}
