# 작업지시서 — Claude-A (백엔드 API)
> 모델: Sonnet
> 역할: Rich-Signal 백엔드 API 개발 (Python FastAPI)
> 첨부 필수: 00_공통스펙_v2.md

---

## 역할 선언 (첫 메시지로 전송)

```
당신은 Claude-A입니다. Rich-Signal 프로젝트의 백엔드 API 개발자입니다.
Python FastAPI를 사용하여 REST API를 구축합니다.
반드시 첨부된 공통 스펙 문서(00_공통스펙_v2.md)를 읽고 모든 규칙을 준수하세요.
조건식 관련 코드는 절대 작성하지 마세요.
```

---

## 기술 환경

| 항목 | 기술 |
|------|------|
| 언어 | Python 3.11+ |
| 프레임워크 | FastAPI |
| DB | Supabase (PostgreSQL) — supabase-py 사용 |
| 인증 | JWT (PyJWT) |
| 결제 | Stripe (stripe-python) |
| 푸시 알림 | Firebase Admin SDK |
| AI | Google Generative AI (Gemini) |

---

## Task 1-A: 인증 시스템 (Week 1)

### 구현 항목
1. **회원가입**: 구글 OAuth + 추가 인증 (이메일 인증 코드)
2. **로그인**: JWT 토큰 발급 (access + refresh)
3. **토큰 갱신**: refresh token으로 access token 재발급
4. **내 정보 조회**: 현재 플랜, 가입일, 베타 유저 여부
5. **회원 탈퇴**: 탈퇴 설문 저장 후 계정 비활성화

### 다중 계정 방지 로직
- 구글 계정 1개당 1개 계정만 허용
- 추가 인증 (이메일 인증 코드) 필수
- 동일 기기/IP에서 다수 가입 시 제한

### 엔드포인트
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
DELETE /api/v1/auth/withdraw
```

---

## Task 1-B: 데이터 조회 API (Week 2)

### 구현 항목
1. **시장 지표 API**: 외부 API 프록시 (코스피/코스닥/나스닥/다우/환율/원유/BTC)
2. **주도주 API**: leader_stocks 테이블 조회 (category별 분류)
3. **섹터 API**: sector_rankings 테이블 조회
4. **수급주 API**: supply_stocks + stock_news + stock_disclosures 조인 조회
5. **종목 상세 API**: 종목 기본 정보 + 네이버금융 아웃링크

### 유료 콘텐츠 접근 제어
```python
# 수급주 API 접근 시 필수 체크
async def check_paid_access(user):
    if user.plan_type == 'free':
        # 베타 기간 또는 무료 체험 기간 체크
        if user.is_beta_user or (user.free_trial_expires_at and user.free_trial_expires_at > now()):
            return True  # 접근 허용
        raise HTTPException(403, "Signal Pro 플랜 이상 구독이 필요합니다")
    return True
```

### 엔드포인트
```
GET    /api/v1/market/indicators
GET    /api/v1/market/kospi
GET    /api/v1/market/kosdaq
GET    /api/v1/leaders/previous
GET    /api/v1/leaders/ai-predicted
GET    /api/v1/leaders/current
GET    /api/v1/leaders/nxt-after
GET    /api/v1/leaders/nxt-pre
GET    /api/v1/sectors/ranking
GET    /api/v1/supply/today            ← 유료 체크
GET    /api/v1/supply/{stock_code}/news     ← 유료 체크
GET    /api/v1/supply/{stock_code}/disclosure ← 유료 체크
GET    /api/v1/stocks/{stock_code}
```

---

## Task 1-C: 결제/구독 + 푸시 (Week 3)

### 구현 항목
1. **Stripe 체크아웃**: 4개 유료 플랜 결제 세션 생성
2. **Stripe Webhook**: 결제 성공/실패/취소 이벤트 처리
3. **구독 조회/취소**: 현재 구독 상태 관리
4. **푸시 토큰 등록**: FCM 토큰 저장
5. **푸시 발송 서비스**: 14:30 수급주 확정 시 유료 회원에게 알림

### Stripe 플랜 구조
```python
PLAN_PRICES = {
    'signal_pro': os.getenv('STRIPE_PRICE_SIGNAL_PRO'),
    'ktrader_basic': os.getenv('STRIPE_PRICE_KTRADER_BASIC'),
    'ktrader_pro': os.getenv('STRIPE_PRICE_KTRADER_PRO'),
    'ktrader_cloud': os.getenv('STRIPE_PRICE_KTRADER_CLOUD'),
}
```

> Phase 1에서는 Stripe 구조만 구현하고 실제 결제는 비활성 상태로 둠.
> Phase 2에서 Stripe Dashboard 플랜 등록 후 활성화.

### 엔드포인트
```
POST   /api/v1/subscriptions/checkout
POST   /api/v1/subscriptions/webhook
GET    /api/v1/subscriptions/current
POST   /api/v1/subscriptions/cancel
POST   /api/v1/notifications/register
PUT    /api/v1/notifications/settings
```

---

## Task 1-D: 설문 API (Week 1~2)

### 구현 항목
1. **온보딩 설문 저장**: 가입 후 설문 응답 저장
2. **탈퇴 설문 저장**: 탈퇴 시 설문 응답 저장

### 엔드포인트
```
POST   /api/v1/survey/onboarding
POST   /api/v1/survey/withdrawal
```

---

## Phase 2 Task (추후 지시)

### Task 2-A: 라이선스 검증 API

K-Trader.exe가 실행 시마다 호출하는 핵심 엔드포인트.

```
GET /api/v1/license/verify
  Authorization: Bearer {jwt_token}
  
  응답 케이스:
  1. 구독 활성:
     { "status": "active", "plan": "ktrader_pro", "expires_at": "2026-05-01T00:00:00Z" }
  
  2. 구독 만료:
     { "status": "expired", "message": "구독이 만료되었습니다" }
  
  3. 결제 실패:
     { "status": "payment_failed", "message": "결제가 실패했습니다" }
  
  4. 구독 없음:
     { "status": "inactive", "message": "구독이 필요합니다" }
```

### Task 2-B: Stripe Webhook 상세 처리

Stripe가 자동 갱신/실패/취소 시 웹훅으로 알려주면 DB를 업데이트.

```python
# 처리해야 할 이벤트:
# invoice.payment_succeeded → subscription.status = 'active', next_billing_date 갱신
# invoice.payment_failed   → subscription.status = 'payment_failed'
# customer.subscription.deleted → subscription.status = 'cancelled'
```

### Task 2-C: Cloud API (deploy / status / stop / restart)

---

## 코드 규칙

1. 모든 라우터는 `/api/v1/` 프리픽스 사용
2. 에러 응답은 `{"detail": "메시지"}` 형식
3. 날짜/시간은 모두 ISO 8601 (UTC)
4. 페이지네이션: `?page=1&size=20`
5. 환경 변수는 공통 스펙 13번 항목 참조
6. **조건식 관련 코드 절대 금지**
