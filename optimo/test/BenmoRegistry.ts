import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
  const [owner, alice, bob] = await ethers.getSigners();
  const registry = await ethers.deployContract("BenmoRegistry");
  return { registry, owner, alice, bob };
}

describe("BenmoRegistry", function () {
  describe("registerHandle", function () {
    it("should register a handle and map it to an Unlink address", async function () {
      const { registry, alice } = await deployFixture();
      const handle = "alice";
      const unlinkAddress = "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z";

      await registry.connect(alice).registerHandle(handle, unlinkAddress);

      const resolved = await registry.resolveHandle(handle);
      expect(resolved).to.equal(unlinkAddress);
    });

    it("should emit HandleRegistered with the handle hash and owner address", async function () {
      const { registry, alice } = await deployFixture();
      const handle = "alice";
      const unlinkAddress = "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z";
      const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(handle));

      await expect(registry.connect(alice).registerHandle(handle, unlinkAddress))
        .to.emit(registry, "HandleRegistered")
        .withArgs(expectedHash, alice.address);
    });

    it("should revert if the handle is already taken", async function () {
      const { registry, alice, bob } = await deployFixture();
      const handle = "coolhandle";
      const unlinkAddress = "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z";

      await registry.connect(alice).registerHandle(handle, unlinkAddress);

      await expect(
        registry.connect(bob).registerHandle(handle, "unlink1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmus2a3h")
      ).to.be.revert(ethers);
    });

    it("should revert if the same wallet tries to register a second handle", async function () {
      const { registry, alice } = await deployFixture();

      await registry
        .connect(alice)
        .registerHandle("alice", "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z");

      await expect(
        registry
          .connect(alice)
          .registerHandle("alice2", "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z")
      ).to.be.revert(ethers);
    });
  });

  describe("resolveHandle", function () {
    it("should revert for a handle that has never been registered", async function () {
      const { registry } = await deployFixture();

      await expect(registry.resolveHandle("unknown")).to.be.revert(ethers);
    });

    it("should return the correct Unlink address after registration", async function () {
      const { registry, alice, bob } = await deployFixture();
      const aliceUnlink = "unlink1qpz5qax4ew8kmrzj8wamqhxlnjrxq3fhvdmt2z";
      const bobUnlink   = "unlink1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmus2a3h";

      await registry.connect(alice).registerHandle("alice", aliceUnlink);
      await registry.connect(bob).registerHandle("bob", bobUnlink);

      expect(await registry.resolveHandle("alice")).to.equal(aliceUnlink);
      expect(await registry.resolveHandle("bob")).to.equal(bobUnlink);
    });
  });
});
