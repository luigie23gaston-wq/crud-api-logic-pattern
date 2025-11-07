<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WeatherSearch;

class WeatherHistoryController extends Controller
{
    public function index(Request $request)
    {
        // paginate 10 per page so UI and pagination align
        $searches = WeatherSearch::latest()->paginate(10);

        // If this is an AJAX request, return rendered partials as JSON
        if ($request->ajax() || $request->wantsJson()) {
            $itemsHtml = view('admin._history_items', compact('searches'))->render();
            $paginationHtml = view('admin._history_pagination', compact('searches'))->render();

            return response()->json([
                'ok' => true,
                'items_html' => $itemsHtml,
                'pagination_html' => $paginationHtml,
                'meta' => [
                    'current_page' => $searches->currentPage(),
                    'last_page' => $searches->lastPage(),
                    'per_page' => $searches->perPage(),
                    'total' => $searches->total(),
                ],
            ]);
        }

        return view('admin.history', compact('searches'));
    }

    public function destroy(WeatherSearch $weatherSearch)
    {
        $weatherSearch->delete();
        return back()->with('success','Record deleted.');
    }

    public function clearAll()
    {
        WeatherSearch::truncate();
        $msg = 'All history cleared.';
        // Return JSON for AJAX requests to support AJAX clearing
        if (request()->ajax() || request()->wantsJson()) {
            return response()->json(['ok' => true, 'message' => $msg]);
        }

        return back()->with('success', $msg);
    }
}
