import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import { cropImage } from "../data/cropImages";

interface Props {
  /** Commodity key — the same string used as Crop.cropType. */
  cropKey: string;
  /** The commodity's emoji, shown when this key has no bundled photo. */
  icon: string;
  size?: number;
}

/**
 * A crop photo in a round thumbnail, falling back to the emoji. Both branches are the same
 * square, so a grid doesn't reflow when one commodity has a photo and the next doesn't — which
 * happens as soon as an admin adds a commodity, since only the bundled ten ship images.
 * cover rather than pre-cropped squares: the sources are a mix of portrait and landscape.
 */
export function CropThumb({ cropKey, icon, size = 44 }: Props) {
  const source = cropImage(cropKey);
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (!source) {
    return (
      <View style={[styles.fallback, box]}>
        <Text style={{ fontSize: size * 0.6 }}>{icon}</Text>
      </View>
    );
  }
  return <Image source={source} style={[styles.photo, box]} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  photo: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
});
