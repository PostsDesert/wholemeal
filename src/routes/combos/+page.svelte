<script lang="ts">
	// ... (The entire <script> block remains exactly the same as before)
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import type { FoodItem } from '$lib/types';
	import { browser } from '$app/environment';
	import AuthModal from '../../components/AuthModal.svelte';
	import DeleteModal from '../../components/DeleteModal.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';

	// --- NEW: IMPORT THE CANVAS EMOJI COMPONENT ---
	import ReceiptEmoji from '../../components/ReceiptEmoji.svelte';
	import BackButton from '../../components/BackButton.svelte';
	import Receipt from '../../components/Receipt.svelte';

	// Combo interface for saved meal combinations
	interface Combo {
		id: string;
		date: string;
		protein: FoodItem;
		carb: FoodItem;
		veggie: FoodItem;
	}

	let combos: Combo[] = $state([]);
	let copySuccess: boolean = $state(false);
	let emailSuccess: boolean = $state(false);

	// Auth modal
	let showAuthModal = $state(false);

	// Delete modal
	let showDeleteModal = $state(false);

	// Auth state
	let isAuthenticated = $state(false);

	// Swipe navigation handler
	let swipeHandler: SwipeNavigationHandler;

	// Load combos from localStorage on mount
	onMount(() => {
		loadCombos();

		// Load auth state
		if (browser) {
			const storedData = localStorage.getItem('mealPlanner') || '{}';
			try {
				const data = JSON.parse(storedData);
				isAuthenticated = data.auth?.isLoggedIn || false;
			} catch (e) {
				console.error('Error loading auth state:', e);
			}
		}

		// Initialize swipe handler
		swipeHandler = new SwipeNavigationHandler({
			currentPage: '/combos',
			options: {
				shouldDisableSwipe: () => showAuthModal || showDeleteModal
			}
		});

		// Attach swipe handlers to document
		const cleanup = swipeHandler.attachToElement(document);

		return cleanup;
	});

	// Load combos from localStorage
	function loadCombos() {
		if (typeof localStorage !== 'undefined') {
			const storedData = localStorage.getItem('mealPlanner');
			if (storedData) {
				try {
					const data = JSON.parse(storedData);
					combos = data.combos || [];
				} catch (e) {
					console.error('Error parsing stored combos:', e);
					combos = [];
				}
			}
		}
	}

	// Save combos to localStorage
	function saveCombos() {
		if (typeof localStorage !== 'undefined') {
			const storedData = localStorage.getItem('mealPlanner') || '{}';
			try {
				const data = JSON.parse(storedData);
				data.combos = combos;
				localStorage.setItem('mealPlanner', JSON.stringify(data));
			} catch (e) {
				console.error('Error saving combos:', e);
			}
		}
	}

	// Delete a combo from the list
	function deleteCombo(id: string) {
		combos = combos.filter((combo) => combo.id !== id);
		saveCombos();
	}

	// Format date for display
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		}).format(date);
	}

	// Copy combos to clipboard
	async function copyToClipboard() {
		const text = combos
			.map((combo) => {
				return (
					`Meal Combo (${formatDate(combo.date)}):\n` +
					`  - ${combo.protein.text} ${combo.protein.emoji}\n` +
					`  - ${combo.carb.text} ${combo.carb.emoji}\n` +
					`  - ${combo.veggie.text} ${combo.veggie.emoji}\n`
				);
			})
			.join('\n');

		try {
			await navigator.clipboard.writeText(text);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	// Clear all combos
	function clearAllCombos() {
		// Clear the local combos array
		combos = [];
		// Remove combos from localStorage
		saveCombos();
		showDeleteModal = false;
	}

	// Show delete confirmation modal
	function showClearConfirmation() {
		showDeleteModal = true;
	}

	// Handle delete modal cancel
	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	// Send combos via email
	function sendEmail() {
		const subject = encodeURIComponent('My Meal Combinations');
		const body = encodeURIComponent(
			combos
				.map((combo) => {
					return (
						`Meal Combo (${formatDate(combo.date)}):\n` +
						`  - ${combo.protein.text} ${combo.protein.emoji}\n` +
						`  - ${combo.carb.text} ${combo.carb.emoji}\n` +
						`  - ${combo.veggie.text} ${combo.veggie.emoji}\n`
					);
				})
				.join('\n\n')
		);

		window.location.href = `mailto:?subject=${subject}&body=${body}`;
		emailSuccess = true;
		setTimeout(() => {
			emailSuccess = false;
		}, 2000);
	}

	// Check if interactions should be handled
	function shouldHandleInteraction() {
		// Don't handle interactions if auth modal or delete modal is open
		return !showAuthModal && !showDeleteModal;
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Don't process keyboard shortcuts if modals are open
		if (!shouldHandleInteraction() && event.key !== 'Escape') return;

		// Ctrl + C to copy to clipboard
		if ((event.ctrlKey || event.metaKey) && event.key === 'c' && shouldHandleInteraction()) {
			event.preventDefault();
			copyToClipboard();
		}

		// Handle navigation keys
		if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'l') {
			// Already on combo page, no action needed
			return;
		} else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'h') {
			// Go to spinner page
			event.preventDefault();
			goto('/spinner');
		} else if (event.key === 'Escape') {
			if (!showAuthModal && !showDeleteModal) {
				// Return to spinner only if no modals are open
				event.preventDefault();
				goto('/spinner');
			}
		}
	}

	// Add keyboard listener
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	// Toggle auth modal
	function toggleAuthModal() {
		showAuthModal = !showAuthModal;
	}
