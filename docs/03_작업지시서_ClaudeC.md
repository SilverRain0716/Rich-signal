# 작업지시서 — Claude-C (프론트엔드)
> 모델: Sonnet
> 역할: Rich-Signal 웹/앱 프론트엔드 개발 (Next.js)
> 첨부 필수: 00_공통스펙_v2.md

---

## 역할 선언 (첫 메시지로 전송)

```
당신은 Claude-C입니다. Rich-Signal 프로젝트의 프론트엔드 개발자입니다.
Next.js 14 + TypeScript + Tailwind CSS로 모바일 우선 반응형 웹앱을 구축합니다.
반드시 첨부된 공통 스펙 문서를 읽고 모든 규칙을 준수하세요.
모든 페이지에 투자 면책 조항을 삽입하세요.
```

---

## 기술 환경

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 상태 관리 | React Query (서버 상태) + Zustand (클라이언트 상태) |
| 인증 | JWT (httpOnly cookie 또는 localStorage) |
| 푸시 | Firebase Cloud Messaging (Web) |
| 차트 | lightweight-charts 또는 recharts |
| API 통신 | Axios 또는 fetch |

---

## 디자인 원칙

1. **모바일 우선**: 모든 UI를 375px 모바일 기준으로 먼저 설계
2. **하단 탭 네비게이션**: 5개 탭 (시장/주도주/섹터/수급주/MY)
3. **다크 모드 기본**: 주식 앱은 다크 모드가 표준
4. **색상**: 상승=빨강, 하락=파랑 (한국 시장 관례)
5. **종목 터치 시**: 종목 상세 페이지 → 네이버금융 아웃링크 제공
6. **유료 잠금 UI**: 블러 처리 + "Signal Pro 업그레이드" 배너

---

## Task C-1: 시장 탭 + 공통 레이아웃 (Week 2)

### 구현 항목
1. **하단 탭 네비게이션** (5개 탭)
2. **시장 탭 (첫 화면)**:
   - 코스피/코스닥 지수 (등락률 포함)
   - 나스닥/다우존스
   - 환율 (USD/KRW), 원유 (WTI), 비트코인
   - 주도주/수급주 요약 카드 (각 페이지 진입점)
3. **투자 면책 조항 푸터**: 모든 페이지 하단

### API 연동
```
GET /api/v1/market/indicators
GET /api/v1/market/kospi
GET /api/v1/market/kosdaq
```

> Phase 1 초기에는 Mock API로 개발 가능. Claude-A API 완성 후 연동.

---

## Task C-2: 주도주 탭 (Week 2~3)

### 메인 뷰 구현
1. **전일 주도주 리스트**: 종목명 + 등락률 + 거래대금
2. **AI 예상 주도주**: 종목명 + AI 분석 근거 + 신뢰도 뱃지
3. **현재 주도주**: 장중 실시간 업데이트 (폴링 or WebSocket)

### NXT 장외시간 (한 뎁스 아래)
4. **"NXT 장외시간" 더보기 버튼** → 하위 페이지
   - 전일 애프터마켓 주도주 (15:30~20:00)
   - 금일 프리마켓 주도주 (8:00~9:00)

### API 연동
```
GET /api/v1/leaders/previous
GET /api/v1/leaders/ai-predicted
GET /api/v1/leaders/current
GET /api/v1/leaders/nxt-after
GET /api/v1/leaders/nxt-pre
```

---

## Task C-3: 섹터 탭 + 수급주 탭 (Week 3)

### 섹터 탭
1. **섹터별 상승률 순위 리스트**: 섹터명 + 상승률 + 색상 바
2. **섹터 터치 시**: 해당 섹터 상위 종목 표시

### 수급주 탭 (유료 잠금)
3. **14:30 수급주 리스트**: 종목명 + 외국인/기관 순매수 수량
4. **종목별 관련 뉴스/공시 묶음**: 아코디언 또는 카드 형태
5. **무료 유저**: 전체 블러 처리 + "Signal Pro로 업그레이드" CTA 배너

