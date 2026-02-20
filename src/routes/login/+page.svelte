<script>
  export let error;
  let showPassword = false;
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<main class="flex items-center justify-center h-screen bg-myPrimary">
  <form method="POST" class="w-full max-w-md bg-gray-100 shadow-md rounded px-8 py-6">
    <h3 class="text-xl font-bold text-center mb-6">Login</h3>

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    <div class="mb-4">
      <label for="username" class="block text-gray-700 font-bold mb-2">Username</label>
      <input
        type="text"
        id="username"
        name="username"
        class="appearance border-2 border-gray-300 rounded vrounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

    <div class="mb-6">
      <label for="password" class="block text-gray-700 font-bold mb-2">Password</label>
      <div class="relative">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          class="appearance-none border-2 border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
        <button 
          type="button"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          on:click={() => showPassword = !showPassword}
        >
          {#if showPassword}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <div class="flex justify-center w-full">
      <button
        type="submit"
        class="w-full bg-myPrimary text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Sign in
      </button>
    </div>
    
    <div class="flex justify-center mt-4">
      <a
        href="/form?process=HR_Management.Manage_Password"
        class="text-sm underline transition-colors text-myPrimary hover:text-blue-600"
      >
        Forgot Password?
      </a>
    </div>
    
    <div class="flex pt-4 justify-center">
      <p class="text-sm">Versi 1.0.0</p>
    </div>
  </form>
</main>

<style>
  main {
    font-family: "Inter", sans-serif;
  }
</style>
