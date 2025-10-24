@php
  // $searches is a LengthAwarePaginator
  $items = $searches instanceof \Illuminate\Contracts\Pagination\Paginator ? $searches->items() : (is_array($searches) ? $searches : []);
  // Safety: ensure up to 10 items rendered
  $items = array_slice($items, 0, 10);
@endphp

@forelse($items as $item)
  {{-- Match the weather search history pill style used in `weather.blade.php` --}}
  <button type="button" class="history-chip" data-city="{{ e($item->city) }}" title="Search {{ e($item->city) }}">
    <div class="flex items-center justify-center w-full">
      <div class="flex flex-col items-center">
        <span class="text-sm font-medium text-slate-800">{{ $item->city }}@if(!empty($item->country)), {{ $item->country }}@endif</span>
  <span class="text-xs text-slate-500 mt-1">{{ $item->created_at ? $item->created_at->setTimezone('Asia/Manila')->format('M d, Y h:i A') : '' }}</span>
      </div>
    </div>
  </button>
@empty
  <div class="p-6 text-center text-slate-600">No search history yet.</div>
@endforelse
