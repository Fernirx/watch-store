<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = [
        'email',
        'otp',
        'type',
        'is_used',
        'expires_at',
        'verified_at',
        'guest_token',
        'attempt_count',
        'max_attempts',
    ];

    protected function casts(): array
    {
        return [
            'is_used' => 'boolean',
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
            'attempt_count' => 'integer',
            'max_attempts' => 'integer',
        ];
    }

    public static function generateOtp(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public static function createOtp(string $email, string $type = 'REGISTER'): self
    {
        self::where('email', $email)
            ->where('type', $type)
            ->where('is_used', false)
            ->delete();

        return self::create([
            'email' => $email,
            'otp' => self::generateOtp(),
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);
    }

    /**
     * Xác thực OTP
     *
     * @return array ['success' => bool, 'message' => string, 'otp_record' => Otp|null]
     */
    public static function verifyOtp(string $email, string $otp, string $type = 'REGISTER'): array
    {
        // Tìm OTP record
        $otpRecord = self::where('email', $email)
            ->where('type', $type)
            ->where('is_used', false)
            ->where('expires_at', '>', Carbon::now())
            ->orderBy('created_at', 'desc')
            ->first();

        \Log::info("Email:" . $email . ", OTP:" . $otp . ", Type:" . $type . ", Record:" . ($otpRecord ? $otpRecord->otp : 'null'));

        // Không tìm thấy OTP hoặc đã hết hạn
        if (!$otpRecord) {
            return [
                'success' => false,
                'message' => 'Mã OTP không tồn tại hoặc đã hết hạn',
                'otp_record' => null,
            ];
        }

        // Kiểm tra đã vượt giới hạn số lần thử chưa
        if ($otpRecord->attempt_count >= $otpRecord->max_attempts) {
            return [
                'success' => false,
                'message' => 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại OTP mới',
                'otp_record' => null,
            ];
        }

        // Kiểm tra OTP có đúng không
        if ($otpRecord->otp !== $otp) {
            // Tăng attempt_count
            $otpRecord->increment('attempt_count');

            $remainingAttempts = $otpRecord->max_attempts - $otpRecord->attempt_count;

            return [
                'success' => false,
                'message' => "Mã OTP không đúng. Còn {$remainingAttempts} lần thử",
                'otp_record' => null,
            ];
        }

        // OTP đúng → Đánh dấu đã verify
        $otpRecord->update([
            'is_used' => true,
            'verified_at' => Carbon::now(),
        ]);

        return [
            'success' => true,
            'message' => 'Xác thực OTP thành công',
            'otp_record' => $otpRecord,
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
