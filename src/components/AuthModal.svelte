<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { browser } from '$app/environment';
    
    // Props
    let { isOpen = false } = $props();
    
    // Create event dispatcher
    const dispatch = createEventDispatcher();
    
    function dispatchClose(event?: MouseEvent | KeyboardEvent) {
        console.log('AuthModal: Close button clicked');
        // Stop propagation to prevent document-level click handlers from firing
        if (event) {
            event.stopPropagation();
        }
        dispatch('close');
    }
    
    function dispatchDataChange() {
        console.log('AuthModal: Data change event');
        dispatch('dataChange');
    }
    
    // Authentication state
    let isAuthenticated = $state(false);
    let username = $state('');
    let password = $state('');
    let errorMessage = $state('');
    let showDeleteConfirm = $state(false);
    
    // Form state
    let isLoading = $state(false);
    
    function close(event?: MouseEvent | KeyboardEvent) {
        dispatchClose(event);
    }
    
    // Load auth state from localStorage
    onMount(() => {
        if (browser) {
            const storedData = localStorage.getItem('mealPlanner') || '{}';
            try {
                const data = JSON.parse(storedData);
                isAuthenticated = data.auth?.isLoggedIn || false;
                username = data.auth?.username || '';
            } catch (e) {
                console.error('Error loading auth state:', e);
            }
        }
    });
    
    // Sign in
    async function signIn() {
        errorMessage = '';
        if (!username.trim()) {
            errorMessage = 'Username is required';
            return;
        }
        
        // Demo auth - just store the username
        isLoading = true;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        isAuthenticated = true;
        
        if (browser) {
            const storedData = localStorage.getItem('mealPlanner') || '{}';
            try {
                const data = JSON.parse(storedData);
                data.auth = {
                    isLoggedIn: true,
                    username: username.trim()
                };
                localStorage.setItem('mealPlanner', JSON.stringify(data));
            } catch (e) {
                console.error('Error saving auth state:', e);
            }
        }
        
        isLoading = false;
    }
    
    // Sign out
    async function signOut() {
        isLoading = true;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        isAuthenticated = false;
        
        if (browser) {
            const storedData = localStorage.getItem('mealPlanner') || '{}';
            try {
                const data = JSON.parse(storedData);
                data.auth = {
                    isLoggedIn: false,
                    username: null
                };
                localStorage.setItem('mealPlanner', JSON.stringify(data));
            } catch (e) {
                console.error('Error saving auth state:', e);
            }
        }
        
        isLoading = false;
    }
    
    // Delete account and data
    async function deleteAccount() {
        isLoading = true;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Clear all user data
        if (browser) {
            const storedData = localStorage.getItem('mealPlanner') || '{}';
            try {
                const data = JSON.parse(storedData);
                // Keep default food items but clear user data
                data.auth = {
                    isLoggedIn: false,
                    username: null
                };
                data.customFoodItems = {
                    protein: [],
                    carb: [],
                    veggie: []
                };
                data.combos = [];
                localStorage.setItem('mealPlanner', JSON.stringify(data));
            } catch (e) {
                console.error('Error clearing user data:', e);
            }
        }
        
        isAuthenticated = false;
        showDeleteConfirm = false;
        isLoading = false;
        
        // Notify success
        dispatchDataChange();
    }
    
    // Export data as JSON
    function exportData() {
        if (!browser) return;
        
        const storedData = localStorage.getItem('mealPlanner') || '{}';
        
        try {
            // Create a data URL from the JSON data
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(storedData);
            
            // Create a download link and trigger click
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "mealplanner_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (e) {
            console.error('Error exporting data:', e);
            errorMessage = 'Failed to export data';
        }
    }
</script>

<!-- Global keyboard handler for Escape key -->
<svelte:window onkeydown={(e) => isOpen && e.key === 'Escape' && dispatchClose(e)} />

