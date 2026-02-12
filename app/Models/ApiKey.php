<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'key',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = [
        'key',
    ];

    /**
     * Generate a new API key.
     */
    public static function generateKey(): string
    {
        return Str::random(64);
    }

    /**
     * Create a new API key with a generated key.
     */
    public static function createWithKey(string $name): self
    {
        return self::create([
            'name' => $name,
            'key' => self::generateKey(),
            'is_active' => true,
        ]);
    }

    /**
     * Validate an API key.
     */
    public static function validate(string $key): ?self
    {
        $apiKey = self::where('key', $key)->where('is_active', true)->first();
        
        if ($apiKey) {
            $apiKey->update(['last_used_at' => now()]);
        }
        
        return $apiKey;
    }
}
