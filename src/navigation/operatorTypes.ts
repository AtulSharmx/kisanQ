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
     * already loaded the booking and the crop) purely so Quality Check can look up the centre's
     * configured ₹/grade rates for *this* commodity and pre-fill the price field. Empty strings
     * are tolerated: a booking predating `Booking.cropType` just means no pre-fill and the
     * operator types the rate free-hand, which was the behaviour before rates existed at all.
     */
    centreId: string;
    cropType: string;
  };
  AdminOverview: undefined;
  AdminDrilldown: undefined;
  AdminSettings: undefined;
  OperatorSettings: undefined;
};
