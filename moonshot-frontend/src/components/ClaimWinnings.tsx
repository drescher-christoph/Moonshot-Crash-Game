"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RoundState } from "../constants";
import { useUserBet } from "@/hooks/useUserBet";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ClaimWinningsProps {
  roundId: number;
  roundState: number | null;
  crashMultiplier: number;
}

export function ClaimWinnings({
  roundId,
  roundState,
  crashMultiplier,
}: ClaimWinningsProps) {
  const { address, isConnected } = useAccount();
  const { hasBet, amount, targetMultiplier, claimed, refetch } =
    useUserBet(roundId);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to claim winnings",
      });
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimWinnings",
        args: [BigInt(roundId)],
      });

      toast.info("Claiming winnings...", {
        description: "Please wait for confirmation",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error claiming winnings", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  if (!isConnected || !hasBet) {
    return null;
  }

  const isResolved = roundState === RoundState.RESOLVED;
  const isWinner = isResolved && targetMultiplier < crashMultiplier;
  const payout = isWinner ? (Number(amount) * Number(targetMultiplier) / 100) : 0;
  const canClaim = isWinner && !claimed;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Bet - Round #{roundId}</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Bet Amount</p>
            <p className="text-lg font-mono font-bold">
              {formatEther(amount as bigint)} ETH
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Multiplier</p>
            <p className="text-lg font-mono font-bold">
              {(Number(targetMultiplier) / 100).toFixed(2)}x
            </p>
          </div>
        </div>

        {isResolved && (
          <>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {isWinner ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">You Won!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    You Lost
                  </span>
                </>
              )}
            </div>

            {isWinner && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Potential Payout
                </p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {formatEther(BigInt(payout))} ETH
                </p>
              </div>
            )}

            {canClaim && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleClaim}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? "Claiming..." : "Claim Winnings"}
              </Button>
            )}

            {claimed && (
              <div className="text-center text-sm text-primary font-semibold">
                Winnings already claimed!
              </div>
            )}
          </>
        )}

        {!isResolved && (
          <div className="text-sm text-muted-foreground text-center">
            Waiting for round to resolve...
          </div>
        )}
      </div>
    </Card>
  );
}
