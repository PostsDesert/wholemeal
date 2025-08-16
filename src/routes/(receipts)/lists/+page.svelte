<script lang="ts">
	import Receipt from '$component/Receipt.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';
	import { FOOD_ITEMS } from '$lib/food-data';
	import { browser } from '$app/environment';
	import type { FoodGroupLabel, FoodItem } from '$lib/types';
	import DeleteModal from '$component/DeleteModal.svelte';
	import BackButton from '$component/BackButton.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';
	import ReceiptEmoji from '$component/ReceiptEmoji.svelte';

	let showResetModal = $state(false);
	let showDeleteModal = $state(false);
	let itemToDelete: { group: FoodGroupLabel; index: number; item: FoodItem } | null = $state(null);

	// Swipe navigation handler
	let swipeHandler: SwipeNavigationHandler;

	// Current view (for mobile)
	let currentList: FoodGroupLabel = $state('protein');

	// Food items with local storage backup
	let foodItems = $state({
		protein: [] as FoodItem[],
		carb: [] as FoodItem[],
		veggie: [] as FoodItem[]
	});

	// New item form
	let newItemText = $state('');
	let newItemEmoji = $state('');
	let isAddingItem = $state(false);
	let editingItemIndex = $state<number | null>(null);

	// Media query for responsive design
	let isDesktop = $state(false);
	const DESKTOP_BREAKPOINT = 1260; // in pixels

	// Check if we're on desktop
	function checkIfDesktop() {
		if (browser) {
			isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
		}
	}

	// Load food items state from local storage
	function loadFromLocalStorage() {
		if (browser) {
			const storedData = localStorage.getItem('mealPlanner') || '{}';
			try {
				const data = JSON.parse(storedData);

				// Load food items if present, otherwise use default items
				if (data.foodItems) {
					foodItems.protein = data.foodItems.protein || [...FOOD_ITEMS.protein];
					foodItems.carb = data.foodItems.carb || [...FOOD_ITEMS.carb];
					foodItems.veggie = data.foodItems.veggie || [...FOOD_ITEMS.veggie];
				} else {
					// First time loading - use default items
					foodItems.protein = [...FOOD_ITEMS.protein];
					foodItems.carb = [...FOOD_ITEMS.carb];
					foodItems.veggie = [...FOOD_ITEMS.veggie];
				}

			} catch (e) {
				console.error('Error loading from local storage:', e);
				// Fallback to default items on error
				foodItems.protein = [...FOOD_ITEMS.protein];
				foodItems.carb = [...FOOD_ITEMS.carb];
				foodItems.veggie = [...FOOD_ITEMS.veggie];
			}
		}
	}

	// Save all food items to local storage
	function saveToLocalStorage() {
		if (browser) {
			const storedData = localStorage.getItem('mealPlanner') || '{}';
			try {
				const data = JSON.parse(storedData);

				// Save all food items
				data.foodItems = {
					protein: [...foodItems.protein],
					carb: [...foodItems.carb],
					veggie: [...foodItems.veggie]
				};

				localStorage.setItem('mealPlanner', JSON.stringify(data));
			} catch (e) {
				console.error('Error saving to local storage:', e);
			}
		}
	}

	// Switch current list (for mobile view) with smooth transition
	function switchList(list: FoodGroupLabel) {
		if (list === currentList) return;

		// Add a subtle fade effect by temporarily reducing opacity
		const listItems = document.querySelector('.list-items') as HTMLElement;
		if (listItems) {
			listItems.style.opacity = '0.5';
			listItems.style.transform = 'translateY(5px)';

			setTimeout(() => {
				currentList = list;
				listItems.style.opacity = '1';
				listItems.style.transform = 'translateY(0)';
			}, 100);
		} else {
			currentList = list;
		}
	}

	// Add new item to list
	function addItem() {
		// Validate input
		if (!newItemText.trim()) {
			alert('Please enter an item name');
			return;
		}
		if (!newItemEmoji) {
			alert('Please select an emoji');
			return;
		}

		const newItem: FoodItem = {
			text: newItemText.trim().toLowerCase(),
			emoji: newItemEmoji
		};

		// Check if item with same name already exists in this category
		const existingItemIndex = foodItems[currentList].findIndex(
			(item) => item.text.toLowerCase() === newItem.text.toLowerCase()
		);

		if (
			existingItemIndex !== -1 &&
			(editingItemIndex === null || existingItemIndex !== editingItemIndex)
		) {
			alert(`An item with the name "${newItem.text}" already exists in this list`);
			return;
		}

		if (editingItemIndex !== null) {
			// Edit existing item
			foodItems[currentList][editingItemIndex] = newItem;
		} else {
			// Add new item
			foodItems[currentList] = [...foodItems[currentList], newItem];
		}

		// Reset form
		newItemText = '';
		newItemEmoji = '';
		isAddingItem = false;
		editingItemIndex = null;

		// Save changes
		saveToLocalStorage();

		// Schedule scroll to the newly added item
		setTimeout(() => {
			scrollToLatestItem();
		}, 100);
	}

	// Scroll to the latest added item
	function scrollToLatestItem() {
		if (browser) {
			const listContainer = document.querySelector('.list-items');
			if (listContainer && !editingItemIndex) {
				listContainer.scrollTop = listContainer.scrollHeight;
			}
		}
	}

	// Delete item from list
	function deleteItem(group: FoodGroupLabel, index: number) {
		if (!shouldHandleInteraction()) return;

		// Show confirmation modal
		itemToDelete = {
			group,
			index,
			item: foodItems[group][index]
		};
		showDeleteModal = true;
	}

	function confirmDeleteItem() {
		if (itemToDelete) {
			foodItems[itemToDelete.group] = foodItems[itemToDelete.group].filter(
				(_, i) => i !== itemToDelete!.index
			);
			saveToLocalStorage();
		}
		showDeleteModal = false;
		itemToDelete = null;
	}

	function cancelDeleteItem() {
		showDeleteModal = false;
		itemToDelete = null;
	}

	// Edit existing item
	function editItem(group: FoodGroupLabel, index: number) {
		if (!shouldHandleInteraction()) return;

		const item = foodItems[group][index];
		newItemText = item.text;
		newItemEmoji = item.emoji;
		editingItemIndex = index;
		currentList = group;
		isAddingItem = true;
	}

	// Check if interactions should be handled
	function shouldHandleInteraction() {
		// Don't handle interactions if adding an item, editing an item, or delete modal is open
		return !isAddingItem && editingItemIndex === null && !showDeleteModal;
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!shouldHandleInteraction() && event.key !== 'Escape') return;

		// Handle navigation keys
		if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'l') {
			event.preventDefault();
			goto('/spinner');
		} else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'h') {
			// Already on lists page, no action needed
		} else if (event.key === 'Escape') {
			if (isAddingItem) {
				isAddingItem = false;
				editingItemIndex = null;
				newItemText = '';
				newItemEmoji = '';
			}
		}
	}

	function toggleResetModal() {
		showResetModal = !showResetModal;
	}

	function resetAllLists() {
		// Reset to default items
		foodItems = {
			protein: [...FOOD_ITEMS.protein],
			carb: [...FOOD_ITEMS.carb],
			veggie: [...FOOD_ITEMS.veggie]
		};
		saveToLocalStorage();
		showResetModal = false;
	}

	onMount(() => {
		loadFromLocalStorage();
		checkIfDesktop();

		// Initialize swipe handler
		swipeHandler = new SwipeNavigationHandler({
			currentPage: '/lists',
			options: {
				shouldDisableSwipe: () => showResetModal || showDeleteModal || isAddingItem
			}
		});

		// Set up resize listener for responsive design
		if (browser) {
			window.addEventListener('resize', checkIfDesktop);
			document.addEventListener('keydown', handleKeydown);
		}

		// Attach swipe handlers to document
		const swipeCleanup = swipeHandler.attachToElement(document);

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkIfDesktop);
				document.removeEventListener('keydown', handleKeydown);
			}
			swipeCleanup();
		};
	});

	// Common emojis for quick selection
	const emojiSuggestions = {
		protein: ['🐔', '🍗', '🥩', '🐟', '🦃', '🥚', '🧀', '🫘'],
		carb: ['🍚', '🍝', '🍞', '🥔', '🌽', '🫘', '🍠', '🌾'],
		veggie: ['🥦', '🥬', '🍅', '🥕', '🫑', '🍆', '🥒', '🌱']
	};
