import React, { useRef, useState } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type PressStyle = StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);

interface Props extends Omit<PressableProps, "style"> {
  style?: PressStyle;
  scaleTo?: number;
}

/**
 * Pressable with a quick scale-down/spring-back layered on top of whatever pressed-state style
 * is passed in (e.g. the app-wide `pressed && styles.pressed` opacity dip) — gives every tap a
 * tactile "push" instead of an instant opacity flip. Used by the shared tap targets
 * (PrimaryButton, IconTile, HomeFab, HelpFab) that most of the app's navigation goes through;
 * wrap this instead of a bare Pressable anywhere else a tap should feel the same way.
 *
 * Deliberately a single Animated-wrapped Pressable rather than Pressable-plus-inner-Animated.View
 * — a wrapper View would break any caller (IconTile's `flexBasis: "47%"` 2-column grid, for
 * one) that relies on its own root element being the actual flex item their parent lays out.
 * Pressable's own per-state `style` callback can't take an Animated.Value directly, so the
 * `pressed` state used to resolve it is tracked here via onPressIn/onPressOut instead of
 * Pressable's internal one, then merged with the animated transform into a single style array.
 */
export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const animateTo = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };

  return (
    <AnimatedPressableBase
      onPressIn={(e) => {
        setPressed(true);
        animateTo(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        animateTo(1);
        onPressOut?.(e);
      }}
      style={[typeof style === "function" ? style({ pressed }) : style, { transform: [{ scale }] }]}
      {...rest}
    />
  );
}
