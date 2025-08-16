<script lang="ts">
	export let single = false;
	let className = '';
	export { className as class };
</script>

<div class="receipt-container {className}" class:single>
	<div class="receipt">
		<slot />
	</div>
</div>

<style>
	.receipt-container {
		background: #fdfdfd;
		padding: 1.5rem;
		box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.1);
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 400px;
	}

	.receipt {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.receipt-container::after {
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

	/* Single: fixed-width receipt */
	.receipt-container.single {
		max-width: 380px;
		margin: 0 auto;
	}


</style>
