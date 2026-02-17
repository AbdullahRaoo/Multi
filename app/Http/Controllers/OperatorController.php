<?php

namespace App\Http\Controllers;

use App\Models\Operator;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OperatorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $operators = Operator::latest()->paginate(15);

        return Inertia::render('operators/index', [
            'operators' => $operators,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('operators/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'employee_id' => ['required', 'string', 'max:255', 'unique:operators,employee_id'],
            'department' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'login_pin' => ['required', 'string', 'min:4', 'max:10'],
        ], [
            'full_name.required' => 'Full name is required.',
            'employee_id.required' => 'Employee ID is required.',
            'employee_id.unique' => 'This employee ID already exists.',
            'login_pin.required' => 'Login PIN is required.',
            'login_pin.min' => 'Login PIN must be at least 4 characters.',
            'login_pin.max' => 'Login PIN must not exceed 10 characters.',
        ]);

        Operator::create([
            'full_name' => $validated['full_name'],
            'employee_id' => $validated['employee_id'],
            'department' => $validated['department'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'login_pin' => Hash::make($validated['login_pin']),
        ]);

        return redirect()->route('operators.index')
            ->with('success', 'Operator created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Operator $operator): Response
    {
        return Inertia::render('operators/show', [
            'operator' => $operator,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Operator $operator): Response
    {
        return Inertia::render('operators/edit', [
            'operator' => $operator,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Operator $operator): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'employee_id' => ['required', 'string', 'max:255', 'unique:operators,employee_id,'.$operator->id],
            'department' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'login_pin' => ['nullable', 'string', 'min:4', 'max:10'],
        ], [
            'full_name.required' => 'Full name is required.',
            'employee_id.required' => 'Employee ID is required.',
            'employee_id.unique' => 'This employee ID already exists.',
            'login_pin.min' => 'Login PIN must be at least 4 characters.',
            'login_pin.max' => 'Login PIN must not exceed 10 characters.',
        ]);

        try {
            $updateData = [
                'full_name' => $validated['full_name'],
                'employee_id' => $validated['employee_id'],
                'department' => $validated['department'] ?? null,
                'contact_number' => $validated['contact_number'] ?? null,
            ];

            // Only update login_pin if provided
            if (!empty($validated['login_pin'])) {
                $updateData['login_pin'] = Hash::make($validated['login_pin']);
            }

            $operator->update($updateData);

            return redirect()->route('operators.index')
                ->with('success', 'Operator updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update operator', [
                'operator_id' => $operator->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update operator. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Operator $operator): RedirectResponse
    {
        try {
            DB::transaction(function () use ($operator) {
                // Nullify operator references in tables with RESTRICT / SET NULL FK rules.
                // measurement_results (Electron-created, FK was RESTRICT, now SET NULL)
                // measurement_results_detailed (FK is SET NULL)
                // Do this explicitly so deletion succeeds even before FK migration runs.
                DB::table('measurement_results')
                    ->where('operator_id', $operator->id)
                    ->update(['operator_id' => null]);

                DB::table('measurement_results_detailed')
                    ->where('operator_id', $operator->id)
                    ->update(['operator_id' => null]);

                // inspection_records → ON DELETE CASCADE (handled by DB)
                // measurement_sessions → ON DELETE CASCADE (handled by DB)

                $operator->delete();
            });

            return redirect()->route('operators.index')
                ->with('success', 'Operator deleted successfully.');
        } catch (QueryException $e) {
            Log::error('Failed to delete operator (FK constraint)', [
                'operator_id' => $operator->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('operators.index')
                ->with('error', 'Cannot delete this operator because they have linked records. Please contact an administrator.');
        } catch (\Exception $e) {
            Log::error('Failed to delete operator', [
                'operator_id' => $operator->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('operators.index')
                ->with('error', 'Failed to delete operator. Please try again.');
        }
    }
}
