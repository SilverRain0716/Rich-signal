/**
 * LS증권 OPEN API - 공통 TR 클라이언트
 *
 * LS 공식 문서 기준 TR별 URL 경로:
 * https://openapi.ls-sec.co.kr:8080/stock/{path}
 *
 * 투자정보(t1404, t1442 등) → /stock/investinfo
 * 업종(t1452 등)           → /stock/sector
 * 시장지수(t1511)          → /stock/market
 */

import { getLSAccessToken } from './auth';

const LS_BASE_URL = 'https://openapi.ls-sec.co.kr:8080';

// TR코드 → URL 경로 매핑
const TR_PATH: Record<string, string> = {
  t1404: 'stock/investinfo',   // 외인+기관 순매수
  t1442: 'stock/investinfo',   // 거래대금 급증
  t1452: 'stock/sector',       // 업종별 수급
  t1511: 'stock/market',       // 시장 지수
};

export interface LSTrResult<T = unknown> {
  rsp_cd: string;
  rsp_msg: string;
  output1?: T;
  output2?: T[];
}

export async function callLSTr<T = unknown>(
  trCode: string,
  body: Record<string, unknown>
): Promise<LSTrResult<T>> {
  const token = await getLSAccessToken();
  const path = TR_PATH[trCode] ?? 'stock/investinfo';

  const res = await fetch(`${LS_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${token}`,
      tr_cd: trCode,
      tr_cont: 'N',
      tr_cont_key: '',
    },
    body: JSON.stringify({ [trCode.toLowerCase()]: body }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[LS TR:${trCode}] HTTP ${res.status} - ${errText.slice(0, 200)}`);
  }

  return res.json() as Promise<LSTrResult<T>>;
}
