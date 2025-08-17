import { emojiColorCache } from '$lib/emoji-cache';

export function getEmojiColor(emojiString: string) {
	const cachedColor = emojiColorCache.get(emojiString);
	if (cachedColor) {
		return cachedColor;
	}

	const emojis = Array.from(emojiString);
	if (typeof document === 'undefined') {
		return '#000000';
	}
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return '#000000';

	canvas.width = 48;
	canvas.height = 48;
	ctx.font = '48px serif';

	let totalR = 0,
		totalG = 0,
		totalB = 0,
		totalCount = 0;

	emojis.forEach((emoji) => {
		ctx.clearRect(0, 0, 48, 48);
		ctx.fillText(emoji, 0, 40);

		const imageData = ctx.getImageData(0, 0, 48, 48).data;
		let r = 0,
			g = 0,
			b = 0,
			count = 0;

		for (let i = 0; i < imageData.length; i += 4) {
			if (imageData[i + 3] > 0) {
				r += imageData[i];
				g += imageData[i + 1];
				b += imageData[i + 2];
				count++;
			}
		}

		if (count > 0) {
			totalR += r;
			totalG += g;
			totalB += b;
			totalCount += count;
		}
	});

	if (totalCount === 0) return '#000000';

	const darken = 1.03; // Reduced from 1 to make colors darker

	let r = Math.floor((totalR / totalCount) * darken);
	let g = Math.floor((totalG / totalCount) * darken);
	let b = Math.floor((totalB / totalCount) * darken);

	// Ensure values stay within 0-255 range
	r = Math.min(255, Math.max(0, r));
	g = Math.min(255, Math.max(0, g));
	b = Math.min(255, Math.max(0, b));

	const color = `rgb(${r}, ${g}, ${b})`;
	emojiColorCache.set(emojiString, color);
	return color;
}

/**
 * Shared utility for rendering and dithering an emoji to a data URL.
 * Used by both ReceiptEmoji.svelte and precompute.ts.
 */
export function drawReceiptEmojiToDataUrl({
	emoji,
	pixelation,
	color,
	renderMode
}: {
	emoji: string;
	pixelation: number;
	color?: string;
	renderMode: 'monochrome' | 'grayscale' | 'color';
}): string | null {
	console.log(`[drawReceiptEmojiToDataUrl] Computing emoji image for "${emoji}" with pixelation=${pixelation}, color=${color}, renderMode=${renderMode}`);
	if (typeof document === 'undefined') return null;

	console.log(`[drawReceiptEmojiToDataUrl] Computing emoji image for "${emoji}" with pixelation=${pixelation}, color=${color}, renderMode=${renderMode}`);
	const offscreenCanvas = document.createElement('canvas');
	offscreenCanvas.width = pixelation;
	offscreenCanvas.height = pixelation;
	const offscreenCtx = offscreenCanvas.getContext('2d');
	if (!offscreenCtx) return null;

	offscreenCtx.clearRect(0, 0, pixelation, pixelation);
	offscreenCtx.font = `${pixelation}px sans-serif`;
	offscreenCtx.textAlign = 'center';
	offscreenCtx.textBaseline = 'middle';
	offscreenCtx.fillText(emoji, pixelation / 2, pixelation / 2 + pixelation * 0.05);

	const imageData = offscreenCtx.getImageData(0, 0, pixelation, pixelation);
	const data = imageData.data;

	const bayerMatrix = [
		[0, 8, 2, 10],
		[12, 4, 14, 6],
		[3, 11, 1, 9],
		[15, 7, 13, 5]
	];
	const matrixSize = 4;
	const bayerFactor = 17;
	const inkColor = 40;

	function hexToRgb(hex: string): [number, number, number] | null {
		let c = hex.replace('#', '');
		if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
		if (c.length !== 6) return null;
		const num = parseInt(c, 16);
		return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
	}
	const overrideRgb = color ? hexToRgb(color) : null;

	for (let y = 0; y < pixelation; y++) {
		for (let x = 0; x < pixelation; x++) {
			const index = (y * pixelation + x) * 4;
			const alpha = data[index + 3];
			const intensity = alpha / 255;
			const threshold = bayerMatrix[y % matrixSize][x % matrixSize] / bayerFactor;

			if (intensity > threshold) {
				switch (renderMode) {
					case 'monochrome':
						data[index] = inkColor;
						data[index + 1] = inkColor;
						data[index + 2] = inkColor;
						break;
					case 'grayscale': {
						const r = data[index];
						const g = data[index + 1];
						const b = data[index + 2];
						const gray = 0.299 * r + 0.587 * g + 0.114 * b;
						data[index] = gray;
						data[index + 1] = gray;
						data[index + 2] = gray;
						break;
					}
					case 'color':
						if (overrideRgb) {
							data[index] = overrideRgb[0];
							data[index + 1] = overrideRgb[1];
							data[index + 2] = overrideRgb[2];
						}
						break;
				}
				data[index + 3] = 255;
			} else {
				data[index + 3] = 0;
			}
		}
	}
	offscreenCtx.putImageData(imageData, 0, 0);

	const dataUrl = offscreenCanvas.toDataURL('image/png');
	console.log(`[drawReceiptEmojiToDataUrl] Finished computing emoji image for "${emoji}".`);
	return dataUrl;
}

export function shuffleArray<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // Random index between 0 and i
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
}

/**
 * Wrapper for drawing/caching receipt emoji images.
 * Checks cache before rendering, and saves to cache if needed.
 */
export function getOrDrawReceiptEmojiDataUrl({
	emoji,
	size,
	pixelation,
	color,
	renderMode,
	cache,
	getCacheKey,
	saveCache
}: {
	emoji: string;
	size: number;
	pixelation: number;
	color?: string;
	renderMode: 'monochrome' | 'grayscale' | 'color';
	cache: Map<string, string>;
	getCacheKey: (...args: any[]) => string;
	saveCache?: () => void;
}): string | null {
	const cacheKey = getCacheKey(emoji, size, pixelation, color, renderMode);
	const cachedDataUrl = cache.get(cacheKey);
	if (cachedDataUrl) {
		console.log(`[getOrDrawReceiptEmojiDataUrl] Cache hit for key:`, cacheKey);
		return cachedDataUrl;
	}
	const dataUrl = drawReceiptEmojiToDataUrl({ emoji, pixelation, color, renderMode });
	if (dataUrl) {
		cache.set(cacheKey, dataUrl);
		if (saveCache) saveCache();
	}
	return dataUrl;
}
