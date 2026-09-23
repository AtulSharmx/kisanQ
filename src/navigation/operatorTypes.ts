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
    /**
     * Which centre and which commodity this lot is — carried through from Weighing (which has
     * already loaded the booking and the crop) so Quality Check can look up this commodity's MSP
     * and moisture rule (src/config/msp.ts) and show the payment breakdown live. An empty
     * cropType (a booking predating `Booking.cropType`) simply finds no MSP; submitQualityCheck
     * re-reads the crop from the booking itself before pricing, so the stored record is right.
     */
    centreId: string;
    cropType: string;
  };
  AdminOverview: undefined;
  AdminDrilldown: undefined;
  AdminSettings: undefined;
  AdminPayments: undefined;
  AdminObjections: undefined;
  AdminSmsLog: undefined;
  OperatorSettings: undefined;
};
