const CACHE_KEY = 'receipt-emoji-cache';

/**
 * Loads the receipt emoji cache from localStorage.
 * The cache maps emoji+render params to a data URL string.
 */
function loadCacheFromLocalStorage(): Map<string, string> {
	if (typeof localStorage === 'undefined') {
		return new Map<string, string>();
	}

	const cachedData = localStorage.getItem(CACHE_KEY);
	if (cachedData) {
		try {
			const parsedData = JSON.parse(cachedData);
			if (Array.isArray(parsedData)) {
				return new Map<string, string>(parsedData);
			}
		} catch (e) {
			console.error('Failed to parse receipt emoji cache from localStorage', e);
			return new Map<string, string>();
		}
	}
	return new Map<string, string>();
}

/**
 * The in-memory cache for receipt emoji images.
 * Key: stringified params (emoji, size, pixelation, color, renderMode)
 * Value: data URL string (image/png)
 */
export const receiptEmojiCache = loadCacheFromLocalStorage();

/**
 * Saves the current cache to localStorage.
 */
export function saveCacheToLocalStorage() {
	if (typeof localStorage === 'undefined') {
		return;
	}
	const dataToStore = JSON.stringify(Array.from(receiptEmojiCache.entries()));
	localStorage.setItem(CACHE_KEY, dataToStore);
}

// Save cache on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', saveCacheToLocalStorage);
}

/**
 * Generates a cache key for a given emoji and rendering parameters.
 * This ensures that different renderings (size, pixelation, color, mode) are cached separately.
 */
export function getReceiptEmojiCacheKey(
	emoji: string,
	size: number,
	pixelation: number,
	color: string | undefined,
	renderMode: string
): string {
	return JSON.stringify({ emoji, size, pixelation, color, renderMode });
}
