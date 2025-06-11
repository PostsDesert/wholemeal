<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';
	import { FOOD_ITEMS } from '$lib/food-data';
	import { browser } from '$app/environment';
	import type { FoodGroupLabel, FoodItem } from '$lib/types';
	import AuthModal from '../../components/AuthModal.svelte';
	import DeleteModal from '../../components/DeleteModal.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';

	// Auth state
	let isAuthenticated = $state(true);
	let showAuthModal = $state(false);
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
	const DESKTOP_BREAKPOINT = 768; // in pixels

	// Check if we're on desktop
	function checkIfDesktop() {
		if (browser) {
			isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
		}
	}

	// Load food items and auth state from local storage
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

				// Load auth state
				// isAuthenticated = data.auth?.isLoggedIn || false;
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

	// Switch current list (for mobile view)
	function switchList(list: FoodGroupLabel) {
		currentList = list;
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
		// Don't handle interactions if auth modal is open, adding an item, editing an item, or delete modal is open
		return !showAuthModal && !isAddingItem && editingItemIndex === null && !showDeleteModal;
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Don't process keyboard shortcuts if auth modal is open
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
			} else if (!showAuthModal) {
				// Return to spinner only if auth modal is not open
				goto('/spinner');
			}
		}
	}

	// Toggle auth modal
	function toggleAuthModal() {
		showAuthModal = !showAuthModal;
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
				shouldDisableSwipe: () => showAuthModal || showResetModal || showDeleteModal || isAddingItem
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

<main>
	<div class="header">
		<div class="nav-items">
			<button class="back-button" onclick={() => goto('/spinner')}>←</button>
			<h1>Lists</h1>
		</div>
		<div class="header-buttons">
			<button
				class="reset-button"
				onclick={(e) => {
					e.stopPropagation();
					toggleResetModal();
				}}
				title="Reset all lists"
			>
				🗑️
			</button>
			<!-- <button
				class="auth-button"
				onclick={(e) => {
					e.stopPropagation();
					toggleAuthModal();
				}}
				class:authenticated={isAuthenticated}
			>
				👤
			</button> -->
		</div>
	</div>

	<div class="lists-container" class:desktop={isDesktop}>
		{#if isDesktop}
			<!-- Desktop layout: side-by-side columns -->
			<div class="list-columns">
				{#each ['protein', 'carb', 'veggie'] as group}
					<div class="list-column">
						<div class="list-header {group}">
							<h2>
								{group}
								<span class="emoji-icon"
									>{group === 'protein' ? '🐔' : group === 'carb' ? '🍚' : '🥦'}</span
								>
							</h2>
							{#if isAuthenticated}
								<button
									class="add-button"
									onclick={() => {
										currentList = group as FoodGroupLabel;
										isAddingItem = true;
										editingItemIndex = null;
										newItemText = '';
										newItemEmoji = '';
									}}
								>
									+
								</button>
							{/if}
						</div>
						<div class="list-items">
							{#each foodItems[group as FoodGroupLabel] as item, index}
								<div class="list-item" id={`item-${group}-${index}`}>
									<span class="item-emoji">{item.emoji}</span>
									<span class="item-text">{item.text}</span>

									{#if isAuthenticated}
										<div class="item-actions">
											<button
												class="edit-button"
												onclick={() => editItem(group as FoodGroupLabel, index)}
												title="Edit item"
											>
												✏️
											</button>
											<button
												class="delete-button"
												onclick={() => deleteItem(group as FoodGroupLabel, index)}
												title="Delete item"
											>
												🗑️
											</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Mobile layout: single list with navigation -->
			<div class="list-single">
				<div class="list-header {currentList}">
					<h2>
						{currentList}
						<span class="emoji-icon">
							{currentList === 'protein' ? '🐔' : currentList === 'carb' ? '🍚' : '🥦'}
						</span>
					</h2>
					{#if isAuthenticated}
						<button
							class="add-button"
							onclick={() => {
								isAddingItem = true;
								editingItemIndex = null;
								newItemText = '';
								newItemEmoji = '';
							}}
						>
							+
						</button>
					{/if}
				</div>
				<div class="list-items">
					{#each foodItems[currentList] as item, index}
						<div class="list-item" in:fade={{ duration: 50 }} id={`item-${currentList}-${index}`}>
							<span class="item-emoji">{item.emoji}</span>
							<span class="item-text">{item.text}</span>

							{#if isAuthenticated}
								<div class="item-actions">
									<button
										class="edit-button"
										onclick={() => editItem(currentList, index)}
										title="Edit item"
									>
										✏️
									</button>
									<button
										class="delete-button"
										onclick={() => deleteItem(currentList, index)}
										title="Delete item"
									>
										🗑️
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
				<!-- Mobile navigation -->
				<div class="mobile-nav">
					<button
						class="nav-button protein"
						class:active={currentList === 'protein'}
						onclick={() => switchList('protein')}
					>
						🐔
					</button>
					<button
						class="nav-button carb"
						class:active={currentList === 'carb'}
						onclick={() => switchList('carb')}
					>
						🍚
					</button>
					<button
						class="nav-button veggie"
						class:active={currentList === 'veggie'}
						onclick={() => switchList('veggie')}
					>
						🥦
					</button>
				</div>
			</div>
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
							autofocus
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

	<!-- Auth modal with event binding -->
	<AuthModal
		isOpen={showAuthModal}
		on:close={() => {
			console.log('Auth modal close event received');
			showAuthModal = false;
		}}
		on:dataChange={() => {
			console.log('Auth modal data change event received');
			// Refresh data or UI as needed
			if (browser) {
				// const storedData = localStorage.getItem('mealPlanner') || '{}';
				try {
					// const data = JSON.parse(storedData);
					const wasAuthenticated = isAuthenticated;
					isAuthenticated = true; // data.auth?.isLoggedIn || false;

					// If user just signed in, enable edit mode for the current list
					if (!wasAuthenticated && isAuthenticated) {
						console.log('User signed in, enabling edit mode');
						// If on desktop, keep current view
						// If on mobile, make sure we're in a valid view for editing
						if (!isDesktop) {
							currentList = currentList || 'protein';
						}
					}
				} catch (e) {
					console.error('Error refreshing data:', e);
				}
			}
		}}
	/>
</main>

<style>
	main {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 1rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.nav-items {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.header-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.back-button,
	.auth-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
	}

	.auth-button {
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.auth-button.authenticated {
		opacity: 1;
		color: #2196f3;
	}

	.reset-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.reset-button:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
	}

	.lists-container {
		padding: 0 1rem;
	}

	/* Desktop layout */
	.list-columns {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
	}

	.list-column {
		flex: 1;
		background-color: white;
		border-radius: 5px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		max-height: 80vh;
	}

	/* Mobile layout */
	.list-single {
		background-color: white;
		border-radius: 5px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 80vh;
		max-width: 600px;
		margin: 0 auto;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	.list-header h2 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-transform: capitalize;
	}

	.emoji-icon {
		font-size: 1.2em;
	}

	/* Color coding for lists */
	.list-header.protein {
		border-left: 5px solid brown;
	}

	.list-header.carb {
		border-left: 5px solid rgb(141, 90, 98);
	}

	.list-header.veggie {
		border-left: 5px solid green;
	}

	.list-items {
		padding: 0.5rem;
		overflow-y: auto;
		flex: 1;
		scrollbar-width: none;
	}

	.list-item {
		display: flex;
		align-items: center;
		padding: 0.75rem;
		border-radius: 5px;
		margin-bottom: 0.5rem;
		background-color: #f9f9f9;
		position: relative;
	}

	.item-emoji {
		font-size: 1.5rem;
		margin-right: 1rem;
		width: 2rem;
		display: inline-block;
		text-align: center;
	}

	.item-text {
		flex-grow: 1;
		text-transform: capitalize;
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.edit-button,
	.delete-button {
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.edit-button:hover,
	.delete-button:hover {
		opacity: 1;
	}

	/* Mobile navigation */
	.mobile-nav {
		display: flex;
		justify-content: center;
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 2rem;
		margin-top: 1rem;
	}

	.nav-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		transition: all 0.2s ease;
		opacity: 0.6;
	}

	.nav-button.active {
		background-color: #fff;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		transform: scale(1.1);
		opacity: 1;
	}

	.protein.active {
		color: brown;
	}

	.carb.active {
		color: rgb(141, 90, 98);
	}

	.veggie.active {
		color: green;
	}

	/* Modal close button */
	.modal-close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.5rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.modal-close-button:hover {
		opacity: 1;
	}

	/* Add button */
	.add-button {
		background-color: #4caf50;
		color: white;
		border: none;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		line-height: 1;
		padding: 0;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		padding: 0;
		margin: 0;
		width: 100%;
		height: 100%;
		border: none;
	}

	.modal {
		background-color: white;
		padding: 2rem;
		border-radius: 5px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		position: relative;
		overflow-y: auto;
	}

	.modal h3 {
		margin-top: 0;
		text-transform: capitalize;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 5px;
		font-size: 1rem;
	}

	.helper-text {
		color: #666;
		font-size: 0.8rem;
		margin-top: 0.25rem;
		display: block;
	}

	.emoji-suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.emoji-button {
		background: none;
		border: 1px solid #ddd;
		border-radius: 5px;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		transition: transform 0.1s ease;
	}

	.emoji-button:hover {
		transform: scale(1.1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.cancel-button,
	.save-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 5px;
		font-weight: bold;
		cursor: pointer;
	}

	.cancel-button {
		background-color: #f0f0f0;
	}

	.save-button {
		background-color: #4caf50;
		color: white;
	}

	.cancel-button:hover {
		background-color: #e0e0e0;
	}

	.save-button:hover {
		background-color: #45a049;
	}

	.modal .delete-button {
		background-color: #ff4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s ease;
	}

	.modal .delete-button:hover {
		background-color: #cc0000;
	}

	.reset-modal {
		max-width: 400px;
	}

	.reset-modal p {
		margin: 1rem 0;
		color: #666;
		line-height: 1.5;
	}

	.reset-modal h3 {
		color: #ff4444;
		margin-bottom: 1rem;
	}

	@media (max-width: 767px) {
		main {
			padding: 0.5rem;
		}

		.lists-container {
			padding: 0;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.save-button {
			width: 100%;
		}
	}
</style>
