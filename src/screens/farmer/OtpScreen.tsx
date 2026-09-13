import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { colors, fontSize, spacing, touchTarget } from "../../theme";
import { useLanguage } from "../../context/LanguageContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { OtpInput } from "../../components/OtpInput";
import { DEMO_OTP } from "../../services/mockAadhaar";

type Props = NativeStackScreenProps<RootStackParamList, "Otp">;

const RESEND_SECONDS = 30;

/** OTP screen — UI/UX spec screen 2. Mocked: accepts the demo OTP shown on screen. */
export function OtpScreen({ route, navigation }: Props) {
  const { aadhaar } = route.params;
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [verifyingFingerprint, setVerifyingFingerprint] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const proceed = () => navigation.navigate("ProfileConfirm", { aadhaar });

  const onVerify = () => {
    if (otp !== DEMO_OTP) {
      setError(t("invalidOtp"));
      return;
    }
    setError(null);
    proceed();
  };

  const onFingerprintFallback = () => {
    // Tiered fallback per Missing Details Polish sec. 1 / UI/UX spec screen 2: OTP -> operator
    // fingerprint -> ...; a genuine farmer is never turned away just because Aadhaar OTP
    // failed. Simulated here since there's no real biometric hardware integration.
    setVerifyingFingerprint(true);
    setTimeout(proceed, 1200);
  };

  return (
    <ScreenContainer showHome={false}>
      <Text style={styles.title}>{t("otpTitle")}</Text>
      <Text style={styles.hint}>
        {t("otpSentTo")} +91 {aadhaar.slice(-4).padStart(10, "•")}
      </Text>

      <View style={styles.otpWrap}>
        <OtpInput value={otp} onChange={setOtp} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.demoHint}>{t("otpDemoValue")}</Text>

      <View style={styles.spacer} />
      <PrimaryButton label={t("continueBtn")} onPress={onVerify} disabled={otp.length < 6} />

      <Pressable
        onPress={() => setCountdown(RESEND_SECONDS)}
        disabled={countdown > 0}
        style={({ pressed }) => [styles.resendRow, pressed && styles.pressed]}
      >
        <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
          {t("resendOtp")} {countdown > 0 ? `(${countdown}s)` : ""}
        </Text>
      </Pressable>

      {verifyingFingerprint ? (
        <Text style={styles.fingerprintStatus}>👆 {t("verifyingFingerprint")}</Text>
      ) : (
        <Pressable
          onPress={onFingerprintFallback}
          style={({ pressed }) => [styles.fallbackRow, pressed && styles.pressed]}
        >
          <Text style={styles.fallbackLink}>👆 {t("otpFailFallback")}</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.header, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.lg },
  otpWrap: { marginBottom: spacing.md },
  error: { color: colors.error, textAlign: "center", marginTop: spacing.sm },
  demoHint: { textAlign: "center", color: colors.textMuted, marginTop: spacing.sm },
  spacer: { height: spacing.lg },
  resendRow: {
    marginTop: spacing.lg,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  resend: { color: colors.primary, fontSize: fontSize.body, fontWeight: "700" },
  resendDisabled: { color: colors.textMuted },
  fallbackRow: {
    marginTop: spacing.xl,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackLink: {
    textAlign: "center",
    color: colors.primary,
    fontSize: fontSize.body,
    textDecorationLine: "underline",
  },
  fingerprintStatus: {
    marginTop: spacing.xl,
    textAlign: "center",
    color: colors.accent,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  pressed: { opacity: 0.7 },
});
