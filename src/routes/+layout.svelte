<script>
    let { children, data } = $props();
</script>

{#key data.pathname}
    <div class="page-container">
        {@render children()}
    </div>
{/key}
