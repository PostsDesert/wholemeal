<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';
	import { FOOD_ITEMS } from '$lib/food-data';
	import { browser } from '$app/environment';
	import type { FoodGroupLabel, FoodItem } from '$lib/types';
	import AuthModal from '../../components/AuthModal.svelte';
	import DeleteModal from '../../components/DeleteModal.svelte';
	import BackButton from '../../components/BackButton.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';
	import ReceiptEmoji from '../../components/ReceiptEmoji.svelte';
	import Receipt from '../../components/Receipt.svelte';

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
			// Temporarily force desktop mode for testing
			isDesktop = true;
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
	<div class="page-header">
		<BackButton href="/" text="← Back to Spinner" />
	</div>

	<!-- Receipt styled lists -->
	<div class="receipts-container">
		{#if isDesktop}
			<!-- Desktop: 3 receipts side by side -->
			<div class="receipts-grid">
				{#each ['protein', 'carb', 'veggie'] as group}
					<Receipt
						subtitle="{group === 'protein'
							? 'PROTEIN'
							: group === 'carb'
								? 'CARBS'
								: 'VEGGIES'} LIST"
						customDate={new Date().toLocaleDateString()}
						footer={desktopFooterSnippet(group)}
					>
						{#if foodItems[group as FoodGroupLabel].length === 0}
							<div class="empty-state" in:fade>
								<p>NO ITEMS</p>
								{#if isAuthenticated}
									<p>ADD ITEMS BELOW</p>
								{/if}
							</div>
						{:else}
							<div class="receipt-items">
								{#each foodItems[group as FoodGroupLabel] as item, index}
									<div class="item-line" in:fade={{ duration: 300 }}>
										<div class="item-emoji">
											<ReceiptEmoji emoji={item.emoji} size={20} />
										</div>
										<span class="item-text">{item.text}</span>
										{#if isAuthenticated}
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
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</Receipt>
				{/each}
			</div>
		{:else}
			<!-- Mobile: single receipt with underlined navigation -->
			<Receipt
				class="mobile"
				subtitle="{currentList === 'protein'
					? 'PROTEIN'
					: currentList === 'carb'
						? 'CARBS'
						: 'VEGGIES'} LIST"
				customDate={new Date().toLocaleDateString()}
				betweenHeaderAndContent={mobileNavSnippet}
				footer={mobileFooterSnippet}
			>
				{#if foodItems[currentList].length === 0}
					<div class="empty-state" in:fade>
						<p>NO ITEMS</p>
						{#if isAuthenticated}
							<p>ADD ITEMS BELOW</p>
						{/if}
					</div>
				{:else}
					<div class="receipt-items">
						{#each foodItems[currentList] as item, index}
							<div class="item-line" in:fade={{ duration: 300 }}>
								<div class="item-emoji">
									<ReceiptEmoji emoji={item.emoji} size={20} />
								</div>
								<span class="item-text">{item.text}</span>
								{#if isAuthenticated}
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
								{/if}
							</div>
						{/each}
					</div>
				{/if}
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

{#snippet desktopFooterSnippet(group)}
	{#if isAuthenticated}
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
	{/if}
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
{/snippet}

{#snippet mobileNavSnippet()}
	<!-- Mobile navigation with underlined text -->
	<div class="mobile-nav">
		{#each ['protein', 'carb', 'veggie'] as listType}
			<button
				class="nav-button"
				class:active={currentList === listType}
				onclick={() => switchList(listType as FoodGroupLabel)}
			>
				{listType === 'protein' ? 'PROTEIN' : listType === 'carb' ? 'CARBS' : 'VEGGIES'}
			</button>
		{/each}
	</div>
{/snippet}

{#snippet mobileFooterSnippet()}
	{#if isAuthenticated}
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
	{/if}
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
{/snippet}

<style>
	/* --- FONT SETUP --- */
	@font-face {
		font-family: 'Merchant Copy';
		src: url('/fonts/Merchant-Copy.ttf') format('TrueType');
	}

	main {
		min-height: 100vh;
		padding: 1rem;
		font-family: 'Merchant Copy', 'Courier New', Courier, monospace;
		background-color: #f5f5f5;
		color: #333;
	}

	.page-header {
		max-width: 1200px;
		margin: 0 auto 1rem auto;
		text-align: left;
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
		font-size: 0.9rem;
		font-weight: bold;
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

	.empty-state {
		text-align: center;
		padding: 2rem 0;
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
	}

	.receipt-items {
		margin-bottom: 1rem;
	}

	.item-line {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 0.5rem;
		line-height: 1.2;
		font-size: 1rem;
		position: relative;
	}

	.item-text {
		text-transform: uppercase;
		order: 1;
		flex: 1;
	}

	.receipt-items {
		padding: 0;
	}

	.item-line {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 0.5rem;
		line-height: 1.2;
		font-size: 1.25rem;
	}

	.item-text {
		text-transform: uppercase;
		flex: 1;
	}

	.item-emoji {
		padding-right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.item-actions {
		margin-left: auto;
		display: flex;
		gap: 0.25rem;
	}

	.edit-button,
	.delete-button {
		background: none;
		border: none;
		font-family: inherit;
		color: #999;
		cursor: pointer;
		padding: 0 0.25rem;
		font-size: 1rem;
	}

	.edit-button:hover {
		color: #2196f3;
	}

	.delete-button:hover {
		color: #d32f2f;
	}

	.empty-state {
		text-align: center;
		padding: 2rem 0;
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
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
	@media (max-width: 767px) {
		main {
			padding: 0.5rem;
		}

		.receipts-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.item-line {
			font-size: 1.25rem;
		}

		.mobile-nav {
			flex-direction: row;
			justify-content: space-around;
		}

		.nav-button {
			font-size: 0.8rem;
			padding: 0.75rem 0;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.save-button {
			width: 100%;
		}
	}

	/* Mobile styles */
	@media (max-width: 767px) {
		main {
			padding: 0.5rem;
		}

		.receipts-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.item-line {
			font-size: 1.25rem;
		}

		.mobile-nav {
			margin-bottom: 1rem;
		}

		.nav-button {
			font-size: 0.9rem;
			padding: 0.5rem 1rem;
		}
	}

	/* Desktop adjustments */
	@media (min-width: 768px) {
		.item-line {
			font-size: 1rem;
		}
	}
</style>
