import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
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
 * Common screen chrome: off-white background, persistent Home and Help buttons.
 *
 * The two `scroll` branches are written out rather than picking a component into a variable.
 * A plain View has no `contentContainerStyle`, so the earlier
 * `Content = scroll ? ScrollView : View` version silently dropped all padding on every
 * scroll={false} screen — and TypeScript didn't catch it, because prop-checking against a
 * runtime union of component types doesn't reject a prop only one branch accepts.
 */
export function ScreenContainer({ children, scroll = true, showHome = true, showHelp = true }: Props) {
  // Both FABs float over the content, so reserve the strips they sit in here rather than
  // asking every screen to remember a spacer. Without the bottom one, the right edge of a
  // full-width Continue button sits under the Help FAB and a tap there dials instead.
  const topPadding = showHome ? touchTarget + spacing.lg : spacing.lg;
  const bottomPadding = showHelp ? touchTarget + spacing.lg + spacing.md : spacing.xl;

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: topPadding, paddingBottom: bottomPadding },
            ]}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        {showHome && <HomeFab />}
        {showHelp && <HelpFab />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={[styles.flex, styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {children}
      </KeyboardAvoidingView>
      {showHome && <HomeFab />}
      {showHelp && <HelpFab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, flexGrow: 1 },
  content: { flex: 1, padding: spacing.lg },
});
