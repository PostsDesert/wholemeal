<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { receiptEmojiCache, saveCacheToLocalStorage, getReceiptEmojiCacheKey } from '$lib/receipt-cache';
	import { getOrDrawReceiptEmojiDataUrl } from '$lib/utils';

	// Props for the component
	export let emoji: string;
	export let size: number = 24; // The final display size in pixels
	export let pixelation: number = 20; // The intermediate resolution. Higher = more detail.
	export let color: string | undefined = undefined; // Optional: override color for all "on" pixels (e.g. "#4caf50")

	type RenderMode = 'monochrome' | 'grayscale' | 'color';

	let canvas: HTMLCanvasElement;

	/**
	 * Draws the emoji using dithering, using cache if available.
	 */
	function draw() {
		if (!browser || !canvas) return;
		const RENDER_MODE: RenderMode = 'color';

		const dataUrl = getOrDrawReceiptEmojiDataUrl({
			emoji,
			size,
			pixelation,
			color,
			renderMode: RENDER_MODE,
			cache: receiptEmojiCache,
			getCacheKey: getReceiptEmojiCacheKey,
			saveCache: saveCacheToLocalStorage
		});
		if (!dataUrl) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		canvas.width = size;
		canvas.height = size;
		ctx.imageSmoothingEnabled = false;

		const img = new window.Image();
		img.onload = () => {
			ctx.clearRect(0, 0, size, size);
			ctx.drawImage(img, 0, 0, size, size);
		};
		img.src = dataUrl;
	}

	onMount(draw);

	$: if (browser && (emoji || size || pixelation)) {
		draw();
	}
</script>

<canvas bind:this={canvas} aria-label={emoji}></canvas>

<style>
	canvas {
		display: block;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}
</style>
