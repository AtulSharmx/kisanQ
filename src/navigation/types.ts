export type RootStackParamList = {
  Splash: undefined;
  Aadhaar: undefined;
  Otp: { aadhaar: string };
  ProfileConfirm: { aadhaar: string };
  StepVillage: undefined;
  StepCrop: { village: string };
  StepCentre: { village: string; cropType: string; expectedQuantity: number };
  Home: undefined;
  AddCrop: undefined;
  CentreSelection: { cropType: string; expectedQuantity: number };
  SlotBooking: { centreId: string; cropId: string };
  Token: { bookingId: string };
  ComingSoon: { titleKey: "homeLiveQueue" | "homeMyProduce" | "homeProcurementStatus" | "homePayment" | "homeNotifications" };
};
