# Moonshot Crash — On-Chain Crash Game DApp

## Live-Preview: https://moonshot-crash-game.vercel.app/

## Overview

**Moonshot Crash** is a decentralized, fully on-chain Crash-style betting game built on the **Base** network.  
Players place a bet and select their **target multiplier** (Auto-Cashout).  
Once the round starts, the rocket’s multiplier begins to rise on-chain.  
If the final crash multiplier exceeds the player’s target, they win — otherwise, they lose their bet.

The goal of Moonshot is to bring **provably fair, transparent gameplay** to the blockchain — powered by **Pyth Entropy** for randomness and **Chainlink Automation** for round timing and management.

This repository contains the frontend (Next.js + wagmi) and contract integration logic for an on-chain crash game that operates autonomously in recurring rounds.

---

## Architecture

- **Frontend:** Next.js (React) using wagmi hooks for wallet connections, reads, writes, and contract event listeners.
- **Smart Contract:** Solidity-based game engine that manages round lifecycle (start, lock, crash, resolve) and handles user bets, payouts, and round storage.
- **Oracles & Automation:**
  - **Pyth Entropy:** Used for generating verifiable, unpredictable randomness that determines each round’s crash multiplier.
  - **Chainlink Automation:** Used for deterministic, time-based transitions between game phases (e.g., opening bets, locking, resolving).

---

## How a Round Works

1. **Round Start:**  
   A new round begins. Players can place bets and specify their desired `targetMultiplier` (auto-cashout level).
2. **Betting Phase:**  
   The contract accepts bets until the `lockTime` is reached.  
   A live countdown in the frontend shows how long the window remains open.
3. **Lock Phase:**  
   Once locked, no further bets are accepted. The round awaits the Pyth Entropy callback.
4. **Crash Resolution:**  
   When randomness arrives from **Pyth Entropy**, the contract calculates the crash multiplier.  
   If the crash multiplier is greater than a player’s target multiplier, the player can claim winnings equal to: **payout = betAmount * targetMultiplier**
Otherwise, the bet is lost.
5. **New Round:**  
Chainlink Automation triggers the start of the next round automatically.

---

## Pyth Entropy — Fair Randomness & Verifiability

Pyth Entropy provides **verifiable, low-latency randomness** designed for on-chain applications that require integrity and unpredictability.

In Moonshot, it’s used to determine the **crash multiplier seed** fairly and transparently:

1. The contract requests entropy from **Pyth Entropy** at the end of each round (in `LockRoundAndCallPyth()`).
2. Pyth Entropy responds via a **secure callback**, delivering a random `bytes32` value.
3. This random value is transformed into a crash multiplier using a deterministic formula such as: **r = uint256(randomBytes) % 1e18
crashMultiplier = (1e20) / (1e18 - r)**

This ensures that the result is:
- **Unpredictable** — since entropy comes from Pyth’s oracle infrastructure.
- **Verifiable** — every randomness response is publicly accessible on-chain.
- **Immutable** — no player or operator can influence the crash result post-request.

Pyth Entropy eliminates the need for off-chain random number servers or manual commit-reveal schemes, simplifying provable fairness.

---

## Chainlink Automation — Autonomous Rounds

Moonshot uses **Chainlink Automation** (formerly Keepers) to manage round progression fully on-chain.  
The contract implements the standard `checkUpkeep` and `performUpkeep` functions, enabling a continuous, self-sustaining game loop without manual intervention.

Each upkeep cycle automatically evaluates the current round state and triggers the appropriate transition:

- `startRound()` → called when there is **no active round** or the previous one has finished and the cooldown period has elapsed.  
  Starts a new betting phase and emits `RoundStarted`.

- `lockRoundAndCallPyth()` → called when the **betting window closes** (after `s_betDuration`).  
  Locks the round to prevent new bets, requests entropy from **Pyth Entropy**, and transitions to the LOCKED state.

- Entropy callback (`entropyCallback(...)`) → when **Pyth returns randomness**, the contract computes the **crash multiplier** and resolves the round.  
  Once resolved, players can claim winnings, and the contract awaits the cooldown before the next upkeep triggers another `startRound()`.

This design ensures that:
- Rounds **advance deterministically** based on on-chain time.  
- The game runs **24/7 without human input**.  
- No single actor controls timing or results — all transitions are driven by Chainlink’s decentralized Automation network.

Chainlink Automation thus acts as the **heartbeat** of Moonshot, keeping the game fair, continuous, and transparent.

---

## Mathematics of the Crash Multiplier (Conceptual)

Each round’s crash multiplier is derived from the entropy output to simulate exponential “crash” growth.

Given a uniform random variable `u ∈ (0, 1)`, we define the multiplier as: **M = 1 / (1 - u)**

The result produces a **heavy-tailed distribution**, meaning:
- Most rounds crash early (low multipliers),
- Rarely, the rocket “flies” very high — rewarding risk-takers.

This mirrors the distribution and excitement of classic crash games while ensuring deterministic fairness.

---

## Provable Fairness

Fairness in Moonshot is achieved through:

- **Public randomness (Pyth Entropy):** every entropy request and response is visible on-chain.
- **Deterministic math:** same input → same output for any verifier.
- **Event transparency:** all state transitions (`RoundStarted`, `RoundLocked`, `RoundCrashed`) are emitted and queryable.
- **Independent timing (Chainlink):** removes any human control over timing or results.

Players and auditors can replay every round, verify entropy inputs, and confirm that no party influenced the results.

---

## Security & Risk Controls

- Maximum bet and payout limits per round to cap exposure.
- Failsafe mechanisms for pausing or resuming gameplay.
- Checks for valid entropy responses and non-reused randomness.
- Guarded access for admin-only functions (emergency withdraw, upkeep settings).
- Full transparency of round data and crash results via contract events.

---

## Development & Deployment

### Prerequisites
- Node.js >= 18
- npm or Yarn
- Wallet (MetaMask) connected to Base Sepolia
- Hardhat or Foundry for smart contract deployment

### Run Frontend
```bash
npm install
npm run dev