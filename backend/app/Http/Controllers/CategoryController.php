<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Http\Controllers\Controller;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }



    public function index()
    {
        try {
            $categories = Category::where('is_active', true)->get();
            return response()->json([
                'success' => true,
                'data' => $categories,
            ], 200);


        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
                'image' => 'nullable|image|max:2048',
                'is_active' => 'boolean',
            ]);
            if ($request->hasFile('image')) {
                $uploadResult = $this->cloudinaryService->upload($request->file('image'), 'watch-store/categories');
                $validated['image_url'] = $uploadResult['url'];
                $validated['image_public_id'] = $uploadResult['public_id'];
            }

            $category = Category::create($validated);
            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category,
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
                'message' => 'Failed to create category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function show(string $id)
    {
        try {
            $category = Category::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $category,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found',
            ], 404);
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            $category = Category::findOrFail($id);

            $validated = $request->validate([
                'name' => 'string|max:100',
                'description' => 'nullable|string',
                'image' => 'nullable|image|max:2048',
                'is_active' => 'boolean',
            ]);
            if ($request->hasFile('image')) {
                if ($category->image_public_id) {
                    $this->cloudinaryService->delete($category->image_public_id);}

                $uploadResult = $this->cloudinaryService->upload($request->file('image'), 'watch-store/categories');
                $validated['image_url'] = $uploadResult['url'];
                $validated['image_public_id'] = $uploadResult['public_id'];
            }

            $category->update($validated);
            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error', 'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $category = Category::findOrFail($id);
            if ($category->image_public_id) {
                $this->cloudinaryService->delete($category->image_public_id);
            }
            $category->delete();
            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
