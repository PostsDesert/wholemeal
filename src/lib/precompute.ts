import { FOOD_ITEMS } from '$lib/food-data';
import { getEmojiColor } from '$lib/utils';

export function precomputeEmojiColors() {
	if (typeof window === 'undefined') {
		// Pre-computation can only happen in the browser where canvas is available
		return;
	}

	// This function will iterate through all food items and cache their emoji colors.
	Object.values(FOOD_ITEMS).forEach((foodGroup) => {
		foodGroup.forEach((item) => {
			getEmojiColor(item.emoji);
		});
	});
}
