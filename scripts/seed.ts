/**
 * Demo seed data (Missing Details Polish section 9): three centres, slots for the next three
 * days with a realistic mix of full and available, and a couple of bookings already in the
 * queue so the Live Queue screen shows "2 people ahead of you" during a demo instead of being
 * empty.
 *
 * Uses firebase-admin, which bypasses the security rules. Local demo use only.
 *
 * Usage:
 *   1. Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
 *   2. save it as serviceAccountKey.json in the repo root (git-ignored)
 *   3. npm run seed
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, GeoPoint, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { BUILT_IN_COMMODITIES } from "../src/data/commodities";

// Matches src/services/pinAuth.ts (plain SHA-256, no salt — good enough to keep PINs out of
// plaintext in a prototype, not a production-grade credential store).
function hashPin(pin: string): string {
  return createHash("sha256").update(pin.trim(), "utf-8").digest("hex");
}

const serviceAccountPath = join(__dirname, "..", "serviceAccountKey.json");

let serviceAccount: object;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    `Missing ${serviceAccountPath}.\n` +
      "Download a service account key from Firebase Console -> Project Settings -> " +
      "Service Accounts, save it as serviceAccountKey.json in the repo root, then re-run " +
      "npm run seed."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount as never) });
const db = getFirestore();

const today = new Date().toISOString().slice(0, 10);

async function seed() {
  console.log("Seeding centres...");
  const centres = [
    {
      id: "centre-ksn",
      name: "Karnal Sadar Mandi",
      district: "Karnal",
      location: { lat: 29.6857, lng: 76.9905 },
      dailyCapacity: 150,
      status: "active" as const,
      code: "KSN",
    },
    {
      id: "centre-pnp",
      name: "Panipat Grain Market",
      district: "Panipat",
      location: { lat: 29.3909, lng: 76.9635 },
      dailyCapacity: 120,
      status: "active" as const,
      code: "PNP",
    },
    {
      id: "centre-snp",
      name: "Sonipat Procurement Centre",
      district: "Sonipat",
      location: { lat: 28.9931, lng: 77.0151 },
      dailyCapacity: 100,
      status: "active" as const,
      code: "SNP",
    },
  ];

  for (const { id, location, ...centre } of centres) {
    await db
      .collection("centres")
      .doc(id)
      .set({ ...centre, location: new GeoPoint(location.lat, location.lng) });
  }

  console.log("Seeding per-crop daily buying capacity (wheat, paddy — CLAUDE.md's MSP scope)...");
  // Only wheat and paddy, matching the MSP scope — every other crop is simply not gated.
  // Remaining starts equal to the daily total: nothing bought yet today.
  const cropCapacityDefs: Record<string, Record<string, number>> = {
    "centre-ksn": { wheat: 500, paddy: 300 },
    "centre-pnp": { wheat: 400, paddy: 250 },
    "centre-snp": { wheat: 300, paddy: 200 },
  };
  // Demo figures, not published rates. Anchored near 2024-25 MSP (wheat ~2275/qtl, paddy
  // ~2300/qtl) with a grade spread, and varied per centre so Centre Selection has a real range
  // to show rather than three identical rows.
  const gradePriceDefs: Record<string, Record<string, Record<string, number>>> = {
    "centre-ksn": { wheat: { A: 2275, B: 2150, C: 1980 }, paddy: { A: 2300, B: 2180, C: 2000 } },
    "centre-pnp": { wheat: { A: 2260, B: 2140, C: 1970 }, paddy: { A: 2290, B: 2170, C: 1990 } },
    "centre-snp": { wheat: { A: 2280, B: 2160, C: 1990 }, paddy: { A: 2310, B: 2190, C: 2010 } },
  };
  for (const [centreId, byCrop] of Object.entries(cropCapacityDefs)) {
    for (const [cropType, dailyCapacityQuintals] of Object.entries(byCrop)) {
      await db
        .collection("centreCropCapacity")
        .doc(`${centreId}_${cropType}`)
        .set({
          centreId,
          cropType,
          dailyCapacityQuintals,
          remainingCapacityQuintals: dailyCapacityQuintals,
          gradePrices: gradePriceDefs[centreId]?.[cropType] ?? {},
        });
    }
  }

  console.log("Seeding the commodity master...");
  // Seeded from the same bundled list the app falls back to, so a seeded project and a fresh
  // clone show the same picker — except these rows can be edited by an admin.
  for (const commodity of BUILT_IN_COMMODITIES) {
    await db.collection("commodities").doc(commodity.key).set({
      name: commodity.name,
      icon: commodity.icon,
      unit: commodity.unit,
      labels: commodity.labels,
      active: true,
    });
  }

  console.log("Seeding slots for today, tomorrow, and the day after (advance booking demo)...");
  const slotDefs = [
    { start: "09:00", end: "10:00", capacity: 20, booked: 20 }, // full
    { start: "10:00", end: "11:00", capacity: 20, booked: 14 },
    { start: "11:00", end: "12:00", capacity: 20, booked: 6 },
    { start: "14:00", end: "15:00", capacity: 20, booked: 0 }, // fully available
  ];
  // The same 4 slots for 3 days, since the date tabs need real data for all of them. Today
  // keeps the unsuffixed IDs that reset.ts knows about; the other days get a -d{offset}.
  const dateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const slotIds: Record<string, string[]> = {};
  for (const centre of centres) {
    slotIds[centre.id] = [];
    for (const dayOffset of [0, 1, 2]) {
      const date = dayOffset === 0 ? today : dateForOffset(dayOffset);
      for (const [i, s] of slotDefs.entries()) {
        const slotId = dayOffset === 0 ? `${centre.id}-slot-${i}` : `${centre.id}-slot-${i}-d${dayOffset}`;
        if (dayOffset === 0) slotIds[centre.id].push(slotId);
        // Tomorrow/day-after start empty (booked: 0) regardless of today's demo booking
        // pattern — those bookings are specific to "today's" live-demo narrative.
        const booked = dayOffset === 0 ? s.booked : 0;
        await db
          .collection("slots")
          .doc(slotId)
          .set({
            centreId: centre.id,
            date,
            startTime: s.start,
            endTime: s.end,
            capacity: s.capacity,
            bookedCount: booked,
          });
      }
    }
  }

  console.log("Seeding demo farmers + bookings + queue ahead of the live demo token...");
  const demoCentre = centres[0];
  const demoSlotId = slotIds[demoCentre.id][2]; // the 11:00-12:00 slot, not full

  const fakeFarmers = [
    { id: "farmer-demo-1", name: "Ramesh Kumar", token: "KSN-1046" },
    { id: "farmer-demo-2", name: "Suresh Yadav", token: "KSN-1047" },
  ];

  for (const [i, f] of fakeFarmers.entries()) {
    await db
      .collection("farmers")
      .doc(f.id)
      .set({
        name: f.name,
        mobile: `98765430${i}0`,
        verificationStatus: "verified",
        village: "Demo Village",
        district: demoCentre.district,
        state: "Haryana",
        createdAt: FieldValue.serverTimestamp(),
      });

    const cropId = `crop-demo-${i}`;
    await db.collection("crops").doc(cropId).set({
      farmerId: f.id,
      cropType: i % 2 === 0 ? "wheat" : "paddy",
      expectedQuantity: 20,
      preferredCentreId: demoCentre.id,
    });

    const bookingId = `booking-demo-${i}`;
    await db
      .collection("bookings")
      .doc(bookingId)
      .set({
        farmerId: f.id,
        centreId: demoCentre.id,
        slotId: demoSlotId,
        cropId,
        tokenNumber: f.token,
        status: "arrived",
      });

    await db
      .collection("queue")
      .doc(`queue-demo-${i}`)
      .set({
        bookingId,
        centreId: demoCentre.id,
        position: i + 1,
        status: "waiting",
        estimatedWaitMinutes: (i + 1 - 1) * 8,
      });
  }

  // The live demo booking — position 3, i.e. "2 people ahead of you".
  await db
    .collection("farmers")
    .doc("farmer-demo-live")
    .set({
      name: "Demo Farmer (live)",
      mobile: "9876543099",
      verificationStatus: "verified",
      village: "Demo Village",
      district: demoCentre.district,
      state: "Haryana",
      createdAt: FieldValue.serverTimestamp(),
    });

  await db.collection("crops").doc("crop-demo-live").set({
    farmerId: "farmer-demo-live",
    cropType: "wheat",
    expectedQuantity: 25,
    preferredCentreId: demoCentre.id,
  });

  await db.collection("bookings").doc("booking-demo-live").set({
    farmerId: "farmer-demo-live",
    centreId: demoCentre.id,
    slotId: demoSlotId,
    cropId: "crop-demo-live",
    tokenNumber: "KSN-1048",
    status: "arrived",
  });

  await db.collection("queue").doc("queue-demo-live").set({
    bookingId: "booking-demo-live",
    centreId: demoCentre.id,
    position: 3,
    status: "waiting",
    estimatedWaitMinutes: 2 * 8,
  });

  // Seed data assigns queue positions 1-3 directly rather than through checkInBooking()'s
  // queuePositionCounters transaction — this counter has to be primed to match, or the next
  // *real* check-in via the app would also compute position 1 and collide with Ramesh Kumar.
  await db
    .collection("queuePositionCounters")
    .doc(`${demoCentre.id}_${today}`)
    .set({ count: 3 });

  // Not checked in yet — lets an operator test the Scan/Check-in screen against a real token.
  console.log("Seeding one not-yet-arrived booking for testing operator check-in...");
  await db.collection("farmers").doc("farmer-demo-notarrived").set({
    name: "Geeta Devi",
    mobile: "9876543098",
    verificationStatus: "verified",
    village: "Demo Village",
    district: demoCentre.district,
    state: "Haryana",
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("crops").doc("crop-demo-notarrived").set({
    farmerId: "farmer-demo-notarrived",
    cropType: "paddy",
    expectedQuantity: 18,
    preferredCentreId: demoCentre.id,
  });
  await db.collection("bookings").doc("booking-demo-notarrived").set({
    farmerId: "farmer-demo-notarrived",
    centreId: demoCentre.id,
    slotId: demoSlotId,
    cropId: "crop-demo-notarrived",
    tokenNumber: "KSN-1049",
    status: "booked",
  });

  console.log("Seeding demo staff accounts (one operator per centre, PIN 1234; admin PIN 9999)...");
  const operatorPin = hashPin("1234");
  await db.collection("staff").doc("staff-op-1").set({
    name: "Demo Operator (Karnal)",
    role: "operator",
    pinHash: operatorPin,
    assignedCentreId: "centre-ksn",
  });
  await db.collection("staff").doc("staff-op-2").set({
    name: "Demo Operator (Panipat)",
    role: "operator",
    pinHash: operatorPin,
    assignedCentreId: "centre-pnp",
  });
  await db.collection("staff").doc("staff-op-3").set({
    name: "Demo Operator (Sonipat)",
    role: "operator",
    pinHash: operatorPin,
    assignedCentreId: "centre-snp",
  });
  await db.collection("staff").doc("staff-admin-1").set({
    name: "Demo Admin",
    role: "admin",
    pinHash: hashPin("9999"),
    assignedCentreId: null,
  });

  console.log(
    "Done. Demo booking token KSN-1048 has 2 people ahead of it in the queue. " +
      "Operator logins (PIN 1234): staff-op-1 (Karnal), staff-op-2 (Panipat), staff-op-3 (Sonipat)."
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