</script>

<svelte:head>
	<title>Food Lists</title>
	<meta name="theme-color" content="#f5f5f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#f5f5f5" />
</svelte:head>

<main class="receipt-page">
	<div class="page-header">
		<BackButton href="/" text="← Back to Spinner" />
	</div>

	<!-- Receipt styled lists -->
	<div class="receipts-container">
		{#if isDesktop}
			<!-- Desktop: 3 receipts side by side -->
			<div class="receipts-grid">
				{#each ['protein', 'carb', 'veggie'] as group}
					<Receipt>
						<div class="receipt-header">
							<h2>WHOLEMEAL</h2>
							<p class="receipt-subtitle">
								<span class="highlighted-list {group === 'protein' ? 'protein-highlight' : group === 'carb' ? 'carb-highlight' : 'veggie-highlight'}">{group === 'protein' ? 'PROTEIN' : group === 'carb' ? 'CARBS' : 'VEGGIES'}</span>
							</p>
						</div>
						<div class="receipt-divider">**********************************</div>
						{#if foodItems[group as FoodGroupLabel].length === 0}
							<div class="empty-state" in:fade>
								<p>NO ITEMS</p>
							</div>
						{:else}
							<div class="receipt-items">
								{#each foodItems[group as FoodGroupLabel] as item, index}
									<div class="item-line" in:fade={{ duration: 300 }}>
										<div class="item-emoji">
											<ReceiptEmoji emoji={item.emoji} size={20} />
										</div>
										<span class="item-text">{item.text}</span>
										<div class="item-actions">
											<button
												class="edit-button"
												onclick={() => editItem(group as FoodGroupLabel, index)}
												title="Edit item"
											>
												(e)
											</button>
											<button
												class="delete-button"
												onclick={() => deleteItem(group as FoodGroupLabel, index)}
												title="Delete item"
											>
												(x)
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<div class="receipt-divider">**********************************</div>
						<div class="receipt-footer">
							<button
								class="action-button"
								onclick={() => {
									currentList = group as FoodGroupLabel;
									isAddingItem = true;
									editingItemIndex = null;
									newItemText = '';
									newItemEmoji = '';
								}}
							>
								ADD ITEM
							</button>
							<button
								class="action-button reset-button"
								onclick={(e) => {
									e.stopPropagation();
									toggleResetModal();
								}}
								title="Reset all lists"
							>
								RESET ALL
							</button>
						</div>
					</Receipt>
				{/each}
			</div>
		{:else}
			<!-- Mobile: single receipt with underlined navigation -->
			<Receipt single>
				<div class="receipt-header">
					<h2>WHOLEMEAL</h2>
					<div class="mobile-nav">
						{#each ['protein', 'carb', 'veggie'] as listType}
							<button
								class="nav-button"
								class:active={currentList === listType}
								onclick={() => switchList(listType as FoodGroupLabel)}
							>
								<span class="emoji-large"></span> <span class="highlighted-list {currentList === listType ? (listType === 'protein' ? 'protein-highlight' : listType === 'carb' ? 'carb-highlight' : 'veggie-highlight') : ''}">{listType === 'protein' ? 'PROTEIN' : listType === 'carb' ? 'CARBS' : 'VEGGIES'}</span>
							</button>
						{/each}
					</div>
				</div>
				<div class="receipt-divider">**********************************</div>

				{#if foodItems[currentList].length === 0}
					<div class="empty-state" in:fade>
						<p>NO ITEMS</p>
					</div>
				{:else}
					<div class="receipt-items">
						{#each foodItems[currentList] as item, index}
							<div class="item-line" in:fade={{ duration: 300 }}>
								<div class="item-emoji">
									<ReceiptEmoji emoji={item.emoji} size={20} />
								</div>
								<span class="item-text">{item.text}</span>
								<div class="item-actions">
									<button
										class="edit-button"
										onclick={() => editItem(currentList, index)}
										title="Edit item"
									>
										(e)
									</button>
									<button
										class="delete-button"
										onclick={() => deleteItem(currentList, index)}
										title="Delete item"
									>
										(x)
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="receipt-divider">**********************************</div>
				<div class="receipt-footer">
					<button
						class="action-button"
						onclick={() => {
							isAddingItem = true;
							editingItemIndex = null;
							newItemText = '';
							newItemEmoji = '';
						}}
					>
						ADD ITEM
					</button>
					<button
						class="action-button reset-button"
						onclick={(e) => {
							e.stopPropagation();
							toggleResetModal();
						}}
						title="Reset all lists"
					>
						RESET ALL
					</button>
				</div>
			</Receipt>
		{/if}
	</div>

	<!-- Add/Edit Item Modal -->
	{#if isAddingItem}
		<!-- Using dialog element with proper semantics instead of div -->
		<dialog class="modal-overlay" open aria-modal="true">
			<!-- Using article as a semantically appropriate container -->
			<article class="modal" in:slide={{ duration: 300 }}>
				<!-- Close button at the top -->
				<button
					type="button"
					class="modal-close-button"
					aria-label="Close dialog"
					onclick={() => {
						isAddingItem = false;
						editingItemIndex = null;
					}}
				>
					✕
				</button>
				<h3>{editingItemIndex !== null ? 'Edit' : 'Add'} {currentList} Item</h3>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						addItem();
					}}
				>
					<div class="form-group">
						<label for="item-text">Name:</label>
						<input
							type="text"
							id="item-text"
							bind:value={newItemText}
							placeholder="Enter item name"
							autocomplete="off"
							required

						/>
						<small class="helper-text">Name must be unique within this category</small>
					</div>

					<div class="form-group">
						<label for="item-emoji">Emoji:</label>
						<input
							type="text"
							id="item-emoji"
							bind:value={newItemEmoji}
							placeholder="Select emoji or type one"
							maxlength="5"
							required
						/>
						<small class="helper-text">Click an emoji below or type your own</small>
					</div>

					<div class="emoji-suggestions">
						{#each emojiSuggestions[currentList] as emoji}
							<button type="button" class="emoji-button" onclick={() => (newItemEmoji = emoji)}>
								{emoji}
							</button>
						{/each}
					</div>

					<div class="form-actions">
						<button
							type="button"
							class="cancel-button"
							onclick={() => {
								isAddingItem = false;
								editingItemIndex = null;
							}}
						>
							Cancel
						</button>
						<button type="submit" class="save-button">
							{editingItemIndex !== null ? 'Update' : 'Add'} Item
						</button>
					</div>
				</form>
			</article>
		</dialog>
	{/if}

	<!-- Reset confirmation modal -->
	{#if showResetModal}
		<dialog class="modal-overlay" open aria-modal="true">
			<article class="modal reset-modal" in:slide={{ duration: 300 }}>
				<button
					class="modal-close-button"
					onclick={() => {
						showResetModal = false;
					}}
					aria-label="Close modal"
				>
					✕
				</button>
				<h3>Reset All Lists</h3>
				<p>
					Are you sure you want to reset all food lists? This will restore the original default
					items and remove any custom items you've added.
				</p>
				<div class="form-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={() => {
							showResetModal = false;
						}}
					>
						Cancel
					</button>
					<button type="button" class="delete-button" onclick={resetAllLists}>
						Reset All Lists
					</button>
				</div>
			</article>
		</dialog>
	{/if}

	<!-- Delete item confirmation modal -->
	<!-- Delete confirmation modal -->
	<DeleteModal
		isOpen={showDeleteModal && itemToDelete !== null}
		title="Delete Item"
		message="Are you sure you want to delete"
		confirmText="Delete Item"
		cancelText="Cancel"
		itemName={itemToDelete ? `${itemToDelete.item.emoji} ${itemToDelete.item.text}` : null}
		on:confirm={confirmDeleteItem}
		on:cancel={cancelDeleteItem}
	/>

</main>

<style>

	@media (min-width: 1260px) {
		.page-header {
			max-width: 1200px;
		}
	}

	.receipts-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Desktop: 3 receipts side by side */
	.receipts-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		/* align-items: start; */
	}

	.receipt-subtitle {
		margin: 0.25rem 0;
		font-size: 1.9rem;
		font-weight: bold;
	}

	.emoji-large {
		font-size: 3rem;
	}

	.highlighted-list {
		position: relative;
		padding: 0.1em 0.3em;
		border-radius: 3px;
	}

	.protein-highlight {
		background: linear-gradient(120deg, rgba(255, 165, 0, 0.4) 0%, rgba(255, 140, 0, 0.6) 100%);
		box-shadow: inset 0 -0.2em 0 rgba(255, 140, 0, 0.3);
	}

	.carb-highlight {
		background: linear-gradient(120deg, rgba(139, 69, 19, 0.4) 0%, rgba(160, 82, 45, 0.6) 100%);
		box-shadow: inset 0 -0.2em 0 rgba(139, 69, 19, 0.3);
	}

	.veggie-highlight {
		background: linear-gradient(120deg, rgba(34, 139, 34, 0.4) 0%, rgba(50, 205, 50, 0.6) 100%);
		box-shadow: inset 0 -0.2em 0 rgba(34, 139, 34, 0.3);
	}

	/* Mobile navigation with underlined text */
	.mobile-nav {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 1rem 0;
		padding: 0 1rem;
	}

	.nav-button {
		background: none;
		border: none;
		font-family: inherit;
		font-weight: bold;
		font-size:1.6rem;
		text-transform: uppercase;
		color: #666;
		cursor: pointer;
		padding: 0.5rem 0;
		position: relative;
		transition: color 0.2s ease;
	}

	.nav-button.active {
		color: #333;
	}

	.nav-button.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background-color: #333;
	}

	.nav-button:hover {
		color: #333;
	}

	.action-button {
		display: block;
		width: calc(100% - 0.5rem);
	}

	.reset-button {
		border-color: #999;
		color: #777;
	}

	.reset-button:hover {
		background-color: #d32f2f;
		border-color: #d32f2f;
		color: white;
	}

	/* Modal styles - Receipt themed */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		margin: 0;
		border: none;
		backdrop-filter: blur(2px);
	}

	.modal {
		background-color: #fdfdfd;
		border-radius: 0;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		position: relative;
		box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.1);
		font-family: 'Merchant Copy', 'Courier New', Courier, monospace;
	}

	.modal::after {
		content: '';
		position: absolute;
		bottom: -15px;
		left: 0;
		right: 0;
		height: 30px;
		background:
			linear-gradient(135deg, transparent 75%, #e0e0e0 75%) 0 50%,
			linear-gradient(45deg, transparent 75%, #e0e0e0 75%) 0 50%;
		background-size: 30px 30px;
		background-repeat: repeat-x;
	}

	.modal h3 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		text-transform: uppercase;
		text-align: center;
		font-weight: bold;
		letter-spacing: 0.05em;
	}

	.modal-close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.5rem;
		font-family: inherit;
		color: #999;
		transition: color 0.2s ease;
	}

	.modal-close-button:hover {
		color: #d32f2f;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
		color: #333;
		text-transform: uppercase;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #333;
		border-radius: 0;
		font-size: 1rem;
		box-sizing: border-box;
		font-family: inherit;
		background-color: #fdfdfd;
		text-transform: uppercase;
	}

	.form-group input:focus {
		outline: none;
		border-color: #555;
		background-color: #fff;
	}

	.helper-text {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #666;
		text-transform: none;
	}

	.emoji-suggestions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
		justify-content: center;
	}

	.emoji-button {
		background: #fdfdfd;
		border: 2px solid #333;
		padding: 0.5rem 0.75rem;
		border-radius: 0;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.emoji-button:hover {
		background-color: #333;
		color: #fdfdfd;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 2px dashed #333;
	}

	.cancel-button,
	.save-button {
		padding: 0.75rem 1.5rem;
		border: 2px solid #333;
		border-radius: 0;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.2s ease;
		background-color: transparent;
		color: #333;
	}

	.cancel-button {
		border-color: #999;
		color: #777;
	}

	.save-button {
		background-color: #333;
		color: #fdfdfd;
	}

	.cancel-button:hover {
		background-color: #999;
		color: #fdfdfd;
	}

	.save-button:hover {
		background-color: #555;
		border-color: #555;
	}

	.modal .delete-button {
		background-color: transparent;
		color: #d32f2f;
		border: 2px solid #d32f2f;
		border-radius: 0;
		padding: 0.75rem 1.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: all 0.2s ease;
	}

	.modal .delete-button:hover {
		background-color: #d32f2f;
		color: #fdfdfd;
	}

	.reset-modal {
		text-align: center;
	}

	.reset-modal p {
		margin: 1rem 0 2rem 0;
		color: #666;
		line-height: 1.5;
		text-transform: none;
		font-size: 1rem;
	}

	.reset-modal h3 {
		color: #d32f2f;
		margin-bottom: 1rem;
	}

	.reset-modal::before {
		content: '**********************************';
		display: block;
		text-align: center;
		color: #555;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.reset-modal::after {
		content: '**********************************';
		display: block;
		text-align: center;
		color: #555;
		margin-top: 1rem;
		font-size: 1rem;
	}

	/* Mobile styles */
	@media (max-width: 1259px) {
		main {
			padding: 0.5rem;
		}

		.receipts-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.receipt-header h2 {
			font-size: 2rem;
		}

		.receipt-header p {
			font-size: 1.7rem;
		}

		.receipt-divider {
			font-size: 1.25rem;
		}

		.item-line {
			font-size: 1.25rem;
		}

		.mobile-nav {
			flex-direction: row;
			justify-content: space-around;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.save-button {
			width: 100%;
		}
	}

	/* Desktop adjustments */
	@media (min-width: 1260px) {
		.receipt-header h2 {
			font-size: 1.5rem;
		}

		.receipt-divider {
			font-size: 1rem;
		}

		.item-line {
			font-size: 1rem;
		}

		.action-button {
			display: inline-block;
			width: auto;
			margin: 0.25rem 0.125rem;
		}
	}
</style>
