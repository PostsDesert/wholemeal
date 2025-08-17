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

export function shuffleArray<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // Random index between 0 and i
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
}
