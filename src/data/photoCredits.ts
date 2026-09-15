/**
 * Attribution for the bundled crop photographs, shown on the Settings screen.
 *
 * Eight of the ten are CC BY or CC BY-SA, which require crediting the photographer wherever the
 * work is distributed — an APK counts, so a CREDITS.md sitting in the repository is not enough on
 * its own. Kept as plain data here rather than as i18n strings because names, file titles and
 * licence codes are not translated.
 *
 * The full table, with links back to each Commons file page, lives in assets/crops/CREDITS.md;
 * this is the short form that fits on a phone. Add a row here whenever a photo is added to
 * src/data/cropImages.ts.
 */
export interface PhotoCredit {
  /** Commodity key, so a reader can tell which picture a line is about. */
  cropKey: string;
  photographer: string;
  licence: string;
}

export const PHOTO_SOURCE = "Wikimedia Commons";

export const PHOTO_CREDITS: PhotoCredit[] = [
  { cropKey: "wheat", photographer: "Plant Industry, CSIRO", licence: "CC BY 3.0" },
  { cropKey: "paddy", photographer: "Sajib5467", licence: "CC0" },
  { cropKey: "mustard", photographer: "Kuldeepburjbhalaike", licence: "CC BY-SA 4.0" },
  { cropKey: "chana", photographer: "Thamizhpparithi Maari", licence: "CC BY-SA 4.0" },
  { cropKey: "bajra", photographer: "Saral Shots", licence: "CC BY-SA 4.0" },
  { cropKey: "jowar", photographer: "Daniel Georg Döhne", licence: "CC BY-SA 3.0" },
  { cropKey: "makka", photographer: "Willis Lam", licence: "CC BY-SA 2.0" },
  { cropKey: "kapas", photographer: "Nanditha Gogate, WELL Labs", licence: "CC BY-SA 4.0" },
  { cropKey: "ganna", photographer: "ruurmo", licence: "CC BY-SA 2.0" },
  { cropKey: "moong", photographer: "Ivar Leidus", licence: "CC BY-SA 4.0" },
];
