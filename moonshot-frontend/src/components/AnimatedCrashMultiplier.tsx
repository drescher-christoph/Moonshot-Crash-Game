"use client"

import { useEffect, useState, useRef } from "react"
import { RocketAnimation } from "./RocketAnimation"

interface AnimatedCrashMultiplierProps {
  finalMultiplier: number
  onAnimationComplete?: () => void
}

export function AnimatedCrashMultiplier({ finalMultiplier, onAnimationComplete }: AnimatedCrashMultiplierProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(100)
  const [isAnimating, setIsAnimating] = useState(true)
  const [hasCrashed, setHasCrashed] = useState(false)
  const [progress, setProgress] = useState(0)

  const onCompleteRef = useRef(onAnimationComplete)

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete
  }, [onAnimationComplete])

  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    console.log("[v0] Starting crash animation to", finalMultiplier / 100, "x")

    const startMultiplier = 100
    const endMultiplier = finalMultiplier
    const duration = 5000
    const updateInterval = 50

    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += updateInterval
      const linearProgress = Math.min(elapsed / duration, 1)
      const exponentialProgress = Math.pow(linearProgress, 3)

      setProgress(linearProgress)
      const range = endMultiplier - startMultiplier
      const currentValue = startMultiplier + range * exponentialProgress
      setCurrentMultiplier(Math.round(currentValue))

      if (linearProgress >= 1) {
        clearInterval(interval)
        setCurrentMultiplier(endMultiplier)
        setIsAnimating(false)
        setHasCrashed(true)

        console.log("[v0] Crash animation reached final multiplier:", endMultiplier / 100, "x")

        setTimeout(() => {
          console.log("[v0] Calling animation complete callback")
          onCompleteRef.current?.()
        }, 2000)
      }
    }, updateInterval)

    return () => clearInterval(interval)
  }, [finalMultiplier])

  return (
    <div className="w-full space-y-6 py-8">
      <RocketAnimation isActive={isAnimating} progress={progress} />

      <div className="text-center space-y-4">
        <div
          className={`text-8xl md:text-9xl font-bold font-mono transition-all duration-300 ${
            hasCrashed ? "text-destructive scale-110" : "text-primary"
          }`}
          style={{
            textShadow: hasCrashed
              ? "0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.4)"
              : "0 0 30px rgba(34, 197, 94, 0.5)",
            lineHeight: 1,
          }}
        >
          {(currentMultiplier / 100).toFixed(2)}x
        </div>

        {isAnimating ? (
          <p className="text-2xl font-bold text-primary animate-pulse">Moonshot in Progress...</p>
        ) : (
          <p className="text-4xl font-bold text-destructive animate-in zoom-in duration-300">CRASHED!</p>
        )}
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${hasCrashed ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
