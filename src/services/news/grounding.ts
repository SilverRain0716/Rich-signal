/**
 * 오늘 뉴스 컨텍스트 수집
 * Gemini가 거시 데이터를 기반으로 시장 컨텍스트를 추론
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export interface NewsContext {
  usMarketSummary: string;
  krMarketCatalyst: string;
  keyRisk: string;
  fetchedAt: string;
}

const NewsSchema = z.object({
  usMarketSummary: z.string().describe('최근 미국 증시 핵심 흐름 2~3문장'),
  krMarketCatalyst: z.string().describe('한국 증시에 영향줄 핵심 요인 2~3문장'),
  keyRisk: z.string().describe('현재 시장 가장 큰 하방 리스크 1문장'),
});

export async function fetchTodayNewsContext(
  sp500: number,
  nasdaqChg: number,
  fearGreed: number
): Promise<NewsContext> {
  try {
    const today = new Date().toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric',
    });

    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: NewsSchema,
      prompt: `오늘 ${today} 한국 주식 트레이더를 위한 시장 컨텍스트 분석:

현재 지표:
- S&P500 선물: ${sp500 >= 0 ? '+' : ''}${sp500.toFixed(2)}%
- 나스닥100: ${nasdaqChg >= 0 ? '+' : ''}${nasdaqChg.toFixed(2)}%  
- 공포탐욕지수: ${fearGreed}/100

위 수치를 바탕으로 현재 미국 증시 흐름, 한국 증시 영향 요인, 주요 리스크를 분석해줘.
실제로 일어나고 있을 법한 구체적인 내용으로 작성해줘.`,
      temperature: 0.3,
    });

    return { ...object, fetchedAt: new Date().toISOString() };
  } catch (e) {
    console.error('[NewsContext] 실패:', e);
    return {
      usMarketSummary: '데이터 수집 실패',
      krMarketCatalyst: '수급 데이터 기반 분석 진행',
      keyRisk: '확인 불가',
      fetchedAt: new Date().toISOString(),
    };
  }
}
