/**
 * Rich Signal - 메인 대시보드 (재설계 v2)
 *
 * 레이아웃:
 * - 좌측 (넓음): SectorRadar - 실시간 수급 레이더
 * - 우측: TradingCandidates - 오늘 매매 후보
 */
import { Zap, Circle } from 'lucide-react';
import SectorRadar from './components/SectorRadar';
import TradingCandidates from './components/TradingCandidates';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-rich-dark">
      {/* 상단 헤더 - 컴팩트 */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-[#D4AF37]/60 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <span className="text-sm font-black tracking-[0.15em] text-white uppercase">Rich Signal</span>
            <span className="text-[8px] text-[#D4AF37]/50 tracking-[0.2em] font-medium hidden sm:block">
              PREMIUM INTELLIGENCE
            </span>
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/30 font-mono">LIVE</span>
            </div>
            <span className="text-[10px] text-white/20 font-mono hidden sm:block">
              KST {new Date().toLocaleTimeString('ko-KR', {
                timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 - 2열 */}
      <main className="max-w-[1600px] mx-auto px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-6">

          {/* 좌측: 실시간 수급 레이더 */}
          <section>
            <SectorRadar />
          </section>

          {/* 우측: 매매 후보 */}
          <section>
            <TradingCandidates />
          </section>

        </div>
      </main>
    </div>
  );
}
