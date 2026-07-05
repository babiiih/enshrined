/**
 * DeFi safety rails: allowance check, gas estimation with buffer, and dry-run simulation.
 * Use before any write that spends tokens or interacts with untrusted contracts.
 */
import { useCallback, useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import type { Address, Hash } from "viem";
import { erc20Abi } from "viem";

/** Standard 20% gas buffer to survive mempool volatility. */
export const GAS_BUFFER_BPS = 2000n; // 20%

export function withBuffer(gas: bigint, bufferBps = GAS_BUFFER_BPS): bigint {
  return (gas * (10_000n + bufferBps)) / 10_000n;
}

/** Read current ERC20 allowance owner→spender. */
export function useAllowance(token?: Address, spender?: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [allowance, setAllowance] = useState<bigint | undefined>();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !spender || !address || !publicClient) return;
    setLoading(true);
    try {
      const v = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spender],
      });
      setAllowance(v as bigint);
    } finally {
      setLoading(false);
    }
  }, [token, spender, address, publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enough = useCallback(
    (amount: bigint) => allowance !== undefined && allowance >= amount,
    [allowance],
  );

  return { allowance, enough, refresh, loading };
}

/** Simulate + estimate gas before signing. Returns null on revert (safe abort). */
export async function simulateAndEstimate(params: {
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>;
  account: Address;
  to: Address;
  data?: `0x${string}`;
  value?: bigint;
}): Promise<{ gas: bigint; gasWithBuffer: bigint; revertReason?: string } | null> {
  const { publicClient, account, to, data, value } = params;
  try {
    // Dry-run: fails fast if the tx would revert.
    await publicClient.call({ account, to, data, value });
    const gas = await publicClient.estimateGas({ account, to, data, value });
    return { gas, gasWithBuffer: withBuffer(gas) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { gas: 0n, gasWithBuffer: 0n, revertReason: msg.slice(0, 200) };
  }
}

/** Preview gas cost in native units (wei) using current gasPrice or maxFeePerGas. */
export async function previewGasCost(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  gas: bigint,
): Promise<bigint> {
  try {
    const fees = await publicClient.estimateFeesPerGas();
    const price = fees.maxFeePerGas ?? (await publicClient.getGasPrice());
    return gas * price;
  } catch {
    return 0n;
  }
}

export function formatGasEth(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  if (eth < 0.00001) return "< 0.00001";
  return eth.toFixed(6);
}

export type TxPreview = {
  gas: bigint;
  gasWithBuffer: bigint;
  costWei: bigint;
  costEth: string;
  revertReason?: string;
  safe: boolean;
};

export async function buildTxPreview(params: {
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>;
  account: Address;
  to: Address;
  data?: `0x${string}`;
  value?: bigint;
}): Promise<TxPreview> {
  const est = await simulateAndEstimate(params);
  if (!est) {
    return {
      gas: 0n,
      gasWithBuffer: 0n,
      costWei: 0n,
      costEth: "0",
      safe: false,
    };
  }
  const costWei = await previewGasCost(params.publicClient, est.gasWithBuffer);
  return {
    gas: est.gas,
    gasWithBuffer: est.gasWithBuffer,
    costWei,
    costEth: formatGasEth(costWei),
    revertReason: est.revertReason,
    safe: !est.revertReason,
  };
}

/** Check if a hash still exists in mempool (useful for pending reconciliation). */
export async function txExists(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  hash: Hash,
): Promise<boolean> {
  try {
    const tx = await publicClient.getTransaction({ hash });
    return !!tx;
  } catch {
    return false;
  }
}
