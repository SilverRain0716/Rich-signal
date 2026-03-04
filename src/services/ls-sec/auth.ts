/**
 * LS증권 OPEN API - OAuth 2.0 토큰 관리
 * 기존 ls-auth.ts의 문제점 수정:
 *   1. `appsecret` → `appsecretkey` (LS 공식 파라미터명)
 *   2. 토큰 캐싱 추가 (만료 5분 전 자동 갱신)
 */

const LS_BASE_URL = 'https://openapi.ls-sec.co.kr:8080';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

// 서버 메모리 캐시 (모듈 스코프 = Next.js 서버 수명 동안 유지)
let _cache: TokenCache | null = null;

export async function getLSAccessToken(): Promise<string> {
  const now = Date.now();
  const BUFFER = 5 * 60 * 1000; // 만료 5분 전에 갱신

  if (_cache && _cache.expiresAt - BUFFER > now) {
    return _cache.accessToken;
  }

  const APP_KEY = process.env.LS_SEC_APP_KEY;
  const APP_SECRET = process.env.LS_SEC_APP_SECRET;

  if (!APP_KEY || !APP_SECRET) {
    throw new Error('[LS Auth] 환경변수 LS_SEC_APP_KEY 또는 LS_SEC_APP_SECRET이 없습니다.');
  }

  const res = await fetch(`${LS_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      appkey: APP_KEY,
      appsecretkey: APP_SECRET, // ⚠️ 기존 코드의 'appsecret' → 'appsecretkey' 수정
      scope: 'oob',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[LS Auth] 토큰 발급 실패 ${res.status}: ${err}`);
  }

  const data = await res.json();
  _cache = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in ?? 86400) * 1000,
  };

  console.log(`[LS Auth] 토큰 갱신 완료 (만료: ${new Date(_cache.expiresAt).toLocaleTimeString('ko-KR')})`);
  return _cache.accessToken;
}
