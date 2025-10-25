"use client"

import { Badge } from "./ui/badge"
import { RoundState } from "../constants"

interface GameStatusBadgeProps {
  state: number | null
}

export function GameStatusBadge({ state }: GameStatusBadgeProps) {
  if (state === null) {
    return (
      <Badge variant="outline" className="text-lg px-6 py-2">
        Loading...
      </Badge>
    )
  }

  switch (state) {
    case RoundState.OPEN:
      return <Badge className="text-lg px-6 py-2 bg-primary text-primary-foreground">🟢 BETTING OPEN</Badge>
    case RoundState.LOCKED:
      return <Badge className="text-lg px-6 py-2 bg-accent text-accent-foreground">🔒 LOCKED - WAITING FOR CRASH</Badge>
    case RoundState.RESOLVED:
      return <Badge className="text-lg px-6 py-2 bg-destructive text-destructive-foreground">💥 CRASHED</Badge>
    default:
      return (
        <Badge variant="outline" className="text-lg px-6 py-2">
          Unknown State
        </Badge>
      )
  }
}
