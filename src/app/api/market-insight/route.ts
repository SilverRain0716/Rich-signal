import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function GET() {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: z.object({
        summary: z.string().describe('미 증시 핵심 요약 (1문장)'),
        signals: z.array(z.object({
          sector: z.string().describe('상승 예상 국장 섹터'),
          relatedStock: z.string().describe('대표 관련주'),
          logic: z.string().describe('인과관계 분석'),
          strength: z.number().describe('시그널 강도 (1-10)')
        })),
        premiumNote: z.string().describe('고액 자산가를 위한 한 줄 조언')
      }),
      prompt: `당신은 '리치 시그널'의 수석 애널리스트입니다. 
               현재 나스닥 및 S&P 500의 흐름을 바탕으로 내일 한국 증시에서 
               가장 유망한 섹터 3개를 선정하고 그 이유를 전문적으로 분석하세요.`,
    });

    return Response.json(object);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch signal' }, { status: 500 });
  }
}