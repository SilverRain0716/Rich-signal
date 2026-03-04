/**
 * LS증권 수급 데이터 조회
 *
 * t1404 - 외인/기관 순매수 상위 종목
 * t1452 - 업종별 거래대금/수급
 * t1442 - 거래대금 급증 종목 (세력 진입 시그널)
 * t1511 - 시장 지수 (KOSPI/KOSDAQ 등락률)
 */

import { callLSTr } from './client';

// ─── 타입 정의 ───────────────────────────────────────────────

export interface StockFlow {
  code: string;      // 종목코드
  name: string;      // 종목명
  price: number;     // 현재가
  chgRate: number;   // 등락률(%)
  frgQty: number;    // 외국인 순매수 수량
  orgQty: number;    // 기관 순매수 수량
  totalQty: number;  // 합계 순매수
  trAmount: number;  // 거래대금(원)
}

export interface SectorFlow {
  code: string;
  name: string;
  trAmount: number;   // 업종 거래대금
  chgRate: number;
  frgNetBuy: number;  // 외인 순매수금액
  orgNetBuy: number;  // 기관 순매수금액
}

export interface VolumeSpike {
  code: string;
  name: string;
  price: number;
  chgRate: number;
  trAmount: number;
  spikeRatio: number; // 전일 대비 거래대금 증가율(%)
}

export interface IndexStatus {
  kospiChg: number;
  kosdaqChg: number;
}

// ─── 조회 함수 ───────────────────────────────────────────────

/** [t1404] 외인+기관 동시 순매수 상위 종목 */
export async function getStockFlows(topN = 15): Promise<StockFlow[]> {
  try {
    const res = await callLSTr<Record<string, unknown>>('t1404', {
      gubun: '0',    // 0: 전체(코스피+코스닥)
      sort: '1',     // 합계 순매수 기준
      tmcode: '0',   // 당일 전체
      cnt: topN,
    });
    if (res.rsp_cd !== '00000' || !res.output2) return [];

    return (res.output2 as Record<string, unknown>[]).map((r) => ({
      code: String(r.shtnIscd ?? ''),
      name: String(r.hname ?? ''),
      price: Number(r.price ?? 0),
      chgRate: Number(r.chgRate ?? 0),
      frgQty: Number(r.frgQty ?? 0),
      orgQty: Number(r.orgQty ?? 0),
      totalQty: Number(r.totQty ?? 0),
      trAmount: Number(r.trAmount ?? 0),
    }));
  } catch (e) {
    console.error('[t1404]', e);
    return [];
  }
}

/** [t1452] 업종별 거래대금/수급 상위 */
export async function getSectorFlows(market: 'K' | 'Q' = 'K'): Promise<SectorFlow[]> {
  try {
    const res = await callLSTr<Record<string, unknown>>('t1452', {
      upjong: market,
      sort: '1',
    });
    if (res.rsp_cd !== '00000' || !res.output2) return [];

    return (res.output2 as Record<string, unknown>[]).map((r) => ({
      code: String(r.upCode ?? ''),
      name: String(r.upName ?? ''),
      trAmount: Number(r.trAmount ?? 0),
      chgRate: Number(r.chgRate ?? 0),
      frgNetBuy: Number(r.frgNetBuy ?? 0),
      orgNetBuy: Number(r.orgNetBuy ?? 0),
    }));
  } catch (e) {
    console.error('[t1452]', e);
    return [];
  }
}

/** [t1442] 거래대금 급증 종목 - 세력 진입 포착 */
export async function getVolumeSpikes(topN = 10): Promise<VolumeSpike[]> {
  try {
    const res = await callLSTr<Record<string, unknown>>('t1442', {
      gubun: '0',
      sort: '2', // 급증률 기준
      cnt: topN,
    });
    if (res.rsp_cd !== '00000' || !res.output2) return [];

    return (res.output2 as Record<string, unknown>[]).map((r) => ({
      code: String(r.shtnIscd ?? ''),
      name: String(r.hname ?? ''),
      price: Number(r.price ?? 0),
      chgRate: Number(r.chgRate ?? 0),
      trAmount: Number(r.trAmount ?? 0),
      spikeRatio: Number(r.trAmountRatio ?? 0),
    }));
  } catch (e) {
    console.error('[t1442]', e);
    return [];
  }
}

/** [t1511] KOSPI/KOSDAQ 현재 등락률 (긴급 알림용) */
export async function getIndexStatus(): Promise<IndexStatus> {
  try {
    const res = await callLSTr<Record<string, unknown>>('t1511', { gubun: '0' });
    if (res.rsp_cd !== '00000') return { kospiChg: 0, kosdaqChg: 0 };

    const o = res.output1 as Record<string, unknown> | undefined;
    return {
      kospiChg: Number(o?.kospiChgRate ?? 0),
      kosdaqChg: Number(o?.kosdaqChgRate ?? 0),
    };
  } catch {
    return { kospiChg: 0, kosdaqChg: 0 };
  }
}
