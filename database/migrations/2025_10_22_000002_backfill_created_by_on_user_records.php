<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // If there is at least one user, set existing user_records.created_by to the first user's id
        try {
            $firstUserId = DB::table('users')->orderBy('id')->value('id');
            if ($firstUserId) {
                DB::table('user_records')->whereNull('created_by')->update(['created_by' => $firstUserId]);
            }
        } catch (\Exception $e) {
            // If users table doesn't exist yet or any error occurs, silently skip backfill
        }
    }

    public function down()
    {
        // revert backfill by clearing created_by for records that match the backfilled user
        try {
            $firstUserId = DB::table('users')->orderBy('id')->value('id');
            if ($firstUserId) {
                DB::table('user_records')->where('created_by', $firstUserId)->update(['created_by' => null]);
            }
        } catch (\Exception $e) { }
    }
};
