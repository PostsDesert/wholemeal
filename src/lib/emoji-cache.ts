const CACHE_KEY = 'emoji-color-cache';

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
			console.error('Failed to parse emoji cache from localStorage', e);
			return new Map<string, string>();
		}
	}
	return new Map<string, string>();
}

export const emojiColorCache = loadCacheFromLocalStorage();

export function saveCacheToLocalStorage() {
	if (typeof localStorage === 'undefined') {
		return;
	}
	const dataToStore = JSON.stringify(Array.from(emojiColorCache.entries()));
	localStorage.setItem(CACHE_KEY, dataToStore);
}

if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', saveCacheToLocalStorage);
}
