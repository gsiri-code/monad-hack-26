import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
  const [owner, alice, bob] = await ethers.getSigners();

  const initialSupply = ethers.parseEther("1000000");
  const token = await ethers.deployContract("MockERC20", [
    "TestUSD",
    "TUSD",
    initialSupply,
  ]);

  const mockPool = await ethers.deployContract("MockUnlinkPool");

  // owner deploys → owner is the server that controls the Unlink account
  const shield = await ethers.deployContract("Web3VenmoShield", [
    await mockPool.getAddress(),
  ]);

  const aliceAmount = ethers.parseEther("1000");
  await token.transfer(alice.address, aliceAmount);

  return { token, mockPool, shield, owner, alice, bob, aliceAmount };
}

async function depositFixture() {
  const fixture = await deployFixture();
  const { token, shield, alice, bob } = fixture;
  const shieldAmount = ethers.parseEther("100");

  await token.connect(alice).approve(await shield.getAddress(), shieldAmount);
  await shield
    .connect(alice)
    .shieldAndPay(await token.getAddress(), shieldAmount, bob.address, "setup");

  return { ...fixture, shieldAmount };
}

describe("Web3VenmoShield", function () {
  describe("Ownership", function () {
    it("should set deployer as owner", async function () {
      const { shield, owner } = await deployFixture();
      expect(await shield.owner()).to.equal(owner.address);
    });

    it("should allow owner to transfer ownership", async function () {
      const { shield, owner, alice } = await deployFixture();
      await shield.connect(owner).transferOwnership(alice.address);
      expect(await shield.owner()).to.equal(alice.address);
    });

    it("should revert if non-owner transfers ownership", async function () {
      const { shield, alice } = await deployFixture();
      await expect(
        shield.connect(alice).transferOwnership(alice.address)
      ).to.be.revert(ethers);
    });
  });

  describe("Deposit (shieldAndPay)", function () {
    it("should decrease user ERC-20 balance", async function () {
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

    it("should increase pool shielded balance", async function () {
      const { token, mockPool, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("100");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

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
      expect(shieldedAfter).to.equal(shieldAmount);
    });

    it("should credit the user's internal balance", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      const shieldAmount = ethers.parseEther("100");

      await token
        .connect(alice)
        .approve(await shield.getAddress(), shieldAmount);

      await shield
        .connect(alice)
        .shieldAndPay(
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "lunch"
        );

      const userBal = await shield.balanceOf(
        await token.getAddress(),
        alice.address
      );
      expect(userBal).to.equal(shieldAmount);
    });

    it("should revert without approval", async function () {
      const { token, shield, alice, bob } = await deployFixture();
      await expect(
        shield
          .connect(alice)
          .shieldAndPay(
            await token.getAddress(),
            ethers.parseEther("100"),
            bob.address,
            "no approval"
          )
      ).to.be.revert(ethers);
    });
  });

  describe("Withdraw (unshieldAndPay)", function () {
    it("should transfer tokens from pool to receiver", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      const bobBefore = await token.balanceOf(bob.address);

      await shield
        .connect(owner)
        .unshieldAndPay(
          alice.address,
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "cash out"
        );

      const bobAfter = await token.balanceOf(bob.address);
      expect(bobAfter - bobBefore).to.equal(shieldAmount);
    });

    it("should debit user internal balance to zero", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      await shield
        .connect(owner)
        .unshieldAndPay(
          alice.address,
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "withdraw"
        );

      const userBal = await shield.balanceOf(
        await token.getAddress(),
        alice.address
      );
      expect(userBal).to.equal(0);
    });

    it("should decrease pool shielded balance", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      await shield
        .connect(owner)
        .unshieldAndPay(
          alice.address,
          await token.getAddress(),
          shieldAmount,
          bob.address,
          "withdraw"
        );

      const totalShielded = await shield.totalShielded(
        await token.getAddress()
      );
      expect(totalShielded).to.equal(0);
    });

    it("should revert if non-owner calls withdraw", async function () {
      const { token, shield, alice, bob, shieldAmount } =
        await depositFixture();

      await expect(
        shield
          .connect(alice)
          .unshieldAndPay(
            alice.address,
            await token.getAddress(),
            shieldAmount,
            bob.address,
            "unauthorized"
          )
      ).to.be.revert(ethers);
    });

    it("should revert if withdrawing more than user balance", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      await expect(
        shield
          .connect(owner)
          .unshieldAndPay(
            alice.address,
            await token.getAddress(),
            shieldAmount + 1n,
            bob.address,
            "too much"
          )
      ).to.be.revert(ethers);
    });
  });

  describe("Event Validation", function () {
    it("should emit SocialPayment on deposit", async function () {
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

    it("should emit SocialPayment on withdraw with user as sender", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      await expect(
        shield
          .connect(owner)
          .unshieldAndPay(
            alice.address,
            await token.getAddress(),
            shieldAmount,
            bob.address,
            "payout"
          )
      )
        .to.emit(shield, "SocialPayment")
        .withArgs(alice.address, bob.address, "payout");
    });

    it("should emit Deposited on deposit", async function () {
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
        .to.emit(shield, "Deposited")
        .withArgs(alice.address, await token.getAddress(), shieldAmount);
    });

    it("should emit Withdrawn on withdraw", async function () {
      const { token, shield, owner, alice, bob, shieldAmount } =
        await depositFixture();

      await expect(
        shield
          .connect(owner)
          .unshieldAndPay(
            alice.address,
            await token.getAddress(),
            shieldAmount,
            bob.address,
            "payout"
          )
      )
        .to.emit(shield, "Withdrawn")
        .withArgs(
          alice.address,
          await token.getAddress(),
          bob.address,
          shieldAmount
        );
    });

    it("SocialPayment should NOT include amount data", async function () {
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
      const iface = shield.interface;

      const socialPaymentEvents = receipt!.logs
        .filter(
          (log: any) =>
            log.address.toLowerCase() === shieldAddress.toLowerCase()
        )
        .map((log: any) =>
          iface.parseLog({ topics: log.topics as string[], data: log.data })
        )
        .filter((parsed: any) => parsed?.name === "SocialPayment");

      expect(socialPaymentEvents.length).to.equal(1);
      const decoded = socialPaymentEvents[0];
      expect(decoded!.args.length).to.equal(3);

      for (const arg of decoded!.args) {
        if (typeof arg === "bigint") {
          expect(arg).to.not.equal(shieldAmount);
        }
      }
    });
  });

  describe("Full Round-Trip", function () {
    it("wallet → shield → unshield → wallet", async function () {
      const { token, shield, owner, alice, bob } = await deployFixture();
      const amount = ethers.parseEther("200");
      const tokenAddr = await token.getAddress();

      await token.connect(alice).approve(await shield.getAddress(), amount);

      const aliceBefore = await token.balanceOf(alice.address);
      const bobBefore = await token.balanceOf(bob.address);

      await shield
        .connect(alice)
        .shieldAndPay(tokenAddr, amount, bob.address, "send");

      expect(await shield.balanceOf(tokenAddr, alice.address)).to.equal(amount);
      expect(await shield.totalShielded(tokenAddr)).to.equal(amount);

      await shield
        .connect(owner)
        .unshieldAndPay(
          alice.address,
          tokenAddr,
          amount,
          bob.address,
          "receive"
        );

      expect(await shield.balanceOf(tokenAddr, alice.address)).to.equal(0);
      expect(await shield.totalShielded(tokenAddr)).to.equal(0);

      const aliceAfter = await token.balanceOf(alice.address);
      const bobAfter = await token.balanceOf(bob.address);

      expect(aliceBefore - aliceAfter).to.equal(amount);
      expect(bobAfter - bobBefore).to.equal(amount);
    });
  });
});
