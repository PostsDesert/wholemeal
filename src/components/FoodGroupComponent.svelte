<!-- FoodGroupComponent.svelte -->
<script lang="ts">
	import type { FoodGroup } from '$lib/types';
	import FoodText from './FoodText.svelte';

	let {
		foodItem,
		hasStarted,
		onStart,
		onStop,
		showTextDuringFalling = true,
		isCurrentlyFalling = false,
		isAddingToCart = false,
		position = "center"
	}: {
		foodItem: FoodGroup;
		hasStarted: boolean;
		onStart: (item: FoodGroup) => void;
		onStop: (item: FoodGroup, event?: Event) => void;
		showTextDuringFalling?: boolean;
		isCurrentlyFalling?: boolean;
		isAddingToCart?: boolean;
		position?: "top" | "center" | "bottom";
	} = $props();
</script>

<button
	class="{foodItem.label} food-group"
	class:rotating={foodItem.rotating}
	class:started={hasStarted}
	onkeydown={(e) => e.preventDefault()}
	onkeyup={(e) => e.preventDefault()}
	onmousedown={() => onStart(foodItem)}
	onmouseup={(e) => onStop(foodItem, e)}
	onmouseleave={(e) => onStop(foodItem, e)}
	ontouchstart={() => onStart(foodItem)}
	ontouchend={(e) => onStop(foodItem, e)}
>
	<FoodText foodItem={foodItem.item} {hasStarted} isRotating={foodItem.rotating} showText={showTextDuringFalling} {isCurrentlyFalling} {isAddingToCart} {position} />
</button>

<style>
	button.food-group {
		background: none;
		border: none;
		margin-top: 0;
		padding: 0.4rem 0.1rem; /* Reduced horizontal padding */
		border: 0.2rem solid transparent;
		text-rendering: optimizeLegibility;
		--pico-line-height: 1.125;
		--pico-font-size: 2rem;
		--pico-font-weight: 700;
		/* margin-bottom: var(--pico-typography-spacing-vertical); */
		--pico-color: var(--pico-h1-color);
		outline: none;
		-webkit-tap-highlight-color: transparent;
		transition: transform 0.1s ease;
	}

	button.food-group.started:not(.rotating):not(:active) > :global(.food-text) {
		animation: popLock 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		transform: scale(1.05);
	}

	@keyframes popLock {
		0% {
			transform: scale(1);
		}
		100% {
			transform: scale(1.05);
		}
	}

	.food-group {
		font-size: clamp(3rem, 15vw, 5rem);
		text-transform: capitalize;
		width: 100%;
		/* display: flex; */
		text-align: center;
		hyphens: none;
		line-height: 1.2;
		margin: 0.5rem 0;
		position: relative;
		/* overflow: hidden; */ /* Removed to prevent clipping */
		--pico-primary-focus: transparent;
		--pico-primary-hover: transparent;
		--pico-primary-hover-background: transparent;
	}

	.food-emoji {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1);
		font-size: 130%; /* Larger emoji size */
		z-index: -1; /* Place behind text */
		opacity: 0;
	}

	.plus-symbol {
		font-size: min(3rem, 8vw);
	}

	.protein {
		color: brown;
	}
	.carb {
		color: rgb(141 90 98);
	}
	.veggie {
		color: green;
	}

	@media (max-width: 860px) {
		.food-group {
			min-height: 2.7em;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 0;
			font-size: 4rem;
			border-radius: 0;
			padding: 0;
			margin: 0;
		}
	}
</style>
