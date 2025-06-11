<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    onMount(() => {
        // Redirect to spinner page
        goto('/spinner');
    });
</script>

<div>
    Redirecting to Meal Planner...
</div>
