// src/lib/ls-auth.ts

export async function getLSAccessToken() {
  const APP_KEY = process.env.LS_SEC_APP_KEY;
  const APP_SECRET = process.env.LS_SEC_APP_SECRET;
  const BASE_URL = 'https://openapi.ls-sec.co.kr:8080';

  try {
    const response = await fetch(`${BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        appkey: APP_KEY!,
        appsecret: APP_SECRET!,
        scope: 'oob', // 기본 범위
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`토큰 발급 실패: ${data.error_description || 'Unknown Error'}`);
    }

    // data.access_token을 반환합니다. 
    // 실제 서비스에서는 이를 Supabase에 저장하고 재사용하는 로직이 추가되어야 효율적입니다.
    return data.access_token;
  } catch (error) {
    console.error('LS Auth Error:', error);
    throw error;
  }
}