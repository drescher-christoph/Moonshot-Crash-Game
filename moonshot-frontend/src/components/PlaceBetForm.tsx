"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RoundState } from "../constants";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface PlaceBetFormProps {
  roundState: number | null;
  currentRoundId: number;
}

export function PlaceBetForm({
  roundState,
  currentRoundId,
}: PlaceBetFormProps) {
  const { address, isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState("0.01");
  const [targetMultiplier, setTargetMultiplier] = useState("200");
  const [autoCashout, setAutoCashout] = useState("0.02");

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handlePlaceBet = async () => {
    if (!isConnected) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to place a bet",
      });
      return;
    }

    try {
      const amount = parseEther(betAmount);
      const targetMult = Math.floor(Number.parseFloat(targetMultiplier));
      const autoCash = parseEther(autoCashout);

      if (targetMult < 100) {
        toast.error("Invalid multiplier", {
          description: "Target multiplier must be at least 1.00x (100)",
        });
        return;
      }

      if (Number.parseFloat(autoCashout) <= Number.parseFloat(betAmount)) {
        toast.error("Invalid auto cashout", {
          description: "Auto cashout must be greater than bet amount",
        });
        return;
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "placeBet",
        args: [amount, BigInt(targetMult), autoCash],
        value: amount,
      });

      toast.success("Bet placed!", {
        description: `Betting ${betAmount} ETH with ${(
          targetMult / 100
        ).toFixed(2)}x target`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error placing bet", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const isDisabled =
    roundState !== RoundState.OPEN || isPending || isConfirming;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Place Your Bet</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="betAmount">Bet Amount (ETH)</Label>
          <Input
            id="betAmount"
            type="number"
            step="0.001"
            min="0.001"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isDisabled}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="targetMultiplier">
            Target Multiplier (e.g., 200 = 2.00x)
          </Label>
          <Input
            id="targetMultiplier"
            type="number"
            step="1"
            min="100"
            value={targetMultiplier}
            onChange={(e) => setTargetMultiplier(e.target.value)}
            disabled={isDisabled}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Current: {(Number.parseFloat(targetMultiplier) / 100).toFixed(2)}x
          </p>
        </div>

        <div>
          <Label htmlFor="autoCashout">Auto Cashout Amount (ETH)</Label>
          <Input
            id="autoCashout"
            type="number"
            step="0.001"
            min="0.001"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            disabled={isDisabled}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be greater than bet amount
          </p>
        </div>

        {!isConnected ? (
          <Button className="w-full" size="lg" disabled>
            Connect Wallet First
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handlePlaceBet}
            disabled={isDisabled}
          >
            {isPending || isConfirming
              ? "Placing Bet..."
              : roundState === RoundState.OPEN
              ? "Place Bet"
              : "Betting Closed"}
          </Button>
        )}

        {isSuccess && (
          <div className="text-sm text-primary text-center">
            Bet placed successfully for Round #{currentRoundId}!
          </div>
        )}
      </div>
    </Card>
  );
}
