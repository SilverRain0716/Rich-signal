/**
 * ╔══════════════════════════════════════════════════╗
 * ║   Rich Signal - Data Fusion Engine               ║
 * ║   LS증권 수급 × 거시지표 → Gemini AI 리포트       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * 실행 순서:
 * 1. Supabase 캐시 확인 (60분 이내면 즉시 반환)
 * 2. LS증권 API + 거시지표 병렬 수집
 * 3. Gemini 1.5 Pro → generateObject로 구조화된 리포트 생성
 * 4. Supabase 캐싱 후 반환
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { collectMacro } from '../macro/indicators';
import { getStockFlows, getSectorFlows, getVolumeSpikes } from '../ls-sec/endpoints';
import { buildFusionPrompt, buildAlertPrompt } from './prompts';

// ─── Supabase ────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const CACHE_TTL = 60; // 분

// ─── 리포트 스키마 (Zod + Vercel AI SDK) ────────────────────

export const FusionReportSchema = z.object({
  macroOneLiner: z.string().describe('미장 거시 지표가 국장에 미칠 영향 한 문장 (50자 이내)'),
  overallSignal: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL', 'CAUTION']).describe('전체 시장 시그널'),
  signalStrength: z.number().min(1).max(5).describe('시그널 강도 1~5'),
  keyTheme: z.string().describe('오늘의 핵심 투자 테마 (20자 이내)'),
  moneyFlow: z.object({
    summary: z.string().describe('수급 집중 이유: 미장 컨텍스트와 연계한 인과관계 분석 (200자)'),
    hotSectors: z.array(z.string()).describe('자금 집중 섹터 상위 3개'),
    watchlist: z.array(z.object({
      code: z.string(),
      name: z.string(),
      reason: z.string().describe('매수 근거 30자 이내'),
      risk: z.string().describe('리스크 20자 이내'),
    })).describe('주목 종목 3개'),
  }),
  pbComment: z.string().describe('PB 어드바이저 스타일의 VIP 한 줄 코멘트 (100자 이내)'),
});

export type FusionReport = z.infer<typeof FusionReportSchema> & {
  meta: {
    generatedAt: string;
    cacheHit: boolean;
    date: string;
  };
};

export const AlertSchema = z.object({
  alertLevel: z.enum(['WARNING', 'DANGER', 'EXTREME']),
  causes: z.array(z.string()).describe('급락 원인 3가지'),
  immediateAction: z.string().describe('즉시 취해야 할 행동 50자'),
  watchFor: z.string().describe('앞으로 주시할 지표 30자'),
});

export type AlertReport = z.infer<typeof AlertSchema> & {
  kospiChg: number;
  kosdaqChg: number;
  triggeredAt: string;
};

// ─── 캐시 유틸 ──────────────────────────────────────────────

function todayKey(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

async function getCached(date: string): Promise<FusionReport | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data } = await sb
      .from('ai_reports')
      .select('report, created_at')
      .eq('report_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;
    const ageMin = (Date.now() - new Date(data.created_at).getTime()) / 60000;
    if (ageMin > CACHE_TTL) return null;

    console.log(`[Cache] 히트 (${ageMin.toFixed(0)}분 전 생성)`);
    return { ...(data.report as FusionReport), meta: { ...(data.report as FusionReport).meta, cacheHit: true } };
  } catch {
    return null;
  }
}

async function saveCache(date: string, report: FusionReport): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('ai_reports').insert({ report_date: date, report, created_at: new Date().toISOString() });
}

// ─── 메인 엔진 ───────────────────────────────────────────────

export async function runFusionEngine(forceRefresh = false): Promise<FusionReport> {
  const date = todayKey();
  console.log(`\n[Fusion] 시작 (${date})`);

  // 1. 캐시 확인
  if (!forceRefresh) {
    const cached = await getCached(date);
    if (cached) return cached;
  }

  // 2. 데이터 병렬 수집
  const t0 = Date.now();
  const [macro, stockFlows, kospiSectors, kosdaqSectors, volumeSpikes] = await Promise.allSettled([
    collectMacro(),
    getStockFlows(15),
    getSectorFlows('K'),
    getSectorFlows('Q'),
    getVolumeSpikes(10),
  ]);

  const macroData = macro.status === 'fulfilled' ? macro.value : {
    usdKrw: 1350, sp500Change: 0, nasdaqChange: 0, us10y: 4.5,
    fearGreed: 50, fearGreedLabel: 'Neutral', dominantSector: '데이터 수집 중',
    collectedAt: new Date().toISOString(),
  };
  const stocks = stockFlows.status === 'fulfilled' ? stockFlows.value : [];
  const sectors = [
    ...(kospiSectors.status === 'fulfilled' ? kospiSectors.value : []),
    ...(kosdaqSectors.status === 'fulfilled' ? kosdaqSectors.value : []),
  ];
  const spikes = volumeSpikes.status === 'fulfilled' ? volumeSpikes.value : [];

  console.log(`[Fusion] 데이터 수집 완료: ${Date.now() - t0}ms | 종목 ${stocks.length}개 | 섹터 ${sectors.length}개`);

  // 3. Gemini 분석
  const prompt = buildFusionPrompt({ macro: macroData, stockFlows: stocks, sectorFlows: sectors, volumeSpikes: spikes, date });

  const t1 = Date.now();
  const { object } = await generateObject({
    model: google('gemini-1.5-pro'),
    schema: FusionReportSchema,
    prompt,
    temperature: 0.3,
  });
  console.log(`[Fusion] Gemini 완료: ${Date.now() - t1}ms`);

  const report: FusionReport = {
    ...object,
    meta: { generatedAt: new Date().toISOString(), cacheHit: false, date },
  };

  // 4. 캐싱
  await saveCache(date, report);
  console.log(`[Fusion] 완료 (총 ${Date.now() - t0}ms)\n`);
  return report;
}

// ─── 긴급 알림 엔진 ─────────────────────────────────────────

export async function runAlertEngine(
  kospiChg: number,
  kosdaqChg: number
): Promise<AlertReport | null> {
  if (kospiChg > -3 && kosdaqChg > -3) return null;

  const macro = await collectMacro();
  const prompt = buildAlertPrompt(kospiChg, kosdaqChg, macro);

  const { object } = await generateObject({
    model: google('gemini-1.5-flash'), // 빠른 응답을 위해 Flash
    schema: AlertSchema,
    prompt,
    temperature: 0.1,
  });

  return { ...object, kospiChg, kosdaqChg, triggeredAt: new Date().toISOString() };
}
