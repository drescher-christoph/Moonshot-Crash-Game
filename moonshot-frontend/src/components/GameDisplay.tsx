"use client";
import Image from "next/image";
import { Card } from "./ui/card";
import { useGameState } from "@/hooks/useGameState";
import { GameInfoCard } from "./GameInfoCard";
import { GameStatusBadge } from "./GameStatusBadge";
import { MultiplierDisplay } from "./MultiplierDisplay";
import { CountdownTimer } from "./CountDownTimer";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function GameDisplay() {
      const {
      currentRoundId,
      roundState,
      actualRoundState,
      crashMultiplier,
      timeRemaining,
      nextPhase,
      betDuration,
      cooldown,
      isWaitingForUpdate,
      isLoading,
      isError,
      isAnimating,
      handleAnimationComplete,
    } = useGameState()

  if (isLoading) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          <Card className="p-8 bg-card/50 backdrop-blur">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading game data...</p>
            </div>
          </Card>
        </div>
      );
    }

  if (isError) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to the smart contract. Please check:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your wallet is connected to the correct network</li>
              <li>The contract address is set correctly</li>
              <li>The RPC endpoint is working</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status Badge */}
      <div className="flex justify-center">
        <GameStatusBadge state={roundState} />
      </div>

      {/* Main Display Card */}
      <Card className="p-8 bg-card/50 backdrop-blur">
        <div className="flex flex-col items-center gap-8">
          {/* Multiplier or Timer */}
          <MultiplierDisplay
            crashMultiplier={crashMultiplier}
            roundState={roundState}
            actualRoundState={actualRoundState}
            isAnimating={isAnimating}
            onAnimationComplete={handleAnimationComplete}
          />

          {(timeRemaining > 0 || isWaitingForUpdate) && (
            <CountdownTimer
              timeRemaining={timeRemaining}
              nextPhase={nextPhase}
              isWaitingForUpdate={isWaitingForUpdate}
            />
          )}
        </div>
      </Card>

      {/* Game Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GameInfoCard label="Round ID" value={currentRoundId} />
        <GameInfoCard label="Bet Duration" value={`${betDuration}s`} />
        <GameInfoCard label="Cooldown" value={`${cooldown}s`} />
        <GameInfoCard label="Last Crash" value={crashMultiplier > 0 ? `${(crashMultiplier / 100).toFixed(2)}x` : "-"} />
      </div>
    </div>
  )
}
