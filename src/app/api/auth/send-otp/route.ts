import { NextResponse } from 'next/server';

// Global cache for serverless environments (using node global variable to survive hot-reload in dev)
interface OtpEntry {
  otp: string;
  expires: number;
}

const globalForOtp = global as unknown as {
  otpCache?: Record<string, OtpEntry>;
};

if (!globalForOtp.otpCache) {
  globalForOtp.otpCache = {};
}

const otpCache = globalForOtp.otpCache;

export async function POST(request: Request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit mobile number required' },
        { status: 400 }
      );
    }

    // Generate a 6-digit OTP
    // For specific test accounts or default admin, let's keep it simple or random
    const otp = mobile === '8368825928' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    // Store in global cache
    otpCache[mobile] = { otp, expires: expiry };

    // Detect SMS Gateways from environment
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const msg91Key = process.env.MSG91_AUTH_KEY;
    const msg91Template = process.env.MSG91_TEMPLATE_ID;
    const twoFactorKey = process.env.TWOFACTOR_API_KEY;

    let smsSent = false;
    let smsProvider = 'Mock';

    if (fast2smsKey) {
      smsProvider = 'Fast2SMS';
      try {
        // Fast2SMS OTP route
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${mobile}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.return) {
          smsSent = true;
        } else {
          console.error('Fast2SMS response error:', data);
        }
      } catch (err) {
        console.error('Fast2SMS dispatch failed:', err);
      }
    } else if (msg91Key && msg91Template) {
      smsProvider = 'MSG91';
      try {
        // MSG91 API V5 OTP route
        const url = `https://control.msg91.com/api/v5/otp?template_id=${msg91Template}&mobile=91${mobile}&authkey=${msg91Key}&otp=${otp}`;
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        if (data.type === 'success') {
          smsSent = true;
        } else {
          console.error('MSG91 response error:', data);
        }
      } catch (err) {
        console.error('MSG91 dispatch failed:', err);
      }
    } else if (twoFactorKey) {
      smsProvider = '2Factor';
      try {
        // 2Factor OTP route
        const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/+91${mobile}/${otp}/OTPSEND`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.Status === 'Success') {
          smsSent = true;
        } else {
          console.error('2Factor response error:', data);
        }
      } catch (err) {
        console.error('2Factor dispatch failed:', err);
      }
    }

    console.log(`[SMS OTP GATEWAY] Provider: ${smsProvider} | Mobile: ${mobile} | Generated OTP: ${otp} | Sent: ${smsSent ? 'YES' : 'NO (Logged only)'}`);

    // Return response
    return NextResponse.json({
      success: true,
      provider: smsProvider,
      sentLive: smsSent,
      // Provide OTP in response only if we are in mockup mode to facilitate testing
      debugOtp: !smsSent ? otp : undefined,
      message: smsSent ? 'OTP sent successfully' : `Simulated: OTP is ${otp} (Logged to terminal)`
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
