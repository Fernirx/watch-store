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
                'slug' => 'nullable|string|max:255|unique:products,slug',
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
                'image' => 'nullable|image|max:2048',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                $uploadedImage = $this->cloudinaryService->upload($request->file('image'), 'watch-store/products');
                $validated['images'] = [$uploadedImage];
            } elseif ($request->hasFile('images')) {
                $uploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');
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
                'slug' => 'nullable|string|max:255|unique:products,slug,' . $id,
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
                'image' => 'nullable|image|max:2048',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                $product = $this->productService->getProductById((int)$id);

                // Delete old images
                if ($product && $product->images && is_array($product->images)) {
                    foreach ($product->images as $image) {
                        if (isset($image['public_id'])) {
                            $this->cloudinaryService->delete($image['public_id']);
                        }
                    }
                }

                $uploadedImage = $this->cloudinaryService->upload($request->file('image'), 'watch-store/products');
                $validated['images'] = [$uploadedImage];
            } elseif ($request->hasFile('images')) {
                $product = $this->productService->getProductById((int)$id);

                // Delete old images
                if ($product && $product->images && is_array($product->images)) {
                    foreach ($product->images as $image) {
                        if (isset($image['public_id'])) {
                            $this->cloudinaryService->delete($image['public_id']);
                        }
                    }
                }

                $uploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');
                $validated['images'] = $uploadedImages;
            }

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
}
