/**
 * Packing list driven by the forecast, the planned activities and who is
 * travelling. Each item says why it is there.
 */
export function buildPackingList(destination, prefs, weather, itinerary) {
  const list = new Map();
  const add = (item, reason) => {
    if (!list.has(item)) list.set(item, reason);
  };

  add('Passport / ID and travel insurance details', 'Essential for every trip');
  add('Phone charger and power bank', 'Maps and tickets live on your phone');

  const conditions = new Set(weather.map((d) => d.condition));
  const maxHigh = Math.max(...weather.map((d) => d.highC));
  const minLow = Math.min(...weather.map((d) => d.lowC));

  if (conditions.has('rainy')) {
    add('Compact umbrella', 'Rain is expected on some days');
    add('Waterproof jacket', 'Rain is expected on some days');
  }
  if (maxHigh >= 28) {
    add('Sunscreen (SPF 30+) and sunglasses', `Highs up to ${maxHigh}°C`);
    add('Refillable water bottle', 'Stay hydrated in the heat');
    add('Light, breathable clothing', `Highs up to ${maxHigh}°C`);
  }
  if (minLow <= 10) add('Warm layers (fleece or sweater)', `Lows down to ${minLow}°C`);
  if (minLow <= 3) add('Hat, gloves and scarf', `Near-freezing lows (${minLow}°C)`);

  const items = itinerary.days.flatMap((d) => d.items).filter((i) => i.attraction);
  const totalHours = items.reduce((sum, i) => sum + i.attraction.hours, 0);
  if (totalHours / itinerary.days.length >= 5) add('Comfortable walking shoes', 'Your plan has a lot of walking');
  if (items.some((i) => i.attraction.category === 'adventure')) add('Sturdy shoes and a small daypack', 'Adventure activities are planned');
  const isEveningOut = (i) => i.attraction.category === 'nightlife' || (i.attraction.category === 'culture' && i.slot === 'evening');
  if (items.some(isEveningOut)) {
    add('One smart-casual outfit', 'For evening shows or venues');
  }

  if (prefs.group === 'family') {
    add('Snacks and wet wipes for the kids', 'Travelling with children');
    add('Basic first-aid kit', 'Travelling with children');
  }
  if (prefs.accessibleOnly) add('Mobility aids and any accessibility documents', 'Step-free trip requested');

  for (const item of destination.packing) add(item, `Specific to ${destination.name}`);

  return [...list].map(([item, reason]) => ({ item, reason }));
}
