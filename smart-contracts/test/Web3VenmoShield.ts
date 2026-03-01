import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
  const [owner, alice, bob] = await ethers.getSigners();

  // Deploy mock ERC-20 with 1,000,000 tokens to owner
  const initialSupply = ethers.parseEther("1000000");
  const token = await ethers.deployContract("MockERC20", [
    "TestUSD",
    "TUSD",
    initialSupply,
  ]);

  // Deploy mock Unlink pool
  const mockPool = await ethers.deployContract("MockUnlinkPool");

  // Deploy Web3VenmoShield pointing at mock pool
  const shield = await ethers.deployContract("Web3VenmoShield", [
    await mockPool.getAddress(),
  ]);

  // Transfer 1000 tokens to Alice for testing
  const aliceAmount = ethers.parseEther("1000");
  await token.transfer(alice.address, aliceAmount);

  return { token, mockPool, shield, owner, alice, bob, aliceAmount };
}

describe("Web3VenmoShield", function () {
  describe("Shielding Flow", function () {
    it("should decrease user ERC-20 balance after shielding", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("100");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

      const balanceBefore = await token.balanceOf(alice.address);

      await shield
        .connect(alice)
        .shieldAndPay(
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "dinner"
        );

      const balanceAfter = await token.balanceOf(alice.address);
      expect(balanceBefore - balanceAfter).to.equal(shieldAmount);
    });

    it("should increase Unlink shielded balance after shielding", async function () {
      const { token, mockPool, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("100");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

      const shieldedBefore = await mockPool.balanceOf(
        await token.getAddress(),
        await shield.getAddress()
      );

      await shield
        .connect(alice)
        .shieldAndPay(
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "lunch"
        );

      const shieldedAfter = await mockPool.balanceOf(
        await token.getAddress(),
        await shield.getAddress()
      );

      expect(shieldedAfter - shieldedBefore).to.equal(shieldAmount);
    });

    it("should revert if user has not approved tokens", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("100");

      await expect(
        shield
          .connect(alice)
          .shieldAndPay(
            await token.getAddress(),
            shieldAmount,
            bob.address,
            "no approval"
          )
      ).to.be.revert(ethers);
    });
  });

  describe("Event Validation", function () {
    it("should emit SocialPayment with sender, receiver, and memo", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("50");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

      await expect(
        shield
          .connect(alice)
          .shieldAndPay(
            await token.getAddress(),
            shieldAmount,
            bob.address,
            "coffee"
          )
      )
        .to.emit(shield, "SocialPayment")
        .withArgs(alice.address, bob.address, "coffee");
    });

    it("should NOT include amount data in SocialPayment event logs", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("50");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

      const tx = await shield
        .connect(alice)
        .shieldAndPay(
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "pizza"
        );

      const receipt = await tx.wait();
      const shieldAddress = await shield.getAddress();

      // Find the SocialPayment event (filter out ERC-20 Transfer/Approval events)
      const socialPaymentEvents = receipt!.logs.filter(
        (log: any) =>
          log.address.toLowerCase() === shieldAddress.toLowerCase()
      );

      expect(socialPaymentEvents.length).to.equal(1);

      const event = socialPaymentEvents[0];
      const iface = shield.interface;
      const decoded = iface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });

      // Verify the event has exactly 3 fields: sender, receiver, memo
      expect(decoded!.args.length).to.equal(3);
      expect(decoded!.name).to.equal("SocialPayment");

      // Verify none of the args equals the shieldAmount
      for (const arg of decoded!.args) {
        if (typeof arg === "bigint") {
          expect(arg).to.not.equal(shieldAmount);
        }
      }
    });
  });
});
