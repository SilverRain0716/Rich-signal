/**
 * Rich Signal - 매매 후보 AI 엔진
 * 수급 + 거시 + 시장 컨텍스트 → Gemini → 오늘 매매 가능한 종목 3~5개
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { collectMacro } from '../macro/indicators';
import { getStockFlows, getSectorFlows, getVolumeSpikes } from '../ls-sec/endpoints';
import { fetchTodayNewsContext } from '../news/grounding';

export const CandidateSchema = z.object({
  candidates: z.array(z.object({
    code: z.string(),
    name: z.string(),
    sector: z.string(),
    signal: z.enum(['BUY', 'WATCH']),
    confidence: z.number().min(1).max(10),
    buyReason: z.string(),
    catalyst: z.string(),
    entryNote: z.string(),
    stopLoss: z.string(),
    risk: z.string(),
  })).min(3).max(5),
  marketCondition: z.enum(['FAVORABLE', 'NEUTRAL', 'RISKY']),
  todayTheme: z.string(),
  oneLiner: z.string(),
  generatedAt: z.string(),
});

export type TradingCandidates = z.infer<typeof CandidateSchema>;

let _cache: { data: TradingCandidates; ts: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

function buildPrompt(args: {
  macro: Awaited<ReturnType<typeof collectMacro>>;
  stocks: Awaited<ReturnType<typeof getStockFlows>>;
  sectors: Awaited<ReturnType<typeof getSectorFlows>>;
  spikes: Awaited<ReturnType<typeof getVolumeSpikes>>;
  news: Awaited<ReturnType<typeof fetchTodayNewsContext>>;
}) {
  const fmt = (n: number, d = 1) => `${n >= 0 ? '+' : ''}${n.toFixed(d)}`;

  const stockList = args.stocks.slice(0, 12).map((s, i) =>
    `${i + 1}. ${s.name}(${s.code}) | ${fmt(s.chgRate)}% | 외인 ${fmt(s.frgQty, 0)}주 | 기관 ${fmt(s.orgQty, 0)}주`
  ).join('\n') || '장 시작 전 또는 데이터 없음';

  const sectorList = args.sectors.slice(0, 8).map(s =>
    `• ${s.name}: 외인 ${fmt(s.frgNetBuy / 1e8, 0)}억 | 기관 ${fmt(s.orgNetBuy / 1e8, 0)}억`
  ).join('\n') || '데이터 없음';

  const spikeList = args.spikes.slice(0, 5).map(s =>
    `• ${s.name}: 거래대금 +${s.spikeRatio.toFixed(0)}% 급증`
  ).join('\n') || '없음';

  return `당신은 한국 주식 트레이더의 AI 분석 파트너입니다.
오늘 실제 매매 가능한 종목을 선별해주세요.

## 시장 컨텍스트
미장: ${args.news.usMarketSummary}
국장 영향: ${args.news.krMarketCatalyst}
리스크: ${args.news.keyRisk}

## 거시 지표
USD/KRW ${args.macro.usdKrw}원 | S&P500 ${fmt(args.macro.sp500Change)}% | 나스닥 ${fmt(args.macro.nasdaqChange)}%
공포탐욕 ${args.macro.fearGreed}/100 | 미장 주도: ${args.macro.dominantSector}

## 외인+기관 순매수 종목
${stockList}

## 섹터별 수급
${sectorList}

## 거래대금 급증
${spikeList}

---
선별 기준:
1. 시장 컨텍스트 + 수급이 동시에 뒷받침되는 종목 우선
2. 외인+기관 동시 매수 종목에 가중치
3. BUY = 오늘 진입 가능 / 애매하면 WATCH
4. 데이터가 없으면 섹터 흐름으로 대표주 추론

generatedAt: "${new Date().toISOString()}"`;
}

export async function generateTradingCandidates(force = false): Promise<TradingCandidates> {
  if (!force && _cache && Date.now() - _cache.ts < CACHE_MS) {
    console.log('[Candidates] 캐시 히트');
    return _cache.data;
  }

  const t0 = Date.now();

  // 데이터 병렬 수집 (각각 실패해도 계속 진행)
  const [macroR, stocksR, sectorsR, spikesR] = await Promise.allSettled([
    collectMacro(),
    getStockFlows(15),
    getSectorFlows('K'),
    getVolumeSpikes(8),
  ]);

  const macro = macroR.status === 'fulfilled' ? macroR.value : {
    usdKrw: 1350, sp500Change: 0, nasdaqChange: 0, us10y: 4.5,
    fearGreed: 50, fearGreedLabel: 'Neutral', dominantSector: '미확인', collectedAt: '',
  };
  const stocks = stocksR.status === 'fulfilled' ? stocksR.value : [];
  const sectors = sectorsR.status === 'fulfilled' ? sectorsR.value : [];
  const spikes = spikesR.status === 'fulfilled' ? spikesR.value : [];

  const news = await fetchTodayNewsContext(macro.sp500Change, macro.nasdaqChange, macro.fearGreed);

  console.log(`[Candidates] 데이터 수집 완료: ${Date.now() - t0}ms | 종목 ${stocks.length}개 | 섹터 ${sectors.length}개`);

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: CandidateSchema,
    prompt: buildPrompt({ macro, stocks, sectors, spikes, news }),
    temperature: 0.2,
  });

  _cache = { data: object, ts: Date.now() };
  console.log(`[Candidates] AI 완료: 총 ${Date.now() - t0}ms`);
  return object;
}
