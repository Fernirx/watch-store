<?php

namespace App\Http\Controllers;

use App\Services\ReviewService;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * CUSTOMER ENDPOINTS
     */

    /**
     * Lấy reviews của sản phẩm
     */
    public function getProductReviews(Request $request, int $productId)
    {
        try {
            $filters = [
                'rating' => $request->query('rating'),
                'verified_only' => $request->query('verified_only', false),
            ];

            $reviews = $this->reviewService->getProductReviews($productId, $filters);
            $stats = $this->reviewService->getReviewStatistics($productId);

            return response()->json([
                'success' => true,
                'data' => [
                    'reviews' => $reviews,
                    'statistics' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy đánh giá: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo review mới
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
                'guest_email' => 'nullable|email|max:255',
                'guest_name' => [
                    'nullable',
                    'string',
                    'max:255',
                    'regex:/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/'
                ],
            ], [
                'guest_name.regex' => 'Tên chỉ được chứa chữ cái và khoảng trắng',
            ]);

            // Lấy user_id nếu đã đăng nhập
            $validated['user_id'] = auth()->id();

            // Nếu là guest, yêu cầu email
            if (!$validated['user_id']) {
                if (empty($validated['guest_email'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vui lòng cung cấp email để xác thực mua hàng.',
                    ], 422);
                }
            }

            $review = $this->reviewService->createReview($validated);

            return response()->json([
                'success' => true,
                'message' => 'Đánh giá của bạn đã được gửi thành công!',
                'data' => $review,
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
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Kiểm tra xem user có thể review sản phẩm không
     */
    public function canReview(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'email' => 'nullable|email',
            ]);

            $productId = $validated['product_id'];
            $userId = auth()->id();
            $email = $validated['email'] ?? null;

            // Kiểm tra đã mua chưa
            $hasPurchased = $this->reviewService->hasUserPurchasedProduct($productId, $userId, $email);

            // Kiểm tra đã review chưa
            $hasReviewed = $this->reviewService->hasUserReviewedProduct($productId, $userId, $email);

            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => $hasPurchased && !$hasReviewed,
                    'has_purchased' => (bool) $hasPurchased,
                    'has_reviewed' => $hasReviewed,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ADMIN ENDPOINTS
     */

    /**
     * Lấy tất cả reviews (Admin)
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'product_id' => $request->query('product_id'),
                'user_id' => $request->query('user_id'),
                'rating' => $request->query('rating'),
                'verified' => $request->query('verified'),
                'search' => $request->query('search'),
                'per_page' => $request->query('per_page', 20),
            ];

            $reviews = $this->reviewService->getAllReviews($filters);

            return response()->json([
                'success' => true,
                'data' => $reviews,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách đánh giá: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật review (Admin)
     */
    public function update(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'rating' => 'nullable|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $review = $this->reviewService->updateReview($id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật đánh giá thành công',
                'data' => $review,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xóa review (Admin)
     */
    public function destroy(int $id)
    {
        try {
            $this->reviewService->deleteReview($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa đánh giá thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa đánh giá: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xuất báo cáo (Admin)
     */
    public function export(Request $request)
    {
        try {
            $filters = [
                'product_id' => $request->query('product_id'),
                'rating' => $request->query('rating'),
                'verified' => $request->query('verified'),
            ];

            $reviews = $this->reviewService->getAllReviews(array_merge($filters, ['per_page' => 10000]));

            // Format data for export
            $exportData = $reviews->map(function ($review) {
                return [
                    'ID' => $review->id,
                    'Sản phẩm' => $review->product->name ?? 'N/A',
                    'Người đánh giá' => $review->reviewer_name,
                    'Email/SĐT' => $review->reviewer_identifier,
                    'Số sao' => $review->rating,
                    'Nhận xét' => $review->comment,
                    'Đã mua' => $review->is_verified_purchase ? 'Có' : 'Không',
                    'Ngày đánh giá' => $review->created_at->format('d/m/Y H:i'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $exportData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xuất báo cáo: ' . $e->getMessage(),
            ], 500);
        }
    }
}
