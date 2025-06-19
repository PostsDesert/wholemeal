<script lang="ts">
	import { goto } from '$app/navigation';

	export let href: string = '/';
	export let text: string = '← Back';
</script>

<button class="back-button" onclick={() => goto(href)}>
	{text}
</button>

<style>
	.back-button {
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-weight: 500;
		background: none;
		border: none;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0.5rem;
		color: #555;
	}
</style>
