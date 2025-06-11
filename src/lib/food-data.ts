import type { FoodItem, FoodGroupLabel } from '$lib/types';

export const FOOD_ITEMS = {
	protein: [
		{ text: 'Salmon', emoji: '🍣' },
		{ text: 'chicken breast', emoji: '🐔' },
		{ text: 'lean beef', emoji: '🥩' },
		{ text: 'turkey', emoji: '🦃' },
		{ text: 'tuna', emoji: '🐟' },
		{ text: 'tofu', emoji: '🥢' },
		{ text: 'eggs', emoji: '🥚' }
	],
	carb: [
		{ text: 'quinoa', emoji: '🌾' },
		{ text: 'Black beans', emoji: '🫘' },
		{ text: 'chickpeas', emoji: '🐤' },
		{ text: 'lentils', emoji: '🫘' },
		{ text: 'potato', emoji: '🥔' },
		{ text: 'rice', emoji: '🍚' },
		{ text: 'sweet potato', emoji: '🍠' },
		{ text: 'pasta', emoji: '🍝' },
		{ text: 'couscous', emoji: '🌾' },
		{ text: 'noodles', emoji: '🍜' }
	],
	veggie: [
		{ text: 'broccoli', emoji: '🥦' },
		{ text: 'veg medley', emoji: '🥬' },
		{ text: 'squash', emoji: '🎃' },
		{ text: 'peppers', emoji: '🫑' },
		{ text: 'brussels sprouts', emoji: '🌱' },
		{ text: 'arugula salad', emoji: '🥗' },
		{ text: 'green beans', emoji: '🫛' },
		{ text: 'peas', emoji: '🫛' },
		{ text: 'spinach', emoji: '🍃' },
		{ text: 'kale', emoji: '🥬' },
		{ text: 'asparagus', emoji: '🌱' },
		{ text: 'carrots', emoji: '🥕' },
		{ text: 'tomato', emoji: '🍅' },
		{ text: 'mushrooms', emoji: '🍄' },
		{ text: 'cauliflower', emoji: '🥦' },
		{ text: 'beets', emoji: '🍠' },
		{ text: 'radish', emoji: '🫑' },
		{ text: 'corn', emoji: '🌽' },
		{ text: 'eggplant', emoji: '🍆' },
		{ text: 'leeks', emoji: '🧅' },
		{ text: 'pumpkin', emoji: '🎃' },
		{ text: 'artichokes', emoji: '🌱' },
		{ text: 'okra', emoji: '🫑' },
		{ text: 'edamame', emoji: '🌱' }
	],
};

// Helper function to normalize keys (lowercase + underscores)
const normalizeKey = (str: string): string => str.toLowerCase().replace(/\s+/g, "_");

// Define the lookup table type structure
type FoodLookup = {
  [key in FoodGroupLabel]: {
    [key: string]: FoodItem;
  };
};

// Create a lookup table from the array
export const FOOD_LOOKUP = Object.keys(FOOD_ITEMS).reduce<FoodLookup>((lookup, category) => {
  const foodCategory = category as FoodGroupLabel;
  lookup[foodCategory] = FOOD_ITEMS[foodCategory].reduce<Record<string, FoodItem>>((acc, item) => {
    acc[normalizeKey(item.text)] = item;
    return acc;
  }, {});
  return lookup;
}, {} as FoodLookup);

// 🔍 Lookup function (normalizes key and retrieves item)
export function getFoodItem(category: FoodGroupLabel, key: string): FoodItem | null {
  const normalizedKey = normalizeKey(key);
  return FOOD_LOOKUP[category]?.[normalizedKey] || null; // Return null if not found
}
