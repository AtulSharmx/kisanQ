/**
 * Photos for the ten bundled commodities, keyed by the same cropType string as everything else.
 *
 * The map has to be written out literally: Metro resolves require() at bundle time, so
 * require("../../assets/crops/" + key + ".jpg") ships a bundle with no images and no error.
 * Only bundled commodities can have a photo — an admin-added one has no file, cropImage()
 * returns undefined and the caller falls back to its emoji.
 *
 * All ten are openly-licensed Wikimedia Commons photos, downscaled to 320px on the long edge
 * (~300KB total). The CC BY / CC BY-SA terms require attribution, which is in
 * assets/crops/CREDITS.md and shown on the Settings screen.
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
