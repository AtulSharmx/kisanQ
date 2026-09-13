/**
 * Demo seed data — docs/KisanQ_Missing_Details_Polish.md section 9.
 *
 * Populates 2-3 centres, a handful of slots for today (some full, some available), and 1-2
 * "fake" bookings already sitting in the queue ahead of a live demo booking, so the Live Queue
 * screen shows a realistic "3 people ahead of you" during the demo instead of an empty queue.
 *
 * Uses firebase-admin (bypasses Firestore security rules) with a service account key — this
 * script is for local/demo seeding only, never run it against a production project.
 *
 * Usage:
 *   1. Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
 *   2. Save the downloaded JSON as serviceAccountKey.json in the repo root (git-ignored)
 *   3. npm run seed
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, GeoPoint, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

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

  console.log("Seeding slots for today...");
  const slotDefs = [
    { start: "09:00", end: "10:00", capacity: 20, booked: 20 }, // full
    { start: "10:00", end: "11:00", capacity: 20, booked: 14 },
    { start: "11:00", end: "12:00", capacity: 20, booked: 6 },
    { start: "14:00", end: "15:00", capacity: 20, booked: 0 }, // fully available
  ];
  const slotIds: Record<string, string[]> = {};
  for (const centre of centres) {
    slotIds[centre.id] = [];
    for (const [i, s] of slotDefs.entries()) {
      const slotId = `${centre.id}-slot-${i}`;
      slotIds[centre.id].push(slotId);
      await db
        .collection("slots")
        .doc(slotId)
        .set({
          centreId: centre.id,
          date: today,
          startTime: s.start,
          endTime: s.end,
          capacity: s.capacity,
          bookedCount: s.booked,
        });
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

  console.log("Seeding demo staff accounts (operator PIN 1234, admin PIN 9999)...");
  await db.collection("staff").doc("staff-op-1").set({
    name: "Demo Operator",
    role: "operator",
    pinHash: hashPin("1234"),
    assignedCentreId: demoCentre.id,
  });
  await db.collection("staff").doc("staff-admin-1").set({
    name: "Demo Admin",
    role: "admin",
    pinHash: hashPin("9999"),
    assignedCentreId: null,
  });

  console.log(
    "Done. Demo booking token KSN-1048 has 2 people ahead of it in the queue. " +
      "Operator login: staff-op-1 / PIN 1234."
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
