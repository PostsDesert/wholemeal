<script lang="ts">
	import { FOOD_ITEMS } from '$lib/food-data';

	import { goto } from '$app/navigation';
	import { ROTATION_INTERVAL, CLICK_PREVENTION_DELAY, ROTATION_START_DELAY } from '$lib/constants';
	import { browser } from '$app/environment';
	import type { FoodGroup, FoodGroupLabel, FoodItem } from '$lib/types';
	import { shuffleArray } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';
	import FoodGroupComponent from '../../components/FoodGroupComponent.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';

	const MEAL_PLANNER_KEY = 'mealPlanner';

	// Desktop detection for responsive design
	let isDesktop = $state(false);
	const DESKTOP_BREAKPOINT = 768; // in pixels

	let comboButton: HTMLButtonElement | null = $state(null); // Reference to the combo button

	// Check if we're on desktop
	function checkIfDesktop() {
		if (browser) {
			isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
		}
	}

	// Function to get food items
	function getFoodItemsSource() {
		if (browser) {
			const storedData = localStorage.getItem(MEAL_PLANNER_KEY) || '{}';
			try {
				const data = JSON.parse(storedData);

				// Load food items if present
				if (data.foodItems) {
					const customItems = data.foodItems;
					if (customItems && customItems.protein && customItems.carb && customItems.veggie) {
						// Ensure all food groups have at least one item to prevent errors
						const validatedItems = {
							protein:
								customItems.protein.length > 0
									? customItems.protein
									: [{ text: 'protein', emoji: '🐔' }],
							carb:
								customItems.carb.length > 0 ? customItems.carb : [{ text: 'carb', emoji: '🍠' }],
							veggie:
								customItems.veggie.length > 0
									? customItems.veggie
									: [{ text: 'veggie', emoji: '🥦' }]
						};
						return validatedItems;
					}
				}

			} catch (e) {
				console.error('Error parsing meal planner data from localStorage:', e);
			}
		}
		return FOOD_ITEMS;
	}

	let currentFoodItemsSource = $derived(getFoodItemsSource());

	// Add a state to track if first click has happened
	let hasStarted = $state(false);

	let items = $state({
		protein: createFoodGroup('protein', '🐔', []),
		carb: createFoodGroup('carb', '🍠', []),
		veggie: createFoodGroup('veggie', '🥦', [])
	});

	$effect(() => {
		const newProteinItems = currentFoodItemsSource.protein;
		const newCarbItems = currentFoodItemsSource.carb;
		const newVeggieItems = currentFoodItemsSource.veggie;

		items.protein.items = newProteinItems;
		items.carb.items = newCarbItems;
		items.veggie.items = newVeggieItems;

		items.protein.index = 0;
		items.carb.index = 0;
		items.veggie.index = 0;

		// If the game hasn't started, show the default labels.
		if (!hasStarted) {
			items.protein.item = { text: 'protein', emoji: '🐔' };
			items.carb.item = { text: 'carb', emoji: '🍠' };
			items.veggie.item = { text: 'veggie', emoji: '🥦' };
		} else {
			// If the game has started and data source changes,
			// reset the display to the first item of the new list.
			// Ensure there's a default item if the list is empty or becomes empty
			items.protein.item = newProteinItems[0] || { text: 'protein', emoji: '🐔' };
			items.carb.item = newCarbItems[0] || { text: 'carb', emoji: '🍠' };
			items.veggie.item = newVeggieItems[0] || { text: 'veggie', emoji: '🥦' };
		}
	});

	let allRotating = $state(false);
	let intervalId: number | undefined = undefined; // Store interval ID


	// Animation states
	let hasAddedCombos = $state(false);

	let comboCount = $state(0);
	let comboMessageDismissed = $state(false);
	let spinJustStarted = false;

	// Cart animation state
	let isAddingToCart = $state(false);

	function createFoodGroup(label: FoodGroupLabel, emoji: string, items: FoodItem[]): FoodGroup {
		return {
			label,
			item: { text: label, emoji },
			items,
			index: 0,
			rotating: false,
			rotatingIntervalId: undefined,
			longPressTimer: undefined
		};
	}

	// Stop rotation
	function stopRotation() {
		clearInterval(intervalId);
		allRotating = false;
		for (const item of Object.values(items)) {
			if (item.rotatingIntervalId === undefined) item.rotating = false;
		}
	}

	// Check if interactions should be handled
	function shouldHandleInteraction() {
		// Always return true for now on the spinner page
		return true;
	}

	// Toggle rotation
	function toggleRotation() {
		if (
			preventClick ||
			!shouldHandleInteraction() ||
			(swipeHandler && swipeHandler.getIsSwipeGesture())
		) {
			return;
		}

		// Skip slide transitions and directly toggle rotation
		if (allRotating) {
			stopRotation();
		} else {
			startRotation();
		}
	}

	// Handle keyboard navigation
	function handleKeyboardNavigation(e: KeyboardEvent) {
		// Don't handle keyboard navigation if modal is open
		if (!shouldHandleInteraction()) return;
		if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'h') {
			// Go to lists page
			goto('/lists');
		} else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'l') {
			// Go to combo page
			goto('/combos');
		} else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 's' || e.key === 'j') {
			if (comboButton) {
				comboButton.focus();
			}
			// Add to combo
			addCombo(null);
		}
	}

	// Reset navigation visibility state (for testing purposes)
	function updateComboCountFromStorage() {
		if (browser) {
			const storedData = localStorage.getItem(MEAL_PLANNER_KEY) || '{}';
			try {
				const data = JSON.parse(storedData);
				comboCount = data.combos?.length || 0;

				hasAddedCombos = comboCount > 0;
			} catch (e) {
				console.error('Error loading combo count from storage:', e);
			}
		}
	}

	onMount(() => {
		// Ensure this code only runs in the browser
		if (browser) {
			document.addEventListener('click', toggleRotation);

			document.addEventListener('keyup', handleKeyUp);
			document.addEventListener('keydown', handleKeyDown);

			// Desktop detection
			checkIfDesktop();
			window.addEventListener('resize', checkIfDesktop);

			const storedData = localStorage.getItem(MEAL_PLANNER_KEY) || '{}';
			try {
				const data = JSON.parse(storedData);
				// Check if there are any saved combos
				hasAddedCombos = data.combos?.length > 0 || localStorage.getItem('comboAdded') === 'true';
			} catch (e) {
				console.error('Error loading local storage:', e);
			}
		}
		visible = true;
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', toggleRotation);

			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('resize', checkIfDesktop);
		}
	});

	function handleKeyUp(e: KeyboardEvent) {
		if (!shouldHandleInteraction()) return;
		if (e.key === ' ' || e.code === 'Space') {
			toggleRotation();
		}
		if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 's' || e.key === 'j') {
			comboMessageDismissed = true;
		}
		// Only handle number key releases in keyup
		if (e.key === '1') stopIndividualRotation(items.protein);
		if (e.key === '2') stopIndividualRotation(items.carb);
		if (e.key === '3') stopIndividualRotation(items.veggie);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!shouldHandleInteraction()) return;
		// Keyboard navigation - ONLY on keydown
		handleKeyboardNavigation(e);

		if (e.key === '1') startIndividualRotation(items.protein, 0);
		if (e.key === '2') startIndividualRotation(items.carb, 0);
		if (e.key === '3') startIndividualRotation(items.veggie, 0);
	}

	function maybeFade(node: Element, params: { duration?: number; delay?: number; easing?: (t: number) => number }) {
		let transition = fade(node, params);

		// If there are children, apply the transition to each child as well
		if (node.children) {
			// Delay the child transitions until the parent transition has started
			tick().then(() => {
				Array.from(node.children).forEach((childNode) => {
					fade(childNode as Element, params); // Apply fade to each child with type assertion
				});
			});
		}
		return transition;
	}

	// return to true after hasStarted is set to true and the first rotation has started and stopped
	// at least once. Subsequent rotations should always return true
	// Do not show the add to cart button while the first rotation is still in progress
	let firstRotationStarted = $state(false);
	let firstRotationComplete = $state(false);

	// Check local storage for persistent navigation state on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedNavState = localStorage.getItem('spinner-nav-visible');
			if (savedNavState === 'true') {
				firstRotationComplete = true;
				// Also update combo count when restoring navigation state
				updateComboCountFromStorage();
			}
		}
	});

	$effect(() => {
		if (hasStarted && !firstRotationStarted) {
			firstRotationStarted = true;
		}
		if (firstRotationStarted && !Object.values(items).some((item) => item.rotating)) {
			firstRotationComplete = true;
			// Save navigation visibility state to local storage
			if (typeof window !== 'undefined') {
				localStorage.setItem('spinner-nav-visible', 'true');
			}
			// Only reset if a new spin just started
			if (spinJustStarted) {
				comboMessageDismissed = false;
				spinJustStarted = false;
			}

			// Update combo count when first rotation completes
			updateComboCountFromStorage();
		}
	});

	let visible = $state(false);

	// Add long press handlers
	function advanceItem(item: FoodGroup) {
		item.index = (item.index + 1) % item.items.length;
		item.item = item.items[item.index];
	}

	// Update startLockTimer to start individual rotation
	function startIndividualRotation(item: FoodGroup, timeout = ROTATION_START_DELAY) {
		if (!hasStarted) return;

		const timer = setTimeout(() => {
			stateFlipped = true;
			if (!allRotating && !item.rotating) {
				advanceItem(item);
				item.rotating = true;
				item.rotatingIntervalId = setInterval(() => {
					advanceItem(item);
				}, ROTATION_INTERVAL);
			}
		}, timeout);

		item.longPressTimer = timer;
	}

	// Update clearLockTimer to stop individual rotation
	function stopIndividualRotation(item: FoodGroup, event?: Event) {
		if (event && stateFlipped) {
			event.stopPropagation();
			preventClick = true;
			setTimeout(() => {
				preventClick = false;
			}, CLICK_PREVENTION_DELAY);
			stateFlipped = false;
		}

		clearTimeout(item.longPressTimer);
		clearInterval(item.rotatingIntervalId);
		item.rotatingIntervalId = undefined;
		if (!allRotating) item.rotating = false;
	}

	function startRotation() {
		if (!allRotating) {
			hasStarted = true; // Mark that the game has started
			spinJustStarted = true;
			shuffleArray(items.protein.items);
			shuffleArray(items.carb.items);
			shuffleArray(items.veggie.items);
			Object.values(items).forEach((item) => (item.rotating = true));
			allRotating = true;
			intervalId = setInterval(() => {
				Object.values(items).forEach(advanceItem);
			}, ROTATION_INTERVAL);
		}
	}

	let stateFlipped = $state(false);
	let preventClick = $state(false);

	// Swipe navigation handler
	let swipeHandler: SwipeNavigationHandler;

	// Initialize swipe handler
	onMount(() => {
		swipeHandler = new SwipeNavigationHandler({
			currentPage: '/spinner',
			options: {
				shouldDisableSwipe: () => allRotating,
				onSwipeDown: () => {
					// Custom swipe down behavior for spinner - create combo
					if (shouldHandleInteraction() && firstRotationComplete) {
						addCombo(null);
					}
				},
				onSwipeUp: () => {
					// Custom swipe up behavior for spinner - create combo
					if (shouldHandleInteraction() && firstRotationComplete) {
						addCombo(null);
					}
				}
			}
		});

		// Attach swipe handlers to document
		const cleanup = swipeHandler.attachToElement(document);

		return cleanup;
	});

	function addCombo(event: MouseEvent | null) {
		if (!shouldHandleInteraction() || !firstRotationComplete) return;

		// Start cart animation
		isAddingToCart = true;

		// Reset animation after 1 second
		setTimeout(() => {
			isAddingToCart = false;
		}, 1000);
		// Only dissmiss the message here if it was a click
		// Otherwise, we'll dismiss on keyboard up.
		if (event && event.detail >= 1) {
			comboMessageDismissed = true;
		}

		if (event) {
			event.stopPropagation();
			preventClick = true;
			setTimeout(() => {
				preventClick = false;
			}, CLICK_PREVENTION_DELAY);
		}

		// Save the combo to local storage
		const protein = items.protein.item;
		const carb = items.carb.item;
		const veggie = items.veggie.item;

		// Create a new combo
		const newCombo = {
			id: `combo_${Date.now()}`,
			date: new Date().toISOString(),
			protein,
			carb,
			veggie
		};

		// Get existing combos or create empty array
		const storedData = localStorage.getItem(MEAL_PLANNER_KEY) || '{}';
		try {
			const data = JSON.parse(storedData);
			if (!data.combos) data.combos = [];

			// Check for duplicates before adding
			const isDuplicate = data.combos.some(
				(combo: { protein: FoodItem; carb: FoodItem; veggie: FoodItem }) =>
					combo.protein.text === protein.text &&
					combo.carb.text === carb.text &&
					combo.veggie.text === veggie.text
			);

			// Only add if not a duplicate
			if (!isDuplicate) {
				// Add new combo
				data.combos.push(newCombo);

				// Save back to local storage
				localStorage.setItem(MEAL_PLANNER_KEY, JSON.stringify(data));

				// Set flag that combos exist
				localStorage.setItem('comboAdded', 'true');
				hasAddedCombos = true;

				// Update the combo count for the navigation hint
				comboCount = data.combos.length;
			} else {
				// Still update the combo count in case it wasn't set yet
				comboCount = data.combos.length;

			}
		} catch (e) {
			console.error('Error saving combo:', e);
		}
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="css/sticky-page.css" />
	<meta name="theme-color" content="#ffffff" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#ffffff" />
</svelte:head>

{#if visible}
	<main in:maybeFade={{ duration: 50 }}>
		<div class="food-group-container pico">
			<div>
				<FoodGroupComponent
					foodItem={items.protein}
					{hasStarted}
					onStart={startIndividualRotation}
					onStop={stopIndividualRotation}
					{isAddingToCart}
					position="top"
				/>
			</div>
			<h2 class="plus-symbol" class:hidden-during-cart={isAddingToCart}>+</h2>
			<div>
				<FoodGroupComponent
					foodItem={items.carb}
					{hasStarted}
					onStart={startIndividualRotation}
					onStop={stopIndividualRotation}
					{isAddingToCart}
					position="center"
				/>
			</div>
			<h2 class="plus-symbol" class:hidden-during-cart={isAddingToCart}>+</h2>
			<div>
				<FoodGroupComponent
					foodItem={items.veggie}
					{hasStarted}
					onStart={startIndividualRotation}
					onStop={stopIndividualRotation}
					{isAddingToCart}
					position="bottom"
				/>
			</div>
		</div>

		<!-- Cart animation overlay -->
		{#if isAddingToCart}
			<div class="cart-overlay">
				<span class="cart-emoji">🛒</span>
			</div>
		{/if}
		<!-- Navigation hints -->
		{#if !allRotating && hasStarted && !comboMessageDismissed}
			<div class="create-combo-container">
				<button
					bind:this={comboButton}
					type="button"
					class="create-combo-message"
					onclick={addCombo}
					tabindex="0"
					aria-label="Create combo"
				>
					{#if isDesktop}
						Press enter to create combo
					{:else}
						Swipe ↕️ to create combo
					{/if}
				</button>
			</div>
		{/if}
		{#if firstRotationComplete}
			<div class="navigation-hints" in:fade={{ duration: 300 }}>
				{#if hasAddedCombos}
					<button
						class="hint left"
						onclick={(e) => {
							e.stopPropagation();
							goto('/lists');
						}}
					>
						<span class="arrow">←</span>
						<span class="hint-text">Lists</span>
					</button>
				{/if}
				{#if hasAddedCombos}
					<button
						class="hint right"
						onclick={(e) => {
							e.stopPropagation();
							goto('/combos');
						}}
					>
						<span class="hint-text">Combos</span>
						<span class="arrow">→</span>
						{#if comboCount > 0}
							<span class="combo-badge">{comboCount}</span>
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</main>
{/if}

<!-- hasStarted && !Object.values(items).some(item => item.rotating) -->

<!-- {#if !visible}
	<main class="pico">
		<h1 class="intro">Loading...</h1>
	</main>
{/if} -->

<style>
	main {
		touch-action: manipulation;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		overscroll-behavior: none;
		-webkit-overflow-scrolling: touch;
	}

	/* Navigation hints */
	.navigation-hints {
		position: fixed;
		bottom: 3rem;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		padding: 0 2rem;
		padding-bottom: env(safe-area-inset-bottom);
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.navigation-hints {
			bottom: 0.5rem;
			padding: 0 1rem;
			padding-bottom: env(safe-area-inset-bottom);
			justify-content: space-between;
		}
	}

	.hint {
		display: flex;
		align-items: center;
		font-size: 1rem;
		color: rgba(0, 0, 0, 0.6);
		background-color: rgba(255, 255, 255, 0.7);
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		pointer-events: auto;
		position: relative; /* For positioning the combo badge */
	}

	.hint:hover {
		background-color: rgba(255, 255, 255, 0.9);
		transform: scale(1.05);
	}

	.combo-badge {
		position: absolute;
		top: -8px;
		right: -8px;
		background-color: #ff5722;
		color: white;
		font-size: 0.8rem;
		font-weight: bold;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.arrow {
		font-size: 1.2rem;
		margin: 0 0.5rem;
	}

	.hint-text {
		font-weight: bold;
	}

	/* Center message container */
	.create-combo-container {
		position: fixed;
		bottom: calc(3.5rem + env(safe-area-inset-bottom));
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		z-index: 10;
		pointer-events: auto;
	}

	/* Create combo instruction message */
	.create-combo-message {
		background-color: rgba(255, 255, 255, 0.9);
		color: rgba(0, 0, 0, 0.7);
		padding: 0.5rem 1rem;
		border-radius: 1.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		text-align: center;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: none;
		background: none;
		cursor: pointer;
		background-color: rgba(255, 255, 255, 0.9);
		pointer-events: auto;
		display: inline-block;
	}

	.create-combo-message:focus {
		outline: 2px solid #aaa;
	}

	main .food-group-container {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		width: 100vw;
		margin-left: auto;
		margin-right: auto;
		padding: 0 1rem;
		position: absolute;
		top: 1rem;
		bottom: 8rem;
	}

	/* Desktop position for create-combo-message */
	@media (min-width: 769px) {
		.create-combo-container {
			bottom: calc(6.5rem + env(safe-area-inset-bottom));
		}
		main .food-group-container {
			top: 5rem;
			bottom: 10rem;
		}
	}


	/* Cart animation styles */
	.cart-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		pointer-events: none;
	}

	.cart-emoji {
		font-size: 6rem;
		animation: cartAnimation 1s ease-in-out;
	}

	@keyframes cartAnimation {
		0% {
			opacity: 0;
			transform: scale(0);
		}
		33% {
			opacity: 1;
			transform: scale(1.2);
		}
		100% {
			opacity: 0;
			transform: scale(1.2);
		}
	}

	.plus-symbol.hidden-during-cart {
		opacity: 0;
		transition: opacity 0.2s ease-out;
	}
</style>
