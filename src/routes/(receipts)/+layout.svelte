<slot />

<style>
	/* --- FONT SETUP --- */
	@font-face {
		font-family: 'Merchant Copy';
		src: url('/fonts/Merchant-Copy.ttf') format('TrueType');
	}

	:global(main.receipt-page) {
		min-height: 100vh;
		padding: 1rem;
		font-family: 'Merchant Copy', 'Courier New', Courier, monospace;
		background-color: #f5f5f5;
		color: #333;
	}

	:global(.page-header) {
		max-width: 380px;
		margin: 0 auto 1rem auto;
		text-align: left;
	}

	/* --- RECEIPT STYLES --- */
	:global(.receipt-header) {
		text-align: center;
		margin-bottom: 1rem;
	}

	:global(.receipt-header h2) {
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-weight: bold;
		text-transform: uppercase;
		font-size: 1.5rem;
		margin: 0;
		letter-spacing: 0.05em;
	}

	:global(.receipt-divider) {
		font-size: 1rem; /* Base desktop size */
		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		margin: 1rem 0;
		color: #555;
	}

	:global(.empty-state) {
		text-align: center;
		padding: 2rem 0;
		color: #666;
		font-size: 1.3rem;
		text-transform: uppercase;
	}

	@media (min-width: 600px) {
        :global(.empty-state) {
            font-size: 1rem;
        }
    }

	:global(.receipt-items) {
		margin-bottom: 1rem;
	}

	:global(.item-line) {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 0.5rem;
		line-height: 1.2;
		font-size: 1rem; /* Base desktop size */
		position: relative;
	}

	:global(.item-text) {
		text-transform: uppercase;
		order: 1;
		flex: 1;
	}

	:global(.item-emoji) {
		padding-right: 0.5rem;
		order: 0;
		line-height: 1;
	}

	:global(.item-actions) {
		display: flex;
		gap: 0.25rem;
		order: 2;
		margin-left: auto;
	}

	:global(.edit-button),
	:global(.delete-button) {
		background: none;
		border: none;
		font-family: inherit;
		color: #999;
		cursor: pointer;
		padding: 0 0.25rem;
		font-size: 1.2rem;
		transition: color 0.2s ease;
	}

	:global(.edit-button:hover) {
		color: #2196f3;
	}

	:global(.delete-button:hover) {
		color: #d32f2f;
	}

	:global(.receipt-footer) {
		text-align: center;
		margin-top: 1rem;
	}

	:global(.action-button) {
		font-family: inherit;
		background-color: transparent;
		border: 2px solid #333;
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-weight: bold;
		text-transform: uppercase;
		transition: all 0.2s ease;
		font-size: 1rem;
		letter-spacing: 0.05em;
		margin: 0.25rem;
		position: relative;
	}

	:global(.action-button:hover) {
		background-color: #333;
		color: #fdfdfd;
	}

	:global(.receipt-note) {
		font-size: 0.9rem;
		color: #888;
		margin: 0.5rem 0;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}

	@media (min-width: 600px) {
		:global(.receipt-note) {
			font-size: 0.9rem;
		}
	}
</style>
