import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { HelpFab } from "./HelpFab";
import { HomeFab } from "./HomeFab";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  showHome?: boolean;
  showHelp?: boolean;
}

/** Common screen chrome: off-white background, persistent Home + Help buttons (UI/UX spec). */
export function ScreenContainer({ children, scroll = true, showHome = true, showHelp = true }: Props) {
  const Content = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Content
          style={styles.flex}
          contentContainerStyle={scroll ? styles.scrollContent : styles.content}
        >
          {children}
        </Content>
      </KeyboardAvoidingView>
      {showHome && <HomeFab />}
      {showHelp && <HelpFab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2, flexGrow: 1 },
  content: { flex: 1, padding: spacing.lg },
});