### API 연동
```
GET /api/v1/sectors/ranking
GET /api/v1/supply/today          ← 403 시 유료 잠금 UI 표시
GET /api/v1/supply/{code}/news
GET /api/v1/supply/{code}/disclosure
```

---

## Task C-4: MY 탭 + 인증 + 기타 페이지 (Week 3~4)

### MY 탭
1. **계정 정보** (이메일, 가입일, 현재 플랜)
2. **구독/플랜 관리** (플랜 변경, 구독 취소)
3. **알림 설정** (수급주 알림 on/off)
4. **K-Trader 다운로드** (Phase 2 — 비활성 상태 표시)
5. **고객 지원** (이메일 링크)
6. **약관/개인정보처리방침** (링크)

### 인증 페이지
7. **회원가입**: 구글 로그인 버튼 + 추가 인증 스텝 + 온보딩 설문
8. **로그인**: 구글 로그인 버튼
9. **회원 탈퇴**: 탈퇴 설문 (객관식) → 탈퇴 확인 모달

### 기타 페이지
10. **랜딩 페이지**: 서비스 소개 + 핵심 기능 + CTA (가입)
11. **요금제 페이지**: 5개 플랜 비교 테이블 + 결제 버튼
12. **종목 상세**: 종목명 + 관련 뉴스 나열 + "네이버 금융에서 상세 보기" 아웃링크

---

## Task C-5: 푸시 알림 연동 (Week 3~4)

### 구현 항목
1. **FCM 토큰 등록**: 앱 로드 시 FCM 토큰 발급 → 서버 등록
2. **브라우저 알림 권한 요청**: 첫 로그인 시 알림 허용 요청
3. **알림 수신 처리**: 14:30 수급주 알림 → 수급주 탭으로 이동

---

## 코드 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 공통 레이아웃 + 하단 탭
│   │   ├── page.tsx                # 시장 탭 (홈)
│   │   ├── leaders/page.tsx        # 주도주 탭
│   │   ├── leaders/nxt/page.tsx    # NXT 장외시간 (더보기)
│   │   ├── sectors/page.tsx        # 섹터 탭
│   │   ├── supply/page.tsx         # 수급주 탭
│   │   ├── my/page.tsx             # MY 탭
│   │   ├── stock/[code]/page.tsx   # 종목 상세
│   │   ├── auth/login/page.tsx     # 로그인
│   │   ├── auth/register/page.tsx  # 회원가입 + 온보딩
│   │   ├── pricing/page.tsx        # 요금제
│   │   └── landing/page.tsx        # 랜딩
│   ├── components/
│   │   ├── BottomNav.tsx           # 하단 탭 네비게이션
│   │   ├── StockCard.tsx           # 종목 카드 컴포넌트
│   │   ├── SectorBar.tsx           # 섹터 순위 바
│   │   ├── PaywallOverlay.tsx      # 유료 잠금 블러 오버레이
│   │   └── DisclaimerFooter.tsx    # 투자 면책 조항
│   ├── lib/
│   │   ├── api.ts                  # API 클라이언트
│   │   ├── auth.ts                 # 인증 유틸리티
│   │   └── firebase.ts             # FCM 설정
│   └── styles/
│       └── globals.css
├── public/
│   └── firebase-messaging-sw.js   # FCM 서비스 워커
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 코드 규칙

1. 모든 컴포넌트는 TypeScript strict mode
2. API 호출은 React Query 사용 (캐싱, 리트라이)
3. 모바일 우선 반응형 (Tailwind breakpoints)
4. 다크 모드 기본, 라이트 모드 선택 가능
5. 한국어 UI (다국어 지원은 추후)
6. 모든 페이지 하단에 투자 면책 조항 포함
7. **조건식 관련 UI는 절대 만들지 않음** (Phase 1)
