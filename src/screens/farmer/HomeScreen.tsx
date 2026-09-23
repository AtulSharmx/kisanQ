import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, spacing } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { useFarmer } from "../../context/FarmerContext";
import { IconTile } from "../../components/IconTile";
import { ScreenContainer } from "../../components/ScreenContainer";
import { getActiveBookingForFarmer } from "../../services/firestoreService";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/** Home Dashboard — UI/UX spec screen 5. 2-column icon grid, simplest screen in the app. */
export function HomeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { farmer, farmerId } = useFarmer();
  const [checkingToken, setCheckingToken] = useState(false);

  const onMyToken = async () => {
    if (!farmerId) return;
    setCheckingToken(true);
    const booking = await getActiveBookingForFarmer(farmerId).catch(() => null);
    setCheckingToken(false);
    if (booking) {
      navigation.navigate("Token", { bookingId: booking.id });
    } else {
      navigation.navigate("LiveQueue");
    }
  };

  return (
    <ScreenContainer showHome={false}>
      <Text style={styles.greeting}>
        {farmer ? `${t("appName")} — ${farmer.name}` : t("appName")}
      </Text>

      <View style={styles.grid}>
        <IconTile
          icon="📅"
          label={t("homeBookSlot")}
          onPress={() => navigation.navigate("AddCrop")}
        />
        <IconTile icon="🎫" label={t("homeMyToken")} onPress={onMyToken} />
        <IconTile
          icon="⏳"
          label={t("homeLiveQueue")}
          onPress={() => navigation.navigate("LiveQueue")}
        />
        <IconTile
          icon="🌾"
          label={t("homeMyProduce")}
          onPress={() => navigation.navigate("ComingSoon", { titleKey: "homeMyProduce" })}
        />
        <IconTile
          icon="📋"
          label={t("homeProcurementStatus")}
          onPress={() => navigation.navigate("ProcurementStatus")}
        />
        <IconTile
          icon="💰"
          label={t("homePayment")}
          onPress={() => navigation.navigate("Payment")}
        />
        <IconTile
          icon="🔔"
          label={t("homeNotifications")}
          onPress={() => navigation.navigate("Notifications")}
        />
        <IconTile
          icon="⚙️"
          label={t("homeSettings")}
          onPress={() => navigation.navigate("Settings")}
        />
      </View>

      {checkingToken && <ActivityIndicator style={styles.loader} color={colors.primary} />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  loader: { marginTop: spacing.lg },
});
