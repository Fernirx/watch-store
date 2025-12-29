<?php

namespace App\Http\Controllers;

use App\Services\ProductService;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    protected ProductService $productService;
    protected CloudinaryService $cloudinaryService;

    public function __construct(ProductService $productService, CloudinaryService $cloudinaryService)
    {
        $this->productService = $productService;
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Lấy danh sách sản phẩm
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->all();

            // Check if user is admin
            $filters['admin_mode'] = $request->user() && $request->user()->role === 'ADMIN';

            $products = $this->productService->getProducts($filters);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết sản phẩm
     */
    public function show(string $id): JsonResponse
    {
        try {
            $product = $this->productService->getProductById((int)$id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thông tin sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo sản phẩm mới
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                // Foreign Keys
                'category_id' => 'required|exists:categories,id',
                'brand_id' => 'required|exists:brands,id',

                // Basic Information
                'code' => 'nullable|string|max:50|unique:products,code',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',

                // Pricing
                'price' => 'required|numeric|min:0',
                'original_price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',

                // Inventory Management
                'stock_quantity' => 'required|integer|min:0',
                'min_stock_level' => 'nullable|integer|min:0',
                'reorder_point' => 'nullable|integer|min:0',

                // Product Details
                'warranty_period' => 'nullable|string|max:50',
                'origin_country' => 'nullable|string|max:100',
                'gender' => 'nullable|in:Nam,Nữ,Unisex',

                // Movement
                'movement_type' => 'nullable|in:Quartz,Automatic,Manual,Solar',
                'movement_name' => 'nullable|string|max:100',
                'power_reserve' => 'nullable|string|max:50',

                // Materials
                'case_material' => 'nullable|string|max:100',
                'strap_material' => 'nullable|string|max:100',
                'glass_material' => 'nullable|string|max:100',

                // Colors
                'dial_color' => 'nullable|string|max:50',
                'case_color' => 'nullable|string|max:50',
                'strap_color' => 'nullable|string|max:50',

                // Water Resistance
                'water_resistance' => 'nullable|string|max:50',

                // Battery
                'battery_type' => 'nullable|string|max:50',
                'battery_voltage' => 'nullable|string|max:20',

                // Technical Specifications
                'case_size' => 'nullable|numeric|min:0',
                'case_thickness' => 'nullable|numeric|min:0',
                'weight' => 'nullable|numeric|min:0',

                // Features & Images
                'features' => 'nullable|string',
                'images' => 'required|array|min:1|max:6',
                'images.*' => 'image|mimes:jpeg,jpg,png,webp|max:2048',
                'primary_image_index' => 'nullable|integer|min:0',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Handle multiple images upload
            if ($request->hasFile('images')) {
                $uploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');

                // Determine primary image index (default to 0)
                $primaryIndex = $request->input('primary_image_index', 0);

                // Mark primary image
                foreach ($uploadedImages as $index => $image) {
                    $uploadedImages[$index]['is_primary'] = ($index === $primaryIndex);
                }

                $validated['images'] = $uploadedImages;
            }

            $product = $this->productService->createProduct($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo sản phẩm thành công',
                'data' => $product->load(['category', 'brand']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật sản phẩm
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                // Foreign Keys
                'category_id' => 'nullable|exists:categories,id',
                'brand_id' => 'nullable|exists:brands,id',

                // Basic Information
                'code' => 'nullable|string|max:50|unique:products,code,' . $id,
                'name' => 'nullable|string|max:255',
                'description' => 'nullable|string',

                // Pricing
                'price' => 'nullable|numeric|min:0',
                'original_price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',

                // Inventory Management
                'stock_quantity' => 'nullable|integer|min:0',
                'min_stock_level' => 'nullable|integer|min:0',
                'reorder_point' => 'nullable|integer|min:0',

                // Product Details
                'warranty_period' => 'nullable|string|max:50',
                'origin_country' => 'nullable|string|max:100',
                'gender' => 'nullable|in:Nam,Nữ,Unisex',

                // Movement
                'movement_type' => 'nullable|in:Quartz,Automatic,Manual,Solar',
                'movement_name' => 'nullable|string|max:100',
                'power_reserve' => 'nullable|string|max:50',

                // Materials
                'case_material' => 'nullable|string|max:100',
                'strap_material' => 'nullable|string|max:100',
                'glass_material' => 'nullable|string|max:100',

                // Colors
                'dial_color' => 'nullable|string|max:50',
                'case_color' => 'nullable|string|max:50',
                'strap_color' => 'nullable|string|max:50',

                // Water Resistance
                'water_resistance' => 'nullable|string|max:50',

                // Battery
                'battery_type' => 'nullable|string|max:50',
                'battery_voltage' => 'nullable|string|max:20',

                // Technical Specifications
                'case_size' => 'nullable|numeric|min:0',
                'case_thickness' => 'nullable|numeric|min:0',
                'weight' => 'nullable|numeric|min:0',

                // Features & Images
                'features' => 'nullable|string',
                'existing_images' => 'nullable|string',
                'new_images' => 'nullable|array|max:6',
                'new_images.*' => 'image|mimes:jpeg,jpg,png,webp|max:2048',
                'primary_image_index' => 'nullable|integer|min:0',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Handle image updates
            $product = $this->productService->getProductById((int)$id);

            // Parse existing images from JSON string
            $existingImages = [];
            if ($request->has('existing_images')) {
                $existingImages = json_decode($request->input('existing_images'), true) ?? [];
            }

            // Get old images to determine which to delete
            $oldImages = $product && $product->images ? $product->images : [];

            // Find images to delete (old images not in existing list)
            $imagesToDelete = [];
            foreach ($oldImages as $oldImage) {
                $found = false;
                foreach ($existingImages as $existingImage) {
                    if (isset($oldImage['public_id']) && isset($existingImage['public_id']) &&
                        $oldImage['public_id'] === $existingImage['public_id']) {
                        $found = true;
                        break;
                    }
                }
                if (!$found && isset($oldImage['public_id'])) {
                    $imagesToDelete[] = $oldImage['public_id'];
                }
            }

            // Delete removed images from Cloudinary
            foreach ($imagesToDelete as $publicId) {
                $this->cloudinaryService->delete($publicId);
            }

            // Upload new images
            $newUploadedImages = [];
            if ($request->hasFile('new_images')) {
                $newUploadedImages = $this->cloudinaryService->uploadMultiple($request->file('new_images'), 'watch-store/products');
            }

            // Merge existing + new images
            $allImages = array_merge($existingImages, $newUploadedImages);

            // Validate total image count
            if (count($allImages) > 6) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tối đa 6 ảnh cho mỗi sản phẩm',
                ], 422);
            }

            if (count($allImages) < 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sản phẩm phải có ít nhất 1 ảnh',
                ], 422);
            }

            // Mark primary image
            $primaryIndex = $request->input('primary_image_index', 0);
            foreach ($allImages as $index => $image) {
                $allImages[$index]['is_primary'] = ($index === (int)$primaryIndex);
            }

            $validated['images'] = $allImages;

            $product = $this->productService->updateProduct((int)$id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật sản phẩm thành công',
                'data' => $product,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa sản phẩm
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $product = $this->productService->getProductById((int)$id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }

            // Delete images from Cloudinary
            if ($product->images && is_array($product->images)) {
                foreach ($product->images as $image) {
                    if (isset($image['public_id'])) {
                        $this->cloudinaryService->delete($image['public_id']);
                    }
                }
            }

            $this->productService->deleteProduct((int)$id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa sản phẩm thành công',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy sản phẩm nổi bật
     */
    public function featured(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 8);
            $products = $this->productService->getFeaturedProducts($limit);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy sản phẩm nổi bật',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy sản phẩm mới
     */
    public function newProducts(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 8);
            $products = $this->productService->getNewProducts($limit);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy sản phẩm mới',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy sản phẩm đang sale
     */
    public function onSale(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 8);
            $products = $this->productService->getOnSaleProducts($limit);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy sản phẩm đang sale',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thêm ảnh phụ cho sản phẩm
     */
    public function addImages(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'images' => 'required|array|min:1|max:6',
                'images.*' => 'image|mimes:jpeg,jpg,png,webp|max:2048',
            ]);

            $product = $this->productService->getProductById((int)$id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }

            // Get existing images
            $existingImages = $product->images ?? [];

            // Upload new images
            $newUploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');

            // Merge with existing
            $allImages = array_merge($existingImages, $newUploadedImages);

            // Validate total count
            if (count($allImages) > 6) {
                // Delete just uploaded images
                foreach ($newUploadedImages as $image) {
                    if (isset($image['public_id'])) {
                        $this->cloudinaryService->delete($image['public_id']);
                    }
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Tối đa 6 ảnh cho mỗi sản phẩm',
                ], 422);
            }

            // Mark new images as non-primary
            foreach ($allImages as $index => $image) {
                if (!isset($allImages[$index]['is_primary'])) {
                    $allImages[$index]['is_primary'] = false;
                }
            }

            // Update product
            $product = $this->productService->updateProduct((int)$id, ['images' => $allImages]);

            return response()->json([
                'success' => true,
                'message' => 'Thêm ảnh thành công',
                'data' => $product,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể thêm ảnh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa một ảnh cụ thể của sản phẩm
     */
    public function deleteImage(Request $request, string $id, int $imageIndex): JsonResponse
    {
        try {
            $product = $this->productService->getProductById((int)$id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }

            $images = $product->images ?? [];

            // Check if index exists
            if (!isset($images[$imageIndex])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ảnh',
                ], 404);
            }

            // Cannot delete if only 1 image left
            if (count($images) <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sản phẩm phải có ít nhất 1 ảnh',
                ], 422);
            }

            // Delete from Cloudinary
            if (isset($images[$imageIndex]['public_id'])) {
                $this->cloudinaryService->delete($images[$imageIndex]['public_id']);
            }

            // Check if deleted image was primary
            $wasPrimary = $images[$imageIndex]['is_primary'] ?? false;

            // Remove from array
            array_splice($images, $imageIndex, 1);

            // If deleted image was primary, make first image primary
            if ($wasPrimary && count($images) > 0) {
                $images[0]['is_primary'] = true;
            }

            // Update product
            $product = $this->productService->updateProduct((int)$id, ['images' => $images]);

            return response()->json([
                'success' => true,
                'message' => 'Xóa ảnh thành công',
                'data' => $product,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa ảnh',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Đổi ảnh chính của sản phẩm
     */
    public function setPrimaryImage(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'image_index' => 'required|integer|min:0',
            ]);

            $product = $this->productService->getProductById((int)$id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }

            $images = $product->images ?? [];
            $imageIndex = $validated['image_index'];

            // Check if index exists
            if (!isset($images[$imageIndex])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ảnh',
                ], 404);
            }

            // Update primary flag for all images
            foreach ($images as $index => $image) {
                $images[$index]['is_primary'] = ($index === $imageIndex);
            }

            // Update product
            $product = $this->productService->updateProduct((int)$id, ['images' => $images]);

            return response()->json([
                'success' => true,
                'message' => 'Đổi ảnh chính thành công',
                'data' => $product,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể đổi ảnh chính',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
