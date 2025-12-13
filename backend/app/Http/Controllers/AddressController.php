<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    /**
     * Lấy địa chỉ của user hiện tại
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $addresses = Address::where('user_id', $user->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $addresses,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch addresses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy địa chỉ mặc định
     */
    public function getDefault(Request $request)
    {
        try {
            $user = $request->user();
            $address = Address::where('user_id', $user->id)
                ->where('is_default', true)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $address,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch default address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo địa chỉ mới
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'recipient_name' => 'required|string|max:200',
                'phone' => 'required|string|max:15',
                'street' => 'required|string|max:255',
                'ward' => 'required|string|max:100',
                'city' => 'required|string|max:100',
                'postal_code' => 'nullable|string|max:6',
                'country' => 'nullable|string|max:100',
                'is_default' => 'nullable|boolean',
            ]);

            $user = $request->user();
            $validated['user_id'] = $user->id;

            DB::beginTransaction();

            // Nếu set is_default = true, bỏ default của các địa chỉ khác
            if (isset($validated['is_default']) && $validated['is_default']) {
                Address::where('user_id', $user->id)
                    ->update(['is_default' => false]);
            } else {
                // Nếu là địa chỉ đầu tiên, tự động set default
                $existingCount = Address::where('user_id', $user->id)->count();
                if ($existingCount === 0) {
                    $validated['is_default'] = true;
                }
            }

            $address = Address::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Address created successfully',
                'data' => $address,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật địa chỉ
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $address = Address::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $validated = $request->validate([
                'recipient_name' => 'sometimes|required|string|max:200',
                'phone' => 'sometimes|required|string|max:15',
                'street' => 'sometimes|required|string|max:255',
                'ward' => 'sometimes|required|string|max:100',
                'city' => 'sometimes|required|string|max:100',
                'postal_code' => 'nullable|string|max:6',
                'country' => 'nullable|string|max:100',
                'is_default' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            // Nếu set is_default = true, bỏ default của các địa chỉ khác
            if (isset($validated['is_default']) && $validated['is_default']) {
                Address::where('user_id', $user->id)
                    ->where('id', '!=', $id)
                    ->update(['is_default' => false]);
            }

            $address->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Address updated successfully',
                'data' => $address->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set địa chỉ mặc định
     */
    public function setDefault(Request $request, $id)
    {
        try {
            $user = $request->user();
            $address = Address::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            DB::beginTransaction();

            // Bỏ default của các địa chỉ khác
            Address::where('user_id', $user->id)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);

            // Set địa chỉ này làm default
            $address->update(['is_default' => true]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Default address updated successfully',
                'data' => $address->fresh(),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update default address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa địa chỉ
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $address = Address::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            DB::beginTransaction();

            $wasDefault = $address->is_default;
            $address->delete();

            // Nếu xóa địa chỉ default, set địa chỉ khác làm default
            if ($wasDefault) {
                $nextAddress = Address::where('user_id', $user->id)->first();
                if ($nextAddress) {
                    $nextAddress->update(['is_default' => true]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Address deleted successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}