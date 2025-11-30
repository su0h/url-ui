<script>
  import { onMount } from 'svelte';
  import { token, email, API_URL } from '$lib/auth';
  import { goto } from '$app/navigation';
  import Modal from '$lib/components/Modal.svelte'; 

  let links = [];
  let stats = { totalLinks: 0, totalClicks: 0 };
  let newTargetUrl = '';
  let newCustomCode = '';
  
  let expandedShortCode = null;
  let clickDetailsCache = {};
  let isLoadingDetails = false;

  // Modal State
  let modalState = {
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {}
  };

  onMount(() => {
    if (!$token) goto('/');
    else fetchData();
  });

  // --- Helper Functions for Modals ---
  function showAlert(title, message) {
    modalState = { isOpen: true, type: 'alert', title, message, onConfirm: () => {} };
  }

  function showConfirm(title, message, callback) {
    modalState = { isOpen: true, type: 'confirm', title, message, onConfirm: callback };
  }

  function closeModal() {
    modalState.isOpen = false;
  }
  // -----------------------------------

  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/links`, {
        headers: { 'Authorization': `Bearer ${$token}` }
      });
      if (res.ok) {
        const data = await res.json();
        links = data.links;
        stats = { totalLinks: data.totalLinks, totalClicks: data.totalClicks };
      }
    } catch (e) { console.error(e); }
  }

  async function createLink() {
    const body = { targetUrl: newTargetUrl };
    if (newCustomCode) body.customCode = newCustomCode;

    const res = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${$token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      newTargetUrl = '';
      newCustomCode = '';
      fetchData();
    } else {
      const data = await res.json();
      showAlert('Error Creating Link', data.message || 'Failed to create link');
    }
  }

  async function deleteLink(shortCode) {
    showConfirm('Delete Link?', `Are you sure you want to delete ${shortCode}? This cannot be undone.`, async () => {
        await fetch(`${API_URL}/links/${shortCode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${$token}` }
        });
        fetchData();
    });
  }

  async function toggleDetails(shortCode) {
    if (expandedShortCode === shortCode) {
        expandedShortCode = null;
        return;
    }
    expandedShortCode = shortCode;

    if (!clickDetailsCache[shortCode]) {
        isLoadingDetails = true;
        try {
            const res = await fetch(`${API_URL}/analytics/details/${shortCode}`, {
                headers: { 'Authorization': `Bearer ${$token}` }
            });
            if (res.ok) clickDetailsCache[shortCode] = await res.json();
        } finally { isLoadingDetails = false; }
    }
  }

  function logout() {
    token.set(null);
    email.set(null);
    goto('/');
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleString();
  }
</script>

<Modal 
  isOpen={modalState.isOpen} 
  type={modalState.type} 
  title={modalState.title} 
  message={modalState.message} 
  onConfirm={modalState.onConfirm}
  onClose={closeModal} 
/>

<div class="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
  <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
    <div class="text-xl font-bold text-black flex items-center gap-2">
        <span class="font-bebas text-5xl tracking-tight">OURLS</span>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-gray-500 text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-sm">{$email}</span>
      <button on:click={logout} class="text-black hover:text-gray-600 font-bold text-sm uppercase tracking-wide transition">Logout</button>
    </div>
  </nav>

  <main class="max-w-5xl mx-auto mt-8 p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="bg-white p-6 rounded shadow-sm border-l-4 border-black">
        <div class="text-gray-500 text-xs uppercase font-bold tracking-wider">Active Links</div>
        <div class="text-4xl font-bold text-black mt-2">{stats.totalLinks}</div>
      </div>
      <div class="bg-white p-6 rounded shadow-sm border-l-4 border-gray-400">
        <div class="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Traffic</div>
        <div class="text-4xl font-bold text-black mt-2">{stats.totalClicks}</div>
      </div>
    </div>

    <div class="bg-white p-6 rounded shadow-sm mb-8 border border-gray-100">
      <h2 class="text-lg font-bold mb-4 text-black tracking-wide text-2xl">CREATE NEW LINK</h2>
      <div class="flex flex-col md:flex-row gap-3">
        <input bind:value={newTargetUrl} placeholder="https://very-long-url.com/..." class="flex-grow p-3 border-2 border-gray-100 rounded focus:border-black outline-none transition-colors" />
        <input bind:value={newCustomCode} placeholder="Custom Code (opt)" class="md:w-48 p-3 border-2 border-gray-100 rounded focus:border-black outline-none transition-colors" />
        <button on:click={createLink} class="bg-black text-white px-8 py-3 rounded font-bold hover:bg-gray-800 transition shadow-lg uppercase tracking-wider text-sm">
            Shorten
        </button>
      </div>
    </div>

    <div class="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th class="p-4 border-b border-gray-200">Short URL</th>
            <th class="p-4 border-b border-gray-200 w-1/2">Target URL</th>
            <th class="p-4 border-b border-gray-200 text-center">Clicks</th>
            <th class="p-4 border-b border-gray-200 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each links as link}
            <tr class="hover:bg-gray-50 transition group {expandedShortCode === link.shortCode ? 'bg-gray-50' : ''}">
              <td class="p-4">
                <a href={link.shortUrl} target="_blank" class="text-black font-bold hover:underline flex items-center gap-2 group-hover:text-gray-700 transition">
                    {link.shortCode}
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </td>
              <td class="p-4">
                <div class="truncate max-w-md text-gray-500 text-sm font-mono" title={link.targetUrl}>
                    {link.targetUrl}
                </div>
              </td>
              <td class="p-4 text-center">
                <span class="bg-black text-white py-1 px-3 rounded-full text-xs font-bold shadow-sm">{link.clickCount}</span>
              </td>
              <td class="p-4 text-right space-x-3">
                <button 
                    on:click={() => toggleDetails(link.shortCode)} 
                    class="text-xs font-bold uppercase tracking-wider {expandedShortCode === link.shortCode ? 'text-black' : 'text-gray-400 hover:text-black'} transition">
                    {expandedShortCode === link.shortCode ? 'Close' : 'Stats'}
                </button>
                <span class="text-gray-200">|</span>
                <button on:click={() => deleteLink(link.shortCode)} class="text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-red-600 transition">Delete</button>
              </td>
            </tr>

            {#if expandedShortCode === link.shortCode}
                <tr>
                    <td colspan="4" class="bg-white p-0 border-b-2 border-black">
                        <div class="p-6 bg-gray-50 inner-shadow">
                            <h3 class="font-bold text-black mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-xl">
                                Traffic Analysis
                                {#if isLoadingDetails}
                                    <span class="text-xs text-gray-400 font-sans font-normal normal-case animate-pulse">(Loading...)</span>
                                {/if}
                            </h3>
                            
                            {#if clickDetailsCache[link.shortCode] && clickDetailsCache[link.shortCode].length > 0}
                                <div class="overflow-hidden border border-gray-200 rounded bg-white shadow-sm">
                                    <table class="w-full text-sm">
                                        <thead class="bg-black text-white text-xs uppercase font-bold tracking-wider">
                                            <tr>
                                                <th class="p-3 text-left w-1/6">Time</th>
                                                <th class="p-3 text-left w-1/6">IP Address</th>
                                                <th class="p-3 text-left w-1/3">Browser / OS</th>
                                                <th class="p-3 text-left w-1/3">Referer</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100">
                                            {#each clickDetailsCache[link.shortCode] as click}
                                                <tr class="hover:bg-gray-50 font-mono text-xs align-top">
                                                    <td class="p-3 text-gray-900 whitespace-nowrap">{formatDate(click.timestamp)}</td>
                                                    <td class="p-3 text-gray-600">{click.ipAddress || 'Unknown'}</td>
                                                    <!-- UPDATED: Replaced truncate with break-words so full text is visible -->
                                                    <td class="p-3 text-gray-500 break-words whitespace-normal leading-tight">
                                                        {click.userAgent || '-'}
                                                    </td>
                                                    <!-- UPDATED: Added break-all for URLs -->
                                                    <td class="p-3 text-gray-500 break-all whitespace-normal leading-tight">
                                                        {click.referer || 'Direct'}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {:else if !isLoadingDetails}
                                <div class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded text-xs font-bold uppercase tracking-widest">
                                    No detailed data yet
                                </div>
                            {/if}
                        </div>
                    </td>
                </tr>
            {/if}
          {/each}
        </tbody>
      </table>
      {#if links.length === 0}
        <div class="p-12 text-center text-gray-400 flex flex-col items-center border border-t-0 border-gray-200 rounded-b">
            <span class="text-4xl mb-4 grayscale opacity-50">📭</span>
            <p class="text-sm font-bold uppercase tracking-widest">No links active</p>
        </div>
      {/if}
    </div>
  </main>
</div>