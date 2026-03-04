/**
 * LS증권 OPEN API - 공통 TR(Transaction) 클라이언트
 * 모든 LS 데이터 조회는 이 함수를 통해 표준화
 */

import { getLSAccessToken } from './auth';

const LS_BASE_URL = 'https://openapi.ls-sec.co.kr:8080';

export interface LSTrResult<T = unknown> {
  rsp_cd: string;   // '00000' = 성공
  rsp_msg: string;
  output1?: T;
  output2?: T[];
}

export async function callLSTr<T = unknown>(
  trCode: string,
  body: Record<string, unknown>
): Promise<LSTrResult<T>> {
  const token = await getLSAccessToken();

  const res = await fetch(`${LS_BASE_URL}/stock/investinfo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Authorization: `Bearer ${token}`,
      tr_cd: trCode,
      tr_cont: 'N',
      tr_cont_key: '',
    },
    body: JSON.stringify({ [trCode.toLowerCase()]: body }),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`[LS TR:${trCode}] HTTP ${res.status}`);
  }

  return res.json() as Promise<LSTrResult<T>>;
}
