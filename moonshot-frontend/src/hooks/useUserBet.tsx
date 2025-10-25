"use client";

import {
  useAccount,
  useReadContract,
  useBlockNumber,
  useWatchContractEvent,
} from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RoundState } from "../constants";
import { useEffect } from "react";

export function useUserBet(roundId: number) {
  const { address } = useAccount();

  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { data: betData, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "s_bets",
    args: address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: !!address && roundId > 0,
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (blockNumber && address && roundId > 0) {
      refetch();
    }
  }, [blockNumber, refetch, address, roundId]);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "BetPlaced",
    onLogs: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (!address || roundId <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetch, address, roundId]);

  const hasBet = betData ? ((betData as unknown[])[1] as number) > 0 : false;
  const amount = betData ? ((betData as unknown[])[1] as BigInt) : BigInt(0);
  const targetMultiplier = betData ? ((betData as unknown[])[2] as number) : 0;
  const autoCashout = betData
    ? ((betData as unknown[])[3] as BigInt)
    : BigInt(0);
  const claimed = betData ? ((betData as unknown[])[4] as BigInt) : false;

  return {
    hasBet,
    amount,
    targetMultiplier,
    autoCashout,
    claimed,
    refetch,
  };
}
