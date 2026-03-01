/**
 * Integration tests using real USDC on Monad testnet.
 *
 * Run with: npx hardhat test test/Web3VenmoShield.integration.ts --network monadTestnet
 *
 * Prerequisites:
 * - MONAD_PRIVATE_KEY: Used only for deployment and funding gas (sending MON to SENDER)
 * - SENDER_PRIVATE_KEY: Wallet that holds USDC and executes shieldAndPay
 * - SENDER_WALLET: Address of SENDER (must match SENDER_PRIVATE_KEY)
 * - RECEIVER_WALLET: Address that receives the payment (event recipient)
 * - Get USDC from https://faucet.circle.com/ for SENDER_WALLET
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// USDC on Monad testnet (Circle)
const USDC_MONAD_TESTNET = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const USDC_DECIMALS = 6;

// Native MON for gas funding
const MON_FOR_GAS = ethers.parseEther("0.01");

async function getSigners() {
  const signers = await ethers.getSigners();
  const gasPayer = signers[0]; // MONAD_PRIVATE_KEY
  const sender = signers[1]; // SENDER_PRIVATE_KEY
  const receiverAddress = process.env.RECEIVER_WALLET;
  if (!receiverAddress) {
    throw new Error("RECEIVER_WALLET must be set in .env");
  }
  return { gasPayer, sender, receiverAddress };
}

async function deployFixture() {
  const { gasPayer, sender, receiverAddress } = await getSigners();

  // Deploy MockUnlinkPool and Web3VenmoShield using gas payer (MONAD_PRIVATE_KEY)
  const mockPool = await ethers.deployContract("MockUnlinkPool", [], {
    signer: gasPayer,
  });
  const shield = await ethers.deployContract(
    "Web3VenmoShield",
    [await mockPool.getAddress()],
    { signer: gasPayer }
  );

  // Fund SENDER with MON for gas (MONAD_PRIVATE_KEY pays)
  const senderBalance = await ethers.provider.getBalance(sender.address);
  if (senderBalance < MON_FOR_GAS) {
    const tx = await gasPayer.sendTransaction({
      to: sender.address,
      value: MON_FOR_GAS,
    });
    await tx.wait();
  }

  return {
    shield,
    mockPool,
    gasPayer,
    sender,
    receiverAddress,
  };
}

describe("Web3VenmoShield (USDC integration)", function () {
  this.timeout(60_000);

  before(function () {
    if (network.name !== "monadTestnet") {
      this.skip();
    }
    if (!process.env.SENDER_PRIVATE_KEY || !process.env.MONAD_PRIVATE_KEY) {
      this.skip();
    }
  });

  describe("Shielding Flow with USDC", function () {
    it("should decrease SENDER USDC balance after shielding", async function () {
      const { shield, sender, receiverAddress } = await deployFixture();

      const usdc = await ethers.getContractAt(
        "MockERC20",
        USDC_MONAD_TESTNET,
        sender
      );
      const shieldAmount = ethers.parseUnits("10", USDC_DECIMALS); // 10 USDC

      const balanceBefore = await usdc.balanceOf(sender.address);
      if (balanceBefore < shieldAmount) {
        this.skip(); // SENDER needs USDC from faucet.circle.com
      }

      await usdc.approve(await shield.getAddress(), shieldAmount);

      await shield
        .connect(sender)
        .shieldAndPay(
          USDC_MONAD_TESTNET,
          shieldAmount,
          receiverAddress,
          "dinner"
        );

      const balanceAfter = await usdc.balanceOf(sender.address);
      expect(balanceBefore - balanceAfter).to.equal(shieldAmount);
    });

    it("should increase Unlink shielded balance after shielding", async function () {
      const { shield, mockPool, sender, receiverAddress } =
        await deployFixture();

      const usdc = await ethers.getContractAt(
        "MockERC20",
        USDC_MONAD_TESTNET,
        sender
      );
      const shieldAmount = ethers.parseUnits("10", USDC_DECIMALS);

      const balanceBefore = await usdc.balanceOf(sender.address);
      if (balanceBefore < shieldAmount) {
        this.skip();
      }

      await usdc.approve(await shield.getAddress(), shieldAmount);

      const shieldedBefore = await mockPool.balanceOf(
        USDC_MONAD_TESTNET,
        await shield.getAddress()
      );

      await shield
        .connect(sender)
        .shieldAndPay(
          USDC_MONAD_TESTNET,
          shieldAmount,
          receiverAddress,
          "lunch"
        );

      const shieldedAfter = await mockPool.balanceOf(
        USDC_MONAD_TESTNET,
        await shield.getAddress()
      );

      expect(shieldedAfter - shieldedBefore).to.equal(shieldAmount);
    });

    it("should revert if SENDER has not approved USDC", async function () {
      const { shield, sender, receiverAddress } = await deployFixture();

      const shieldAmount = ethers.parseUnits("10", USDC_DECIMALS);

      await expect(
        shield
          .connect(sender)
          .shieldAndPay(
            USDC_MONAD_TESTNET,
            shieldAmount,
            receiverAddress,
            "no approval"
          )
      ).to.be.revert(ethers);
    });
  });

  describe("Event Validation", function () {
    it("should emit SocialPayment with sender, receiver, and memo", async function () {
      const { shield, sender, receiverAddress } = await deployFixture();

      const usdc = await ethers.getContractAt(
        "MockERC20",
        USDC_MONAD_TESTNET,
        sender
      );
      const shieldAmount = ethers.parseUnits("5", USDC_DECIMALS);

      if ((await usdc.balanceOf(sender.address)) < shieldAmount) {
        this.skip();
      }

      await usdc.approve(await shield.getAddress(), shieldAmount);

      await expect(
        shield
          .connect(sender)
          .shieldAndPay(
            USDC_MONAD_TESTNET,
            shieldAmount,
            receiverAddress,
            "coffee"
          )
      )
        .to.emit(shield, "SocialPayment")
        .withArgs(sender.address, receiverAddress, "coffee");
    });

    it("should NOT include amount data in SocialPayment event logs", async function () {
      const { shield, sender, receiverAddress } = await deployFixture();

      const usdc = await ethers.getContractAt(
        "MockERC20",
        USDC_MONAD_TESTNET,
        sender
      );
      const shieldAmount = ethers.parseUnits("5", USDC_DECIMALS);

      if ((await usdc.balanceOf(sender.address)) < shieldAmount) {
        this.skip();
      }

      await usdc.approve(await shield.getAddress(), shieldAmount);

      const tx = await shield
        .connect(sender)
        .shieldAndPay(
          USDC_MONAD_TESTNET,
          shieldAmount,
          receiverAddress,
          "pizza"
        );

      const receipt = await tx.wait();
      const shieldAddress = await shield.getAddress();

      const socialPaymentEvents = receipt!.logs.filter(
        (log: { address: string }) =>
          log.address.toLowerCase() === shieldAddress.toLowerCase()
      );

      expect(socialPaymentEvents.length).to.equal(1);

      const event = socialPaymentEvents[0];
      const iface = shield.interface;
      const decoded = iface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });

      expect(decoded!.args.length).to.equal(3);
      expect(decoded!.name).to.equal("SocialPayment");

      for (const arg of decoded!.args) {
        if (typeof arg === "bigint") {
          expect(arg).to.not.equal(shieldAmount);
        }
      }
    });
  });
});
