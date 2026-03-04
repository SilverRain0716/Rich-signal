/**
 * GET /api/sectors
 * 실시간 섹터별 수급 (2분 간격 갱신)
 * 장중에 계속 살아있어야 하는 핵심 데이터
 */

import { NextResponse } from 'next/server';
import { getSectorFlows, getStockFlows, getVolumeSpikes } from '@/services/ls-sec/endpoints';
import { collectMacro } from '@/services/macro/indicators';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [kospi, kosdaq, stocks, spikes, macro] = await Promise.allSettled([
      getSectorFlows('K'),
      getSectorFlows('Q'),
      getStockFlows(10),
      getVolumeSpikes(5),
      collectMacro(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          sectors: [
            ...(kospi.status === 'fulfilled' ? kospi.value : []),
            ...(kosdaq.status === 'fulfilled' ? kosdaq.value : []),
          ],
          topStocks: stocks.status === 'fulfilled' ? stocks.value : [],
          volumeSpikes: spikes.status === 'fulfilled' ? spikes.value : [],
          macro: macro.status === 'fulfilled' ? macro.value : null,
          updatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=120', // 2분 캐시
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
