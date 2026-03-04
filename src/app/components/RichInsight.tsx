'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Crown, AlertTriangle,
  RefreshCw, Zap, Globe, BarChart3, Target, ChevronRight,
  ShieldAlert, Activity
} from 'lucide-react';
import type { FusionReport } from '@/services/ai-engine/fusion';

interface AlertData {
  alertLevel: 'WARNING' | 'DANGER' | 'EXTREME';
  causes: string[];
  immediateAction: string;
  watchFor: string;
  kospiChg: number;
  kosdaqChg: number;
  triggeredAt: string;
}

const SIGNAL_CONFIG = {
  BULLISH:  { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: '강세', icon: TrendingUp },
  BEARISH:  { color: 'text-red-400',     bg: 'bg-red-500/20',     label: '약세', icon: TrendingDown },
  NEUTRAL:  { color: 'text-slate-400',   bg: 'bg-slate-500/20',   label: '중립', icon: Minus },
  CAUTION:  { color: 'text-amber-400',   bg: 'bg-amber-500/20',   label: '주의', icon: AlertTriangle },
};

const ALERT_CONFIG = {
  WARNING:  { border: 'border-amber-400', bg: 'bg-amber-900/40',  label: '⚠️ 경고' },
  DANGER:   { border: 'border-orange-400', bg: 'bg-orange-900/40', label: '🔶 위험' },
  EXTREME:  { border: 'border-red-500',   bg: 'bg-red-900/50',    label: '🔴 극단적 위험' },
};

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`}>
      <div className="p-6 space-y-3">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-5 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-4/5" />
      </div>
    </div>
  );
}

function SignalBadge({ signal, strength }: { signal: FusionReport['overallSignal']; strength: number }) {
  const cfg = SIGNAL_CONFIG[signal];
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${cfg.bg} border border-current/20`}>
      <Icon className={`w-4 h-4 ${cfg.color}`} />
      <span className={`font-black text-sm tracking-wider ${cfg.color}`}>{cfg.label}</span>
      <span className="text-white/40 text-xs">Str.{strength}/5</span>
    </div>
  );
}

export default function RichInsight() {
  const [report, setReport] = useState<FusionReport | null>(null);
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market-insight');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setReport(json.data as FusionReport);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAlert = useCallback(async () => {
    try {
      const res = await fetch('/api/alert');
      const json = await res.json();
      if (json.data?.isAlert) {
        const alertRes = await fetch('/api/alert', { method: 'POST' });
        const alertJson = await alertRes.json();
        if (alertJson.data) setAlert(alertJson.data as AlertData);
      } else {
        setAlert(null);
      }
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    fetchReport();
    checkAlert();
    const id = setInterval(checkAlert, 30000);
    return () => clearInterval(id);
  }, [fetchReport, checkAlert]);

  return (
    <div className="space-y-8">
      {/* 긴급 알림 */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative rounded-2xl border-2 ${ALERT_CONFIG[alert.alertLevel].border} ${ALERT_CONFIG[alert.alertLevel].bg} p-6 backdrop-blur-md overflow-hidden`}
          >
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
                <span className="font-black text-white tracking-widest text-sm">
                  {ALERT_CONFIG[alert.alertLevel].label} — EMERGENCY SIGNAL
                </span>
                <span className="ml-auto text-xs text-white/40">
                  KOSPI {alert.kospiChg.toFixed(2)}% / KOSDAQ {alert.kosdaqChg.toFixed(2)}%
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">급락 원인 분석</p>
                  {alert.causes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="text-red-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">즉시 행동</p>
                    <p className="text-sm text-amber-300 font-medium">{alert.immediateAction}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">주시 지표</p>
                    <p className="text-sm text-white/70">{alert.watchFor}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-black text-white/40 tracking-[0.25em] uppercase">Live Intelligence</span>
          {report && !loading && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${report.meta.cacheHit ? 'bg-slate-700 text-slate-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
              {report.meta.cacheHit ? '📦 CACHED' : '⚡ FRESH'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/20">
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 갱신
            </span>
          )}
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-2xl bg-red-900/30 border border-red-500/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 font-medium">{error}</p>
          <button onClick={fetchReport} className="mt-3 text-xs text-red-400 underline">다시 시도</button>
        </div>
      )}

      {/* 로딩 */}
      {loading && !report && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 animate-pulse text-center">
            <Zap className="w-6 h-6 text-[#D4AF37] mx-auto mb-2 animate-pulse" />
            <p className="text-[#D4AF37]/60 text-sm font-medium tracking-widest">ANALYSING GLOBAL SIGNALS...</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-36" />)}
          </div>
        </div>
      )}

      {/* 리포트 */}
      {report && (
        <div className="space-y-6">
          {/* Macro Bridge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-[#D4AF37]/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-black text-[#D4AF37] tracking-[0.2em] uppercase">Macro Bridge</span>
            </div>
            <p className="text-lg md:text-xl font-medium text-white leading-relaxed">{report.macroOneLiner}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SignalBadge signal={report.overallSignal} strength={report.signalStrength} />
              <span className="text-xs text-white/40 font-bold tracking-wider px-3 py-1.5 bg-white/5 rounded-full">
                {report.keyTheme}
              </span>
            </div>
          </motion.div>

          {/* Money Flow Report */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-black text-white/40 tracking-[0.2em] uppercase">Money Flow Report</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-5">{report.moneyFlow.summary}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {report.moneyFlow.hotSectors.map((s, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-[#1E40AF]/40 border border-[#1E40AF]/60 text-xs font-bold text-blue-200">
                  #{s}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-black text-white/30 tracking-[0.2em] uppercase">Watchlist</p>
              {report.moneyFlow.watchlist.map((stock, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-[#D4AF37]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{stock.name}</span>
                      <span className="text-xs text-white/30">{stock.code}</span>
                    </div>
                    <p className="text-xs text-white/50 truncate">{stock.reason}</p>
                  </div>
                  <p className="text-xs text-amber-400/70 shrink-0">⚠ {stock.risk}</p>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* PB Comment */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[#1E40AF]/30 border border-[#D4AF37]/30 border-b-4 border-b-[#D4AF37]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-black text-[#D4AF37] tracking-[0.2em] uppercase">PB Strategic Comment</span>
            </div>
            <p className="text-white/90 italic font-medium leading-relaxed">&ldquo;{report.pbComment}&rdquo;</p>
          </motion.div>

          {/* 워치리스트 카드 */}
          <div className="grid md:grid-cols-3 gap-4">
            {report.moneyFlow.watchlist.map((stock, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.07 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <Target className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-white/30 font-mono">{stock.code}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">{stock.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-3">{stock.reason}</p>
                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs text-amber-400/70">리스크: {stock.risk}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
