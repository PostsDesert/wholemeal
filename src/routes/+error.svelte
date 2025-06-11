<script lang="ts">
    import { page } from '$app/state';
  </script>

<div class="food-emojis">
    <span class="emoji emoji-1">🍕</span>
    <span class="emoji emoji-2">🍔</span>
    <span class="emoji emoji-3">🍦</span>
    <span class="emoji emoji-4">🍩</span>
    <span class="emoji emoji-5">🌮</span>
  </div>
  
  <div class="error-container">
    <div class="error-content">
      <h1>Error {page.status}</h1>
      <p class="error-message">{page.error?.message || 'An unexpected error occurred'}</p>
    </div>
  </div>
  
  <style>
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
  
    .error-content {
      background-color: #fff;
      padding: 2rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
  
    h1 {
      margin-top: 0;
      color: #e74c3c;
    }
  
    .error-message {
      margin: 1rem 0 0.5rem;
      line-height: 1.5;
      color: #555;
    }

    .food-emojis {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .emoji {
    position: absolute;
    font-size: 5rem;
    opacity: 0.6;
  }

  .emoji-1 {
    top: 15%;
    left: 10%;
    transform: rotate(-25deg);
  }

  .emoji-2 {
    top: 65%;
    right: 15%;
    transform: rotate(30deg);
  }

  .emoji-3 {
    bottom: 10%;
    left: 20%;
    transform: rotate(15deg);
  }

  .emoji-4 {
    top: 30%;
    right: 10%;
    transform: rotate(-15deg);
  }

  .emoji-5 {
    bottom: 25%;
    left: 50%;
    transform: rotate(20deg);
  }

  @media (max-width: 600px) {
    .emoji-5 {
      bottom: 80%;
    }
  }
  </style>