{#if isOpen}
    <!-- Modal dialog with proper accessibility structure -->
    <div class="modal-backdrop" in:fade={{ duration: 200 }}>
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            in:slide={{ duration: 300 }}
        >
            <div class="modal-header">
                <h2>{isAuthenticated ? 'Account' : 'Sign In'}</h2>
                <button
                    type="button"
                    class="close-button"
                    onclick={(event) => dispatchClose(event)}
                    aria-label="Close dialog"
                >
                    ✕
                </button>
            </div>
            
            <div class="modal-content">
                {#if isAuthenticated}
                    <!-- Signed in view -->
                    <div class="account-info">
                        <div class="user-icon">👤</div>
                        <p class="username">{username}</p>
                    </div>
                    
                    <div class="button-group">
                        <button class="primary-button" onclick={exportData}>
                            Download Data
                        </button>
                        
                        <button class="secondary-button" onclick={signOut} disabled={isLoading}>
                            {#if isLoading}Signing Out...{:else}Sign Out{/if}
                        </button>
                        
                        {#if !showDeleteConfirm}
                            <button class="danger-button" onclick={() => showDeleteConfirm = true}>
                                Delete Account & Data
                            </button>
                        {:else}
                            <div class="confirm-delete" in:slide={{ duration: 200 }}>
                                <p>Are you sure? This will delete all your custom items and saved combinations.</p>
                                <div class="confirm-buttons">
                                    <button class="cancel-button" onclick={() => showDeleteConfirm = false}>
                                        Cancel
                                    </button>
                                    <button class="confirm-button" onclick={deleteAccount} disabled={isLoading}>
                                        {#if isLoading}Deleting...{:else}Confirm Delete{/if}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Sign in form -->
                    <form onsubmit={(e) => { e.preventDefault(); signIn(); }}>
                        {#if errorMessage}
                            <div class="error-message" in:slide={{ duration: 200 }}>
                                {errorMessage}
                            </div>
                        {/if}
                        
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                bind:value={username}
                                placeholder="Enter username" 
                                required
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                bind:value={password}
                                placeholder="Enter password (demo: any password works)" 
                            />
                            <p class="hint">This is a demo - any username/password will work</p>
                        </div>
                        
                        <button type="submit" class="primary-button" disabled={isLoading}>
                            {#if isLoading}Signing In...{:else}Sign In{/if}
                        </button>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }
    
    .modal {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .modal-content {
        padding: 1.5rem;
    }
    
    .account-info {
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .user-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        color: #2196F3;
    }
    
    .username {
        font-size: 1.25rem;
        margin: 0;
        font-weight: bold;
    }
    
    .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }
    
    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 1rem;
    }
    
    .hint {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #666;
        font-style: italic;
    }
    
    .error-message {
        background-color: #ffebee;
        color: #c62828;
        padding: 0.75rem;
        border-radius: 5px;
        margin-bottom: 1.5rem;
    }
    
    .primary-button,
    .secondary-button,
    .danger-button,
    .cancel-button,
    .confirm-button {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    
    .primary-button {
        background-color: #2196F3;
        color: white;
    }
    
    .primary-button:hover {
        background-color: #1976D2;
    }
    
    .secondary-button {
        background-color: #f0f0f0;
    }
    
    .secondary-button:hover {
        background-color: #e0e0e0;
    }
    
    .danger-button {
        background-color: #ffebee;
        color: #c62828;
    }
    
    .danger-button:hover {
        background-color: #ffcdd2;
    }
    
    .confirm-delete {
        background-color: #ffebee;
        padding: 1rem;
        border-radius: 5px;
        margin-top: 0.5rem;
    }
    
    .confirm-delete p {
        margin-top: 0;
    }
    
    .confirm-buttons {
        display: flex;
        gap: 1rem;
    }
    
    .cancel-button {
        background-color: #e0e0e0;
    }
    
    .cancel-button:hover {
        background-color: #d0d0d0;
    }
    
    .confirm-button {
        background-color: #c62828;
        color: white;
    }
    
    .confirm-button:hover {
        background-color: #b71c1c;
    }
    
    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
