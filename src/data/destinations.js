/**
 * Curated destination dataset.
 *
 * Costs are rough per-person estimates in USD so trips can be compared across
 * countries. `climate` holds monthly averages (Jan..Dec) used when a live
 * forecast is not available (trip too far ahead, or the network is down).
 *
 * Attraction fields:
 *   category  - one of INTERESTS
 *   setting   - 'indoor' | 'outdoor' | 'mixed'
 *   costUSD   - typical entry/activity cost per person
 *   hours     - typical time to allow
 *   area      - neighbourhood, used to keep each day geographically compact
 *   bestTime  - slots where the experience works best
 *   kidFriendly, accessible (step-free / wheelchair-friendly)
 */

export const INTERESTS = Object.freeze([
  'art',
  'history',
  'culture',
  'food',
  'nature',
  'adventure',
  'shopping',
  'nightlife',
  'relaxation',
]);

const a = (id, name, category, setting, costUSD, hours, area, bestTime, kidFriendly, accessible, blurb) =>
  Object.freeze({ id, name, category, setting, costUSD, hours, area, bestTime, kidFriendly, accessible, blurb });

export const DESTINATIONS = Object.freeze([
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lon: 2.3522,
    dailyCostUSD: { budget: 80, moderate: 180, luxury: 450 },
    climate: {
      highC: [7, 8, 12, 16, 20, 23, 25, 25, 21, 16, 11, 8],
      rainyDays: [10, 9, 10, 9, 10, 8, 7, 7, 8, 10, 10, 11],
    },
    tips: [
      'Many museums are free on the first Sunday of the month, so book a time slot early.',
      'Buy a Navigo Easy card for the metro instead of single paper tickets.',
      'Start shop and café conversations with "Bonjour". It is expected.',
    ],
    packing: ['Plug adapter (type C/E)'],
    attractions: [
      a('louvre', 'Louvre Museum', 'art', 'indoor', 22, 3, 'Louvre', ['morning', 'afternoon'], true, true, 'World-class collection from the Mona Lisa to Egyptian antiquities.'),
      a('orsay', "Musée d'Orsay", 'art', 'indoor', 18, 2.5, 'Saint-Germain', ['morning', 'afternoon'], true, true, 'Impressionist masterpieces inside a grand former railway station.'),
      a('eiffel', 'Eiffel Tower', 'culture', 'mixed', 35, 2, 'Champ de Mars', ['afternoon', 'evening'], true, true, 'Lifts to the top for the classic city panorama, sparkling after dark.'),
      a('montmartre', 'Montmartre & Sacré-Cœur', 'culture', 'outdoor', 0, 2.5, 'Montmartre', ['morning', 'afternoon'], true, false, 'Hilltop village streets, artists and city views (steep stairs).'),
      a('seine', 'Seine River Cruise', 'relaxation', 'mixed', 18, 1, 'Champ de Mars', ['evening'], true, true, 'One-hour covered boat ride past illuminated landmarks.'),
      a('marais', 'Le Marais Food Walk', 'food', 'outdoor', 40, 2, 'Le Marais', ['afternoon'], true, true, 'Falafel, pastries and cheese shops in a historic quarter.'),
      a('luxembourg', 'Luxembourg Gardens', 'nature', 'outdoor', 0, 1.5, 'Saint-Germain', ['morning', 'afternoon'], true, true, 'Formal gardens, fountains and puppet shows for kids.'),
      a('versailles', 'Palace of Versailles (day trip)', 'history', 'mixed', 32, 6, 'Versailles', ['morning'], true, true, 'Hall of Mirrors and vast royal gardens, 40 min by RER C.'),
      a('catacombs', 'Catacombs of Paris', 'history', 'indoor', 32, 1.5, 'Montparnasse', ['morning', 'afternoon'], false, false, 'Underground ossuary tunnels: 243 steps, not for young kids.'),
      a('cabaret', 'Cabaret Show in Pigalle', 'nightlife', 'indoor', 120, 2, 'Montmartre', ['evening'], false, true, 'Classic Parisian revue with dinner options.'),
      a('lafayette', 'Galeries Lafayette & Rooftop', 'shopping', 'indoor', 0, 1.5, 'Opéra', ['afternoon'], true, true, 'Art-nouveau department store with a free rooftop view.'),
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    dailyCostUSD: { budget: 70, moderate: 160, luxury: 420 },
    climate: {
      highC: [10, 10, 14, 19, 23, 26, 30, 31, 27, 22, 17, 12],
      rainyDays: [5, 6, 10, 10, 11, 12, 12, 9, 12, 10, 7, 5],
    },
    tips: [
      'Load a Suica/PASMO card on your phone for trains, buses and convenience stores.',
      'Tipping is not customary and can cause confusion.',
      'Carry some cash: smaller restaurants and shrines may not take cards.',
    ],
    packing: ['Plug adapter (type A)', 'Small towel or handkerchief (public restrooms rarely have dryers)'],
    attractions: [
      a('sensoji', 'Senso-ji Temple', 'history', 'outdoor', 0, 1.5, 'Asakusa', ['morning'], true, true, "Tokyo's oldest temple with the Nakamise snack street."),
      a('teamlab', 'teamLab Planets', 'art', 'indoor', 25, 2, 'Toyosu', ['afternoon', 'evening'], true, true, 'Immersive digital art you walk (and wade) through.'),
      a('tsukiji', 'Tsukiji Outer Market', 'food', 'outdoor', 25, 2, 'Ginza', ['morning'], true, true, 'Sushi breakfast and street snacks among market stalls.'),
      a('shibuya', 'Shibuya Crossing & Sky Deck', 'culture', 'mixed', 18, 2, 'Shibuya', ['evening'], true, true, "The world's busiest crossing, then a rooftop view at dusk."),
      a('meiji', 'Meiji Shrine & Yoyogi Park', 'nature', 'outdoor', 0, 1.5, 'Harajuku', ['morning'], true, true, 'Forested shrine grounds a short walk from Harajuku.'),
      a('akihabara', 'Akihabara Electric Town', 'shopping', 'indoor', 0, 2, 'Akihabara', ['afternoon'], true, true, 'Electronics, retro games and anime culture.'),
      a('gyoen', 'Shinjuku Gyoen Garden', 'nature', 'outdoor', 4, 1.5, 'Shinjuku', ['morning', 'afternoon'], true, true, 'Japanese, French and English gardens in one park.'),
      a('goldengai', 'Golden Gai Bar Alleys', 'nightlife', 'indoor', 30, 2, 'Shinjuku', ['evening'], false, false, 'Tiny bars packed into narrow lanes (adults only).'),
      a('tnm', 'Tokyo National Museum', 'history', 'indoor', 7, 2.5, 'Ueno', ['morning', 'afternoon'], true, true, 'Samurai armour, ceramics and national treasures.'),
      a('hakone', 'Hakone Day Trip', 'nature', 'outdoor', 45, 7, 'Hakone', ['morning'], true, false, 'Hot springs, lake cruise and Mt Fuji views.'),
      a('ramen', 'Ramen Tasting in Shinjuku', 'food', 'indoor', 12, 1, 'Shinjuku', ['evening'], true, true, 'Slurp your way through two contrasting ramen styles.'),
    ],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    lat: 26.9124,
    lon: 75.7873,
    dailyCostUSD: { budget: 30, moderate: 70, luxury: 250 },
    climate: {
      highC: [22, 26, 32, 37, 41, 39, 34, 32, 33, 33, 29, 24],
      rainyDays: [1, 1, 1, 1, 2, 4, 10, 10, 4, 1, 0, 1],
    },
    tips: [
      'A composite ticket covers Amber Fort, Hawa Mahal, Jantar Mantar and more.',
      'Agree the fare before an auto-rickshaw ride, or use a ride-hailing app.',
      'Dress modestly (shoulders and knees covered) for temples and palaces.',
    ],
    packing: ['Scarf or shawl for temple visits', 'Oral rehydration salts'],
    attractions: [
      a('amber', 'Amber Fort', 'history', 'outdoor', 6, 3, 'Amer', ['morning'], true, false, 'Hilltop fort of mirrored halls and ramparts (lots of steps).'),
      a('citypalace', 'City Palace', 'history', 'mixed', 8, 2, 'Old City', ['morning', 'afternoon'], true, true, 'Royal residence with museums and ornate courtyards.'),
      a('hawamahal', 'Hawa Mahal', 'culture', 'outdoor', 2, 1, 'Old City', ['morning'], true, false, 'The pink "Palace of Winds" with 953 windows.'),
      a('jantar', 'Jantar Mantar', 'history', 'outdoor', 2, 1, 'Old City', ['morning', 'afternoon'], true, true, 'UNESCO-listed 18th-century astronomical instruments.'),
      a('alberthall', 'Albert Hall Museum', 'art', 'indoor', 3, 1.5, 'Ram Niwas Garden', ['afternoon'], true, true, 'Indo-Saracenic museum with an Egyptian mummy.'),
      a('bazaars', 'Johari & Bapu Bazaars', 'shopping', 'outdoor', 0, 2, 'Old City', ['afternoon', 'evening'], true, false, 'Gems, textiles and block-printed fabrics.'),
      a('chokhidhani', 'Chokhi Dhani Village Dinner', 'food', 'outdoor', 15, 3, 'Tonk Road', ['evening'], true, true, 'Folk dance, puppetry and a Rajasthani thali.'),
      a('nahargarh', 'Nahargarh Fort Sunset', 'adventure', 'outdoor', 2, 2, 'Nahargarh Hills', ['evening'], true, false, 'Drive up to sweeping sunset views over the pink city.'),
      a('patrika', 'Patrika Gate & Jawahar Circle', 'culture', 'outdoor', 0, 1, 'Malviya Nagar', ['evening'], true, true, 'Vividly painted gateway, great for photos.'),
      a('cooking', 'Rajasthani Cooking Class', 'food', 'indoor', 25, 3, 'Old City', ['morning', 'afternoon'], true, true, 'Cook dal baati and gatte with a local family.'),
    ],
  },
  {
    id: 'newyork',
    name: 'New York City',
    country: 'USA',
    lat: 40.7128,
    lon: -74.006,
    dailyCostUSD: { budget: 120, moderate: 250, luxury: 600 },
    climate: {
      highC: [4, 6, 10, 17, 22, 27, 29, 29, 25, 18, 12, 6],
      rainyDays: [11, 10, 11, 11, 11, 10, 10, 9, 9, 9, 9, 11],
    },
    tips: [
      'Tap a contactless card or phone at subway gates. Fares cap after 12 rides a week.',
      'Tip 18–20% at restaurants. It is a large part of staff wages.',
      'Same-day discounted Broadway tickets are sold at the TKTS booth.',
    ],
    packing: ['Plug adapter (type A/B)'],
    attractions: [
      a('met', 'The Metropolitan Museum of Art', 'art', 'indoor', 30, 3, 'Upper East Side', ['morning', 'afternoon'], true, true, '5,000 years of art under one roof.'),
      a('centralpark', 'Central Park', 'nature', 'outdoor', 0, 2, 'Central Park', ['morning', 'afternoon'], true, true, 'Bethesda Fountain, Bow Bridge and rowboats.'),
      a('liberty', 'Statue of Liberty & Ellis Island', 'history', 'mixed', 25, 4, 'Lower Manhattan', ['morning'], true, true, 'Ferry to Lady Liberty and the immigration museum.'),
      a('moma', 'Museum of Modern Art', 'art', 'indoor', 30, 2.5, 'Midtown', ['afternoon'], true, true, 'Van Gogh, Warhol and Picasso.'),
      a('highline', 'High Line & Chelsea Market', 'food', 'outdoor', 15, 2, 'Chelsea', ['afternoon'], true, true, 'Elevated park walk ending in a food hall.'),
      a('broadway', 'Broadway Show', 'culture', 'indoor', 120, 3, 'Midtown', ['evening'], true, true, 'World-famous musical theatre.'),
      a('brooklynbridge', 'Brooklyn Bridge & DUMBO', 'culture', 'outdoor', 0, 2, 'DUMBO', ['afternoon', 'evening'], true, true, 'Walk the bridge for skyline views, then pizza in DUMBO.'),
      a('amnh', 'American Museum of Natural History', 'history', 'indoor', 28, 3, 'Upper West Side', ['morning', 'afternoon'], true, true, 'Dinosaurs, the blue whale and the planetarium.'),
      a('toprock', 'Top of the Rock', 'culture', 'mixed', 40, 1.5, 'Midtown', ['evening'], true, true, 'Observation deck facing the Empire State Building.'),
      a('jazz', 'Greenwich Village Jazz Club', 'nightlife', 'indoor', 35, 2, 'Greenwich Village', ['evening'], false, false, 'Live jazz in an intimate basement club.'),
      a('soho', 'SoHo Shopping', 'shopping', 'outdoor', 0, 2, 'SoHo', ['afternoon'], true, true, 'Cast-iron streets of boutiques and flagships.'),
    ],
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    lat: 15.4909,
    lon: 73.8278,
    dailyCostUSD: { budget: 35, moderate: 80, luxury: 280 },
    climate: {
      highC: [32, 32, 33, 33, 33, 30, 29, 29, 30, 32, 33, 33],
      rainyDays: [0, 0, 0, 0, 3, 22, 27, 25, 15, 5, 2, 0],
    },
    tips: [
      'Rent a scooter only with an international licence and a helmet. Police check both.',
      'Swim only at beaches with lifeguard flags, and never during the monsoon.',
      'The Anjuna flea market runs on Wednesdays from November to April.',
    ],
    packing: ['Swimwear and quick-dry towel', 'Insect repellent'],
    attractions: [
      a('baga', 'Baga & Calangute Beaches', 'relaxation', 'outdoor', 0, 3, 'North Goa', ['morning', 'afternoon'], true, false, 'Lively golden beaches lined with shacks.'),
      a('oldgoa', 'Old Goa Churches', 'history', 'mixed', 0, 2, 'Old Goa', ['morning'], true, true, 'Basilica of Bom Jesus and Sé Cathedral (UNESCO).'),
      a('fontainhas', 'Fontainhas Latin Quarter', 'culture', 'outdoor', 0, 1.5, 'Panaji', ['morning', 'afternoon'], true, false, 'Colourful Portuguese-era lanes and cafés.'),
      a('dudhsagar', 'Dudhsagar Falls Jeep Safari', 'adventure', 'outdoor', 40, 6, 'Mollem', ['morning'], false, false, 'Off-road ride to a four-tiered waterfall.'),
      a('spice', 'Spice Plantation Tour & Lunch', 'food', 'outdoor', 15, 3, 'Ponda', ['morning'], true, true, 'Guided walk through spice gardens with a Goan buffet.'),
      a('anjuna', 'Anjuna Flea Market', 'shopping', 'outdoor', 0, 2, 'North Goa', ['afternoon'], true, false, 'Wednesday market of crafts, clothes and music.'),
      a('watersports', 'Calangute Water Sports', 'adventure', 'outdoor', 30, 2, 'North Goa', ['morning', 'afternoon'], false, false, 'Parasailing, jet-ski and banana boat rides.'),
      a('palolem', 'Palolem Beach & Kayaking', 'nature', 'outdoor', 10, 3, 'South Goa', ['afternoon', 'evening'], true, false, 'Calm crescent bay, perfect at sunset.'),
      a('mandovi', 'Mandovi River Sunset Cruise', 'relaxation', 'mixed', 8, 1.5, 'Panaji', ['evening'], true, true, 'Music and folk dance on a covered riverboat.'),
      a('titos', "Tito's Lane Nightlife", 'nightlife', 'mixed', 25, 3, 'North Goa', ['evening'], false, false, 'Beach clubs and live DJs.'),
      a('mog', 'Museum of Goa', 'art', 'indoor', 6, 2, 'North Goa', ['afternoon'], true, true, 'Contemporary art in an airy gallery space.'),
      a('seafood', 'Goan Seafood Tasting', 'food', 'indoor', 15, 1.5, 'Panaji', ['evening'], true, true, 'Fish curry rice, recheado and bebinca dessert.'),
    ],
  },
]);

const BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]));

/** @returns {object|undefined} */
export function getDestination(id) {
  return BY_ID.get(id);
}
