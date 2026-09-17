/**
 * Clears everything a rehearsal run adds, leaving seed.ts's fixed-ID data alone. Run it before
 * each practice pass, or the Admin Dashboard counters drift up with every test booking.
 *
 * Collections fall into two groups:
 *   1. real-usage only (notifications, procurement, payments, identityVerification,
 *      staffSessions, tokenCounters) — wiped completely;
 *   2. mixed (farmers, crops, bookings, queue, staff, slots, centres) — a doc is wiped only if
 *      its ID isn't one of seed.ts's fixed ones, mirrored below. Keep that list in sync with
 *      seed.ts.
 * slots.bookedCount and queuePositionCounters.count are seeded in place rather than created, so
 * they're restored to their seeded values instead of deleted.
 *
 * Uses firebase-admin, which bypasses the security rules. Local demo use only.
 * Usage: npm run reset
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BUILT_IN_COMMODITIES } from "../src/data/commodities";

const serviceAccountPath = join(__dirname, "..", "serviceAccountKey.json");

let serviceAccount: object;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    `Missing ${serviceAccountPath}.\n` +
      "Download a service account key from Firebase Console -> Project Settings -> " +
      "Service Accounts, save it as serviceAccountKey.json in the repo root, then re-run " +
      "npm run reset."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount as never) });
const db = getFirestore();

const today = new Date().toISOString().slice(0, 10);

// --- Fixed IDs scripts/seed.ts creates, mirrored exactly so we never delete seed data. ---
const CENTRE_IDS = ["centre-ksn", "centre-pnp", "centre-snp"];
// Mirrors seed.ts's cropCapacityDefs, so remaining capacity can be restored to "nothing bought
// yet". Capacity an admin added during rehearsal isn't a seed doc and gets wiped.
const SEEDED_CROP_CAPACITY: Record<string, Record<string, number>> = {
  "centre-ksn": { wheat: 500, paddy: 300 },
  "centre-pnp": { wheat: 400, paddy: 250 },
  "centre-snp": { wheat: 300, paddy: 200 },
};
const CROP_CAPACITY_IDS = Object.entries(SEEDED_CROP_CAPACITY).flatMap(([centreId, byCrop]) =>
  Object.keys(byCrop).map((cropType) => `${centreId}_${cropType}`)
);
// The commodity master seed.ts writes is exactly the bundled list, so a commodity present in
// Firestore but *not* in that list can only have been added by an admin during rehearsal — real
// usage, wiped like anything else. Edits to a seeded row (a renamed or deactivated built-in) are
// restored by re-running seed.ts, not by this script.
const COMMODITY_IDS = BUILT_IN_COMMODITIES.map((c) => c.key);
// Today's slots keep the original `{centre}-slot-{i}` IDs; tomorrow/day-after (advance
// booking demo data) use a `-d{offset}` suffix — see scripts/seed.ts.
const SLOT_IDS = CENTRE_IDS.flatMap((centreId) => [
  ...[0, 1, 2, 3].map((i) => `${centreId}-slot-${i}`),
  ...[1, 2].flatMap((dayOffset) => [0, 1, 2, 3].map((i) => `${centreId}-slot-${i}-d${dayOffset}`)),
]);
const FARMER_IDS = [
  "farmer-demo-1",
  "farmer-demo-2",
  "farmer-demo-live",
  "farmer-demo-notarrived",
];
const CROP_IDS = ["crop-demo-0", "crop-demo-1", "crop-demo-live", "crop-demo-notarrived"];
const BOOKING_IDS = [
  "booking-demo-0",
  "booking-demo-1",
  "booking-demo-live",
  "booking-demo-notarrived",
];
const QUEUE_IDS = ["queue-demo-0", "queue-demo-1", "queue-demo-live"];
const STAFF_IDS = ["staff-op-1", "staff-op-2", "staff-op-3", "staff-admin-1"];
const QUEUE_POSITION_COUNTER_IDS = [`centre-ksn_${today}`];

/** Deletes every document in `collection` whose id is not in `keepIds`. */
async function wipeExcept(collection: string, keepIds: string[]): Promise<number> {
  const snapshot = await db.collection(collection).get();
  const toDelete = snapshot.docs.filter((d) => !keepIds.includes(d.id));
  await Promise.all(toDelete.map((d) => d.ref.delete()));
  return toDelete.length;
}

