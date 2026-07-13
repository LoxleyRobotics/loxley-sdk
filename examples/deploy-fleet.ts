/**
 * Sign a build manifest and roll it out to a 64-unit fleet in waves.
 *
 * Run: LOXLEY_API_KEY=… npx tsx examples/deploy-fleet.ts
 */
import { LoxleyClient } from "@loxley/sdk";

const lox = new LoxleyClient({ apiKey: process.env.LOXLEY_API_KEY });

// Sign with your account key; units verify the on-chain anchor before flashing
const manifest = await lox.deploy.signManifest("wren-2-scout");
console.log(`manifest signed, anchored at ${manifest.anchorTx}`);

const rollout = await lox.deploy.createRollout({
  manifest,
  fleet: "warehouse-eu-1",
  waveSize: 0.25, // 4 waves of 16 units
});

const done = await lox.deploy.waitForRollout(rollout.id, {
  onProgress: (d) =>
    console.log(`${d.status} · ${d.unitsHealthy}/${d.unitsTotal} healthy`),
});

if (done.status !== "healthy") {
  console.error(`rollout ended ${done.status} — aborting`);
  await lox.deploy.abortRollout(done.id);
  process.exit(1);
}
console.log("fleet updated ✔");
