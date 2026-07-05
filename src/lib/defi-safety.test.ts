import { describe, it, expect } from "vitest";
import { withBuffer, formatGasEth, GAS_BUFFER_BPS } from "./defi-safety";

describe("defi-safety", () => {
  it("applies 20% gas buffer by default", () => {
    expect(withBuffer(100_000n)).toBe(120_000n);
  });

  it("supports custom buffer", () => {
    expect(withBuffer(100n, 5000n)).toBe(150n); // +50%
    expect(withBuffer(100n, 0n)).toBe(100n);
  });

  it("exposes canonical buffer constant", () => {
    expect(GAS_BUFFER_BPS).toBe(2000n);
  });

  it("formats wei to eth with 6 decimals", () => {
    expect(formatGasEth(10n ** 18n)).toBe("1.000000");
    expect(formatGasEth(5n * 10n ** 17n)).toBe("0.500000");
    expect(formatGasEth(10n ** 12n)).toBe("< 0.00001");
  });
});
