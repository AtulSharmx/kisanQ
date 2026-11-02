import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { colors, fontSize, radius, shadow, spacing } from "../../../theme";
import { useFarmer } from "../../../context/FarmerContext";
import { useLanguage } from "../../../context/LanguageContext";
import { tryT } from "../../../i18n/strings";
import { listenConsentsForFarmer, revokeConsent } from "../../../interop/interopFirestoreService";
import { generateCorrelationId } from "../../../interop/connectors/baseConnector";
import type { Consent, ConsentStatus } from "../../../types/interop";
import type { StringKey } from "../../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "MyConsents">;

const STATUS_LABEL: Record<ConsentStatus, StringKey> = {
  ACTIVE: "consentStatusActive",
  REVOKED: "consentStatusRevoked",
  EXPIRED: "consentStatusExpired",
  DENIED: "consentStatusDenied",
};

export function MyConsentsScreen({ navigation }: Props) {
  const { farmerId } = useFarmer();
  const { t, lang } = useLanguage();
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
              Alert.alert(t("consentsRevokedTitle"), t("consentStatusRevoked"));
            } catch (err) {
              console.error(err);
              Alert.alert(t("consentsRevokedTitle"), t("saveFailed"));
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer showHome={true}>
      <Text style={styles.title}>{t("myConsentsTitle")}</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : consents.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t("consentsEmpty")}</Text>
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
                    {
                      backgroundColor:
                        item.status === "ACTIVE" ? colors.primaryTint : colors.errorTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.status === "ACTIVE" ? colors.primary : colors.error },
                    ]}
                  >
                    ● {t(STATUS_LABEL[item.status] ?? "consentStatusActive")}
                  </Text>
                </View>
              </View>

              <Text style={styles.purposeText}>
                {t("consentPurposeLabel")}: {tryT(item.purpose, lang)}
              </Text>

              <Text style={styles.fieldsHeader}>{t("consentsSharedFields")}</Text>
              <Text style={styles.fieldsText}>
                {Array.isArray(item.requestedDataFields)
                  ? item.requestedDataFields.map((f) => tryT(f, lang)).join(", ")
                  : ""}
              </Text>

              {item.status === "ACTIVE" && (
                <Pressable
                  style={({ pressed }) => [styles.revokeBtn, pressed && styles.pressed]}
                  onPress={() => onRevoke(item)}
                >
                  <Text style={styles.revokeBtnText}>{t("consentsRevokeBtn")}</Text>
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
