import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, touchTarget } from "../theme";
import { HelpFab } from "./HelpFab";
import { HomeFab } from "./HomeFab";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  showHome?: boolean;
  showHelp?: boolean;
}

/**
 * Common screen chrome: off-white background, persistent Home + Help buttons (UI/UX spec).
 * When the Home FAB is shown it's absolutely positioned at `top: 12` over the content (see
 * HomeFab.tsx), so the default `spacing.lg` top padding isn't enough to clear it — a
 * left-aligned screen title (Settings, Notifications, Procurement Status, ...) starts at the
 * same top-left corner as the FAB and renders half-hidden behind it. Bump the top padding to
 * clear the FAB's full height whenever it's actually shown; screens that pass `showHome={false}`
 * (Home itself) keep the tighter default.
 */
export function ScreenContainer({ children, scroll = true, showHome = true, showHelp = true }: Props) {
  const Content = scroll ? ScrollView : View;
  const topPadding = showHome ? touchTarget + spacing.lg : spacing.lg;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Content
          style={styles.flex}
          contentContainerStyle={[
            scroll ? styles.scrollContent : styles.content,
            { paddingTop: topPadding },
          ]}
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
