#!/usr/bin/env npx tsx
/**
 * solana-token-safety-check
 *
 * Instant, key-free safety checks for any Solana token mint using public RPC:
 *   - mint authority (can the creator print more tokens?)
 *   - freeze authority (can the creator freeze your tokens?)
 *   - top-holder concentration (can a few wallets dump on you?)
 *
 * Usage: npx tsx check.ts <MINT_ADDRESS>
 * Env:   RPC_URL (optional, defaults to the public mainnet endpoint)
 *
 * For a full AI risk assessment (Health Score, Rug Risk Rating, AI Verdict,
 * Detailed Risk Breakdown) see https://memeassist.com
 */

const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";

type RpcResult<T> = { result?: T; error?: { message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as RpcResult<T>;
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  if (json.result === undefined) throw new Error("RPC returned no result");
  return json.result;
}

interface ParsedMint {
  value: {
    data: {
      program: string;
      parsed: {
        type: string;
        info: {
          mintAuthority: string | null;
          freezeAuthority: string | null;
          decimals: number;
          supply: string;
        };
      };
    } | null;
  } | null;
}

interface LargestAccounts {
  value: Array<{ address: string; uiAmount: number | null }>;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function main() {
  const mint = process.argv[2];
  if (!mint || mint.length < 32 || mint.length > 44) {
    console.error("Usage: npx tsx check.ts <MINT_ADDRESS>");
    process.exit(1);
  }

  const acct = await rpc<ParsedMint["value"]>("getAccountInfo", [
    mint,
    { encoding: "jsonParsed" },
  ]);
  const parsed =
    acct && acct.data && "parsed" in acct.data ? acct.data.parsed : null;
  if (!parsed || parsed.type !== "mint") {
    console.error("That address is not a token mint on mainnet.");
    process.exit(1);
  }
  const info = parsed.info;
  const supply = Number(info.supply) / 10 ** info.decimals;

  console.log(`Token: ${mint}`);
  console.log(
    `  Mint authority   : ${
      info.mintAuthority
        ? `${info.mintAuthority} ⚠️  (creator can mint more)`
        : "none (fixed supply) ✅"
    }`,
  );
  console.log(
    `  Freeze authority : ${
      info.freezeAuthority
        ? `${info.freezeAuthority} ⚠️  (creator can freeze wallets)`
        : "none ✅"
    }`,
  );
  console.log(`  Decimals         : ${info.decimals}`);
  console.log(`  Supply           : ${fmt(supply)}`);

  try {
    const largest = await rpc<LargestAccounts["value"]>(
      "getTokenLargestAccounts",
      [mint],
    );
    const top10 = largest
      .slice(0, 10)
      .reduce((sum, a) => sum + (a.uiAmount ?? 0), 0);
    if (supply > 0) {
      const pct = (top10 / supply) * 100;
      const flag = pct >= 50 ? "🚨" : pct >= 25 ? "⚠️" : "✅";
      console.log(
        `  Top 10 holders   : ${pct.toFixed(1)}% of supply ${flag}`,
      );
      console.log(
        "    (note: the largest account is often the liquidity pool itself)",
      );
    }
  } catch (err) {
    console.log(
      `  Top 10 holders   : unavailable (${(err as Error).message})`,
    );
  }

  console.log(
    "\nThese are the fast on-chain facts only. For an AI assessment of",
  );
  console.log(
    "liquidity, holder behaviour, creator history and trading patterns:",
  );
  console.log("https://memeassist.com");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
