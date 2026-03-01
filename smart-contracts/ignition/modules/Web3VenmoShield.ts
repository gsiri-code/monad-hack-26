import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Replace with the real Unlink pool address on Monad testnet once known.
// For now this deploys with a placeholder; override via --parameters flag.
const UNLINK_POOL_PLACEHOLDER = "0x0000000000000000000000000000000000000001";

export default buildModule("Web3VenmoShieldModule", (m) => {
  const unlinkPool = m.getParameter("unlinkPool", UNLINK_POOL_PLACEHOLDER);

  const shield = m.contract("Web3VenmoShield", [unlinkPool]);

  return { shield };
});
