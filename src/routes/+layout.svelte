<script lang="ts">
	import { precomputeEmojiColors } from '$lib/precompute';
	import { onMount } from 'svelte';

	onMount(() => {
		precomputeEmojiColors();
	});

	let { children, data } = $props();
</script>

{#key data.pathname}
	<div class="page-container">
		{@render children()}
	</div>
{/key}

<style>
	.page-container {
		min-height: 100vh;
		min-height: 100dvh;
		width: 100vw;
		position: relative;
		/* Ensure safe areas are respected */
		padding-left: max(var(--safe-area-inset-left, 0px), 0px);
		padding-right: max(var(--safe-area-inset-right, 0px), 0px);
		box-sizing: border-box;
	}
</style>
