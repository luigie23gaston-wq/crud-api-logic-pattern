<!-- Modal: Clear History -->
<div id="clear-history-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/40">
  <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
    <h3 class="text-lg font-semibold text-slate-800">Clear Search History</h3>
    <p class="mt-3 text-sm text-slate-600">Are you sure you want to clear all the search history? This action cannot be undone.</p>

    <div class="mt-6 flex justify-end space-x-3">
      <button id="clear-history-cancel" type="button" class="px-4 py-2 rounded-lg bg-gray-100 text-slate-700 hover:bg-gray-200">Cancel</button>

      <form id="clear-history-form" method="POST" action="{{ route('admin.history.clear') }}">
        @csrf
        <button id="clear-history-confirm" type="submit" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Yes, clear</button>
      </form>
    </div>
  </div>
</div>
