<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\OTPMail;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }

            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                ],
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
                'message' => 'Login failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                ],
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
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $request->user(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            $request->user()->currentAccessToken()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function sendRegisterOtp(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);
            Otp::where('email', $validated['email'])
                ->where('type', 'REGISTER')
                ->where('is_used', false)
                ->delete();

            $otpRecord = Otp::create([
                'email' => $validated['email'],
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
                'otp' => Otp::generateOtp(),
                'type' => 'REGISTER',
                'expires_at' => now()->addMinutes(5),
            ]);

            Mail::to($validated['email'])->send(new OtpMail($otpRecord->otp, 'REGISTER'));

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your email. Valid for 5 minutes.',
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
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function verifyRegisterOtp(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            $otpRecord = Otp::where('email', $validated['email'])
                ->where('otp', $validated['otp'])
                ->where('type', 'REGISTER')
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->first();

            if (!$otpRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 400);
            }

            $user = User::create([
                'name' => $otpRecord->name,
                'email' => $otpRecord->email,
                'password' => $otpRecord->password, // Already hashed
                'email_verified_at' => now(),
            ]);

            $otpRecord->update(['is_used' => true]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                ],
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
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function sendForgotPasswordOtp(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            $otpRecord = Otp::createOtp($validated['email'], 'FORGOT_PASSWORD');

            Mail::to($validated['email'])->send(new OtpMail($otpRecord->otp, 'FORGOT_PASSWORD'));

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your email. Valid for 5 minutes.',
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
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
                'otp' => 'required|string|size:6',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if (!Otp::verifyOtp($validated['email'], $validated['otp'], 'FORGOT_PASSWORD')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 400);
            }

            $user = User::where('email', $validated['email'])->first();
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Password reset successful. Please login with your new password.',
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
                'message' => 'Password reset failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function googleRedirect()
    {
        try {
            return Socialite::driver('google')->stateless()->redirect();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to redirect to Google',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function googleCallback()
    {
        try {
            $guzzleClient = new \GuzzleHttp\Client([
                'verify' => false,
            ]);

            $googleUser = Socialite::driver('google')
                ->setHttpClient($guzzleClient)
                ->stateless()
                ->user();
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'provider' => 'GOOGLE',
                    'provider_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                ]);
            } else {
                if (!$user->provider_id) {
                    $user->update([
                        'provider' => 'GOOGLE',
                        'provider_id' => $googleUser->getId(),
                        'avatar_url' => $googleUser->getAvatar(),
                        'email_verified_at' => now(),
                    ]);
                }
            }

            $user->tokens()->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            $frontendUrl = config('app.frontend_url');
            return redirect()->away(
                $frontendUrl . '/auth/google/callback?token=' . $token . '&user=' . urlencode(json_encode($user))
            );
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
