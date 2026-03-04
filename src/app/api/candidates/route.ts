/**
 * GET /api/candidates
 * 오늘의 매매 후보 종목 (AI 생성, 15분 캐시)
 * ?refresh=true → 강제 재생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTradingCandidates } from '@/services/ai-engine/candidates';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('refresh') === 'true';
  try {
    const data = await generateTradingCandidates(force);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
