'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Crown } from 'lucide-react';

interface Signal {
  sector: string;
  relatedStock: string;
  logic: string;
  strength: number;
}

interface InsightData {
  summary: string;
  signals: Signal[];
  premiumNote: string;
}

export default function RichInsight() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market-insight')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-[#D4AF37] animate-pulse">Analysing Global Signals...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 메인 요약 카드 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/30 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
          <Crown size={20} />
          <span className="font-bold tracking-wider uppercase text-sm">Market Intelligence</span>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">{data?.summary}</h2>
        <p className="text-blue-100/80 italic">"{data?.premiumNote}"</p>
      </motion.div>

      {/* 개별 섹터 시그널 카드 */}
      {data?.signals.map((signal, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.02 }}
          className="p-5 rounded-xl bg-[#1E40AF]/20 border border-white/10 hover:border-[#D4AF37]/50 transition-all"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#1E40AF] text-xs font-bold">
              Strength {signal.strength}/10
            </span>
            <TrendingUp size={18} className="text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{signal.sector}</h3>
          <p className="text-[#D4AF37] text-sm mb-3 font-medium">관련주: {signal.relatedStock}</p>
          <p className="text-sm text-blue-100/70 leading-relaxed">{signal.logic}</p>
        </motion.div>
      ))}
    </div>
  );
}