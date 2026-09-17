import React, { useRef, useState } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const PRESS_SCALE_HIT_SLOP = { top: 8, bottom: 8, left: 20, right: 20 };

type PressStyle = StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);

interface Props extends Omit<PressableProps, "style"> {
  style?: PressStyle;
  scaleTo?: number;
}

/**
 * Pressable with a scale-down and spring-back on tap, layered over whatever pressed style the
 * caller passes. Used by the shared tap targets so every tap in the app feels the same.
 *
 * One Animated-wrapped Pressable rather than a Pressable around an Animated.View: a wrapper
 * would break callers whose parent lays out this component's root as a flex item, like
 * IconTile's two-column grid. Pressable's style callback can't take an Animated.Value, so
 * `pressed` is tracked here instead of using Pressable's own.
 *
 * `hitSlop` is load-bearing, not cosmetic. Hit-testing runs against the transformed box, so
 * shrinking on press-in shrinks the tappable area with it and a finger near the edge falls
 * outside on release — the press cancels and onPress never fires. The symptom was a wide button
 * that only worked dead-centre. Needs to be at least half the widest caller's width x
 * (1 - scaleTo).
 */
export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  hitSlop = PRESS_SCALE_HIT_SLOP,
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
      hitSlop={hitSlop}
      style={[typeof style === "function" ? style({ pressed }) : style, { transform: [{ scale }] }]}
      {...rest}
    />
  );
}
