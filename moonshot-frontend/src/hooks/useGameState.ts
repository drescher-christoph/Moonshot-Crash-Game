"use client";

import { useReadContract, useWatchContractEvent, useBlockNumber } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RoundState } from "../constants";
import { useEffect, useState, useRef } from "react";

export function useGameState() {
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [previousRoundState, setPreviousRoundState] = useState<number | null>(
    null
  );
  const [displayState, setDisplayState] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTriggeredRef = useRef(false);
  const previousRoundIdRef = useRef<number | null>(null);

  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Poll current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("[v0] Contract Address:", CONTRACT_ADDRESS);
    console.log("[v0] Contract Address is valid:", !!CONTRACT_ADDRESS);
  }, []);

  // Read current round ID
  const {
    data: currentRoundId,
    refetch: refetchRoundId,
    isError: roundIdError,
    isLoading: roundIdLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "s_currentRoundId",
  });

  useEffect(() => {
    console.log("[v0] Current Round ID:", currentRoundId);
    console.log("[v0] Round ID Loading:", roundIdLoading);
    console.log("[v0] Round ID Error:", roundIdError);
  }, [currentRoundId, roundIdLoading, roundIdError]);

  // Read bet duration
  const { data: betDuration } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "s_betDuration",
  });

  // Read cooldown
  const { data: cooldown } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "s_cooldown",
  });

  // Read current round data
  const {
    data: roundData,
    refetch: refetchRound,
    isError: roundError,
    isLoading: roundLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "s_rounds",
    args: currentRoundId ? [currentRoundId] : undefined,
    query: {
      enabled: !!currentRoundId,
    },
  });

  useEffect(() => {
    const roundIdNum = currentRoundId ? Number(currentRoundId) : null;
    if (
      roundIdNum !== null &&
      previousRoundIdRef.current !== null &&
      roundIdNum !== previousRoundIdRef.current
    ) {
      console.log("[v0] New round detected, resetting animation state");
      setIsAnimating(false);
      animationTriggeredRef.current = false;
      setPreviousRoundState(null);
    }
    previousRoundIdRef.current = roundIdNum;
  }, [currentRoundId]);

  useEffect(() => {
    if (blockNumber) {
      refetchRoundId();
      if (currentRoundId) {
        refetchRound();
      }
    }
  }, [blockNumber, refetchRoundId, refetchRound, currentRoundId]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchRoundId();
      if (currentRoundId) {
        refetchRound();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [refetchRoundId, refetchRound, currentRoundId]);

  useEffect(() => {
    console.log("[v0] Round Data:", roundData);
    console.log("[v0] Round Loading:", roundLoading);
    console.log("[v0] Round Error:", roundError);
    console.log("[v0] Bet Duration:", betDuration);
    console.log("[v0] Cooldown:", cooldown);
  }, [roundData, roundLoading, roundError, betDuration, cooldown]);

  // Watch for round events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "RoundStarted",
    onLogs() {
      console.log("[v0] RoundStarted event detected");
      refetchRoundId();
      refetchRound();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "RoundLocked",
    onLogs() {
      console.log("[v0] RoundLocked event detected");
      refetchRound();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "RoundCrashed",
    onLogs() {
      console.log("[v0] RoundCrashed event detected");
      refetchRound();
    },
  });

  const roundState = roundData ? (roundData as unknown[])[5] as number : null
  const startTime = roundData ? Number((roundData as unknown[])[1]) : 0
  const lockTime = roundData ? Number((roundData as unknown[])[4]) : 0
  const crashTime = roundData ? Number((roundData as unknown[])[3]) : 0
  const crashMultiplier = roundData ? Number((roundData as unknown[])[2]) : 0

  useEffect(() => {
    if (roundState !== null) {
      // If round is OPEN, always update display state immediately (new round started)
      if (roundState === RoundState.OPEN) {
        console.log("[v0] Round is OPEN, updating display state");
        setDisplayState(RoundState.OPEN);
        setIsAnimating(false);
        animationTriggeredRef.current = false;
      }
      // Detect transition from LOCKED to RESOLVED for animation
      else if (
        previousRoundState === RoundState.LOCKED &&
        roundState === RoundState.RESOLVED &&
        !animationTriggeredRef.current
      ) {
        console.log(
          "[v0] Detected LOCKED -> RESOLVED transition, starting animation"
        );
        setIsAnimating(true);
        setDisplayState(RoundState.LOCKED); // Keep showing LOCKED during animation
        animationTriggeredRef.current = true; // Prevent multiple triggers
      }
      // Normal state update when not animating and not in a special transition
      else if (!isAnimating && !animationTriggeredRef.current) {
        setDisplayState(roundState);
      }

      setPreviousRoundState(roundState);
    }
  }, [roundState, previousRoundState, isAnimating]);

  const handleAnimationComplete = () => {
    console.log("[v0] Animation complete, updating display state to RESOLVED");
    setIsAnimating(false);
    setDisplayState(RoundState.RESOLVED);
    // Don't reset animationTriggeredRef here - it will be reset when new round starts
  };

  // Calculate time remaining based on display state (not actual state during animation)
  const stateForCalculation = displayState ?? roundState;
  let timeRemaining = 0;
  let nextPhase = "";
  let isWaitingForUpdate = false;

  if (stateForCalculation === RoundState.OPEN && betDuration) {
    const lockAt = startTime + Number(betDuration);
    timeRemaining = Math.max(0, lockAt - currentTime);
    nextPhase = "LOCK";
    if (timeRemaining === 0 && stateForCalculation === RoundState.OPEN) {
      isWaitingForUpdate = true;
    }
  } else if (stateForCalculation === RoundState.LOCKED) {
    timeRemaining = 0;
    nextPhase = "CRASH";
  } else if (stateForCalculation === RoundState.RESOLVED && cooldown) {
    const nextRoundAt = crashTime + Number(cooldown);
    timeRemaining = Math.max(0, nextRoundAt - currentTime);
    nextPhase = "NEXT ROUND";
    if (timeRemaining === 0 && stateForCalculation === RoundState.RESOLVED) {
      isWaitingForUpdate = true;
    }
  }

  return {
    currentRoundId: currentRoundId ? Number(currentRoundId) : 0,
    roundState: displayState ?? roundState, // Return display state for UI
    actualRoundState: roundState, // Export actual blockchain state for components that need immediate updates
    previousRoundState,
    startTime,
    lockTime,
    crashTime,
    crashMultiplier,
    betDuration: betDuration ? Number(betDuration) : 60,
    cooldown: cooldown ? Number(cooldown) : 30,
    timeRemaining,
    nextPhase,
    currentTime,
    isWaitingForUpdate,
    isLoading: roundIdLoading || roundLoading,
    isError: roundIdError || roundError,
    isAnimating,
    handleAnimationComplete,
  };
}
