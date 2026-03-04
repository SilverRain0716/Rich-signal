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
    console.error('[/api/candidates]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
