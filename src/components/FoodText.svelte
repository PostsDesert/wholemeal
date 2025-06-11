<script lang="ts">
	import type { FoodItem } from '$lib/types';
	import { getEmojiColor } from '$lib/utils';

	let {
		foodItem,
		hasStarted,
		isRotating,
		showEmoji = true,
		showText = true,
		isCurrentlyFalling = false
	}: {
		foodItem: FoodItem;
		hasStarted?: boolean;
		isRotating?: boolean;
		showEmoji?: boolean;
		showText?: boolean;
		isCurrentlyFalling?: boolean;
	} = $props();

	let emojiColor = $derived(getEmojiColor(foodItem.emoji));
</script>

{#if showText && !isCurrentlyFalling}
	<p class="pico food-text" style="color: {emojiColor};" class:rotating={isRotating}>
		{foodItem.text}
	</p>
{/if}
{#if showEmoji}
	<span
		class="food-emoji pico"
		class:showEmoji
		class:started={hasStarted}
		class:rotating={isRotating}
		class:falling_animation={isCurrentlyFalling}
	>
		{foodItem.emoji}
	</span>
{/if}

<style>
	p {
		margin: 0;
	}
	.food-text.rotating {
		opacity: 0;
	}

	.food-emoji.rotating {
		opacity: 0.92;
	}

	.food-emoji.showEmoji.started:not(.rotating) {
		opacity: 0.45;
	}

	.food-emoji {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1);
		font-size: 130%; /* Larger emoji size */
		z-index: -1; /* Place behind text */
		opacity: 0;
		/* Ensure background is transparent for emojis during normal state */
		background-color: transparent;
	}

	.food-emoji.falling_animation {
		/* Override scale from parent's falling animation to keep emoji size consistent */
		transform: translate(-50%, -50%) scale(1) !important; /* Increased scale */
		opacity: 1 !important; /* Ensure emoji is visible during fall */
		background-color: transparent !important; /* Ensure no background color during fall */
	}

	.food-text {
		display: block;
		text-transform: capitalize;
		font-weight: 700;
		text-shadow:
			-2px -2px 0 black,
			2px -2px 0 black,
			-2px 2px 0 black,
			2px 2px 0 black,
			-2px 0 0 black,
			2px 0 0 black,
			0 -2px 0 black,
			0 2px 0 black;
	}

	/* Apply smaller text-shadow for mobile devices */
	@media (max-width: 768px) {
		.food-text {
			text-shadow:
				-1.5px -1.5px 0 black,
				1.5px -1px 0 black,
				-1px 1.5px 0 black,
				1.5px 1.5px 0 black,
				-1.5px 0 0 black,
				1.5px 0 0 black,
				0 -1.5px 0 black,
				0 1.5px 0 black;
		}
	}
</style>
