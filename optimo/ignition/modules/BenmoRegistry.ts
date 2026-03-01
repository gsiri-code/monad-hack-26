import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BenmoRegistryModule = buildModule("BenmoRegistryModule", (m) => {
  const registry = m.contract("BenmoRegistry");
  return { registry };
});

export default BenmoRegistryModule;
