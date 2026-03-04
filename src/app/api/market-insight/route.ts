/**
 * GET /api/market-insight
 * Data Fusion Engine으로 업그레이드
 * LS증권 수급 × 거시지표 × Gemini 1.5 Pro → 리포트
 *
 * ?refresh=true + x-admin-key 헤더 → 강제 재생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFusionEngine } from '@/services/ai-engine/fusion';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      const key = req.headers.get('x-admin-key');
      if (key !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const report = await runFusionEngine(forceRefresh);

    return NextResponse.json(
      { success: true, data: report },
      {
        headers: {
          'Cache-Control': report.meta.cacheHit ? 'public, max-age=3600' : 'public, max-age=300',
          'X-Cache-Hit': String(report.meta.cacheHit),
          'X-Generated-At': report.meta.generatedAt,
        },
      }
    );
  } catch (err) {
    console.error('[/api/market-insight]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}