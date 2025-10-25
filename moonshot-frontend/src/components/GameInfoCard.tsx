"use client"

import { Card } from "./ui/card"

interface GameInfoCardProps {
  label: string
  value: string | number
}

export function GameInfoCard({ label, value }: GameInfoCardProps) {
  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-mono font-bold">{value}</p>
    </Card>
  )
}
