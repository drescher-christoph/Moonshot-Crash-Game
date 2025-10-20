"use client";
import Image from "next/image";
import RocketAnimation from "../components/RocketAnimation";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import EntropyAbi from "@pythnetwork/entropy-sdk-solidity/abis/IEntropyV2.json";

interface BetResult {
  //roundId: bigint;
  crashMultiplier: bigint;
  crashTimeStamp: bigint;
}

interface Bet {
  roundId: bigint;
  amount: bigint;
  targetMultiplier: bigint;
  autoCashout: bigint;
  claimed: boolean;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const currentRound = 1;
  const [bet, setBet] = useState<Bet | null>(null);
  const [crash, setCrash] = useState<BetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string | number>("0.01");
  const [targetMultiplier, setTargetMultiplier] = useState<string | number>(
    "2.0"
  );
  const isPending = false;

  const ROUND_STATES = ["OPEN", "LOCKED", "RESOLVED"];

  // WAGMI HOOKS //

  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (txConfirmed) {
      console.log("Bet placed successfully, refetching...");
      refetchCurrentUserBet();
    }
  }, [txConfirmed]);

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

  const {
    data: currentUserBet,
    isError: errorLoadingUserBet,
    refetch: refetchCurrentUserBet,
  } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "s_bets",
    args: [currentRoundId, address],
  });

  useEffect(() => {
    if (errorLoadingUserBet) {
      setError("Fehler beim Laden der Wette.");
    } else if (currentUserBet) {
      try {
        const betArray = currentUserBet as [
          bigint,
          bigint,
          bigint,
          bigint,
          boolean
        ];
        // Check if bet is empty: all numeric values are 0 and claimed is false
        const isEmptyBet =
          betArray[0] === BigInt(0) &&
          betArray[1] === BigInt(0) &&
          betArray[2] === BigInt(0) &&
          betArray[3] === BigInt(0) &&
          betArray[4] === false;
        if (isEmptyBet) {
          // Leere Wette, nichts setzen
          return;
        }
        console.log("Bet Amount: ", betArray[1]);
        setBet({
          roundId: betArray[0],
          amount: betArray[1],
          targetMultiplier: betArray[2],
          autoCashout: betArray[3],
          claimed: betArray[4],
        });
      } catch (err) {
        console.error("Fehler beim Verarbeiten der Wette:", err);
        setError("Ungültige Datenstruktur empfangen.");
      }
    }
  }, [currentUserBet, isError, address]);

  // Debug Log
  useEffect(() => {
    if (bet) console.log("Aktuelle Wette:", bet);
  }, [bet]);

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
      {isConnected ? (
        <>
          <p>Current Round ID: {currentRoundId?.toString()}</p>

          <h2>Round State: {ROUND_STATES[currentRoundState as any]}</h2>
          <h2>
            Crash:{" "}
            {crashMultiplier ? (crashMultiplier as any) : "No yet confirmed"}
          </h2>

          {currentRoundState === 0 && (
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
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}
          {isLoading && <p>Lade deine Wette...</p>}

          {!isLoading && !error && bet && (
            <div>
              <p>Deine Wette: {ethers.formatEther(bet.amount)} ETH</p>
              <p>Ziel-Multiplikator: {Number(bet.targetMultiplier) / 100}x</p>
            </div>
          )}

          {!bet && !isLoading && !error && (
            <p>Du hast in dieser Runde noch keine Wette platziert.</p>
          )}

          {bet && crash && (
            <>
              <p>Crash at {crash.crashMultiplier}</p>
              {bet!.targetMultiplier < crash!.crashMultiplier ? (
                <>
                  <p>Du hast gewonnen</p>
                  <button onClick={claim}>
                    Claim {bet.amount * bet.targetMultiplier}
                  </button>
                </>
              ) : (
                <p>Du hast verloren</p>
              )}
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <p>Please connect your wallet to start gambling</p>
          <RocketAnimation />
        </div>
      )}
    </div>
  );
}
