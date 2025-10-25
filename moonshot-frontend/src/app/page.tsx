"use client";
import Image from "next/image";
import GameDisplay from "@/components/GameDisplay";
import { PlaceBetForm } from "@/components/PlaceBetForm";
import { ClaimWinnings } from "@/components/ClaimWinnings";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { ethers } from "ethers";
import {
  useConfig,
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { useGameState } from "@/hooks/useGameState";
import { readContract } from "wagmi/actions";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import EntropyAbi from "@pythnetwork/entropy-sdk-solidity/abis/IEntropyV2.json";

export default function Home() {
  const { address, isConnected } = useAccount();
  const wagmiConfig = useConfig();
  const { currentRoundId, roundState, actualRoundState, crashMultiplier } = useGameState();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col text-center items-center space-y-2">
          <Image
            src="/images/logo.png"
            alt="Moonshot Logo"
            width={150}
            height={150}
            priority
          />
          <p className="text-muted-foreground">
            On-chain Crash Game powered by Pyth Entropy
          </p>
        </div>

        {/* Game Display */}
        {isConnected ? (
          <>
            <GameDisplay />

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <PlaceBetForm
                roundState={roundState as number}
                currentRoundId={currentRoundId as number}
              />
              <ClaimWinnings
                roundId={currentRoundId}
                roundState={actualRoundState ?? roundState as number}
                crashMultiplier={crashMultiplier}
              />
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Please connect your wallet to participate in the game.
          </div>
        )}
      </div>
    </main>
  );
}
