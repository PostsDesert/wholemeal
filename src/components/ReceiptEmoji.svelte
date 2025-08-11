<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props for the component
	export let emoji: string;
	export let size: number = 24; // The final display size in pixels
	export let pixelation: number = 20; // The intermediate resolution. Higher = more detail.
	export let color: string | undefined = undefined; // Optional: override color for all "on" pixels (e.g. "#4caf50")

	type RenderMode = 'monochrome' | 'grayscale' | 'color';

	let canvas: HTMLCanvasElement;

	// This function performs the rendering and dithering
	function draw() {
		if (!browser || !canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// --- NEW: UNIFIED RENDERING MODE ---
		// Set to one of the following to change the style:
		// 'monochrome': Authentic single-color receipt look.
		// 'grayscale':  Dithered black-and-white version of the emoji.
		// 'color':      Dithered, pixelated version with original colors.
		const RENDER_MODE: RenderMode = 'color';

		// --- Step 1: Prepare Canvases ---
		canvas.width = size;
		canvas.height = size;
		ctx.imageSmoothingEnabled = false;

		const offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = pixelation;
		offscreenCanvas.height = pixelation;
		const offscreenCtx = offscreenCanvas.getContext('2d');
		if (!offscreenCtx) return;

		// --- Step 2: Draw the original emoji at low resolution ---
		offscreenCtx.clearRect(0, 0, pixelation, pixelation);
		offscreenCtx.font = `${pixelation}px sans-serif`;
		offscreenCtx.textAlign = 'center';
		offscreenCtx.textBaseline = 'middle';
		offscreenCtx.fillText(emoji, pixelation / 2, pixelation / 2 + pixelation * 0.05);

		// --- Step 3: Implement Ordered Dithering ---
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
		const inkColor = 40; // Used only for monochrome mode

		// Helper: parse hex color to [r,g,b]
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
					// This pixel is "on". Apply the selected render mode.
					switch (RENDER_MODE as RenderMode) {
						case 'monochrome':
							data[index] = inkColor;
							data[index + 1] = inkColor;
							data[index + 2] = inkColor;
							break;

						case 'grayscale': {
							// Calculate luminance for an accurate grayscale value
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
							// else: keep original color
							break;
					}
					data[index + 3] = 255; // Make the "on" pixel fully opaque
				} else {
					// This pixel is "off" (fully transparent).
					data[index + 3] = 0;
				}
			}
		}
		offscreenCtx.putImageData(imageData, 0, 0);

		// --- Step 4: Scale the dithered image up to the final canvas ---
		ctx.clearRect(0, 0, size, size);
		ctx.drawImage(offscreenCanvas, 0, 0, pixelation, pixelation, 0, 0, size, size);
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
