/**
 * Rich Signal - 메인 대시보드
 * 네비게이션 + RichInsight 컴포넌트 (실제 AI 데이터 연동)
 */
import { Zap, Globe, TrendingUp, ShieldCheck, Search, User } from 'lucide-react';
import RichInsight from './components/RichInsight';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-rich-dark text-white">
      {/* 네비게이션 */}
      <nav className="bg-[#0D1B3E]/80 backdrop-blur-xl text-white sticky top-0 z-50 border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] rounded-full flex items-center justify-center bg-blue-900/50">
              <Zap className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-[0.15em] uppercase leading-none">Rich Signal</span>
              <span className="text-[9px] text-[#D4AF37]/60 tracking-[0.25em] font-medium mt-0.5">PREMIUM INTELLIGENCE</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 text-xs font-bold tracking-widest">
            <button className="text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1">DASHBOARD</button>
            <button className="text-white/40 hover:text-white transition-colors">MARKET FLOW</button>
            <button className="text-white/40 hover:text-white transition-colors">AI INSIGHT</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/40" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#1E40AF] border border-[#D4AF37]/30 flex items-center justify-center">
              <User className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* 상단 배너 */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D1B3E] to-[#1E40AF]/60 border border-[#D4AF37]/20 p-8 md:p-12">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1E40AF]/30 rounded-full blur-2xl" />

          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 text-[#D4AF37]/80 text-xs font-bold tracking-[0.2em] uppercase">
                <Globe className="w-4 h-4" />
                Strategic Market Bridge · AI-Powered
              </div>
              <h1 className="text-2xl md:text-3xl font-medium leading-tight text-white/90">
                글로벌 수급과 거시 지표를 융합하여<br />
                <span className="text-[#D4AF37] font-bold">국내 주도주를 선점</span>하는 프리미엄 인텔리전스
              </h1>
              <p className="text-sm text-white/40 max-w-xl">
                LS증권 실시간 수급 데이터 × Gemini AI × 글로벌 거시 지표의 삼중 융합 분석
              </p>
            </div>

            <div className="bg-black/30 border border-[#D4AF37]/20 p-6 rounded-2xl text-center min-w-[160px]">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Data Sources</div>
              <div className="space-y-2 text-left">
                {[
                  { label: 'LS증권 API', status: '연결' },
                  { label: 'Gemini 1.5 Pro', status: '활성' },
                  { label: 'Supabase Cache', status: '준비' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/40">{s.label}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 메인 인사이트 */}
        <section>
          <RichInsight />
        </section>

        {/* 면책 조항 */}
        <footer className="border-t border-white/10 pt-8 pb-4">
          <div className="flex items-start gap-3 max-w-3xl">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]/60 shrink-0 mt-0.5" />
            <p className="text-xs text-white/20 leading-relaxed">
              본 분석은 AI가 처리한 객관적 지표 기반의 투자 참고용 데이터입니다.
              모든 투자 판단과 책임은 투자자 본인에게 있으며, 금융투자상품의 원금 손실이 발생할 수 있습니다.
              Rich Signal은 투자 자문업자가 아닙니다.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
