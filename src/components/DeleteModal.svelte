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
	}

	.modal {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-close-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		color: #666;
		transition: color 0.2s ease;
	}

	.modal-close-button:hover {
		color: #333;
	}

	.delete-modal {
		max-width: 400px;
	}

	.delete-modal h3 {
		color: #ff4444;
		margin-bottom: 1rem;
		margin-top: 0;
	}

	.delete-modal p {
		margin: 1rem 0;
		color: #666;
		line-height: 1.5;
	}

	.delete-modal strong {
		color: #333;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.cancel-button,
	.delete-button {
		padding: 0.75rem 1.5rem;
		border-radius: 5px;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.2s ease;
		border: none;
	}

	.cancel-button {
		background-color: #f0f0f0;
	}

	.delete-button {
		background-color: #ff4444;
		color: white;
		opacity: 0.7;
	}

	.cancel-button:hover {
		background-color: #e0e0e0;
	}

	.delete-button:hover {
		background-color: #cc0000;
		opacity: 1;
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
