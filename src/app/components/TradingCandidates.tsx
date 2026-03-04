'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RefreshCw, AlertTriangle, TrendingUp, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import type { TradingCandidates as TCType } from '@/services/ai-engine/candidates';

const CONDITION_CONFIG = {
  FAVORABLE: { label: '매매 유리', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  NEUTRAL:   { label: '중립',     color: 'text-white/50',     dot: 'bg-white/30' },
  RISKY:     { label: '위험',     color: 'text-red-400',      dot: 'bg-red-400' },
};

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < score
              ? score >= 8 ? 'bg-emerald-400' : score >= 5 ? 'bg-amber-400' : 'bg-red-400'
              : 'bg-white/10'
          }`}
        />
      ))}
      <span className={`text-[10px] font-black ml-1 ${score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
        {score}/10
      </span>
    </div>
  );
}

function CandidateCard({ stock, index }: { stock: TCType['candidates'][0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isBuy = stock.signal === 'BUY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        isBuy
          ? 'bg-gradient-to-br from-emerald-950/80 to-black/60 border-emerald-500/30 hover:border-emerald-400/50'
          : 'bg-black/40 border-white/10 hover:border-white/20'
      }`}
    >
      {/* 상단 핵심 정보 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          {/* 시그널 배지 + 종목 */}
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${
              isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'
            }`}>
              {isBuy ? <TrendingUp className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {stock.signal}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm">{stock.name}</span>
                <span className="text-white/30 text-[10px] font-mono">{stock.code}</span>
              </div>
              <span className="text-[10px] text-white/30 mt-0.5 block">{stock.sector}</span>
            </div>
          </div>

          {/* 신뢰도 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-white/20 hover:text-white/50 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* 신뢰도 바 */}
        <ConfidenceBar score={stock.confidence} />

        {/* 매수 근거 - 핵심 */}
        <div className={`mt-3 p-2.5 rounded-lg ${isBuy ? 'bg-emerald-950/50' : 'bg-white/5'}`}>
          <p className={`text-xs leading-relaxed font-medium ${isBuy ? 'text-emerald-200/90' : 'text-white/60'}`}>
            {stock.buyReason}
          </p>
        </div>
      </div>

      {/* 확장 정보 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-2 border-t border-white/10">
              <div className="pt-3 grid grid-cols-2 gap-2">
                <InfoItem label="촉매" value={stock.catalyst} color="text-[#D4AF37]/80" />
                <InfoItem label="진입 전략" value={stock.entryNote} color="text-blue-300/80" />
                <InfoItem label="손절 기준" value={stock.stopLoss} color="text-white/60" />
                <InfoItem label="리스크" value={stock.risk} color="text-red-400/70" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-2">
      <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-xs font-medium leading-relaxed ${color}`}>{value}</p>
    </div>
  );
}

export default function TradingCandidates() {
  const [data, setData] = useState<TCType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/candidates${refresh ? '?refresh=true' : ''}`);
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      setData(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const cond = data?.marketCondition ? CONDITION_CONFIG[data.marketCondition] : null;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-black text-white/50 tracking-[0.2em] uppercase">Today's Picks</span>
          {cond && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
              <span className={`text-[10px] font-bold ${cond.color}`}>{cond.label}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data?.generatedAt && (
            <span className="text-[10px] text-white/20 font-mono">
              {new Date(data.generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetch_(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[10px] text-white/40 font-medium disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            재분석
          </button>
        </div>
      </div>

      {/* 오늘 테마 + 한 줄 요약 */}
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-widest whitespace-nowrap">
              오늘의 테마
            </span>
            <span className="text-sm font-bold text-[#D4AF37]">{data.todayTheme}</span>
            <span className="text-xs text-white/40 ml-auto hidden md:block">{data.oneLiner}</span>
          </div>
          <p className="text-xs text-white/40 mt-1 md:hidden">{data.oneLiner}</p>
        </motion.div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
          <button onClick={() => fetch_()} className="ml-auto text-xs text-red-400 underline">재시도</button>
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && !data && (
        <div className="space-y-3">
          <div className="rounded-xl bg-black/20 border border-white/5 p-4 animate-pulse text-center">
            <Target className="w-5 h-5 text-[#D4AF37]/40 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-[#D4AF37]/40 tracking-wider">
              뉴스 + 수급 분석 중... (15~30초 소요)
            </p>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-black/20 border border-white/5 p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-14 h-6 bg-white/10 rounded-md" />
                <div className="w-24 h-6 bg-white/10 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-1.5 bg-white/5 rounded-full" />
                <div className="h-10 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 후보 카드 리스트 */}
      {data && (
        <div className="space-y-3">
          {data.candidates.map((stock, i) => (
            <CandidateCard key={stock.code || stock.name} stock={stock} index={i} />
          ))}
        </div>
      )}

      {/* 면책 */}
      <p className="text-[9px] text-white/15 text-center px-4 leading-relaxed">
        AI 분석은 투자 참고용이며 투자 손실에 대한 책임은 투자자 본인에게 있습니다.
      </p>
    </div>
  );
}
