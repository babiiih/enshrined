import { describe, it, expect, beforeEach } from "vitest";
import { upsertTx, listTxHistory, clearTxHistory } from "./tx-history";

describe("tx-history", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearTxHistory();
  });

  it("inserts a new tx", () => {
    upsertTx({ id: "t1", label: "Swap", status: "signing" });
    const all = listTxHistory();
    expect(all).toHaveLength(1);
    expect(all[0].label).toBe("Swap");
    expect(all[0].status).toBe("signing");
  });

  it("updates existing tx by id", () => {
    upsertTx({ id: "t1", label: "Swap", status: "signing" });
    upsertTx({ id: "t1", status: "confirmed", hash: "0xabc" });
    const [t] = listTxHistory();
    expect(t.status).toBe("confirmed");
    expect(t.hash).toBe("0xabc");
    expect(t.label).toBe("Swap");
  });

  it("caps history length", () => {
    for (let i = 0; i < 120; i++) upsertTx({ id: `t${i}`, label: "x", status: "signing" });
    expect(listTxHistory()).toHaveLength(100);
  });
});
