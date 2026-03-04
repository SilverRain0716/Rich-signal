/**
 * GET  /api/alert → 현재 지수 상태 확인 (폴링용)
 * POST /api/alert → 급락 시 Gemini 긴급 분석 요청
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAlertEngine } from '@/services/ai-engine/fusion';
import { getIndexStatus } from '@/services/ls-sec/endpoints';

export const dynamic = 'force-dynamic';

/** 폴링: 현재 지수 등락률만 빠르게 반환 */
export async function GET() {
  try {
    const status = await getIndexStatus();
    const isAlert = status.kospiChg <= -3 || status.kosdaqChg <= -3;

    return NextResponse.json({
      success: true,
      data: {
        kospiChg: status.kospiChg,
        kosdaqChg: status.kosdaqChg,
        isAlert,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/** 급락 감지 시 Gemini 긴급 시그널 생성 */
export async function POST(req: NextRequest) {
  try {
    let kospiChg: number;
    let kosdaqChg: number;

    const body = await req.json().catch(() => null);
    if (body?.kospiChg !== undefined) {
      kospiChg = Number(body.kospiChg);
      kosdaqChg = Number(body.kosdaqChg);
    } else {
      const s = await getIndexStatus();
      kospiChg = s.kospiChg;
      kosdaqChg = s.kosdaqChg;
    }

    const alert = await runAlertEngine(kospiChg, kosdaqChg);

    return NextResponse.json({
      success: true,
      data: alert,
      message: alert ? null : '정상 범위 (-3% 이상). 알림 없음.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
