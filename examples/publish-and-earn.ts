/**
 * Publish a robot model, validate it in sim, list it — then watch
 * royalties settle in real time.
 *
 * Run: LOXLEY_API_KEY=… npx tsx examples/publish-and-earn.ts
 */
import { LoxleyClient, parseLox, formatLox } from "@loxley/sdk";

const lox = new LoxleyClient({ apiKey: process.env.LOXLEY_API_KEY });

// 1. Publish — component graph compiles server-side, manifest anchors on-chain
const model = await lox.registry.publish({
  name: "wren-2-scout",
  category: "aerial-recon",
  version: "2.1.0",
  priceLox: parseLox("84"),
  components: [
    { ref: "wren_scout.chassis@2.1.0", kind: "chassis" },
    { ref: "lidar_v3@^1.4", kind: "sensor" },
    { ref: "nav_skill@^4", kind: "skill" },
  ],
});
console.log(`published ${model.name}@${model.version} → ${model.manifestHash}`);

// 2. Simulate until provably safe
const run = await lox.sim.createRun({
  modelId: model.id,
  scenario: "warehouse-dense-v2",
  steps: 1_200_000,
  maxCollisionRate: 0.001,
});
const result = await lox.sim.waitForRun(run.id, {
  onProgress: (r) => console.log(`sim ${r.status}: ${r.stepsCompleted} steps`),
});
if (result.status !== "passed") throw new Error(`sim ${result.status}`);
console.log(`sim PASS · collision rate ${result.collisionRate}`);

// 3. Royalties stream — every license routes $LOX to the split, instantly
for await (const ev of lox.royalties.streamEvents(model.owner)) {
  console.log(`+${formatLox(ev.amount)} from ${ev.modelId} @ block ${ev.block}`);
}
