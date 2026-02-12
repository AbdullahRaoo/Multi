<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Operator extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'employee_id',
        'department',
        'contact_number',
        'login_pin',
    ];

    protected $hidden = [
        'login_pin',
    ];
}
