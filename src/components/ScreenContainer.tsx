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
 * Common screen chrome: off-white background, persistent Home + Help buttons (UI/UX spec).
 * When the Home FAB is shown it's absolutely positioned at `top: 12` over the content (see
 * HomeFab.tsx), so the default `spacing.lg` top padding isn't enough to clear it — a
 * left-aligned screen title (Settings, Notifications, Procurement Status, ...) starts at the
 * same top-left corner as the FAB and renders half-hidden behind it. Bump the top padding to
 * clear the FAB's full height whenever it's actually shown; screens that pass `showHome={false}`
 * (Home itself) keep the tighter default.
 *
 * `scroll` renders a genuinely different component (ScrollView vs plain View), not just a style
 * switch — a plain `View` has no `contentContainerStyle` prop, so an earlier version of this
 * component that picked `Content = scroll ? ScrollView : View` and always passed
 * `contentContainerStyle` silently dropped ALL padding (not just the top-clearance fix above) on
 * every `scroll={false}` screen — Select a Centre, Choose a Time Slot, Choose your Village,
 * Preferred Centre. TypeScript didn't catch it because JSX prop-checking against a component
 * type that's a runtime union (`typeof ScrollView | typeof View`) doesn't reliably reject a prop
 * only one branch accepts. Branching the JSX itself, not just the style, avoids the whole class
 * of bug — each branch only ever receives props its real component type supports.
 */
export function ScreenContainer({ children, scroll = true, showHome = true, showHelp = true }: Props) {
  const topPadding = showHome ? touchTarget + spacing.lg : spacing.lg;
  // The Help FAB floats over the bottom-right corner (bottom: 20, height: touchTarget), so a
  // screen whose last element is a full-width action button — Continue, Book Slot, Save — had its
  // right edge sitting underneath it: a tap there hit the dialer instead of the button, and the
  // FAB itself read as "part of the button" rather than a separate control. Reserve the strip it
  // occupies whenever it's shown, rather than asking every screen to remember its own spacer.
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
