<?php

namespace App\Http\Controllers;

use App\Services\AddressService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AddressController extends Controller
{
    protected AddressService $addressService;

    public function __construct(AddressService $addressService)
    {
        $this->addressService = $addressService;
    }

    /**
     * Lấy địa chỉ của user hiện tại
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $addresses = $this->addressService->getUserAddresses($request->user()->id);

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
    public function getDefault(Request $request): JsonResponse
    {
        try {
            $address = $this->addressService->getDefaultAddress($request->user()->id);

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
    public function store(Request $request): JsonResponse
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

            $address = $this->addressService->createAddress($request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Address created successfully',
                'data' => $address,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
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
    public function update(Request $request, $id): JsonResponse
    {
        try {
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

            $address = $this->addressService->updateAddress(
                $request->user()->id,
                (int)$id,
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Address updated successfully',
                'data' => $address,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
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
    public function setDefault(Request $request, $id): JsonResponse
    {
        try {
            $address = $this->addressService->setDefaultAddress(
                $request->user()->id,
                (int)$id
            );

            return response()->json([
                'success' => true,
                'message' => 'Default address updated successfully',
                'data' => $address,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (\Exception $e) {
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
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $this->addressService->deleteAddress($request->user()->id, (int)$id);

            return response()->json([
                'success' => true,
                'message' => 'Address deleted successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete address',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
