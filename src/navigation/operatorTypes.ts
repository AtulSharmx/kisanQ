export type OperatorStackParamList = {
  StaffLogin: undefined;
  ScanCheckIn: undefined;
  LiveQueueManagement: undefined;
  Weighing: { bookingId: string; queueId: string; farmerId: string };
  QualityCheck: {
    bookingId: string;
    queueId: string;
    farmerId: string;
    procurementId: string;
    expectedQuantity: number;
    actualWeight: number;
  };
};
