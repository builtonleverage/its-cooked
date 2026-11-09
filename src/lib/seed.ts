import type { Recipe, RecipeTranslation } from './types';
import { contentHash } from './translate';

const base = import.meta.env.BASE_URL;
const bundled = (file: string, title: string) => ({
  url: `${base}seed/${file}`,
  sourceUrl: 'https://github.com/builtonleverage/its-cooked',
  title,
  author: "It's Cooked contributors",
  license: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  provider: 'bundled' as const,
});

export const SEED_ID = 'seed-onion-tandoori-paratha';

export function seedRecipes(): Recipe[] {
  const now = Date.now();
  const recipes: Recipe[] = [
    {
      id: SEED_ID,
      title: 'Onion Tandoori Paratha (Electric Tandoor)',
      summary:
        'Flaky whole-wheat flatbread stuffed with spiced onion, baked in an electric tandoor until blistered and golden.',
      servings: 3,
      prepMinutes: 35,
      cookMinutes: 25,
      tags: ['Indian', 'Bread', 'Vegetarian', 'Whole wheat', 'Diabetic-friendly', 'Low-salt option'],
      image: bundled('onion-paratha.svg', 'Onion tandoori paratha (illustration)'),
      ingredients: [
        { id: 'i1', quantity: '2', unit: 'cups', name: 'whole-wheat flour (atta)', note: 'about 250 g, plus extra for dusting' },
        { id: 'i2', quantity: '½', unit: 'tsp', name: 'salt', note: 'use ¼ tsp for low-salt' },
        { id: 'i3', quantity: '1', unit: 'tbsp', name: 'oil or ghee', note: 'for the dough' },
        { id: 'i4', quantity: '¾', unit: 'cup', name: 'warm water', note: 'about 180 ml, add gradually' },
        { id: 'i5', quantity: '2', unit: 'medium', name: 'onions', note: 'very finely chopped' },
        { id: 'i6', quantity: '1–2', unit: '', name: 'green chillies', note: 'finely chopped' },
        { id: 'i7', quantity: '2', unit: 'tbsp', name: 'fresh coriander', note: 'chopped' },
        { id: 'i8', quantity: '½', unit: 'tsp', name: 'ajwain (carom seeds)', note: 'crushed between palms' },
        { id: 'i9', quantity: '½', unit: 'tsp', name: 'Kashmiri red chilli powder' },
        { id: 'i10', quantity: '½', unit: 'tsp', name: 'amchur (dry mango powder)', note: 'or chaat masala' },
        { id: 'i11', quantity: '1', unit: 'pinch', name: 'salt for the filling', note: 'add just before stuffing' },
        { id: 'i12', quantity: '1–2', unit: 'tbsp', name: 'ghee or oil', note: 'for brushing' },
      ],
      steps: [
        {
          id: 's1',
          text: 'Make the dough: mix the flour, salt and 1 tbsp oil. Add warm water a little at a time and knead for 5 minutes into a soft, smooth dough.',
          timers: [],
        },
        {
          id: 's2',
          text: 'Cover the dough with a damp cloth and let it rest for 20 minutes. Resting relaxes the gluten so it rolls thin without tearing.',
          timers: [{ id: 't1', label: 'Dough rest', seconds: 20 * 60, checks: [] }],
        },
        {
          id: 's3',
          text: 'While the dough rests, switch on the electric tandoor and preheat it for 10–15 minutes with the lid closed, until the ready light comes on.',
          timers: [
            {
              id: 't2',
              label: 'Tandoor preheat',
              seconds: 15 * 60,
              checks: [{ atSeconds: 10 * 60, label: 'Check if the ready light is on' }],
            },
          ],
        },
        {
          id: 's4',
          text: 'Make the filling: squeeze excess water out of the chopped onion, then mix with green chilli, coriander, ajwain, chilli powder and amchur. Add the pinch of salt only right before stuffing — salt draws out water and makes the filling soggy.',
          timers: [],
        },
        {
          id: 's5',
          text: 'Divide the dough into 6 balls. Roll one into a 4-inch disc, put 2 tbsp filling in the centre, gather the edges up and pinch to seal. Flatten, dust with flour and gently roll to 6–7 inches.',
          timers: [],
          image: bundled('stuffing-diagram.svg', 'How to stuff and seal a paratha (diagram)'),
        },
        {
          id: 's6',
          text: 'Lightly wet the underside of each paratha with water and place it on the tandoor plate (or stick it to the wall if your model has one). Brush the top with a little ghee. Fit 2–3 per batch without overlapping.',
          timers: [],
        },
        {
          id: 's7',
          text: 'Close the lid and bake for 6–8 minutes per batch. Check at 4 minutes and rotate if one side is browning faster. It is done when puffed with deep brown blisters.',
          timers: [
            {
              id: 't3',
              label: 'Bake batch',
              seconds: 8 * 60,
              checks: [
                { atSeconds: 4 * 60, label: 'Mid-point check — rotate if uneven' },
                { atSeconds: 6 * 60, label: 'Check for doneness' },
              ],
            },
          ],
        },
        {
          id: 's8',
          text: 'Lift out, brush with ghee and keep warm wrapped in a cloth. Repeat with the next batch (restart the bake timer). Serve hot with yogurt, raita or pickle.',
          timers: [],
        },
      ],
      notes:
        'Diabetic-friendly: whole-wheat atta (or half atta, half besan/multigrain) has a gentler glycaemic impact than maida. Keep ghee to a light brush and pair with protein — dal, paneer or plain yogurt.\n\nLow-salt: halve the salt in the dough and lean on ajwain, amchur, chilli and coriander for flavour.\n\nElectric tandoors vary — the first batch tells you how hot yours runs. Keep the lid closed as much as possible to hold heat.',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const r of recipes) {
    const hi = SEED_HI[r.id];
    if (hi) r.translations = { hi: { ...hi, sourceHash: contentHash(r), source: 'manual', translatedAt: now } };
  }
  return recipes;
}

type SeedTranslation = Omit<RecipeTranslation, 'sourceHash' | 'source' | 'translatedAt'>;

/** Hand-written Hindi for the seed recipe. */
const SEED_HI: Record<string, SeedTranslation> = {
  [SEED_ID]: {
    title: 'प्याज़ तंदूरी पराठा (इलेक्ट्रिक तंदूर)',
    summary: 'मसालेदार प्याज़ से भरा परतदार गेहूँ का पराठा — इलेक्ट्रिक तंदूर में छालेदार और सुनहरा सेंका हुआ।',
    tags: ['भारतीय', 'रोटी-पराठा', 'शाकाहारी', 'गेहूँ का आटा', 'डायबिटीज़ के अनुकूल', 'कम नमक विकल्प'],
    ingredients: {
      i1: { name: 'गेहूँ का आटा', unit: 'कप', note: 'लगभग 250 ग्राम, बेलने के लिए थोड़ा और' },
      i2: { name: 'नमक', unit: 'छोटा चम्मच', note: 'कम नमक के लिए ¼ छोटा चम्मच' },
      i3: { name: 'तेल या घी', unit: 'बड़ा चम्मच', note: 'आटे के लिए' },
      i4: { name: 'गुनगुना पानी', unit: 'कप', note: 'लगभग 180 मि.ली., थोड़ा-थोड़ा डालें' },
      i5: { name: 'प्याज़', unit: 'मध्यम', note: 'बहुत बारीक कटे हुए' },
      i6: { name: 'हरी मिर्च', unit: '', note: 'बारीक कटी हुई' },
      i7: { name: 'हरा धनिया', unit: 'बड़े चम्मच', note: 'कटा हुआ' },
      i8: { name: 'अजवाइन', unit: 'छोटा चम्मच', note: 'हथेलियों में मसलकर' },
      i9: { name: 'कश्मीरी लाल मिर्च पाउडर', unit: 'छोटा चम्मच' },
      i10: { name: 'अमचूर पाउडर', unit: 'छोटा चम्मच', note: 'या चाट मसाला' },
      i11: { name: 'भरावन के लिए नमक', unit: 'चुटकी', note: 'भरने से ठीक पहले डालें' },
      i12: { name: 'घी या तेल', unit: 'बड़े चम्मच', note: 'ऊपर लगाने के लिए' },
    },
    steps: {
      s1: { text: 'आटा गूँधें: आटा, नमक और 1 बड़ा चम्मच तेल मिलाएँ। थोड़ा-थोड़ा गुनगुना पानी डालते हुए 5 मिनट गूँधकर नरम, चिकना आटा तैयार करें।', timers: {} },
      s2: {
        text: 'आटे को गीले कपड़े से ढककर 20 मिनट रख दें। इससे आटा ढीला पड़ता है और बिना फटे पतला बेला जा सकता है।',
        timers: { t1: { label: 'आटा आराम', checks: [] } },
      },
      s3: {
        text: 'जब तक आटा रखा है, इलेक्ट्रिक तंदूर चालू करें और ढक्कन बंद करके 10–15 मिनट गरम करें, जब तक रेडी लाइट न जल जाए।',
        timers: { t2: { label: 'तंदूर गरम करना', checks: ['देखें, रेडी लाइट जली या नहीं'] } },
      },
      s4: {
        text: 'भरावन बनाएँ: कटे प्याज़ का पानी निचोड़ दें, फिर उसमें हरी मिर्च, धनिया, अजवाइन, लाल मिर्च और अमचूर मिलाएँ। चुटकी भर नमक भरने से ठीक पहले ही डालें — नमक से प्याज़ पानी छोड़ता है और भरावन गीला हो जाता है।',
        timers: {},
      },
      s5: {
        text: 'आटे की 6 लोइयाँ बनाएँ। एक लोई को 4 इंच का बेलें, बीच में 2 बड़े चम्मच भरावन रखें, किनारे ऊपर इकट्ठा करके अच्छी तरह बंद करें। हल्का दबाएँ, सूखा आटा लगाएँ और धीरे-धीरे 6–7 इंच तक बेलें।',
        timers: {},
      },
      s6: {
        text: 'हर पराठे के नीचे की तरफ़ हल्का पानी लगाएँ और तंदूर की प्लेट पर रखें (या अगर आपके तंदूर में दीवार है तो उस पर चिपकाएँ)। ऊपर थोड़ा घी लगाएँ। एक बार में 2–3 पराठे रखें, एक-दूसरे पर न चढ़ें।',
        timers: {},
      },
      s7: {
        text: 'ढक्कन बंद करें और हर बैच को 6–8 मिनट सेंकें। 4 मिनट पर देखें — अगर एक तरफ़ जल्दी भूरा हो रहा हो तो घुमा दें। पराठा फूल जाए और गहरे भूरे छाले दिखें, तो तैयार है।',
        timers: { t3: { label: 'बैच सेंकना', checks: ['आधे समय पर जाँच — असमान हो तो घुमाएँ', 'देखें, पका या नहीं'] } },
      },
      s8: {
        text: 'निकालकर घी लगाएँ और कपड़े में लपेटकर गरम रखें। अगला बैच लगाएँ (सेंकने का टाइमर फिर से शुरू करें)। दही, रायते या अचार के साथ गरम-गरम परोसें।',
        timers: {},
      },
    },
    notes:
      'डायबिटीज़ के अनुकूल: मैदे की जगह गेहूँ का आटा (या आधा आटा, आधा बेसन/मल्टीग्रेन) ब्लड शुगर पर हल्का असर डालता है। घी बस हल्का-सा लगाएँ और साथ में प्रोटीन लें — दाल, पनीर या सादा दही।\n\nकम नमक: आटे में नमक आधा कर दें और स्वाद के लिए अजवाइन, अमचूर, मिर्च और धनिया का सहारा लें।\n\nहर इलेक्ट्रिक तंदूर अलग होता है — पहले बैच से पता चल जाएगा कि आपका तंदूर कितना गरम होता है। गरमी बनाए रखने के लिए ढक्कन जितना हो सके बंद रखें।',
  },
};
