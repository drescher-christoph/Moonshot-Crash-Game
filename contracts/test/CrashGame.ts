import { expect } from "chai";
import { network } from "hardhat";
import { Contract } from "ethers";

const { ethers } = await network.connect();

const sepolia_entropy = "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";

describe("Moonshot", function () {

  let crashGame: any;
  let owner: any, player: any;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    const CrashGame = await ethers.getContractFactory("CrashGame");
    crashGame = await CrashGame.deploy(sepolia_entropy);
    await crashGame.waitForDeployment();
  });

  it("Should fetch the correct and current pyth network entropy fee", async function () {
    const game = await ethers.deployContract("CrashGame", [sepolia_entropy]);

    console.log(game)

    await expect(game.inc()).to.emit(game, "Increment").withArgs(1n);
  });

  
});
