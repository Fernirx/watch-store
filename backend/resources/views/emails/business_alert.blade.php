<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Business Alert - Watch Store</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #dc2626;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .alert-box {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 15px 0;
        }
        .detail-row {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
            font-weight: bold;
            color: #6b7280;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">🔴 CRITICAL ALERT</h1>
        <p style="margin: 5px 0 0 0;">Watch Store eCommerce System</p>
    </div>

    <div class="content">
        <div class="alert-box">
            <h2 style="margin-top: 0; color: #dc2626;">{{ $code }}</h2>
            <p><strong>Detected at:</strong> {{ $time }}</p>
        </div>

        <h3>Details:</h3>
        @foreach($context as $key => $value)
            @if(!is_array($value) && !is_object($value))
            <div class="detail-row">
                <span class="detail-label">{{ ucfirst(str_replace('_', ' ', $key)) }}:</span>
                {{ $value }}
            </div>
            @endif
        @endforeach

        @if(isset($context['message']))
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
            <strong>Message:</strong> {{ $context['message'] }}
        </div>
        @endif

        @if(isset($context['action_required']))
        <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6;">
            <strong>⚠️ Action Required:</strong> {{ $context['action_required'] }}
        </div>
        @endif
    </div>

    <div class="footer">
        <p>This is an automated alert from Watch Store eCommerce System.</p>
        <p>Please check the admin panel or logs for more details.</p>
        <p><strong>Environment:</strong> {{ config('app.env') }}</p>
    </div>
</body>
</html>
