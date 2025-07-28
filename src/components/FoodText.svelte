<script lang="ts">
	import type { FoodItem } from '$lib/types';
	import { getEmojiColor } from '$lib/utils';
	import { onMount } from 'svelte';

	let {
		foodItem,
		hasStarted,
		isRotating,
		showEmoji = true,
		showText = true,
		isCurrentlyFalling = false,
		isAddingToCart = false,
		position = "center"
	}: {
		foodItem: FoodItem;
		hasStarted?: boolean;
		isRotating?: boolean;
		showEmoji?: boolean;
		showText?: boolean;
		isCurrentlyFalling?: boolean;
		isAddingToCart?: boolean;
		position?: "top" | "center" | "bottom";
	} = $props();

	let emojiColor = $derived(getEmojiColor(foodItem.emoji));
	let emojiElement: HTMLElement;
	let centerOffset = $state(0);

	// Calculate offset to center position when component mounts
	onMount(() => {
		if (position !== "center") {
			calculateCenterOffset();
		}
	});

	function calculateCenterOffset() {
		if (!emojiElement) return;

		// Find the center emoji element
		const centerEmoji = document.querySelector('.food-emoji.center-emoji');
		if (!centerEmoji) return;

		const emojiRect = emojiElement.getBoundingClientRect();
		const centerRect = centerEmoji.getBoundingClientRect();

		// Calculate vertical offset needed to reach center
		centerOffset = centerRect.top - emojiRect.top;
	}

	// Recalculate when animation starts
	$effect(() => {
		if (isAddingToCart && position !== "center") {
			calculateCenterOffset();
		}
	});
</script>

{#if showText && !isCurrentlyFalling && !isAddingToCart}
	<p class="pico food-text" style="color: {emojiColor};" class:rotating={isRotating}>
		{foodItem.text}
	</p>
{/if}
{#if showEmoji}
	<span
		bind:this={emojiElement}
		class="food-emoji pico"
		class:showEmoji
		class:started={hasStarted}
		class:rotating={isRotating}
		class:falling_animation={isCurrentlyFalling}
		class:cart_animation_top={isAddingToCart && position === "top"}
		class:cart_animation_center={isAddingToCart && position === "center"}
		class:cart_animation_bottom={isAddingToCart && position === "bottom"}
		class:center-emoji={position === "center"}
		style={isAddingToCart && position !== "center" ? `--center-offset: ${centerOffset}px` : ''}
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

	.food-emoji.showEmoji.started.cart_animation_top {
		animation: emojiToCartFromTop 1s ease-in-out;
		z-index: 999;
	}

	.food-emoji.showEmoji.started.cart_animation_center {
		animation: emojiToCartFromCenter 1s ease-in-out;
		z-index: 999;
	}

	.food-emoji.showEmoji.started.cart_animation_bottom {
		animation: emojiToCartFromBottom 1s ease-in-out;
		z-index: 999;
	}



	@keyframes emojiToCartFromTop {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		33% {
			transform: translate(-50%, calc(-50% + var(--center-offset, 0px))) scale(0.6);
			opacity: 1;
		}
		100% {
		    transform: translate(-50%, calc(-50% + var(--center-offset, 0px))) scale(0.6);
			opacity: 0;
			visibility: hidden;
		}
	}

	@keyframes emojiToCartFromCenter {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		33% {
			transform: translate(-50%, -50%) scale(0.6);
			opacity: 1;
		}
		100% {
		    transform: translate(-50%, -50%) scale(0.6);
			opacity: 0;
			visibility: hidden;
		}
	}

	@keyframes emojiToCartFromBottom {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		33% {
			transform: translate(-50%, calc(-50% + var(--center-offset, 0px))) scale(0.6);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, calc(-50% + var(--center-offset, 0px))) scale(0.6);
			opacity: 0;
			visibility: hidden;
		}
	}

	.food-text {
		display: block;
		text-transform: capitalize;
		font-weight: 700;
		text-shadow:
			-1px -1px 0 black,
			1px -1px 0 black,
			-1px 1px 0 black,
			1px 1px 0 black,
			-1px 0 0 black,
			1px 0 0 black,
			0 -1px 0 black,
			0 1px 0 black;
	}

	/* Apply smaller text-shadow for mobile devices */
	@media (max-width: 768px) {
		.food-text {
			text-shadow:
				-1px -1px 0 black,
				1px -1px 0 black,
				-1px 1px 0 black,
				1px 1px 0 black,
				-1px 0 0 black,
				1px 0 0 black,
				0 -1px 0 black,
				0 1px 0 black;
		}
	}
</style>
