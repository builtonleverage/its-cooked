import type { Recipe } from './types';

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
  return [
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
}
