/**
 * 거시 지표 수집 - 병렬 처리로 빠른 응답
 * 환율, S&P500/나스닥 선물, 미국채 10년, 공포탐욕지수, 미장 주도 섹터
 */

export interface MacroData {
  usdKrw: number;
  sp500Change: number;   // S&P500 선물 등락률(%)
  nasdaqChange: number;  // 나스닥100 선물 등락률(%)
  us10y: number;         // 미국채 10년 수익률(%)
  fearGreed: number;     // CNN 공포탐욕지수 (0~100)
  fearGreedLabel: string;
  dominantSector: string; // 전일 미장 주도 섹터
  collectedAt: string;
}

async function getYahooChange(ticker: string): Promise<number> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta ?? {};
    const cur: number = meta.regularMarketPrice ?? 0;
    const prev: number = meta.chartPreviousClose ?? 1;
    return prev ? ((cur - prev) / prev) * 100 : 0;
  } catch {
    return 0;
  }
}

async function getUSDKRW(): Promise<number> {
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 600 },
    });
    const j = await r.json();
    return j?.rates?.KRW ?? 1350;
  } catch {
    return 1350;
  }
}

async function getFearGreed(): Promise<{ score: number; label: string }> {
  try {
    const r = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      next: { revalidate: 3600 },
    });
    const j = await r.json();
    return {
      score: Math.round(j?.fear_and_greed?.score ?? 50),
      label: j?.fear_and_greed?.rating ?? 'Neutral',
    };
  } catch {
    return { score: 50, label: 'Neutral' };
  }
}

// 섹터 ETF → 주도 섹터 판별
const SECTORS: Record<string, string> = {
  '반도체': 'SOXX',
  '빅테크': 'QQQ',
  '바이오': 'XBI',
  '에너지': 'XLE',
  '금융': 'XLF',
  '소비재': 'XLY',
  '헬스케어': 'XLV',
};

async function getDominantSector(): Promise<string> {
  const results = await Promise.all(
    Object.entries(SECTORS).map(async ([name, ticker]) => ({
      name,
      chg: await getYahooChange(ticker),
    }))
  );
  results.sort((a, b) => b.chg - a.chg);
  const top = results[0];
  if (!top) return '알 수 없음';
  return `${top.name} (${top.chg >= 0 ? '+' : ''}${top.chg.toFixed(2)}%)`;
}

export async function collectMacro(): Promise<MacroData> {
  const [usdKrw, sp500Change, nasdaqChange, us10y, fearGreed, dominantSector] = await Promise.all([
    getUSDKRW(),
    getYahooChange('ES=F'),  // S&P500 선물
    getYahooChange('NQ=F'),  // 나스닥100 선물
    getYahooChange('^TNX'),  // 미국채 10년
    getFearGreed(),
    getDominantSector(),
  ]);

  return {
    usdKrw,
    sp500Change,
    nasdaqChange,
    us10y,
    fearGreed: fearGreed.score,
    fearGreedLabel: fearGreed.label,
    dominantSector,
    collectedAt: new Date().toISOString(),
  };
}
