"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {baseSepolia} from "wagmi/chains"

export default getDefaultConfig({
    appName: "Moonshot",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [baseSepolia],
    ssr: false
})