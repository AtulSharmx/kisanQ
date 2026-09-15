# Crop photo credits

Every photograph in this folder is an openly-licensed image from
[Wikimedia Commons](https://commons.wikimedia.org), downscaled to 320px on its long edge for use
as a thumbnail in the farmer app's crop picker. No other change was made.

The CC BY and CC BY-SA licences below require attribution wherever the photos are distributed, so
the same list is shown inside the app on the Settings screen — a file in the repository would not
reach anyone holding the APK.

| File | Crop | Source | Photographer | Licence |
| --- | --- | --- | --- | --- |
| `wheat.jpg` | Wheat / गेहूं | [CSIRO ScienceImage 386 Close up of Wheat](https://commons.wikimedia.org/wiki/File:CSIRO_ScienceImage_386_Close_up_of_Wheat.jpg) | Plant Industry, CSIRO | CC BY 3.0 |
| `paddy.jpg` | Paddy / धान | [Rice panicle in Bangladesh](https://commons.wikimedia.org/wiki/File:Rice_panicle_in_Bangladesh.jpg) | Sajib5467 | CC0 |
| `mustard.jpg` | Mustard / सरसों | [Mustard Plant Flower with dew drops, Burj Bhalaike 01](https://commons.wikimedia.org/wiki/File:Mustard_Plant_Flower_with_dew_drops,_Burj_Bhalaike_01.jpg) | Kuldeepburjbhalaike | CC BY-SA 4.0 |
| `chana.jpg` | Chickpea / चना | [Chickpea in White colour](https://commons.wikimedia.org/wiki/File:Chickpea_in_White_colour.jpg) | Thamizhpparithi Maari | CC BY-SA 4.0 |
| `bajra.jpg` | Pearl millet / बाजरा | [கம்பு கதிர்](https://commons.wikimedia.org/wiki/File:%E0%AE%95%E0%AE%AE%E0%AF%8D%E0%AE%AA%E0%AF%81_%E0%AE%95%E0%AE%A4%E0%AE%BF%E0%AE%B0%E0%AF%8D.jpg) | Saral Shots | CC BY-SA 4.0 |
| `jowar.jpg` | Sorghum / ज्वार | [Sorghum bicolor (Moench)](https://commons.wikimedia.org/wiki/File:Sorghum_bicolor_(Moench).JPG) | Daniel Georg Döhne (Bugdream) | CC BY-SA 3.0 |
| `makka.jpg` | Maize / मक्का | [Yellow Corn on the Cob](https://commons.wikimedia.org/wiki/File:Yellow_Corn_on_the_Cob_(35115370841).jpg) | Willis Lam | CC BY-SA 2.0 |
| `kapas.jpg` | Cotton / कपास | [Mature cotton boll in Raichur, Karnataka](https://commons.wikimedia.org/wiki/File:Mature_cotton_boll_in_Raichur,_Karnataka.jpg) | Nanditha Gogate, WELL Labs | CC BY-SA 4.0 |
| `ganna.jpg` | Sugarcane / गन्ना | [Cut sugarcane](https://commons.wikimedia.org/wiki/File:Cut_sugarcane.jpg) | ruurmo | CC BY-SA 2.0 |
| `moong.jpg` | Green gram / मूंग | [Mung beans (Vigna radiata)](https://commons.wikimedia.org/wiki/File:Mung_beans_(Vigna_radiata).jpg) | Ivar Leidus | CC BY-SA 4.0 |

Only these ten bundled commodities have a photo. A commodity an admin adds at runtime has no file
here, and the crop picker falls back to its emoji — see `src/data/cropImages.ts`.
