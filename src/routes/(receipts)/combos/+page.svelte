<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import type { FoodItem } from '$lib/types';
	import DeleteModal from '$component/DeleteModal.svelte';
	import { SwipeNavigationHandler } from '$lib/swipe-navigation';

	import ReceiptEmoji from '$component/ReceiptEmoji.svelte';
	import BackButton from '$component/BackButton.svelte';
	import Receipt from '$component/Receipt.svelte';
	import ReceiptFooter from '$component/ReceiptFooter.svelte';

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

	// Delete modal
	let showDeleteModal = $state(false);

	// Swipe navigation handler
	let swipeHandler: SwipeNavigationHandler;

	// Load combos from localStorage on mount
	onMount(() => {
		loadCombos();


		// Initialize swipe handler
		swipeHandler = new SwipeNavigationHandler({
			currentPage: '/combos',
			options: {
				shouldDisableSwipe: () => showDeleteModal
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
		// Don't handle interactions if delete modal is open
		return !showDeleteModal;
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
			if (!showDeleteModal) {
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

</script>

<svelte:head>
	<title>Saved Meals - Receipt</title>
	<meta name="theme-color" content="#f5f5f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#f5f5f5" />
</svelte:head>

<main class="receipt-page">
	<div class="page-header">
		<BackButton href="/spinner" text="← Back to Spinner" />
	</div>

	<!-- Receipt styled list of combos -->
	<Receipt single>
		<div class="receipt-header">
			<h2>WHOLEMEAL</h2>
			<p>Your Saved Combinations</p>
			<p class="date">{new Date().toLocaleString()}</p>
		</div>
		<div class="receipt-divider">**********************************</div>

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

		<div class="receipt-divider">**********************************</div>
		<div class="receipt-footer">
			<div class="action-buttons">
				<button class="action-button" onclick={copyToClipboard}>
					COPY LIST
					{#if copySuccess}
						<span class="success-message"
							><ReceiptEmoji emoji="✓" size={24} pixelation={64} color="#4caf50" /></span
						>
					{/if}
				</button>
				<button class="action-button" onclick={sendEmail}>
					SEND VIA EMAIL
					{#if emailSuccess}
						<span class="success-message"
							><ReceiptEmoji emoji="✓" size={24} pixelation={64} color="#4caf50" /></span
						>
					{/if}
				</button>
				{#if combos.length > 0}
					<button class="action-button clear-button" onclick={showClearConfirmation}>
						CLEAR ALL MEALS
					</button>
				{/if}
			</div>
			<ReceiptFooter></ReceiptFooter>
		</div>
	</Receipt>
</main>

<!-- Delete confirmation modal -->
<DeleteModal
	isOpen={showDeleteModal}
	title="empty-stateClear All Combinations"
	message="Are you sure you want to clear all saved meal combinations? This action cannot be undone."
	confirmText="Clear All"
	cancelText="Cancel"
	on:confirm={clearAllCombos}
	on:cancel={handleDeleteCancel}
/>

<style>
	.receipt-header p {
		margin: 0.25rem 0;
		font-size: 1.15rem;
	}

	.receipt-divider {
		font-size: 1.25rem;
	}
	.receipt-divider.small {
		margin: 0.75rem 0;
	}

	.combo-group {
		margin-bottom: 0.5rem;
	}

	.combo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.15rem;
		/* Mobile: 20px (larger than desktop 16px) */
		color: #666;
		margin-bottom: 0.75rem;
	}

	.delete-button {
		font-size: 1.25rem;
	}

	.item-line {
		font-size: 1.25rem;
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.5rem;
	}

	.clear-button {
		border-color: #999;
		color: #777;
	}
	.clear-button:hover {
		background-color: #d32f2f;
		border-color: #d32f2f;
		color: white;
	}

	.success-message {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: #4caf50;
		font-size: 1.5rem;
		animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes pop-in {
		0% {
			transform: scale(0) translateY(-50%);
		}
		100% {
			transform: scale(1) translateY(-50%);
		}
	}

	/* Desktop styles - apply original sizes for larger screens */
	@media (min-width: 768px) {
		.receipt-header h2 {
			font-size: 1.5rem;
		}

		.receipt-header p {
			font-size: 0.9rem; /* Desktop: 18px */
		}

		.receipt-divider {
			font-size: 1rem; /* Desktop: 20px */
		}

		.combo-header {
			font-size: 0.8rem; /* Desktop: 16px */
		}

		.delete-button {
			font-size: 1rem; /* Desktop: 20px */
		}

		.item-line {
			font-size: 1rem; /* Desktop: 20px */
		}
	}
</style>
