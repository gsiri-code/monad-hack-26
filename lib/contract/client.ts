import { ethers } from "ethers";

const ABI = [
  {
    name: "shieldAndPay",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "memo", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "unshieldAndPay",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "memo", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalShielded",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "SocialPayment",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "receiver", type: "address" },
      { indexed: false, name: "memo", type: "string" },
    ],
  },
  {
    name: "Deposited",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    name: "Withdrawn",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
] as const;

const RPC_URL = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const CONTRACT_ADDRESS =
  process.env.SHIELD_CONTRACT_ADDRESS ??
  "0xf9a83f9322113C6fe84Ed6EFE8affB0b57fB39ac";

let _provider: ethers.JsonRpcProvider | null = null;
let _contract: ethers.Contract | null = null;
let _readContract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

/**
 * Returns a contract instance connected to the server signer (write calls).
 * Requires SERVER_PRIVATE_KEY in env.
 */
export function getContract(): ethers.Contract {
  if (!_contract) {
    const privateKey = process.env.SERVER_PRIVATE_KEY;
    if (!privateKey) throw new Error("SERVER_PRIVATE_KEY is not set");
    const signer = new ethers.Wallet(privateKey, getProvider());
    _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }
  return _contract;
}

/**
 * Returns a read-only contract instance (view calls only).
 */
export function getReadContract(): ethers.Contract {
  if (!_readContract) {
    _readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, getProvider());
  }
  return _readContract;
}

/** Default ERC-20 token address for shielding. */
export function getShieldTokenAddress(): string {
  const addr = process.env.SHIELD_TOKEN_ADDRESS;
  if (!addr) throw new Error("SHIELD_TOKEN_ADDRESS is not set");
  return addr;
}
