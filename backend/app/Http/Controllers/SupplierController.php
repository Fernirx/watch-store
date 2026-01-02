<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        $suppliers = Supplier::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::with(['products', 'stockTransactions'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $supplier,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:suppliers,name',
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $supplier = Supplier::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Supplier created successfully',
                'data' => $supplier,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['name'])) {
                $message = 'Tên nhà cung cấp "' . $request->input('name') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng tên khác.';
            }

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
                'fields' => isset($errors['name']) ? 'name' : null,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update brand',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255|unique:suppliers,name,' . $id,
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $supplier = Supplier::findOrFail($id);
            $supplier->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully',
                'data' => $supplier,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['name'])) {
                $message = 'Tên nhà cung cấp "' . $request->input('name') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng tên khác.';
            }

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
                'fields' => isset($errors['name']) ? 'name' : null,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update supplier',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        // Check if supplier has associated products
        if ($supplier->products()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete supplier with associated products',
            ], 400);
        }

        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }
}
