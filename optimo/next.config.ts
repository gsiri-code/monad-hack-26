import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load env vars from repo root .env
config({ path: resolve(import.meta.dirname, "../.env") });

const nextConfig: NextConfig = {};

export default nextConfig;
