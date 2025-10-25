"use client"

import { RoundState } from "../constants"
import { TrendingUp } from "lucide-react"
import { AnimatedCrashMultiplier } from "./AnimatedCrashMultiplier"

interface MultiplierDisplayProps {
  crashMultiplier: number
  roundState: number | null
  actualRoundState: number | null
  isAnimating: boolean
  onAnimationComplete: () => void
}

export function MultiplierDisplay({
  crashMultiplier,
  roundState,
  actualRoundState,
  isAnimating,
  onAnimationComplete,
}: MultiplierDisplayProps) {
  if (
    isAnimating &&
    (actualRoundState === RoundState.RESOLVED || roundState === RoundState.RESOLVED) &&
    crashMultiplier > 0
  ) {
    return <AnimatedCrashMultiplier finalMultiplier={crashMultiplier} onAnimationComplete={onAnimationComplete} />
  }

  if (roundState === RoundState.RESOLVED && crashMultiplier > 0) {
    return (
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-8 h-8 text-destructive" />
          <h2 className="text-6xl font-bold font-mono text-destructive">{(crashMultiplier / 100).toFixed(2)}x</h2>
        </div>
        <p className="text-sm text-muted-foreground">Crash Multiplier</p>
      </div>
    )
  }

  if (roundState === RoundState.LOCKED) {
    return (
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-pulse">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-6xl font-bold font-mono text-primary animate-pulse">??.??x</h2>
        </div>
        <p className="text-sm text-muted-foreground">Waiting for crash...</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-2">
      <h2 className="text-6xl font-bold font-mono text-muted-foreground">--.-x</h2>
      <p className="text-sm text-muted-foreground">Place your bets!</p>
    </div>
  )
}