/** Deletes every document in `collection`, no exceptions. */
async function wipeAll(collection: string): Promise<number> {
  const snapshot = await db.collection(collection).get();
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
  return snapshot.docs.length;
}

async function reset() {
  console.log("Wiping rehearsal traffic (keeping scripts/seed.ts's fixed demo data)...");

  const mixed = await Promise.all([
    wipeExcept("farmers", FARMER_IDS),
    wipeExcept("crops", CROP_IDS),
    wipeExcept("bookings", BOOKING_IDS),
    wipeExcept("queue", QUEUE_IDS),
    wipeExcept("staff", STAFF_IDS),
    wipeExcept("slots", SLOT_IDS),
    wipeExcept("centres", CENTRE_IDS),
    // Only centre-ksn's counter is seeded (primed to 3) — a real check-in at Panipat/Sonipat
    // during rehearsal would create a queuePositionCounters doc for that centre that seed.ts
    // never knows about, so it must be wiped like any other real-usage document.
    wipeExcept("queuePositionCounters", QUEUE_POSITION_COUNTER_IDS),
    wipeExcept("centreCropCapacity", CROP_CAPACITY_IDS),
    wipeExcept("commodities", COMMODITY_IDS),
  ]);
  console.log(
    `  farmers -${mixed[0]}, crops -${mixed[1]}, bookings -${mixed[2]}, queue -${mixed[3]}, ` +
      `staff -${mixed[4]}, slots -${mixed[5]}, centres -${mixed[6]}, ` +
      `queuePositionCounters -${mixed[7]}, centreCropCapacity -${mixed[8]}, ` +
      `commodities -${mixed[9]}`
  );

  console.log("Wiping real-usage-only collections entirely...");
  const usageOnly = await Promise.all([
    wipeAll("notifications"),
    wipeAll("procurement"),
    wipeAll("payments"),
    wipeAll("identityVerification"),
    wipeAll("staffSessions"),
    wipeAll("tokenCounters"),
    wipeAll("expressSlotCounters"),
  ]);
  console.log(
    `  notifications -${usageOnly[0]}, procurement -${usageOnly[1]}, payments -${usageOnly[2]}, ` +
      `identityVerification -${usageOnly[3]}, staffSessions -${usageOnly[4]}, ` +
      `tokenCounters -${usageOnly[5]}, expressSlotCounters -${usageOnly[6]}`
  );

  console.log("Restoring seeded slot bookedCount and queue position counters...");
  const slotDefs = [20, 14, 6, 0]; // matches scripts/seed.ts's slotDefs booked counts, in order
  await Promise.all(
    CENTRE_IDS.flatMap((centreId) =>
      slotDefs.map((booked, i) =>
        db
          .collection("slots")
          .doc(`${centreId}-slot-${i}`)
          .set({ bookedCount: booked }, { merge: true })
      )
    )
  );
  // Tomorrow/day-after slots are seeded empty (bookedCount: 0) — advance-booking rehearsal
  // traffic against them needs resetting back to that, same as today's slots above.
  await Promise.all(
    CENTRE_IDS.flatMap((centreId) =>
      [1, 2].flatMap((dayOffset) =>
        [0, 1, 2, 3].map((i) =>
          db
            .collection("slots")
            .doc(`${centreId}-slot-${i}-d${dayOffset}`)
            .set({ bookedCount: 0 }, { merge: true })
        )
      )
    )
  );
  await Promise.all(
    QUEUE_POSITION_COUNTER_IDS.map((id) =>
      db.collection("queuePositionCounters").doc(id).set({ count: 3 })
    )
  );

  console.log("Restoring seeded per-crop daily buying capacity (remainingCapacityQuintals)...");
  await Promise.all(
    Object.entries(SEEDED_CROP_CAPACITY).flatMap(([centreId, byCrop]) =>
      Object.entries(byCrop).map(([cropType, dailyCapacityQuintals]) =>
        db
          .collection("centreCropCapacity")
          .doc(`${centreId}_${cropType}`)
          .set({ remainingCapacityQuintals: dailyCapacityQuintals }, { merge: true })
      )
    )
  );

  console.log(
    "Done. Fixed demo data (centres, slots, staff, the 4 seeded farmers/bookings) is intact " +
      "and reset to its seeded state; everything created by real app usage since the last seed " +
      "is gone."
  );
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
