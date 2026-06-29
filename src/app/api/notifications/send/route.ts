import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Safe init function
function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
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
      console.error('Firebase Admin initialization error in notifications:', err);
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { token, tokens, title, body } = await request.json();

    if ((!token && (!tokens || tokens.length === 0)) || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'Recipient token(s), title, and body are required' },
        { status: 400 }
      );
    }

    const adminApp = initFirebaseAdmin();
    let sentLive = false;
    let provider = 'Mock FCM';

    const targetTokens = tokens && tokens.length > 0 ? tokens : [token];

    if (adminApp) {
      try {
        provider = 'Firebase Admin FCM';
        const messagingAdmin = getMessaging(adminApp);
        
        const sendPromises = targetTokens.map((t: string) => {
          if (!t || t.startsWith('mock_')) return Promise.resolve(null);
          
          const payload = {
            notification: {
              title,
              body,
            },
            webpush: {
              notification: {
                title,
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
              }
            },
            token: t
          };
          return messagingAdmin.send(payload);
        });

        await Promise.all(sendPromises);
        sentLive = true;
      } catch (fcmErr) {
        console.error('FCM dispatch failed, falling back to mock logs:', fcmErr);
        sentLive = false;
      }
    }

    console.log(`[FCM NOTIFICATION] Provider: ${provider} | Target Tokens Count: ${targetTokens.length} | Title: "${title}" | Body: "${body}" | Sent: ${sentLive ? 'YES' : 'NO (Logged only)'}`);

    return NextResponse.json({
      success: true,
      sentLive,
      provider,
      message: sentLive 
        ? 'Push notification dispatched successfully via FCM.' 
        : `Simulated Push: "${title}" -> "${body}" (Logged to console)`
    });

  } catch (error) {
    console.error('Error in send-notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
