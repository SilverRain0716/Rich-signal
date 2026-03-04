# Rich Signal - 방향성 및 진척 기록

## 핵심 목적 (North Star)

> **오늘 시장에서 어떤 종목을 매매해야 확률이 높은지**,
> **그리고 실시간으로 어떤 섹터에 수급이 몰리는지**를 보여준다.

리포트가 아니라 **행동 판단 근거**를 제공하는 도구.

---

## 설계 원칙

1. **실시간성 우선** - 수급은 장중에 계속 변한다. 캐시는 최소화.
2. **인과관계 명확히** - "왜 이 종목인가"를 미장/뉴스 컨텍스트와 연결.
3. **K-Trader 연계** - 분석 결과가 실제 매매로 연결되는 브리지가 최종 목표.
4. **개인 도구** - PB 스타일 포장보다 정확한 데이터가 중요.

---

## 아키텍처

```
[LS증권 API]     [거시지표(Yahoo)]   [Gemini 추론]
      ↓                ↓                  ↓
  수급 데이터        환율/선물/금리        시장 컨텍스트
      └───────────────┴──────────────────┘
                       ↓
               Gemini 1.5 Pro
               (generateObject + Zod)
                       ↓
         ┌─────────────┴─────────────┐
         ↓                           ↓
    SectorRadar                TradingCandidates
   (2분 자동갱신)               (15분 캐시, 수동갱신)
```

### API 엔드포인트

| 경로 | 캐시 | 역할 |
|---|---|---|
| `GET /api/sectors` | 2분 | 실시간 섹터 수급 |
| `GET /api/candidates` | 15분 | 오늘 매매 후보 AI 생성 |
| `GET /api/alert` | 없음 | KOSPI/KOSDAQ -3% 급락 감지 |
| `POST /api/alert` | 없음 | 긴급 분석 트리거 |

---

## 진척 현황

### ✅ 완료 (v2 - 2026.03)

**백엔드**
- [x] LS증권 OAuth 토큰 캐싱 (메모리, 5분 버퍼)
- [x] 수급 TR 클라이언트 (t1404 외인+기관, t1452 섹터, t1442 거래대금급증)
- [x] 거시지표 수집 (환율, S&P500/나스닥 선물, 미국채, 공포탐욕지수, 주도섹터)
- [x] 시장 컨텍스트 추론 (Gemini - 거시데이터 기반)
- [x] 매매 후보 AI 엔진 (Gemini 1.5 Pro + Zod 스키마)
- [x] Supabase 캐싱 (ai_reports 테이블, 60분 TTL)
- [x] 긴급 알림 시스템 (Gemini Flash, -3% 트리거)

**프론트엔드**
- [x] SectorRadar (실시간 섹터 수급 바, 2분 자동갱신)
- [x] TradingCandidates (BUY/WATCH 카드, 신뢰도 바, 확장 정보)
- [x] 다크 터미널 테마 (Deep Navy + Gold, 격자 배경)
- [x] 긴급 알림 오버레이 (AnimatePresence)

**버그 수정**
- [x] `appsecret` → `appsecretkey` (LS증권 파라미터 오류)
- [x] `useSearchGrounding` API 버전 호환성 수정

---

## 다음 스프린트 (v3)

### 🔴 High Priority

- [ ] **K-Trader 브리지** - `/api/candidates` 의 워치리스트 JSON을 K-Trader 조건식으로 변환
  - 형식: `{ code, entryCondition, stopLoss }[]`
  - K-Trader에서 polling 또는 파일 기반 연동
- [ ] **장 시간 스케줄링** - 하루 4회 고정 실행 (09:00, 10:30, 14:00, 15:30)
  - Vercel Cron 또는 AWS EventBridge
  - 첫 리포트는 장 시작 전 08:50 생성

### 🟡 Medium Priority

- [ ] **수익률 트래킹** - 후보 종목 진입 가격 기록 → 실제 등락 비교
  - Supabase `candidate_results` 테이블
  - 주간/월간 정확도 통계
- [ ] **전일 비교** - 오늘 수급 vs 어제 수급 변화량 표시
- [ ] **뉴스 그라운딩** - SDK 업그레이드 후 Gemini 실제 검색 연결
  - 현재: 거시 데이터 기반 추론
  - 목표: Google Search Grounding으로 실제 뉴스 인용

### 🟢 Low Priority

- [ ] 모바일 최적화 (현재 데스크톱 우선)
- [ ] K-Trader 연계 완성 후 외부 서비스화 검토
- [ ] 수익률 트랙레코드 기반 유료 구독 전환

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI | Gemini 1.5 Pro / Flash via `@ai-sdk/google` |
| DB/Cache | Supabase (PostgreSQL + RLS) |
| 수급 데이터 | LS증권 OPEN API (OAuth 2.0) |
| 거시 데이터 | Yahoo Finance (unofficial) |
| 애니메이션 | Framer Motion |
| 배포 | Vercel (예정) |

---

## 환경변수 체크리스트

```
GOOGLE_GENERATIVE_AI_API_KEY  ← Gemini
LS_SEC_APP_KEY                ← LS증권 OPEN API
LS_SEC_APP_SECRET             ← LS증권 OPEN API
NEXT_PUBLIC_SUPABASE_URL      ← Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY ← Supabase
SUPABASE_SERVICE_ROLE_KEY     ← Supabase (서버사이드)
ADMIN_SECRET_KEY              ← 강제 갱신 키
```

---

*마지막 업데이트: 2026-03-04*
