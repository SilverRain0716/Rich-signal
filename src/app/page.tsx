/**
 * Rich Signal - PWA 메인 (탭 기반 모바일 레이아웃)
 * 데스크톱: 2열 사이드바이사이드
 * 모바일: 하단 탭 네비게이션
 */
'use client';

import { useState, useEffect } from 'react';
import { Zap, BarChart2, Target, Circle } from 'lucide-react';
import SectorRadar from './components/SectorRadar';
import TradingCandidates from './components/TradingCandidates';

type Tab = 'radar' | 'picks';

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('picks');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen min-h-dvh bg-rich-dark flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-white/8 bg-black/50 backdrop-blur-xl shrink-0 safe-top">
        <div className="max-w-[1600px] mx-auto px-4 h-13 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-[#D4AF37]/70 flex items-center justify-center">
              <Zap className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <span className="text-sm font-black tracking-[0.12em] text-white">Rich Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/30 font-mono tabular-nums">{time}</span>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {/* 데스크톱: 2열 */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] h-full max-w-[1600px] mx-auto px-5 py-5 gap-5">
          <div className="overflow-y-auto pr-2">
            <SectorRadar />
          </div>
          <div className="overflow-y-auto pl-2 border-l border-white/8">
            <TradingCandidates />
          </div>
        </div>

        {/* 모바일: 탭 컨텐츠 */}
        <div className="lg:hidden h-full overflow-y-auto">
          <div className="px-4 py-4 pb-24">
            {tab === 'radar' && <SectorRadar />}
            {tab === 'picks' && <TradingCandidates />}
          </div>
        </div>
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-bottom">
        <div className="flex">
          <button
            onClick={() => setTab('radar')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              tab === 'radar' ? 'text-[#D4AF37]' : 'text-white/30'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">수급 레이더</span>
          </button>
          <button
            onClick={() => setTab('picks')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              tab === 'picks' ? 'text-[#D4AF37]' : 'text-white/30'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider">매매 후보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
