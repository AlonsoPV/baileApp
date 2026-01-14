import { strict as assert } from "node:assert";
import { failFastTimeout } from "../src/utils/failFastTimeout";

async function main() {
  const t0 = Date.now();

  // Simulate a "hung forever" backend call.
  const never = new Promise<void>(() => {});

  let err: any = null;
  try {
    await failFastTimeout(never, 50, "Save profile (RPC)");
  } catch (e: any) {
    err = e;
  }

  assert(err, "Expected a timeout error, but the call resolved.");
  assert.equal(err.code, "NETWORK_TIMEOUT");
  assert.match(String(err.message), /tardando demasiado/i);

  const elapsed = Date.now() - t0;
  assert(elapsed < 1000, `Test took too long (${elapsed}ms)`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

