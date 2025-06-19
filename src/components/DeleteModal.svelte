<script lang="ts">
	import { slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		confirm: void;
		cancel: void;
	}>();

	// Props
	export let isOpen: boolean = false;
	export let title: string = 'Delete Item';
	export let message: string = 'Are you sure you want to delete this item?';
	export let confirmText: string = 'Delete';
	export let cancelText: string = 'Cancel';
	export let itemName: string | null = null;

	function handleConfirm() {
		dispatch('confirm');
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="modal-overlay" aria-modal="true">
		<div class="modal delete-modal" in:slide={{ duration: 300 }}>
			<button class="modal-close-button" onclick={handleCancel} aria-label="Close modal">
				✕
			</button>
			<h3>{title}</h3>
			<p>
				{message}
				{#if itemName}
					<strong>{itemName}</strong>?
				{/if}
			</p>
			<div class="form-actions">
				<button type="button" class="cancel-button" onclick={handleCancel}>
					{cancelText}
				</button>
				<button type="button" class="delete-button" onclick={handleConfirm}>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* --- FONT SETUP --- */
	@font-face {
		font-family: 'Merchant Copy';
		src: url('/fonts/Merchant-Copy.ttf') format('TrueType');
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
		box-sizing: border-box;
		backdrop-filter: blur(2px);
	}

	.modal {
		background: #fdfdfd;
		border-radius: 0;
		padding: 2rem;
		position: relative;
		max-width: 400px;
		width: 100%;
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

	.delete-modal {
		text-align: center;
	}

	.delete-modal::before {
		content: '**********************************';
		display: block;
		text-align: center;
		color: #555;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.delete-modal h3 {
		color: #d32f2f;
		margin-bottom: 1rem;
		margin-top: 0;
		font-size: 1.2rem;
		text-transform: uppercase;
		text-align: center;
		font-weight: bold;
		letter-spacing: 0.05em;
	}

	.delete-modal p {
		margin: 1rem 0 2rem 0;
		color: #666;
		line-height: 1.5;
		text-transform: none;
		font-size: 1rem;
	}

	.delete-modal strong {
		color: #333;
		text-transform: uppercase;
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
	.delete-button {
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

	.delete-button {
		background-color: transparent;
		color: #d32f2f;
		border-color: #d32f2f;
	}

	.cancel-button:hover {
		background-color: #999;
		color: #fdfdfd;
	}

	.delete-button:hover {
		background-color: #d32f2f;
		color: #fdfdfd;
	}

	@media (max-width: 767px) {
		.modal {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.delete-button {
			width: 100%;
		}
	}
</style>
