# Rich-Signal / K-Trader

**한국 주식 시장 정보 서비스 + 자동매매 SaaS**

---

## 서비스 구조

| 서비스 | 설명 | 상태 |
|--------|------|------|
| **Rich-Signal** | 주도주/섹터/수급주 시장 정보 웹/앱 | Phase 1 개발 중 |
| **K-Trader** | 조건식 기반 자동매매 데스크톱 프로그램 | Phase 2 예정 |

## 플랜

| 플랜 | 가격 | 주요 기능 |
|------|------|-----------|
| Free | 0원 | 주도주, 주도섹터, AI 예상 주도주 |
| Signal Pro | 19,900원/월 | + 당일 수급주, 뉴스/공시, 푸시 알림 |
| K-Trader Basic | 39,900원/월 | + K-Trader.exe (본인 조건식) |
| K-Trader Pro | 59,900원/월 | + 오너 검증 조건식 포함 |
| K-Trader Cloud | 99,900원/월 | + AWS 24시간 자동매매 |

## 기술 스택

- **프론트엔드**: Next.js 14 + TypeScript + Tailwind CSS
- **백엔드**: Python FastAPI
- **데이터베이스**: Supabase (PostgreSQL)
- **데이터 수집**: LS증권 XingAPI (KRX + NXT 통합)
- **자동매매**: 키움 OpenAPI+ (K-Trader 전용)
- **AI**: Google Gemini API
- **결제**: Stripe
- **푸시**: Firebase Cloud Messaging

## 프로젝트 구조

```
Rich-signal/
├── docs/           # 공통 스펙 + 작업지시서
├── backend/        # FastAPI 백엔드 (Claude-A)
├── frontend/       # Next.js 프론트엔드 (Claude-C)
├── collector/      # 데이터 수집 엔진 (Claude-E)
├── ktrader/        # K-Trader 데스크톱 앱 (Claude-B, Phase 2)
├── infra/          # AWS 인프라 자동화 (Claude-D, Phase 2)
├── legal/          # 약관/FAQ/면책조항 (Claude-F)
└── supabase/       # DB 마이그레이션
```

## 문서

- [공통 스펙](docs/00_공통스펙_v2.md) — 모든 개발자 필독
- [PM 총괄](docs/07_PM총괄_v2.md) — 일정/비용/리소스

## 면책 조항

본 서비스는 투자 자문이 아닌 시장 정보 제공 서비스입니다.
제공되는 정보는 투자 판단의 참고용이며, 투자에 따른 모든 책임은 이용자에게 있습니다.
