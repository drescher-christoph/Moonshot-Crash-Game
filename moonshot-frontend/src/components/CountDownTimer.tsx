"use client"

import { Clock, Loader2 } from "lucide-react"

interface CountdownTimerProps {
  timeRemaining: number
  nextPhase: string
  isWaitingForUpdate?: boolean
}

export function CountdownTimer({ timeRemaining, nextPhase, isWaitingForUpdate }: CountdownTimerProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  if (isWaitingForUpdate) {
    return (
      <div className="flex items-center gap-3 text-primary">
        <Loader2 className="w-5 h-5 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium">Waiting for blockchain update...</p>
          <p className="text-xs text-muted-foreground">State transition in progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Clock className="w-5 h-5" />
      <div className="text-center">
        <p className="text-sm font-medium">Time until {nextPhase}</p>
        <p className="text-2xl font-mono font-bold text-foreground">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </p>
      </div>
    </div>
  )
}
