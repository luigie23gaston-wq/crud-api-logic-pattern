<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_message_id')->constrained('chat_messages')->onDelete('cascade');
            $table->string('filename'); // original filename
            $table->string('path'); // storage path
            $table->string('mime_type')->nullable();
            $table->integer('size')->nullable(); // file size in bytes
            $table->enum('type', ['image', 'file'])->default('file'); // attachment type
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_attachments');
    }
};
