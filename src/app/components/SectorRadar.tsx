'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, RefreshCw, Zap, BarChart2 } from 'lucide-react';
import type { SectorFlow, StockFlow, VolumeSpike } from '@/services/ls-sec/endpoints';
import type { MacroData } from '@/services/macro/indicators';

interface SectorsData {
  sectors: SectorFlow[];
  topStocks: StockFlow[];
  volumeSpikes: VolumeSpike[];
  macro: MacroData | null;
  updatedAt: string;
}

function fmt(n: number, d = 1) { return `${n >= 0 ? '+' : ''}${n.toFixed(d)}`; }
function fmtBil(n: number) {
  const abs = Math.abs(n);
  const prefix = n >= 0 ? '+' : '-';
  if (abs >= 1e12) return `${prefix}${(abs / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `${prefix}${(abs / 1e8).toFixed(0)}억`;
  return `${prefix}${(abs / 1e4).toFixed(0)}만`;
}

function MacroBar({ macro }: { macro: MacroData }) {
  const items = [
    { label: 'USD/KRW', value: `${macro.usdKrw.toLocaleString('ko-KR')}`, neutral: true },
    { label: 'S&P500', value: fmt(macro.sp500Change) + '%', up: macro.sp500Change >= 0 },
    { label: 'NASDAQ', value: fmt(macro.nasdaqChange) + '%', up: macro.nasdaqChange >= 0 },
    { label: '공포탐욕', value: `${macro.fearGreed}`, neutral: true },
    { label: '주도섹터', value: macro.dominantSector.split(' ')[0], neutral: true },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{item.label}</span>
          <span className={`text-xs font-bold font-mono ${item.neutral ? 'text-white/70' : item.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectorBar({ sector, maxAmt }: { sector: SectorFlow; maxAmt: number }) {
  const netFlow = sector.frgNetBuy + sector.orgNetBuy;
  const pct = maxAmt > 0 ? Math.abs(netFlow) / maxAmt : 0;
  const isPositive = netFlow >= 0;

  return (
    <motion.div
      layout
      className="group"
    >
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
        {/* 섹터명 */}
        <div className="w-28 shrink-0">
          <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors truncate block">
            {sector.name}
          </span>
        </div>

        {/* 수급 바 */}
        <div className="flex-1 relative h-4 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${isPositive ? 'bg-gradient-to-r from-[#1E40AF] to-emerald-500' : 'bg-gradient-to-r from-red-900 to-red-500'}`}
          />
        </div>

        {/* 금액 */}
        <div className="w-20 text-right shrink-0">
          <span className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtBil(netFlow)}
          </span>
        </div>

        {/* 등락 */}
        <div className="w-12 text-right shrink-0">
          <span className={`text-[10px] font-mono ${sector.chgRate >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {fmt(sector.chgRate)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function StockPill({ stock }: { stock: StockFlow }) {
  const isNet = stock.totalQty >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
        ${isNet
          ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
          : 'bg-red-950/60 border-red-500/30 text-red-300'
        }`}
    >
      {isNet ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
      <span className="font-bold">{stock.name}</span>
      <span className="opacity-60">{fmt(stock.chgRate, 1)}%</span>
    </motion.div>
  );
}

function SpikeItem({ spike }: { spike: VolumeSpike }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-xs text-white/80 font-medium">{spike.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono ${spike.chgRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmt(spike.chgRate)}%
        </span>
        <span className="text-[10px] text-amber-400 font-bold">
          거래대금 +{spike.spikeRatio.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function SectorRadar() {
  const [data, setData] = useState<SectorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch('/api/sectors');
      const j = await r.json();
      if (j.success) {
        setData(j.data);
        setLastUpdate(new Date());
        setPulse(true);
        setTimeout(() => setPulse(false), 500);
      }
    } catch { /* 무시 */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(() => fetch_(true), 120_000); // 2분마다
    return () => clearInterval(id);
  }, [fetch_]);

  const sortedSectors = data?.sectors
    ? [...data.sectors]
        .sort((a, b) => Math.abs(b.frgNetBuy + b.orgNetBuy) - Math.abs(a.frgNetBuy + a.orgNetBuy))
        .slice(0, 10)
    : [];

  const maxAmt = sortedSectors.length
    ? Math.max(...sortedSectors.map(s => Math.abs(s.frgNetBuy + s.orgNetBuy)))
    : 1;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${pulse ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'} transition-all duration-300`} />
          <span className="text-xs font-black text-white/50 tracking-[0.2em] uppercase">Sector Radar</span>
          <span className="text-[10px] text-white/20">2분 갱신</span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] text-white/20 font-mono">
              {lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetch_()}
            disabled={loading}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 text-white/40 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 거시 티커 */}
      {data?.macro && (
        <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/5">
          <MacroBar macro={data.macro} />
        </div>
      )}

      {/* 섹터 수급 바 */}
      <div className="rounded-xl bg-black/20 border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <BarChart2 className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">섹터 외인+기관 순매수</span>
        </div>

        {loading && !data ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-28 h-3 bg-white/10 rounded" />
                <div className="flex-1 h-4 bg-white/5 rounded-full" />
                <div className="w-16 h-3 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-1">
            <AnimatePresence>
              {sortedSectors.map((s) => (
                <SectorBar key={s.code || s.name} sector={s} maxAmt={maxAmt} />
              ))}
              {sortedSectors.length === 0 && (
                <div className="py-8 text-center text-white/20 text-xs">
                  장 시작 전 / LS증권 API 연결 대기
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 하단 2열: 순매수 상위 종목 + 거래대금 급증 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 외인+기관 상위 종목 */}
        <div className="rounded-xl bg-black/20 border border-white/8 p-3">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
            외인+기관 동시 매수
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data?.topStocks.slice(0, 8).map((s) => (
              <StockPill key={s.code} stock={s} />
            )) ?? (
              <span className="text-xs text-white/20">데이터 없음</span>
            )}
          </div>
        </div>

        {/* 거래대금 급증 */}
        <div className="rounded-xl bg-black/20 border border-white/8 p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3 text-amber-400" />
            <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">
              거래대금 급증 (세력 포착)
            </p>
          </div>
          <div className="space-y-0">
            {data?.volumeSpikes.slice(0, 5).map((s) => (
              <SpikeItem key={s.code} spike={s} />
            )) ?? (
              <span className="text-xs text-white/20">데이터 없음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
