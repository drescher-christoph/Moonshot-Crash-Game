"use client";
import Image from "next/image";
import { useState } from "react";
import { ethers } from "ethers";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import EntropyAbi from "@pythnetwork/entropy-sdk-solidity/abis/IEntropyV2.json";

interface BetResult {
  //roundId: bigint;
  crashMultiplier: bigint;
  crashTimeStamp: bigint;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const currentRound = 1;
  const [betAmount, setBetAmount] = useState<string | number>("0.01");
  const [targetMultiplier, setTargetMultiplier] = useState<string | number>(
    "2.0"
  );
  const [crash, setCrash] = useState<BetResult | null>(null);
  const isPending = false;

  const ROUND_STATES = ["OPEN", "LOCKED", "RESOLVED"];

  const {
    data: entropyFee,
    isLoading,
    isError,
  } = useReadContract({
    abi: EntropyAbi,
    address: "0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c",
    functionName: "getFeeV2",
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const {
    data: currentRoundId,
    isLoading: loadingCurrentRoundId,
    isError: errorLoadingCurrentRoundId,
  } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "s_currentRoundId",
  });

  const { data: currentRoundState, isLoading: loadingCurrentRoundState } =
    useReadContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "getCurrentRoundState",
    });

  const { data: crashMultiplier, isLoading: loadingCrashMultiplier } =
    useReadContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "getCrashMultiplier",
    });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "RoundCrashed",
    onLogs(logs) {
      console.log("Round Crashed!");
      logs.forEach((log) => {
        if ("args" in log) {
          const args = log.args as BetResult;
          setCrash(args);
          console.log("Crash: : ", args);
        }
      });
    },
  });

  async function placeBet() {
    const value = ethers.parseEther((betAmount as string) || "0");
    const autoCashOutMultiplier = (targetMultiplier as number) * 100;
    try {
      writeContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "placeBet",
        args: [value, autoCashOutMultiplier, value + value],
        value: entropyFee ? entropyFee + value : value + value * BigInt(0.1),
      });
    } catch (err) {
      console.log("Error placing bet: ", err);
    }
  }

  async function claim() {
    try {
      writeContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "claimWinnings",
      });
      console.log("Claimed win!");
    } catch (err) {
      console.log("Error claiming: ", err);
    }
  }

  return (
    <div
      style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: 50 }}
    >
      <h1 className="font-bold text-4xl">CrashGame UI ⚡️</h1>
      {isConnected && (
        <>
          <p>Current Round ID: {currentRoundId?.toString()}</p>

          <h2>Round State: {ROUND_STATES[currentRoundState as any]}</h2>
          <h2>
            Crash:{" "}
            {crashMultiplier ? (crashMultiplier as any) : "No yet confirmed"}
          </h2>

          {currentRoundState === 0 ? (
            <>
              <h3>Place Bet</h3>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                step="0.001"
              />
              <input
                type="number"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(e.target.value)}
                step="0.1"
              />
              <button onClick={placeBet} disabled={isPending}>
                {isPending ? "Betting..." : "Place Bet"}
              </button>
            </>
          ) : crash ? (
            Number(targetMultiplier) < Number(crash.crashMultiplier) ? (
              <>
                <h2>Du hast gewonnen!</h2>
                <button onClick={claim}>Claim</button>
              </>
            ) : (
              <h2>Du hast verloren!</h2>
            )
          ) : (
            <h2>You cannot bet at the moment</h2>
          )}
        </>
      )}
    </div>
  );
}
