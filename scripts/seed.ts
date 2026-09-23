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
import { BUILT_IN_COMMODITIES } from "../src/data/commodities";
import { computeBreakdown } from "../src/config/msp";
import { expectedPaymentDate } from "../src/utils/paymentDates";
import {
  paymentStageText,
  qualityAcceptedText,
  weighingText,
  callNextText,
  type NotificationText,
} from "../src/services/notificationText";
import { maskMobile } from "../src/utils/maskMobile";

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

  console.log("Seeding per-crop daily buying capacity (wheat, mustard)...");
  // Daily Buying Capacity feature — opt-in per (centre, crop) pair (see the type comment on
  // CentreCropCapacity in src/types/firestore.ts). Only wheat and mustard are seeded — two Rabi
  // crops with a verified RMS 2026-27 MSP in src/config/msp.ts (paddy has no verified MSP
  // configured yet, so a paddy lot couldn't be accepted in the demo). Every other crop in the
  // picker is simply not capacity-gated by default. remainingCapacityQuintals starts equal to dailyCapacityQuintals (nothing bought
  // yet today); submitQualityCheck()'s Accept step decrements it live, an admin can manually
  // increase it.
  const cropCapacityDefs: Record<string, Record<string, number>> = {
    "centre-ksn": { wheat: 500, mustard: 300 },
    "centre-pnp": { wheat: 400, mustard: 250 },
    "centre-snp": { wheat: 300, mustard: 200 },
  };
  // No per-centre prices: every lot is paid at the single official MSP from src/config/msp.ts.
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
        });
    }
  }

  console.log("Seeding the commodity master...");
  // The runtime commodity table. Seeded from the same bundled list the app falls back to, so a
  // seeded Firestore and a fresh clone show the same picker — the difference is that once these
  // rows exist an admin can edit them (rename, change unit, deactivate) like any commodity they
  // add themselves. Doc id === the `cropType` string every other collection keys on.
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
  // Same 4 time slots, 3 days out — SlotBookingScreen's Aaj/Kal/Parso date tabs need real data
  // for all three, not just today. Offset 0 keeps today's original slot IDs (`{centre}-slot-{i}`)
  // for backward compatibility with scripts/reset.ts; tomorrow/day-after get a `-d{offset}`
  // suffix so all three days' docs coexist without colliding.
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
      cropType: i % 2 === 0 ? "wheat" : "mustard",
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
        cropType: i % 2 === 0 ? "wheat" : "mustard",
        tokenNumber: f.token,
        status: "arrived",
        checkedInByStaffId: "staff-op-1",
        createdAt: FieldValue.serverTimestamp(),
      });

    await db
      .collection("queue")
      .doc(`queue-demo-${i}`)
      .set({
        bookingId,
        centreId: demoCentre.id,
        // Position 1 is the completed demo lot seeded below, so waiting farmers start at 2.
        position: i + 2,
        status: "waiting",
        estimatedWaitMinutes: i * 8,
      });
  }

  // The live demo booking — position 4, with 2 *waiting* farmers ahead of it (position 1 is the
  // already-completed lot, which the Live Queue doesn't count), i.e. "2 people ahead of you".
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
    cropType: "wheat",
    tokenNumber: "KSN-1048",
    status: "arrived",
    checkedInByStaffId: "staff-op-1",
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("queue").doc("queue-demo-live").set({
    bookingId: "booking-demo-live",
    centreId: demoCentre.id,
    position: 4,
    status: "waiting",
    estimatedWaitMinutes: 2 * 8,
  });

  // Seed data assigns queue positions 1-4 directly rather than through checkInBooking()'s
  // queuePositionCounters transaction — this counter has to be primed to match, or the next
  // *real* check-in via the app would also compute position 1 and collide with Ramesh Kumar.
  await db
    .collection("queuePositionCounters")
    .doc(`${demoCentre.id}_${today}`)
    .set({ count: 4 });

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
    cropType: "chana",
    expectedQuantity: 18,
    preferredCentreId: demoCentre.id,
  });
  await db.collection("bookings").doc("booking-demo-notarrived").set({
    farmerId: "farmer-demo-notarrived",
    centreId: demoCentre.id,
    slotId: demoSlotId,
    cropId: "crop-demo-notarrived",
    cropType: "chana",
    tokenNumber: "KSN-1049",
    status: "booked",
    createdAt: FieldValue.serverTimestamp(),
  });

  // ---------------------------------------------------------------------------------------------
  // One fully-completed lot, so every transparency feature has something real to show on a fresh
  // seed: a moisture deduction on the procurement record, a payment part-way through its stages,
  // an open objection naming the operator, and the notifications + simulated SMS that went with
  // each step. All numbers come from the same functions the app uses (computeBreakdown,
  // notificationText), so the demo can't drift from real behaviour.
  // ---------------------------------------------------------------------------------------------
  console.log("Seeding a completed lot with a moisture deduction, payment stages, objection, SMS log...");
  const doneFarmer = { id: "farmer-demo-done", name: "Mahesh Singh", mobile: "9876543097" };
  await db.collection("farmers").doc(doneFarmer.id).set({
    name: doneFarmer.name,
    mobile: doneFarmer.mobile,
    verificationStatus: "verified",
    village: "Demo Village",
    district: demoCentre.district,
    state: "Haryana",
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("crops").doc("crop-demo-done").set({
    farmerId: doneFarmer.id,
    cropType: "wheat",
    expectedQuantity: 20,
    preferredCentreId: demoCentre.id,
  });
  await db.collection("bookings").doc("booking-demo-done").set({
    farmerId: doneFarmer.id,
    centreId: demoCentre.id,
    slotId: demoSlotId,
    cropId: "crop-demo-done",
    cropType: "wheat",
    tokenNumber: "KSN-1045",
    status: "completed",
    checkedInByStaffId: "staff-op-1",
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("queue").doc("queue-demo-done").set({
    bookingId: "booking-demo-done",
    centreId: demoCentre.id,
    position: 1,
    status: "completed",
    estimatedWaitMinutes: 0,
  });

  // 20 quintal wheat at 13.5% moisture: 20 × ₹2,585 = ₹51,700, 1.5 points over the 12% limit
  // at the DEMO 1%-per-point rate = ₹776 deduction -> ₹50,924.
  const breakdown = computeBreakdown("wheat", 20, 13.5)!;
  await db.collection("procurement").doc("procurement-demo-done").set({
    bookingId: "booking-demo-done",
    actualWeight: 20,
    qualityStatus: "accepted",
    moisturePct: breakdown.moisturePct,
    grade: "A",
    procurementStatus: "completed",
    mspPerQuintal: breakdown.mspPerQuintal,
    grossAmount: breakdown.grossAmount,
    moistureLimitPct: breakdown.moistureLimitPct,
    excessMoisturePct: breakdown.excessMoisturePct,
    deductionPctPerPoint: breakdown.deductionPctPerPoint,
    deductionRule: breakdown.deductionRule,
    deductionAmount: breakdown.deductionAmount,
    finalAmount: breakdown.finalAmount,
    weighedByStaffId: "staff-op-1",
    qualityCheckedByStaffId: "staff-op-1",
  });

  const dueDate = expectedPaymentDate(new Date());
  await db.collection("payments").doc("payment-demo-done").set({
    procurementId: "procurement-demo-done",
    bookingId: "booking-demo-done",
    farmerId: doneFarmer.id,
    amount: breakdown.finalAmount,
    status: "jform_generated",
    transactionReference: null,
    expectedPaymentDate: dueDate,
    stageUpdatedAt: {
      quality_accepted: FieldValue.serverTimestamp(),
      jform_generated: FieldValue.serverTimestamp(),
    },
  });

  await db.collection("objections").doc("booking-demo-done_quality").set({
    bookingId: "booking-demo-done",
    farmerId: doneFarmer.id,
    centreId: demoCentre.id,
    procurementId: "procurement-demo-done",
    stage: "quality",
    operatorStaffId: "staff-op-1",
    reason: "quality",
    note: "मेरे मीटर पर नमी 12.5% थी, 13.5% नहीं — दोबारा जांच की जाए।",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });

  const doneMessages: { type: string; text: NotificationText }[] = [
    { type: "call_next", text: callNextText(1) },
    { type: "weighing_recorded", text: weighingText(20) },
    { type: "quality_checked", text: qualityAcceptedText("A", breakdown) },
    { type: "payment_processing", text: paymentStageText("quality_accepted", breakdown.finalAmount, dueDate) },
    { type: "payment_jform_generated", text: paymentStageText("jform_generated", breakdown.finalAmount, dueDate) },
  ];
  for (const [i, m] of doneMessages.entries()) {
    // Spaced a minute apart so both the notification list and the SMS log read in order.
    const at = new Date(Date.now() - (doneMessages.length - i) * 60_000);
    await db.collection("notifications").doc(`notification-demo-done-${i + 1}`).set({
      farmerId: doneFarmer.id,
      bookingId: "booking-demo-done",
      type: m.type,
      message: m.text.hi,
      messageEn: m.text.en,
      channel: "in_app",
      status: i < 3 ? "read" : "unread",
      createdAt: at,
    });
    await db.collection("smsLog").doc(`sms-demo-done-${i + 1}`).set({
      mobileMasked: maskMobile(doneFarmer.mobile),
      text: m.text.hi,
      bookingId: "booking-demo-done",
      status: "simulated",
      createdAt: at,
    });
  }

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
    "Done. Demo booking token KSN-1048 has 2 people ahead of it in the queue; KSN-1045 is a " +
      "completed wheat lot with a moisture deduction, an open objection and SMS log entries. " +
      "Operator logins (PIN 1234): staff-op-1 (Karnal), staff-op-2 (Panipat), staff-op-3 (Sonipat)."
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
