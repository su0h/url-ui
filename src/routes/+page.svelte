<script>
  import { token, email, API_URL } from '$lib/auth';
  import { goto } from '$app/navigation';

  let isRegister = false;
  let username = '';
  let userEmail = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    const endpoint = isRegister ? '/users/register' : '/users/login';
    const body = isRegister 
        ? { username, email: userEmail, password } 
        : { email: userEmail, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      // Save to store
      token.set(data.token);
      email.set(data.email);
      
      goto('/dashboard');
    } catch (e) {
      error = e.message;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded shadow-md w-96">
    <h1 class="text-8xl font-bold text-center font-bebas mb-0 leading-[0.75]"> OURLS</h1>
    <h2 class="text-l mb-6 text-center text-gray-500">an overengineered url shortener</h2>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      {#if isRegister}
        <input class="w-full p-2 border rounded" placeholder="Username" bind:value={username} required />
      {/if}
      <input class="w-full p-2 border rounded" type="email" placeholder="Email" bind:value={userEmail} required />
      <input class="w-full p-2 border rounded" type="password" placeholder="Password" bind:value={password} required />
      
      {#if error}
        <div class="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>
        {/if}

      <button class="w-full bg-black text-white p-2 rounded hover:bg-gray-800 font-bold">
        {isRegister ? 'Sign Up' : 'Log In'}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-600 cursor-pointer hover:underline" on:click={() => isRegister = !isRegister}>
      {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
    </p>
  </div>
</div>