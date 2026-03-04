/**
 * Rich Signal - Gemini 프롬프트 템플릿
 * Vercel AI SDK의 generateObject와 함께 사용
 */

import type { MacroData } from '../macro/indicators';
import type { StockFlow, SectorFlow, VolumeSpike } from '../ls-sec/endpoints';

export interface PromptContext {
  macro: MacroData;
  stockFlows: StockFlow[];
  sectorFlows: SectorFlow[];
  volumeSpikes: VolumeSpike[];
  date: string;
}

function fmt(n: number, decimals = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}`;
}

export function buildFusionPrompt(ctx: PromptContext): string {
  const macro = `
## 글로벌 거시 지표 (${ctx.date})
- USD/KRW 환율: ${ctx.macro.usdKrw.toLocaleString('ko-KR')}원
- S&P500 선물: ${fmt(ctx.macro.sp500Change)}%
- 나스닥100 선물: ${fmt(ctx.macro.nasdaqChange)}%
- 미국채 10년: ${ctx.macro.us10y.toFixed(2)}%
- CNN 공포탐욕지수: ${ctx.macro.fearGreed}/100 (${ctx.macro.fearGreedLabel})
- 미장 주도 섹터: ${ctx.macro.dominantSector}
`.trim();

  const stocks = ctx.stockFlows.slice(0, 10).map((s, i) =>
    `${i + 1}. ${s.name}(${s.code}) | 등락 ${fmt(s.chgRate, 1)}% | 외인 ${s.frgQty >= 0 ? '+' : ''}${s.frgQty.toLocaleString()}주 | 기관 ${s.orgQty >= 0 ? '+' : ''}${s.orgQty.toLocaleString()}주`
  ).join('\n');

  const sectors = ctx.sectorFlows.slice(0, 6).map((s) =>
    `- ${s.name}: 거래대금 ${(s.trAmount / 1e8).toFixed(0)}억 | 외인 ${fmt(s.frgNetBuy / 1e8, 0)}억 | 기관 ${fmt(s.orgNetBuy / 1e8, 0)}억`
  ).join('\n');

  const spikes = ctx.volumeSpikes.slice(0, 5).map((s) =>
    `- ${s.name}: 거래대금 전일比 ${s.spikeRatio.toFixed(0)}% 급증 (${(s.trAmount / 1e8).toFixed(0)}억)`
  ).join('\n');

  return `
당신은 '리치 시그널'의 수석 PB 애널리스트입니다.
아래 실시간 수급 데이터와 글로벌 거시 지표를 종합 분석하여
고액 자산가를 위한 프리미엄 투자 인텔리전스를 제공하세요.

${macro}

## 외인+기관 동시 순매수 상위 종목
${stocks || '데이터 없음 (장 마감 또는 API 연결 대기 중)'}

## 업종별 자금 흐름
${sectors || '데이터 없음'}

## 거래대금 급증 종목 (세력 포착)
${spikes || '데이터 없음'}

---
위 데이터를 바탕으로 다음을 분석하세요:
1. 미장 흐름이 왜 국장 수급에 이런 영향을 미치는지 인과관계
2. 외인/기관이 특정 섹터에 집중하는 전략적 이유
3. 오늘 가장 주목해야 할 테마 및 핵심 종목 3개
4. 고액 자산가에게 전달할 전문적 한 줄 코멘트
`.trim();
}

export function buildAlertPrompt(
  kospiChg: number,
  kosdaqChg: number,
  macro: MacroData
): string {
  return `
한국 주식시장 급락 감지:
- KOSPI: ${fmt(kospiChg)}%
- KOSDAQ: ${fmt(kosdaqChg)}%
- S&P500 선물: ${fmt(macro.sp500Change)}%
- USD/KRW: ${macro.usdKrw}원
- 공포탐욕지수: ${macro.fearGreed} (${macro.fearGreedLabel})

이 급락의 핵심 원인 3가지와 투자자 즉시 대응 지침을 분석하세요.
`.trim();
}
