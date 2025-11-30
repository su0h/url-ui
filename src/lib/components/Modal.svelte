<script>
  export let isOpen = false;
  export let title = "Notification";
  export let message = "";
  export let type = "alert"; // 'alert' or 'confirm'
  export let onConfirm = () => {};
  export let onClose = () => {};

  function handleConfirm() {
    onConfirm();
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" on:click={onClose}></div>

    <div class="relative bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 border border-gray-100">
      <h3 class="text-xl font-bold text-gray-900 mb-2 tracking-wide">{title}</h3>
      <p class="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>

      <div class="flex justify-center gap-3">
        {#if type === 'confirm'}
          <button 
            on:click={onClose} 
            class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-wider">
            Cancel
          </button>
        {/if}
        <button 
          on:click={handleConfirm} 
          class="bg-black text-white px-6 py-2 rounded text-sm font-bold hover:bg-gray-800 transition-transform active:scale-95 uppercase tracking-wider shadow-lg">
          {type === 'confirm' ? 'Confirm' : 'Okay'}
        </button>
      </div>
    </div>
  </div>
{/if}