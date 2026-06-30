import { NextResponse } from 'next/server';

// Global cache for serverless environments (linked to node global variable)
interface OtpEntry {
  otp: string;
  expires: number;
}

const globalForOtp = global as unknown as {
  otpCache?: Record<string, OtpEntry>;
};

const otpCache = globalForOtp.otpCache || {};

// Helper to initialize Firebase Admin safely using dynamic imports
async function initFirebaseAdmin() {
  const { initializeApp, getApps, getApp, cert } = await import('firebase-admin/app');

  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace escaped newlines if they are passed as a single line
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error('Firebase Admin initialization error:', err);
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { mobile, otp } = await request.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, error: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP (allow '123456' as universal bypass demo OTP)
    let otpValid = false;
    if (otp === '123456') {
      otpValid = true;
    } else {
      const record = otpCache[mobile];
      if (record && Date.now() <= record.expires && record.otp === otp) {
        otpValid = true;
        delete otpCache[mobile];
      }
    }

    if (!otpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code or session expired. Use demo code 123456 to test.' },
        { status: 400 }
      );
    }

    // Try to initialize Firebase Admin and generate Custom Token
    let customToken = '';
    let isMock = true;

    const formattedPhone = `+91${mobile}`;
    const customUid = `phone_91_${mobile}`;

    // Skip Firebase Admin SDK calls when using the bypass demo OTP code to avoid serverless timeouts
    if (otp !== '123456') {
      const adminApp = await initFirebaseAdmin();
      if (adminApp) {
        try {
          isMock = false;
          const { getAuth } = await import('firebase-admin/auth');
          const authAdmin = getAuth(adminApp);
          let userRecord;
          try {
            userRecord = await authAdmin.getUserByPhoneNumber(formattedPhone);
          } catch (err) {
            const fbErr = err as { code?: string };
            if (fbErr.code === 'auth/user-not-found') {
              // User doesn't exist in Firebase Auth yet, create them
              userRecord = await authAdmin.createUser({
                phoneNumber: formattedPhone,
                displayName: `Patient ${mobile}`,
              });
              console.log(`[Firebase Auth] Created new user: ${userRecord.uid} for phone ${formattedPhone}`);
            } else {
              throw err;
            }
          }

          // Generate Custom Token
          customToken = await authAdmin.createCustomToken(userRecord.uid, {
            mobile,
            verified: true
          });
        } catch (authErr) {
          console.error('Firebase Custom Token generation failed, falling back to mock:', authErr);
          isMock = true;
        }
      }
    }

    if (isMock) {
      customToken = `mock_custom_token_${mobile}_${Date.now()}`;
      console.warn(`[Firebase Auth] Firebase Admin not fully configured. Generated mock custom token for +91${mobile}`);
    }

    return NextResponse.json({
      success: true,
      customToken,
      isMock,
      uid: customUid,
      mobile,
      message: isMock 
        ? 'OTP verified. Logging in via Mock Token (Local Dev mode)' 
        : 'OTP verified. Custom Firebase Token generated.'
    });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
