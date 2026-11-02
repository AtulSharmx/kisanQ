import type { StringKey } from "../i18n/strings";

export type RootStackParamList = {
  Splash: undefined;
  Aadhaar: undefined;
  Otp: { aadhaar: string };
  ProfileConfirm: { aadhaar: string };
  StepVillage: { aadhaar: string };
  StepCrop: { aadhaar: string; village: string };
  StepCentre: { aadhaar: string; village: string; cropType: string; expectedQuantity: number };
  Home: undefined;
  AddCrop: undefined;
  CentreSelection: { cropType: string; expectedQuantity: number };
  SlotBooking: { centreId: string; cropId: string };
  Token: { bookingId: string };
  LiveQueue: undefined;
  ProcurementStatus: undefined;
  Payment: undefined;
  Notifications: undefined;
  Settings: undefined;
  ComingSoon: { titleKey: "homeMyProduce" };
  GovernmentServices: undefined;
  SchemeSelection: { schemeId: string; schemeName: string };
  // `requestedFields` and `purpose` are i18n keys, not literal text: this screen is where a
  // farmer grants permission to share their data, so what it lists has to be readable in their
  // own language — passing English strings through navigation made that impossible.
  ConsentScreen: {
    schemeId: string;
    schemeName: string;
    requestedFields: StringKey[];
    purposeKey: StringKey;
  };
  MyApplications: undefined;
  MyConsents: undefined;
};
