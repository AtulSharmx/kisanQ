import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useFarmer } from "../../../context/FarmerContext";
import { listenConsentsForFarmer, revokeConsent } from "../../../interop/interopFirestoreService";
import { generateCorrelationId } from "../../../interop/connectors/baseConnector";
import type { Consent } from "../../../types/interop";

type Props = NativeStackScreenProps<RootStackParamList, "MyConsents">;

export function MyConsentsScreen({ navigation }: Props) {
  const { farmerId } = useFarmer();
  const [consents, setConsents] = useState<(Consent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmerId) return;

    const unsub = listenConsentsForFarmer(
      farmerId,
      (list) => {
        setConsents(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [farmerId]);

  const onRevoke = (consent: Consent & { id: string }) => {
    Alert.alert(
      "Revoke Consent",
      `Are you sure you want to revoke data sharing consent for ${consent.requestingService}?\n\nFuture data sharing requests using this consent will be rejected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            if (!farmerId) return;
            try {
              const correlationId = generateCorrelationId();
              await revokeConsent(consent.id, farmerId, correlationId);
              Alert.alert("Consent Revoked", "Data sharing permission has been revoked.");
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to revoke consent";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>My Granted Consents</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : consents.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No active data sharing consents granted.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {consents.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{item.requestingService}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: item.status === "ACTIVE" ? "#E8F5E9" : "#FFEBEE" },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.status === "ACTIVE" ? "#2E7D32" : "#C62828" },
                    ]}
                  >
                    ● {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.purposeText}>Purpose: {item.purpose}</Text>

              <Text style={styles.fieldsHeader}>Shared Data Fields:</Text>
              <Text style={styles.fieldsText}>
                {Array.isArray(item.requestedDataFields) ? item.requestedDataFields.join(", ") : ""}
              </Text>

              {item.status === "ACTIVE" && (
                <Pressable
                  style={({ pressed }) => [styles.revokeBtn, pressed && styles.pressed]}
                  onPress={() => onRevoke(item)}
                >
                  <Text style={styles.revokeBtnText}>REVOKE CONSENT</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.header,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: fontSize.label,
    fontWeight: "800",
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  purposeText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  fieldsHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  fieldsText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.text,
  },
  revokeBtn: {
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  revokeBtnText: {
    color: colors.error,
    fontWeight: "800",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
