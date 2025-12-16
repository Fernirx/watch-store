<?php

namespace App\Http\Controllers;

use App\Services\BrandService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class BrandController extends Controller
{
    protected BrandService $brandService;

    public function __construct(BrandService $brandService)
    {
        $this->brandService = $brandService;
    }

    /**
     * Lấy danh sách brand
     */
    public function index(): JsonResponse
    {
        try {
            $brands = $this->brandService->getBrands();

            return response()->json([
                'success' => true,
                'data' => $brands,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch brands',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết brand
     */
    public function show(string $id): JsonResponse
    {
        try {
            $brand = $this->brandService->getBrandById((int)$id);

            if (!$brand) {
                return response()->json([
                    'success' => false,
                    'message' => 'Brand not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $brand,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Brand not found',
            ], 404);
        }
    }

    /**
     * Tạo brand mới
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
                'logo' => 'nullable|image|max:2048',
                'country' => 'nullable|string|max:100',
                'website' => 'nullable|url|max:255',
                'is_active' => 'boolean',
            ]);

            $logoFile = $request->hasFile('logo') ? $request->file('logo') : null;

            $brand = $this->brandService->createBrand($validated, $logoFile);

            return response()->json([
                'success' => true,
                'message' => 'Brand created successfully',
                'data' => $brand,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create brand',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật brand
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'string|max:100',
                'description' => 'nullable|string',
                'logo' => 'nullable|image|max:2048',
                'country' => 'nullable|string|max:100',
                'website' => 'nullable|url|max:255',
                'is_active' => 'boolean',
            ]);

            $logoFile = $request->hasFile('logo') ? $request->file('logo') : null;

            $brand = $this->brandService->updateBrand((int)$id, $validated, $logoFile);

            return response()->json([
                'success' => true,
                'message' => 'Brand updated successfully',
                'data' => $brand,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update brand',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa brand
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->brandService->deleteBrand((int)$id);

            return response()->json([
                'success' => true,
                'message' => 'Brand deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete brand',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
