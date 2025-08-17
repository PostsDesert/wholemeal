const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Function to convert a Unicode character to its unified codepoint string
function toUnified(char) {
	return Array.from(char)
		.map((c) => c.codePointAt(0).toString(16).toUpperCase())
		.join('-');
}

// Function to extract the average color from an image data block
function getAverageColor(imageData) {
	let r = 0,
		g = 0,
		b = 0,
		count = 0;

	for (let i = 0; i < imageData.length; i += 4) {
		// Only consider pixels with an alpha value greater than a threshold
		// to avoid transparent/semi-transparent pixels
		if (imageData[i + 3] > 200) {
			r += imageData[i];
			g += imageData[i + 1];
			b += imageData[i + 2];
			count++;
		}
	}

	if (count === 0) {
		return 'rgb(0, 0, 0)';
	}

	r = Math.floor(r / count);
	g = Math.floor(g / count);
	b = Math.floor(b / count);

	return `rgb(${r}, ${g}, ${b})`;
}

const STATIC_FOOD_EMOJIS = [
	// Fruits
	'🍇',
	'🍈',
	'🍉',
	'🍊',
	'🍋',
	'🍋‍🟩',
	'🍌',
	'🍍',
	'🥭',
	'🍎',
	'🍏',
	'🍐',
	'🍑',
	'🍒',
	'🍓',
	'🫐',
	'🥝',
	'🍅',
	'🫒',
	'🥥',
	// Vegetables
	'🥑',
	'🍆',
	'🥔',
	'🥕',
	'🌽',
	'🌶️',
	'🫑',
	'🥒',
	'🥬',
	'🥦',
	'🧄',
	'🧅',
	'🥜',
	'🫘',
	'🌰',
	'🫚',
	'🫛',
	'🫜',
	'🍄‍🟫',
	// Prepared Foods
	'🍞',
	'🥐',
	'🥖',
	'🫓',
	'🥨',
	'🥯',
	'🥞',
	'🧇',
	'🧀',
	'🍖',
	'🍗',
	'🥩',
	'🥓',
	'🍔',
	'🍟',
	'🍕',
	'🌭',
	'🥪',
	'🌮',
	'🌯',
	'🫔',
	'🥙',
	'🧆',
	'🥚',
	'🍳',
	'🥘',
	'🍲',
	'🫕',
	'🥣',
	'🥗',
	'🍿',
	'🧈',
	'🧂',
	'🥫',
	'🍝',
	// Asian Foods
	'🍱',
	'🍘',
	'🍙',
	'🍚',
	'🍛',
	'🍜',
	'🍠',
	'🍢',
	'🍣',
	'🍤',
	'🍥',
	'🥮',
	'🍡',
	'🥟',
	'🥠',
	'🥡',
	// Sweets & Desserts
	'🍦',
	'🍧',
	'🍨',
	'🍩',
	'🍪',
	'🎂',
	'🍰',
	'🧁',
	'🥧',
	'🍫',
	'🍬',
	'🍭',
	'🍮',
	'🍯',
	// Drinks & Dishware
	'🍼',
	'🥛',
	'☕',
	'🫖',
	'🍵',
	'🍶',
	'🍾',
	'🍷',
	'🍸',
	'🍹',
	'🍺',
	'🍻',
	'🥂',
	'🥃',
	'🫗',
	'🥤',
	'🧋',
	'🧃',
	'🧉',
	'🥢',
	'🍽️',
	'🍴',
	'🥄',
	'🔪',
	'🫙',
	'🏺'
];

async function precomputeAndSave() {
	try {
		// --- 1. Load Food Data ---
		const foodDataPath = path.resolve(__dirname, '../src/lib/food-data.ts');
		const foodDataContent = fs.readFileSync(foodDataPath, 'utf8');
		const foodItemsRegex = /export const FOOD_ITEMS = (\{[\s\S]*?\});/;
		const match = foodDataContent.match(foodItemsRegex);
		if (!match) {
			throw new Error('Could not find FOOD_ITEMS in food-data.ts');
		}
		const foodItemsString = match[1]
			.replace(/(\w+):/g, '"$1":')
			.replace(/'/g, '"')
			.replace(/,(?=\s*?[\]\}])/g, '');
		const FOOD_ITEMS = JSON.parse(foodItemsString);

		// --- 2. Load Emoji Data ---
		const emojiDataPath = require.resolve('emoji-datasource/emoji.json');
		const emojiData = JSON.parse(fs.readFileSync(emojiDataPath, 'utf8'));

		// Create a lookup map from unified codepoint to emoji data
		const emojiMap = new Map();
		for (const emojiInfo of emojiData) {
			if (emojiInfo.unified) {
				emojiMap.set(emojiInfo.unified, emojiInfo);
			}
			if (emojiInfo.skin_variations) {
				for (const skinTone in emojiInfo.skin_variations) {
					const skinVariation = emojiInfo.skin_variations[skinTone];
					emojiMap.set(skinVariation.unified, skinVariation);
				}
			}
		}

		// --- 3. Load Emoji Spritesheet ---
		const spritesheetPath = require.resolve('emoji-datasource-apple/img/apple/sheets/64.png');
		const spritesheet = await loadImage(spritesheetPath);

		const canvas = createCanvas(64, 64);
		const ctx = canvas.getContext('2d');

		const precomputedColors = {};
		console.log('Precomputing emoji colors from Apple spritesheet...');

		// --- 4. Process Emojis ---
		const emojisToProcess = new Set(STATIC_FOOD_EMOJIS);
		for (const category in FOOD_ITEMS) {
			for (const item of FOOD_ITEMS[category]) {
				if (item.emoji) {
					emojisToProcess.add(item.emoji);
				}
			}
		}

		for (const emoji of emojisToProcess) {
			if (precomputedColors[emoji]) {
				continue;
			}
			const unified = toUnified(emoji);
			const emojiInfo = emojiMap.get(unified);

			if (emojiInfo && emojiInfo.has_img_apple) {
				const { sheet_x, sheet_y } = emojiInfo;
				const size = 64;
				const padding = 1; // 1px border around each emoji in the spritesheet
				const x = sheet_x * (size + 2 * padding) + padding;
				const y = sheet_y * (size + 2 * padding) + padding;

				ctx.clearRect(0, 0, size, size);
				ctx.drawImage(spritesheet, x, y, size, size, 0, 0, size, size);
				const imageData = ctx.getImageData(0, 0, size, size).data;
				const color = getAverageColor(imageData);
				precomputedColors[emoji] = color;
				console.log(`  ${emoji}: ${color}`);
			} else {
				console.log(`  ${emoji}: No Apple image found, skipping.`);
			}
		}

		// --- 5. Save Results ---
		const outputPath = path.resolve(__dirname, '../src/lib/food-data-precomputed.ts');
		const outputContent = `// This file is generated by scripts/precompute-colors.cjs
// Do not edit this file directly.

export const PRECOMPUTED_EMOJI_COLORS: Record<string, string> = ${JSON.stringify(
			precomputedColors,
			null,
			2
		)};
`;
		fs.writeFileSync(outputPath, outputContent, 'utf8');
		console.log(`\n✅ Precomputed colors saved to ${outputPath}`);
	} catch (error) {
		console.error('Error during precomputation:', error);
		process.exit(1);
	}
}

precomputeAndSave();