</script>

<svelte:head>
	<title>Saved Meals - Receipt</title>
	<meta name="theme-color" content="#f5f5f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#f5f5f5" />
</svelte:head>

<!-- Auth modal -->
<AuthModal
	isOpen={showAuthModal}
	on:close={() => (showAuthModal = false)}
	on:dataChange={() => {
		/* ... */
	}}
/>

<main>
	<div class="page-header">
		<BackButton href="/spinner" text="← Back to Spinner" />
	</div>

	<!-- Receipt styled list of combos -->
	<div class="receipt-container">
		<Receipt subtitle="Your Saved Combinations" footer={footerSnippet}>
			{#if combos.length === 0}
				<div class="empty-state" in:fade>
					<p>NO SAVED MEALS</p>
					<p>ADD MEALS FROM THE SPINNER PAGE</p>
				</div>
			{:else}
				<div class="receipt-items">
					{#each combos as combo (combo.id)}
						<div class="combo-group" in:fly={{ y: 20, duration: 300 }}>
							<div class="combo-header">
								<span class="item-date">Meal from: {formatDate(combo.date)}</span>
								<button
									class="delete-button"
									onclick={() => deleteCombo(combo.id)}
									aria-label="Delete combo"
								>
									(x)
								</button>
							</div>
							<!-- --- CHANGE: USE THE RECEIPTEMOJI COMPONENT --- -->
							<div class="item-line">
								<span class="item-text">{combo.protein.text}</span>
								<div class="item-emoji">
									<ReceiptEmoji emoji={combo.protein.emoji} size={20} />
								</div>
							</div>
							<div class="item-line">
								<span class="item-text">{combo.carb.text}</span>
								<div class="item-emoji">
									<ReceiptEmoji emoji={combo.carb.emoji} size={20} />
								</div>
							</div>
							<div class="item-line">
								<span class="item-text">{combo.veggie.text}</span>
								<div class="item-emoji">
									<ReceiptEmoji emoji={combo.veggie.emoji} size={20} />
								</div>
							</div>
						</div>
						<div class="receipt-divider small">----------------------------------</div>
					{/each}
				</div>
			{/if}
		</Receipt>
	</div>

	{#snippet footerSnippet()}
		<div class="action-buttons">
			<button class="action-button" onclick={copyToClipboard}>
				COPY LIST
				{#if copySuccess}
					<span class="success-message">✓</span>
				{/if}
			</button>
			<button class="action-button" onclick={sendEmail}>
				SEND VIA EMAIL
				{#if emailSuccess}
					<span class="success-message">✓</span>
				{/if}
			</button>
			{#if combos.length > 0}
				<button class="action-button clear-button" onclick={showClearConfirmation}>
					CLEAR ALL MEALS
				</button>
			{/if}
		</div>
		<p class="receipt-note">Thank you for using WHOLEMEAL!</p>
	{/snippet}
</main>

<!-- Delete confirmation modal -->
<DeleteModal
	isOpen={showDeleteModal}
	title="Clear All Combinations"
	message="Are you sure you want to clear all saved meal combinations? This action cannot be undone."
	confirmText="Clear All"
	cancelText="Cancel"
	on:confirm={clearAllCombos}
	on:cancel={handleDeleteCancel}
/>

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
		max-width: 380px;
		margin: 0 auto 1rem auto;
		text-align: left;
	}

	/* Receipt container wrapper for centering */
	.receipt-container {
		max-width: 380px;
		margin: 0 auto;
	}

	.receipt-divider.small {
		font-size: 1.25rem;
		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		margin: 0.75rem 0;
		color: #555;
	}

	/* Mobile styles */
	@media (max-width: 767px) {
		main {
			padding: 0.5rem;
		}

		.item-line {
			font-size: 1.25rem;
		}

		.receipt-divider.small {
			font-size: 1.25rem;
		}
	}

	.empty-state {
		text-align: center;
		padding: 2rem 0;
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
	}

	.combo-group {
		margin-bottom: 0.5rem;
	}

	.combo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1rem;
		/* Mobile: 20px (larger than desktop 16px) */
		color: #666;
		margin-bottom: 0.75rem;
	}

	.delete-button {
		background: none;
		border: none;
		font-family: inherit;
		color: #999;
		cursor: pointer;
		padding: 0 0.25rem;
		font-size: 1.25rem;
		/* Mobile: 25px (larger than desktop 20px) */
	}
	.delete-button:hover {
		color: #d32f2f;
	}

	.item-line {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 0.5rem;
		line-height: 1.2;
		font-size: 1.25rem;
		/* Mobile: 25px (larger than desktop 20px) */
	}

	.item-text {
		text-transform: uppercase;
		order: 1;
	}

	/* --- CHANGE: CSS filter is no longer needed. This class is now just a wrapper. --- */
	.item-emoji {
		padding-right: 0.5rem;
		order: 0;
		/* We can set a fixed size for the wrapper if needed, but flexbox handles alignment. */
		line-height: 1; /* Helps with vertical alignment */
	}

	.delete-button {
		background: none;
		border: none;
		font-family: inherit;
		color: #999;
		cursor: pointer;
		padding: 0 0.25rem;
		font-size: 1.25rem;
	}

	.delete-button:hover {
		color: #d32f2f;
	}

	.receipt-divider.small {
		font-size: 1.25rem;
		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		margin: 0.75rem 0;
		color: #555;
	}

	/* Mobile styles */
	@media (max-width: 767px) {
		main {
			padding: 0.5rem;
		}

		.item-line {
			font-size: 1.25rem;
		}

		.receipt-divider.small {
			font-size: 1.25rem;
		}
	}

	/* Desktop styles - apply original sizes for larger screens */
	@media (min-width: 768px) {
		.combo-header {
			font-size: 0.8rem; /* Desktop: 16px */
		}

		.delete-button {
			font-size: 1rem; /* Desktop: 20px */
		}

		.item-line {
			font-size: 1rem; /* Desktop: 20px */
		}

		.receipt-divider.small {
			font-size: 1rem;
		}
	}
</style>
