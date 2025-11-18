<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Current Task Orders in Database:\n";
echo "=================================\n\n";

$tasks = \App\Models\TaskItem::select('id', 'title', 'task_section_id', 'order')
    ->orderBy('task_section_id')
    ->orderBy('order')
    ->get();

foreach ($tasks as $task) {
    echo sprintf(
        "ID: %3d | Section: %2d | Order: %2d | Title: %s\n",
        $task->id,
        $task->task_section_id ?? 0,
        $task->order,
        $task->title
    );
}

echo "\n=================================\n";
echo "Total tasks: " . $tasks->count() . "\n";
