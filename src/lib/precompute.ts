import { FOOD_ITEMS } from '$lib/food-data';
import { getEmojiColor, getOrDrawReceiptEmojiDataUrl } from '$lib/utils';
import { receiptEmojiCache, saveCacheToLocalStorage, getReceiptEmojiCacheKey } from '$lib/receipt-cache';

export function precomputeEmojiColors() {
	if (typeof window === 'undefined') {
		// Pre-computation can only happen in the browser where canvas is available
		return;
	}

	// Cache emoji colors
	Object.values(FOOD_ITEMS).forEach((foodGroup) => {
		foodGroup.forEach((item) => {
			getEmojiColor(item.emoji);
		});
	});
}

/**
 * Precompute and cache receipt emoji images for all food items.
 * Uses the same rendering logic as ReceiptEmoji.svelte.
 */
export function precomputeReceiptEmojis({
	size = 24,
	pixelation = 20,
	color = undefined,
	renderMode = 'color'
}: {
	size?: number;
	pixelation?: number;
	color?: string;
	renderMode?: 'monochrome' | 'grayscale' | 'color';
} = {}) {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return;
	}

	Object.values(FOOD_ITEMS).forEach((foodGroup) => {
		foodGroup.forEach((item) => {
			getOrDrawReceiptEmojiDataUrl({
				emoji: item.emoji,
				size,
				pixelation,
				color,
				renderMode,
				cache: receiptEmojiCache,
				getCacheKey: getReceiptEmojiCacheKey,
			});
		});
	});
	saveCacheToLocalStorage();
}
