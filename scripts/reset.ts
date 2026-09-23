/**
 * Demo data reset — wipes everything a rehearsal run adds, without touching the fixed-ID demo
 * data scripts/seed.ts creates. Run this before every practice/demo pass so the Admin Dashboard
 * counters and Live Queue stay exactly as clean as they were right after `npm run seed`
 * (Audit finding: rehearsal traffic with auto-generated Firestore IDs had already pushed the
 * Admin Dashboard to "5 farmers, 11 bookings" against a seeded baseline of 4 farmers, with no
 * script anywhere to undo it).
 *
 * Two kinds of collections here:
 *   1. Real-usage-only (nothing in seed.ts ever writes to these): identityVerification,
 *      staffSessions, tokenCounters — every document in them is wiped unconditionally.
 *   2. Seed + real-usage mixed: farmers, crops, bookings, queue, staff, slots, centres,
 *      procurement, payments, notifications, objections, smsLog — documents are only wiped if
 *      their ID isn't one of seed.ts's fixed IDs (mirrored below; keep this list in sync with
 *      scripts/seed.ts if that script's shape ever changes).
 * slots.bookedCount, queuePositionCounters.count, the seeded payment's stage and the seeded
 * objection's status are fixed-ID docs that app usage mutates in place (an admin advancing the
 * payment or resolving the objection during rehearsal) — those are restored to their seeded
 * values rather than deleted.
 *
 * Uses firebase-admin (bypasses Firestore security rules) with the same serviceAccountKey.json
 * as scripts/seed.ts — local/demo use only, never run against a production project.
 *
 * Usage: npm run reset   (then npm run seed if you want a fully clean slate, or just reset if
 * you never deleted the fixed seed docs and only want to drop rehearsal traffic)
 */
import { initializeApp, cert } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
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
// Seeded per-crop daily buying capacity (Daily Buying Capacity feature) — mirrors
// scripts/seed.ts's cropCapacityDefs exactly, so remainingCapacityQuintals can be restored to
// "nothing bought yet today" the same way slots.bookedCount is restored below. An admin adding
// capacity for some *other* crop during rehearsal (addCentreCropCapacity()) isn't a fixed seed
// doc, so it gets wiped like any other real-usage document — see CROP_CAPACITY_IDS below.
const SEEDED_CROP_CAPACITY: Record<string, Record<string, number>> = {
  "centre-ksn": { wheat: 500, mustard: 300 },
  "centre-pnp": { wheat: 400, mustard: 250 },
  "centre-snp": { wheat: 300, mustard: 200 },
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
  "farmer-demo-done",
];
const CROP_IDS = [
  "crop-demo-0",
  "crop-demo-1",
  "crop-demo-live",
  "crop-demo-notarrived",
  "crop-demo-done",
];
const BOOKING_IDS = [
  "booking-demo-0",
  "booking-demo-1",
  "booking-demo-live",
  "booking-demo-notarrived",
  "booking-demo-done",
];
const QUEUE_IDS = ["queue-demo-0", "queue-demo-1", "queue-demo-live", "queue-demo-done"];
// The completed demo lot (see seed.ts): its procurement record, payment, objection, and the five
// notifications + simulated SMS that went with it.
const PROCUREMENT_IDS = ["procurement-demo-done"];
const PAYMENT_IDS = ["payment-demo-done"];
const OBJECTION_IDS = ["booking-demo-done_quality"];
const NOTIFICATION_IDS = [1, 2, 3, 4, 5].map((i) => `notification-demo-done-${i}`);
const SMS_LOG_IDS = [1, 2, 3, 4, 5].map((i) => `sms-demo-done-${i}`);
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
    wipeExcept("procurement", PROCUREMENT_IDS),
    wipeExcept("payments", PAYMENT_IDS),
    wipeExcept("objections", OBJECTION_IDS),
    wipeExcept("notifications", NOTIFICATION_IDS),
    wipeExcept("smsLog", SMS_LOG_IDS),
  ]);
  console.log(
    `  farmers -${mixed[0]}, crops -${mixed[1]}, bookings -${mixed[2]}, queue -${mixed[3]}, ` +
      `staff -${mixed[4]}, slots -${mixed[5]}, centres -${mixed[6]}, ` +
      `queuePositionCounters -${mixed[7]}, centreCropCapacity -${mixed[8]}, ` +
      `commodities -${mixed[9]}, procurement -${mixed[10]}, payments -${mixed[11]}, ` +
      `objections -${mixed[12]}, notifications -${mixed[13]}, smsLog -${mixed[14]}`
  );

  console.log("Wiping real-usage-only collections entirely...");
  const usageOnly = await Promise.all([
    wipeAll("identityVerification"),
    wipeAll("staffSessions"),
    wipeAll("tokenCounters"),
  ]);
  console.log(
    `  identityVerification -${usageOnly[0]}, staffSessions -${usageOnly[1]}, ` +
      `tokenCounters -${usageOnly[2]}`
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
      db.collection("queuePositionCounters").doc(id).set({ count: 4 })
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

  console.log("Restoring the seeded payment stage and objection status...");
  await db.collection("payments").doc("payment-demo-done").update({
    status: "jform_generated",
    transactionReference: null,
    "stageUpdatedAt.payment_sent": FieldValue.delete(),
    "stageUpdatedAt.credited": FieldValue.delete(),
  }).catch(() => undefined); // not present if seed.ts hasn't been run yet
  await db.collection("objections").doc("booking-demo-done_quality").update({
    status: "open",
    resolvedAt: FieldValue.delete(),
    resolvedByStaffId: FieldValue.delete(),
  }).catch(() => undefined); // not present if seed.ts hasn't been run yet

  console.log(
    "Done. Fixed demo data (centres, slots, staff, the 5 seeded farmers/bookings and the completed demo lot) is intact " +
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
