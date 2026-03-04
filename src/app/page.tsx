/**
 * 경로: /src/app/page.tsx
 * 리치 시그널의 메인 화면입니다.
 */
import React from 'react';
import { Zap, Globe, TrendingUp, ShieldCheck, MessageSquare, Search, Bell, User, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      {/* 상단 네비게이션: Deep Blue 배경 */}
      <nav className="bg-[#1E40AF] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] rounded-full flex items-center justify-center bg-blue-900/50">
              <Zap className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-[0.15em] uppercase leading-none">Rich Signal</span>
              <span className="text-[9px] text-blue-200 tracking-[0.25em] font-medium mt-1">PREMIUM INTELLIGENCE</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-xs font-bold tracking-widest">
            <button className="text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1">DASHBOARD</button>
            <button className="text-blue-100 hover:text-white transition-colors">MARKET FLOW</button>
            <button className="text-blue-100 hover:text-white transition-colors">AI INSIGHT</button>
          </div>

          <div className="flex items-center gap-5">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Search className="w-5 h-5 text-blue-100" /></button>
            <div className="w-10 h-10 rounded-full bg-blue-950 border border-[#D4AF37]/30 flex items-center justify-center">
              <User className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* 글로벌 브릿지: 시장의 큰 흐름을 보여주는 배너 */}
        <section className="bg-white border-l-[10px] border-[#D4AF37] shadow-xl p-10 rounded-r-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 text-left max-w-2xl">
              <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-xs uppercase tracking-[0.2em]">
                <Globe className="w-4 h-4" /> Strategic Market Bridge
              </div>
              <h1 className="text-3xl md:text-4xl font-medium leading-tight text-slate-800">
                Nasdaq 반도체 섹터 강세 → <span className="text-[#1E40AF] font-bold">국내 HBM 및 AI 소부장</span>으로의 강력한 낙수효과가 관측됩니다.
              </h1>
            </div>
            <div className="bg-[#F9FAFB] border border-slate-100 p-6 rounded-2xl text-center min-w-[180px] shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Market Strength</div>
              <div className="text-4xl font-bold text-[#D4AF37]">94/100</div>
              <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                STRONG BULLISH <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* 메인 섹터 그리드 */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-left tracking-tight">주도 섹터 자금 흐름</h2>
              <button className="text-xs font-bold text-[#1E40AF] flex items-center gap-1 hover:underline">
                상세보기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['반도체 소부장', 'AI 소프트웨어', '이차전지 소재', '방산/우주항공'].map((sector, i) => (
                <div key={i} className="premium-card p-8 text-left group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] group-hover:text-[#1E40AF] transition-colors">{sector}</span>
                    <span className="text-lg font-bold text-emerald-600">+{2.4 + i * 1.1}%</span>
                  </div>
                  <div className="h-[3px] w-full bg-slate-100 mb-4 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E40AF] transition-all duration-1000" style={{ width: `${65 + i * 7}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Strength <span className="text-[#111827] ml-2">{70 + i * 5}%</span></span>
                    <span className="text-[10px] font-medium text-slate-300">VOL: {1.2 - i * 0.2}T</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 사이드바: AI 인사이트 */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-5">
              <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold text-left tracking-tight">AI 전략 리포트</h2>
            </div>

            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="premium-card p-8 space-y-5 text-left border-t-4 border-t-[#D4AF37]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#1E40AF] tracking-[0.2em] uppercase">Insight</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">Latest</span>
                  </div>
                  <h3 className="font-bold text-xl leading-snug group-hover:text-[#1E40AF] transition-colors">
                    {i === 1 ? 'HBM3E 공정 수율 확보에 따른 밸류체인 재편 분석' : '글로벌 금리 경로와 수출주 대응 전략'}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">• 전방 산업 수요 폭증에 따른 장비주 수혜 지속 전망</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">• 외국인 순매수세가 대형주 위주로 집중 유입 중</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 면책 조항 및 하단 정보 */}
            <div className="bg-[#1E40AF] p-8 rounded-3xl text-white text-left space-y-4 border-b-8 border-[#D4AF37] shadow-xl">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Compliance Notice</span>
               </div>
               <p className="text-[10px] text-blue-200 leading-relaxed font-medium">
                 본 분석 결과는 인공지능이 처리한 객관적 지표 기반의 투자 참고용 데이터입니다. 모든 투자의 판단과 책임은 투자자 본인에게 있습니다.
               </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}