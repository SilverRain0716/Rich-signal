/**
 * GET /api/flow
 * 실시간 수급 레이더 - 90초마다 갱신
 * 
 * 반환: 섹터별 자금흐름 + 외인/기관 동시 순매수 상위 종목
 */

import { NextResponse } from 'next/server';
import { getStockFlows, getSectorFlows, getIndexStatus } from '@/services/ls-sec/endpoints';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [index, stocks, kospiSectors, kosdaqSectors] = await Promise.allSettled([
      getIndexStatus(),
      getStockFlows(20),
      getSectorFlows('K'),
      getSectorFlows('Q'),
    ]);

    const indexData  = index.status  === 'fulfilled' ? index.value  : { kospiChg: 0, kosdaqChg: 0 };
    const stockData  = stocks.status === 'fulfilled' ? stocks.value : [];
    const sectorData = [
      ...(kospiSectors.status === 'fulfilled' ? kospiSectors.value : []),
      ...(kosdaqSectors.status === 'fulfilled' ? kosdaqSectors.value : []),
    ].sort((a, b) => (b.frgNetBuy + b.orgNetBuy) - (a.frgNetBuy + a.orgNetBuy));

    return NextResponse.json({
      success: true,
      data: {
        index: indexData,
        sectors: sectorData,
        stocks: stockData,
        updatedAt: new Date().toISOString(),
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=90' }, // 90초 캐시
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
