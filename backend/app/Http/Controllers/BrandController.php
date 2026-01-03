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
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if user is admin
            $adminMode = $request->user() && $request->user()->role === 'ADMIN';

            $brands = $this->brandService->getBrands($adminMode);

            return response()->json([
                'success' => true,
                'data' => $brands,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tải danh sách thương hiệu',
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
                    'message' => 'Không tìm thấy thương hiệu',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $brand,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thương hiệu',
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
                'name' => 'required|string|max:100|unique:brands,name',
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
                'message' => 'Tạo thương hiệu thành công',
                'data' => $brand,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['name'])) {
                $message = 'Tên thương hiệu "' . $request->input('name') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng tên khác.';
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
                'message' => 'Không thể tạo thương hiệu',
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
                'name' => 'nullable|string|max:100|unique:brands,name,' . $id,
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
                'message' => 'Cập nhật thương hiệu thành công',
                'data' => $brand,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['name'])) {
                $message = 'Tên thương hiệu "' . $request->input('name') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng tên khác.';
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
                'message' => 'Không thể cập nhật thương hiệu',
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
                'message' => 'Xóa thương hiệu thành công',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa thương hiệu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
