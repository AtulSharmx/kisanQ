/**
 * Photographs for the ten bundled commodities, keyed by the same `key`/`cropType` string
 * everything else in the app is keyed by.
 *
 * Metro resolves `require()` of an asset at bundle time, so this has to be a literal, statically
 * written map — `require("../../assets/crops/" + key + ".jpg")` does not work and silently ships a
 * bundle with no images at all. That also means only *bundled* commodities can have a photo: an
 * admin-added commodity (see mergeCommodities in ./commodities.ts) has no file in the tree, so
 * cropImage() returns undefined for it and callers fall back to the commodity's emoji. A photo is
 * therefore a nicety on top of the icon, never a replacement for it.
 *
 * Every image is an openly-licensed Wikimedia Commons photo downscaled to 320px on its long edge
 * (~30KB each, ~300KB for all ten) to stay inside the 50-100MB app-size ceiling the UI/UX spec
 * sets. Attribution for each one lives in assets/crops/CREDITS.md and is shown to users on the
 * Settings screen, which the CC BY / CC BY-SA licences require.
 */
import type { ImageSourcePropType } from "react-native";

const CROP_IMAGES: Record<string, ImageSourcePropType> = {
  wheat: require("../../assets/crops/wheat.jpg"),
  paddy: require("../../assets/crops/paddy.jpg"),
  mustard: require("../../assets/crops/mustard.jpg"),
  chana: require("../../assets/crops/chana.jpg"),
  bajra: require("../../assets/crops/bajra.jpg"),
  jowar: require("../../assets/crops/jowar.jpg"),
  makka: require("../../assets/crops/makka.jpg"),
  kapas: require("../../assets/crops/kapas.jpg"),
  ganna: require("../../assets/crops/ganna.jpg"),
  moong: require("../../assets/crops/moong.jpg"),
};

/** The photo for a commodity key, or undefined if it has none (admin-added commodities). */
export function cropImage(key: string): ImageSourcePropType | undefined {
  return CROP_IMAGES[key];
}
