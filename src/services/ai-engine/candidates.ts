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

// ─── 스키마 ─────────────────────────────────────────────────

export const CandidateSchema = z.object({
  candidates: z.array(z.object({
    code: z.string().describe('종목코드 (6자리)'),
    name: z.string().describe('종목명'),
    sector: z.string().describe('섹터'),
    signal: z.enum(['BUY', 'WATCH']).describe('BUY: 오늘 진입 가능 / WATCH: 모니터링'),
    confidence: z.number().min(1).max(10).describe('신뢰도 1~10'),
    buyReason: z.string().describe('매수 근거 - 수급+시장 인과관계 60자 이내'),
    catalyst: z.string().describe('핵심 촉매 40자 이내'),
    entryNote: z.string().describe('진입 전략 40자 이내'),
    stopLoss: z.string().describe('손절 기준 40자 이내'),
    risk: z.string().describe('주요 리스크 30자 이내'),
  })).min(3).max(5),
  marketCondition: z.enum(['FAVORABLE', 'NEUTRAL', 'RISKY']),
  todayTheme: z.string().describe('오늘의 핵심 투자 테마 20자 이내'),
  oneLiner: z.string().describe('오늘 시장 한 줄 요약 50자 이내'),
  generatedAt: z.string(),
});

export type TradingCandidates = z.infer<typeof CandidateSchema>;

// ─── 메모리 캐시 (15분) ────────────────────────────────────

let _cache: { data: TradingCandidates; ts: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

// ─── 프롬프트 ────────────────────────────────────────────────

function buildPrompt(args: {
  macro: Awaited<ReturnType<typeof collectMacro>>;
  stocks: Awaited<ReturnType<typeof getStockFlows>>;
  sectors: Awaited<ReturnType<typeof getSectorFlows>>;
  spikes: Awaited<ReturnType<typeof getVolumeSpikes>>;
  news: Awaited<ReturnType<typeof fetchTodayNewsContext>>;
}) {
  const stockList = args.stocks.slice(0, 12).map((s, i) =>
    `${i + 1}. ${s.name}(${s.code}) | 등락 ${s.chgRate >= 0 ? '+' : ''}${s.chgRate.toFixed(1)}% | 외인 ${s.frgQty >= 0 ? '+' : ''}${s.frgQty.toLocaleString()}주 | 기관 ${s.orgQty >= 0 ? '+' : ''}${s.orgQty.toLocaleString()}주 | 거래대금 ${(s.trAmount / 1e8).toFixed(0)}억`
  ).join('\n');

  const sectorList = args.sectors.slice(0, 8).map(s =>
    `• ${s.name}: 외인 ${s.frgNetBuy >= 0 ? '+' : ''}${(s.frgNetBuy / 1e8).toFixed(0)}억 | 기관 ${s.orgNetBuy >= 0 ? '+' : ''}${(s.orgNetBuy / 1e8).toFixed(0)}억`
  ).join('\n');

  const spikeList = args.spikes.slice(0, 5).map(s =>
    `• ${s.name}: 거래대금 전일比 +${s.spikeRatio.toFixed(0)}% 급증`
  ).join('\n');

  return `당신은 한국 주식 트레이더의 AI 분석 파트너입니다.
아래 데이터를 분석해서 오늘 실제 매매 가능한 종목을 선별해주세요.

## 시장 컨텍스트
미장 요약: ${args.news.usMarketSummary}
국장 영향: ${args.news.krMarketCatalyst}
주요 리스크: ${args.news.keyRisk}

## 거시 지표
- USD/KRW: ${args.macro.usdKrw}원 | S&P500: ${args.macro.sp500Change >= 0 ? '+' : ''}${args.macro.sp500Change.toFixed(2)}% | 나스닥100: ${args.macro.nasdaqChange >= 0 ? '+' : ''}${args.macro.nasdaqChange.toFixed(2)}%
- 공포탐욕지수: ${args.macro.fearGreed}/100 | 미장 주도섹터: ${args.macro.dominantSector}

## 외인+기관 동시 순매수 종목
${stockList || '장 시작 전 / 데이터 없음'}

## 섹터별 수급
${sectorList || '데이터 없음'}

## 거래대금 급증 (세력 포착)
${spikeList || '없음'}

---
선별 기준:
1. 시장 컨텍스트 + 수급이 동시에 뒷받침되는 종목 우선
2. 외인+기관 동시 매수 종목에 가중치
3. 거래대금 급증 + 수급 유입 = 강한 시그널
4. BUY는 오늘 당일 진입 가능한 것만. 애매하면 WATCH
5. 데이터에 없어도 섹터 흐름으로 추론한 대표주 포함 가능

generatedAt: "${new Date().toISOString()}"`;
}

// ─── 메인 ────────────────────────────────────────────────────

export async function generateTradingCandidates(force = false): Promise<TradingCandidates> {
  if (!force && _cache && Date.now() - _cache.ts < CACHE_MS) {
    console.log('[Candidates] 캐시 히트');
    return _cache.data;
  }

  const t0 = Date.now();

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

  // 뉴스 컨텍스트 (거시 데이터 기반)
  const news = await fetchTodayNewsContext(
    macro.sp500Change,
    macro.nasdaqChange,
    macro.fearGreed,
  );

  const { object } = await generateObject({
    model: google('gemini-1.5-pro'),
    schema: CandidateSchema,
    prompt: buildPrompt({ macro, stocks, sectors, spikes, news }),
    temperature: 0.2,
  });

  _cache = { data: object, ts: Date.now() };
  console.log(`[Candidates] 완료: ${Date.now() - t0}ms`);
  return object;
}
