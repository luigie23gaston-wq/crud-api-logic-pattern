<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CitiesSeeder extends Seeder
{
    public function run()
    {
        $now = now();

        // Regions
        $regions = [
            'NCR', 'Calabarzon', 'Central Luzon'
        ];
        $regionIds = [];
        foreach ($regions as $r) {
            $regionIds[$r] = DB::table('regions')->insertGetId(['name' => $r, 'created_at'=>$now,'updated_at'=>$now]);
        }

        // Provinces (map to region)
        $provinces = [
            ['name'=>'Metro Manila', 'region'=>'NCR'],
            ['name'=>'Rizal', 'region'=>'Calabarzon'],
            ['name'=>'Cavite', 'region'=>'Calabarzon'],
            ['name'=>'Pampanga', 'region'=>'Central Luzon'],
        ];
        $provinceIds = [];
        foreach ($provinces as $p) {
            $provinceIds[$p['name']] = DB::table('provinces')->insertGetId([
                'region_id' => $regionIds[$p['region']] ?? null,
                'name' => $p['name'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Cities with normalized province_id / region_id
        $cities = [
            ['name'=>'Makati','province'=>'Metro Manila','region'=>'NCR','city_type'=>'C'],
            ['name'=>'Manila','province'=>'Metro Manila','region'=>'NCR','city_type'=>'C'],
            ['name'=>'Pasig','province'=>'Metro Manila','region'=>'NCR','city_type'=>'C'],
            ['name'=>'Caloocan','province'=>'Metro Manila','region'=>'NCR','city_type'=>'C'],
            ['name'=>'Antipolo City','province'=>'Rizal','region'=>'Calabarzon','city_type'=>'C'],
            ['name'=>'Mabalacat City','province'=>'Pampanga','region'=>'Central Luzon','city_type'=>'C'],
            ['name'=>'Rodriguez','province'=>'Rizal','region'=>'Calabarzon','city_type'=>'M'],
            ['name'=>'Cainta','province'=>'Rizal','region'=>'Calabarzon','city_type'=>'C'],
            ['name'=>'Cavite City','province'=>'Cavite','region'=>'Calabarzon','city_type'=>'C'],
            ['name'=>'Rizal','province'=>'Rizal','region'=>'Calabarzon','city_type'=>'P'],
        ];

        foreach ($cities as $c) {
            DB::table('cities')->insert([
                'name' => $c['name'],
                'province' => $c['province'],
                'region' => $c['region'],
                'city_type' => $c['city_type'],
                'province_id' => $provinceIds[$c['province']] ?? null,
                'region_id' => $regionIds[$c['region']] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
