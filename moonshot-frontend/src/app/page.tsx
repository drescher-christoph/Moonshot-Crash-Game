"use client";
import Image from "next/image";
import RocketAnimation from "../components/RocketAnimation";
import GameDisplay from "@/components/GameDisplay";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { ethers } from "ethers";
import {
  useConfig,
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";
import EntropyAbi from "@pythnetwork/entropy-sdk-solidity/abis/IEntropyV2.json";


/* -------------------- Component -------------------- */
export default function Home() {
  const { address, isConnected } = useAccount();
  const wagmiConfig = useConfig();

  /* -------------------- Render -------------------- */
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: 50 }}
    >
      <h1 className="font-bold text-4xl text-white">Moonshot — Crash Game ⚡️</h1>

      <Image
        src="/images/logo.png"
        alt="Moonshot Logo"
        width={150}
        height={150}
      />

      {isConnected ? (
        <>
          <GameDisplay />
        </>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p>Please connect wallet to play</p>
          <RocketAnimation />
        </div>
      )}

    </div>
  );
}
