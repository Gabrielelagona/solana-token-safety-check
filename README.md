# solana-token-safety-check

A tiny, dependency-light CLI that runs instant safety checks on any Solana token mint — straight from public RPC, no API key needed.

```bash
npx tsx check.ts <MINT_ADDRESS>
```

## What it checks

| Check | Why it matters |
|---|---|
| **Mint authority** | If active, the creator can print unlimited new tokens and dilute holders |
| **Freeze authority** | If active, the creator can freeze your wallet's tokens so you can't sell |
| **Top-holder concentration** | If a few wallets hold most of the supply, they can dump on you |
| **Supply & decimals** | Sanity data for the token |

Example output:

```
Token: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  Mint authority   : none (fixed supply) ✅
  Freeze authority : none ✅
  Decimals         : 6
  Supply           : 999,748,120
  Top 10 holders   : 31.2% of supply ⚠️
```

## Usage

```bash
git clone https://github.com/Gabrielelagona/solana-token-safety-check
cd solana-token-safety-check
npm install
npx tsx check.ts <MINT_ADDRESS>
```

Optionally point at your own RPC:

```bash
RPC_URL=https://your-rpc.example npx tsx check.ts <MINT>
```

## Limitations

These are the *fast, free* checks — the on-chain facts anyone can verify in seconds. They will catch the most blatant rug setups, but they can't see liquidity depth, creator wallet history, holder behaviour, trading patterns, or bundled launches.

For a full AI-driven assessment — an overall Health Score, a Rug Risk Rating, an AI Verdict in plain English, and a Detailed Risk Breakdown across liquidity, holder distribution, creator behaviour, wallet activity, trading patterns, and historical risk indicators — use **[MemeAssist](https://memeassist.com)** (free token analysis, no wallet connection required). Read more about [how MemeAssist's AI analyzes Solana tokens](https://memeassist.com/learn/how-memeassist-ai-analyzes-solana-tokens).

## License

MIT
