# Rich Signal - 현재 컨텍스트 (다른 채팅 인계용)

## 레포지토리
https://github.com/SilverRain0716/Rich-signal

## 프로젝트 목적
한국 주식 트레이더를 위한 PWA 앱.
- **오늘 어떤 종목을 매매해야 확률이 높은지** → TradingCandidates
- **실시간으로 어떤 섹터에 수급이 몰리는지** → SectorRadar

리포트가 아니라 **행동 판단 근거**를 제공하는 도구.
장기적으로 K-Trader(PyQt5 자동매매, 별도 레포)와 연계 예정.

---

## 현재 파일 구조

```
src/
├── app/
│   ├── api/
│   │   ├── market-insight/route.ts  ← 기존 Fusion Engine (Supabase 캐싱)
│   │   ├── candidates/route.ts      ← 매매 후보 AI (15분 캐시)
│   │   ├── sectors/route.ts         ← 실시간 섹터 수급 (2분 캐시)
│   │   └── alert/route.ts           ← 급락 알림 (-3% 트리거)
│   ├── components/
│   │   ├── SectorRadar.tsx          ← 실시간 섹터 수급 바 (2분 자동갱신)
│   │   └── TradingCandidates.tsx    ← BUY/WATCH 매매 후보 카드
│   ├── page.tsx                     ← PWA 메인 (하단 탭바 + 2열 데스크톱)
│   ├── layout.tsx                   ← PWA 메타태그, viewport
│   └── globals.css                  ← 다크 테마, safe-area
├── services/
│   ├── ls-sec/
│   │   ├── auth.ts                  ← OAuth 토큰 캐싱 (메모리, 5분 버퍼)
│   │   ├── client.ts                ← TR 공통 클라이언트 (경로 매핑 포함)
│   │   └── endpoints.ts             ← t1404/t1452/t1442/t1511
│   ├── macro/
│   │   └── indicators.ts            ← 환율/S&P500/나스닥/공포탐욕/주도섹터
│   ├── news/
│   │   └── grounding.ts             ← Gemini 기반 시장 컨텍스트 추론
│   └── ai-engine/
│       ├── candidates.ts            ← 핵심: 수급+거시+컨텍스트 → 매매 후보
│       ├── fusion.ts                ← Fusion Engine (Supabase 캐싱)
│       └── prompts.ts               ← 프롬프트 템플릿
supabase/
└── migrations/001_initial_schema.sql
```

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI | Gemini **2.0-flash** via `@ai-sdk/google` v3 |
| DB | Supabase (PostgreSQL + RLS) |
| 수급 데이터 | LS증권 OPEN API (OAuth 2.0) |
| 거시 데이터 | Yahoo Finance (unofficial) |
| PWA | `@ducanh2912/next-pwa` |
| 애니메이션 | Framer Motion |

---

## 중요 수정 이력 (버그/주의사항)

### LS증권 API
- `appsecret` → `appsecretkey` (auth.ts 파라미터명)
- TR별 URL 경로가 다름:
  - `t1404`, `t1442` → `/stock/investinfo`
  - `t1452` → `/stock/sector`
  - `t1511` → `/stock/market`

### Gemini
- 모델명: `gemini-1.5-pro` 사용 불가 → **`gemini-2.0-flash`** 사용
- `useSearchGrounding` → `@ai-sdk/google` v3에서 `google()` 단일 인자만 지원

### Tailwind
- v4 사용 중: `@tailwind base/components/utilities` 대신 `@import "tailwindcss"`
- `@apply` 사용 불가 → 일반 CSS 속성으로 풀어서 작성

### 환경변수 (.env.local)
```
GOOGLE_GENERATIVE_AI_API_KEY=   ← Gemini (필수)
LS_SEC_APP_KEY=                 ← LS증권
LS_SEC_APP_SECRET=              ← LS증권
NEXT_PUBLIC_SUPABASE_URL=       ← Supabase (선택)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  ← Supabase (선택)
SUPABASE_SERVICE_ROLE_KEY=      ← Supabase (선택)
ADMIN_SECRET_KEY=               ← 강제 갱신 키 (선택)
```

---

## 현재 상태 (2026-03-04 기준)

### 작동하는 것
- [x] PWA 설정 완료 (manifest, 아이콘, 하단 탭바)
- [x] Gemini 2.0-flash 매매 후보 생성
- [x] 거시 지표 수집 (Yahoo Finance)
- [x] LS증권 토큰 발급 (로그에서 확인됨)
- [x] 다크 터미널 UI (SectorRadar + TradingCandidates)

### 미해결 / 디버깅 중
- [ ] LS TR HTTP 500 - t1404/t1452/t1442 실제 응답 에러
  - 토큰은 발급되나, TR 조회에서 500 반환
  - URL 경로 수정 완료했으나 실제 API 응답 확인 필요
  - LS증권 개발자센터에서 request body 필드명 재확인 권장
- [ ] /api/candidates 가끔 500 - LS 데이터 없어도 Gemini 단독으로 fallback 처리함

### 다음 스프린트
1. LS TR 500 원인 특정 (응답 body 로그로 확인)
2. K-Trader 연계 엔드포인트 (`/api/candidates` → K-Trader 조건식 변환)
3. 장 시간 스케줄링 (09:00 자동 리포트)
4. 수익률 트래킹 (후보 종목 실제 등락 비교)

---

## 로컬 실행

```bash
git clone https://github.com/SilverRain0716/Rich-signal.git
cd Rich-signal
npm install
# .env.local 파일 생성 후 키 입력
npm run dev
# → http://localhost:3000
```

*마지막 업데이트: 2026-03-04*
