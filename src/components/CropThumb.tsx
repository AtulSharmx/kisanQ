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
 * A crop's photo in a round thumbnail, falling back to its emoji.
 *
 * Both branches occupy exactly the same square so a grid of crop cards doesn't reflow when one
 * commodity has a photo and the next doesn't — which is the normal case the moment an admin adds
 * a commodity from Admin Settings, since only the ten bundled crops ship with an image
 * (see src/data/cropImages.ts).
 *
 * `resizeMode="cover"` rather than pre-cropped square files: the source photos are a mix of
 * portrait and landscape, and letting the platform centre-crop at display time keeps the assets
 * one file each instead of one per size, at no visual cost in a circle this small.
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
