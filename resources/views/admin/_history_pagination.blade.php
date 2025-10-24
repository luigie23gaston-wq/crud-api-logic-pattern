<div class="flex items-center justify-between">
  <div class="text-sm text-slate-600">
    @if($searches->total() > 0)
      Showing {{ $searches->firstItem() }} to {{ $searches->lastItem() }} of {{ $searches->total() }}
    @endif
  </div>

  <nav class="inline-flex items-center space-x-2" aria-label="Pagination">
    @if($searches->onFirstPage())
      <span class="px-3 py-1 rounded-md bg-slate-100 text-slate-400">Prev</span>
    @else
      <a href="{{ $searches->previousPageUrl() }}" class="px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700">Prev</a>
    @endif

    @php
      $current = $searches->currentPage();
      $last = $searches->lastPage();
      $start = max(1, $current - 2);
      $end = min($last, $current + 2);
    @endphp

    @for($p = $start; $p <= $end; $p++)
      @if($p == $current)
        <span class="px-3 py-1 rounded-md bg-sky-500 text-white font-medium">{{ $p }}</span>
      @else
        <a href="{{ $searches->url($p) }}" class="px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700">{{ $p }}</a>
      @endif
    @endfor

    @if($searches->hasMorePages())
      <a href="{{ $searches->nextPageUrl() }}" class="px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700">Next</a>
    @else
      <span class="px-3 py-1 rounded-md bg-slate-100 text-slate-400">Next</span>
    @endif
  </nav>
</div>
