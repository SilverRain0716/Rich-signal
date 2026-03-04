# K-Trader 기술 아키텍처

## 1. 시스템 개요

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                 K-Trader Platform                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  클라이언트층                                        │
│  ├─ K-Trader.exe (Windows Desktop)                 │
│  ├─ 웹 대시보드 (React)                            │
│  └─ 모바일 앱 (React Native)                       │
│                                                     │
│  신호 엔진층                                        │
│  ├─ 로컬 신호 생성 (조건식 평가)                   │
│  └─ AWS 신호 생성 (24시간)                         │
│                                                     │
│  백엔드층                                           │
│  ├─ FastAPI (라이선스 검증, 신호 저장)            │
│  ├─ RDS (사용자 데이터, 거래 기록)                │
│  └─ Redis (신호 캐시, 실시간)                      │
│                                                     │
│  Kiwoom 통합층                                      │
│  └─ Kiwoom OpenAPI (거래 실행)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. 조건식 엔진

### 2.1 조건식이 "박혀있다"는 의미

```
조건식 = Python 코드로 컴파일되어 프로그램에 포함됨

구조:

[조건식 정의]
def evaluate_secret_formula(market_data):
    """당신의 1% 일평균 수익 조건식"""
    
    condition_A = check_ma20(market_data)
    condition_C = check_volume(market_data)
    condition_D = check_rsi(market_data)
    condition_G = check_support(market_data)
    condition_H = check_resistance(market_data)
    condition_I = check_momentum(market_data)
    condition_J = check_trend(market_data)
    condition_K = check_confirmation(market_data)
    condition_L = check_timing(market_data)
    
    return condition_A and condition_C and condition_D and \
           (condition_G or condition_H) and \
           condition_I and condition_J and condition_K and condition_L

[컴파일]
→ K-Trader.exe에 포함
→ 사용자가 코드 볼 수 없음
→ 조건식 로직 완벽 비밀 유지
```

### 2.2 신호 생성 프로세스

```
1단계: 시장 데이터 수신
   Kiwoom OpenAPI → 실시간 가격 데이터

2단계: 조건식 평가 (프로그램 내부)
   market_data → evaluate_secret_formula() → Boolean

3단계: 신호 생성
   Boolean → 신호 강도/신뢰도 계산
           → "BUY" / "SELL" / "HOLD"

4단계: 신호 전송
   K-Trader → AWS API → 신호만 (조건식 X)
   
   {
     "signal": "BUY",
     "confidence": 88,
     "strength": 75,
     "timestamp": "2024-03-04 10:30:00"
   }

5단계: 사용자에게 표시
   웹/앱 → "BUY 신호" (조건식은 표시 X)
```

### 2.3 보안: 조건식 노출 방지

```
방어 계층 1: 프로그램에 박혀있음
  └─ 사용자가 K-Trader 코드를 분석해도
     조건식 로직을 찾을 수 없음

방어 계층 2: 신호만 전송
  └─ 서버 ↔ 클라이언트
     조건식 코드 전혀 전송 X
     신호 결과만 전송

방어 계층 3: 난독화 (선택사항)
  └─ PyArmor / Cython으로 역공학 방지
     .exe → 복호화 거의 불가능

결과: 조건식은 영원한 비밀 ✓
```

---

## 3. 플랜별 조건식 사용

### 3.1 기본 플랜 (월 15,900원)

```
조건식 출처: HTS만

사용자가:
1. Kiwoom HTS 열기
2. 조건식 설정
3. K-Trader에서 "HTS 조건식 사용" 선택
4. 자동으로 신호 생성

코드:

class BasicPlan:
    def evaluate_condition(self):
        # HTS 조건식만 사용
        hts_signal = self.kiwoom.get_hts_signal()
        return hts_signal
```

### 3.2 프리덤 플랜 (월 29,900원)

```
조건식 출처: 당신의 조건식 (선택) + HTS 조건식 (선택)

사용자가:
1. K-Trader 설정 열기
2. 조건식 모드 선택:
   - "당신의 조건식만"
   - "HTS 조건식만"
   - "둘 다 AND"
   - "둘 다 OR"
3. 신호 수신 및 거래

코드:

class FreedomPlan:
    def __init__(self, mode="program"):
        self.mode = mode  # "program" / "hts" / "and" / "or"
        self.secret_formula = SecretFormula()  # 비밀 조건식
    
    def evaluate_condition(self):
        if self.mode == "program":
            return self.secret_formula.evaluate()
        
        elif self.mode == "hts":
            return self.kiwoom.get_hts_signal()
        
        elif self.mode == "and":
            secret = self.secret_formula.evaluate()
            hts = self.kiwoom.get_hts_signal()
            return secret and hts
        
        elif self.mode == "or":
            secret = self.secret_formula.evaluate()
            hts = self.kiwoom.get_hts_signal()
            return secret or hts
```

### 3.3 프로 플랜 (월 49,900원)

```
조건식 출처: 당신의 1% 조건식 (자동) + HTS 조건식 (선택)

사용자가:
1. K-Trader 실행
2. 당신의 1% 조건식 자동으로 설정됨
3. 옵션: HTS 조건식도 추가 가능
   - 당신의 조건식만 (기본)
   - 당신의 조건식 AND HTS
   - 당신의 조건식 OR HTS
4. 신호 수신 및 거래

특징:
  ✓ 설치 후 바로 거래 시작 가능
  ✓ 조건식 선택 UI 제공
  ✓ 신호 기반 거래

코드:

class ProPlan:
    def __init__(self, hts_mode="none"):
        self.secret_formula = SecretFormula()  # 항상 포함
        self.hts_mode = hts_mode  # "none" / "and" / "or"
    
    def evaluate_condition(self):
        secret = self.secret_formula.evaluate()  # 항상 실행
        
        if self.hts_mode == "none":
            return secret
        
        elif self.hts_mode == "and":
            hts = self.kiwoom.get_hts_signal()
            return secret and hts
        
        elif self.hts_mode == "or":
            hts = self.kiwoom.get_hts_signal()
            return secret or hts
```

### 3.4 24시간 자동화 플랜 (월 99,900원)

```
조건식 출처: 당신의 1% 조건식 (AWS에서 24시간) + HTS 조건식 (선택)

배포 프로세스:
1. 사용자가 24시간 플랜 구독
2. AWS 자격증명 입력 (또는 우리가 관리)
3. Kiwoom 자격증명 입력
4. "배포" 버튼
5. Docker 이미지 생성
6. AWS EC2에 배포
7. 자동으로 24시간 실행

특징:
  ✓ 당신의 조건식이 AWS에서 24시간 실행
  ✓ PC 끌 필요 없음
  ✓ 조건식은 여전히 비밀 (서버에만 있음)
  ✓ 웹/앱에서 실시간 모니터링

코드 (AWS에서):

class CloudPlan:
    def __init__(self, hts_mode="none"):
        self.secret_formula = SecretFormula()
        self.hts_mode = hts_mode
        self.scheduler = APScheduler()  # 24시간 스케줄
    
    def run_forever(self):
        """24시간 자동 실행"""
        self.scheduler.add_job(
            self.evaluate_and_trade,
            'cron',
            hour='*',  # 매시간
            minute='0',
            second='0'
        )
        self.scheduler.start()
    
    def evaluate_and_trade(self):
        market_data = self.kiwoom.get_market_data()
        signal = self.evaluate_condition(market_data)
        
        if signal:
            self.execute_trade(signal)
            self.send_notification()  # Discord, Email
```

---

## 4. 신호 기반 거래

### 4.1 신호만 제공하는 이유

```
조건식 공개 방식:
  ❌ 조건식 코드 노출
  ❌ 사용자가 복사 가능
  ❌ 경쟁사도 분석 가능
  ❌ 차별화 없음

신호 기반 방식:
  ✅ 조건식 비밀 유지
  ✅ 신호의 정확도로 신뢰도 구축
  ✅ 장기적 차별화
  ✅ 영업비밀 완벽 보호
```

### 4.2 신호 표시 (클라이언트)

```
웹/앱에서 표시되는 것:

┌────────────────────────────┐
│   현재 신호: BUY           │
│   신뢰도: ████████░░ 88%  │
│   강도: ███████░░░░ 75%   │
│                            │
│   신호 히스토리            │
│   ─────────────────────────│
│   10:30  BUY   88% 75%    │
│   09:15  SELL  92% 81%    │
│   08:45  HOLD   0%  0%    │
│                            │
│   * 조건식은 우리의 비밀!  │
│                            │
└────────────────────────────┘

절대 표시되지 않는 것:
  ❌ 조건식 코드
  ❌ 어떤 지표 사용했는지
  ❌ 왜 BUY 신호인지
  ❌ 조건식 로직
```

---

## 5. AWS 클라우드 아키텍처

### 5.1 배포 구조

```
┌──────────────────────────────────────┐
│         AWS 클라우드                 │
├──────────────────────────────────────┤
│                                      │
│  EC2 (t3.micro)                     │
│  ├─ K-Trader 엔진                   │
│  ├─ 조건식 평가                     │
│  ├─ Kiwoom 연동                     │
│  └─ 거래 실행                       │
│                                      │
│  RDS (PostgreSQL)                   │
│  ├─ 사용자 데이터                   │
│  ├─ 거래 기록                       │
│  └─ 신호 히스토리                   │
│                                      │
│  Lambda (API Gateway)               │
│  ├─ 라이선스 검증                   │
│  ├─ 신호 조회                       │
│  └─ 설정 저장                       │
│                                      │
└──────────────────────────────────────┘
```

### 5.2 자동 배포 프로세스

```python
# backend/cloud/deploy.py

class CloudDeployment:
    
    def deploy_to_aws(self, user_config):
        """
        사용자 AWS 계정에 자동 배포
        """
        
        # Step 1: Docker 이미지 생성
        docker_image = self.build_docker_image(
            k_trader_code,
            user_config
        )
        
        # Step 2: ECR에 푸시
        self.push_to_ecr(docker_image)
        
        # Step 3: EC2 인스턴스 생성
        instance = self.create_ec2_instance(
            image_id='ami-...',
            instance_type='t3.micro',
            user_config=user_config
        )
        
        # Step 4: RDS 연결
        self.setup_rds(instance)
        
        # Step 5: 자동 재시작 설정
        self.setup_auto_restart(instance)
        
        # Step 6: 모니터링 설정
        self.setup_cloudwatch(instance)
        
        return {
            "status": "success",
            "instance_id": instance.id,
            "estimated_cost": "$10-20/월"
        }
```

---

## 6. 결제 및 라이선스 시스템

### 6.1 Stripe 연동

```python
# backend/payment/stripe_handler.py

class StripePayment:
    
    def create_subscription(self, user_id, plan_type):
        """
        Stripe 구독 생성
        """
        
        plan_prices = {
            'basic': 'price_basic_15900',
            'freedom': 'price_freedom_29900',
            'pro': 'price_pro_49900',
            'cloud24h': 'price_cloud24h_99900'
        }
        
        subscription = stripe.Subscription.create(
            customer=user_id,
            items=[{'price': plan_prices[plan_type]}],
            billing_cycle_anchor=datetime.now(),
            automatic_tax={'enabled': True}
        )
        
        # DB에 저장
        self.save_subscription(user_id, subscription)
        
        return subscription
    
    def webhook_payment_success(self, event):
        """
        결제 성공 웹훅
        """
        subscription = event['data']['object']
        user_id = subscription['metadata']['user_id']
        
        # DB 업데이트
        self.update_subscription_status(
            user_id,
            status='active',
            next_billing_date=subscription['current_period_end']
        )
    
    def webhook_payment_failed(self, event):
        """
        결제 실패 웹훅
        """
        subscription = event['data']['object']
        user_id = subscription['metadata']['user_id']
        
        # DB 업데이트
        self.update_subscription_status(
            user_id,
            status='payment_failed'
        )
```

### 6.2 라이선스 검증

```python
# backend/license/verify.py

class LicenseVerifier:
    
    def verify_license(self, token):
        """
        K-Trader 앱에서 호출
        """
        
        # Step 1: 토큰 검증
        user = self.get_user_by_token(token)
        
        # Step 2: 구독 상태 확인
        subscription = self.get_subscription(user.id)
        
        # Step 3: 상태 반환
        if not subscription or subscription.status != 'active':
            return {"status": "inactive"}
        
        if subscription.next_billing_date < datetime.now():
            return {"status": "expired"}
        
        if subscription.status == 'payment_failed':
            return {"status": "payment_failed"}
        
        # Step 4: 활성 상태 반환
        return {
            "status": "active",
            "plan": subscription.plan_type,
            "expires": subscription.next_billing_date.isoformat()
        }
```

---

## 7. 데이터 모델

### 7.1 User 모델

```python
class User(Base):
    id: int
    email: str
    password_hash: str
    master_password_hash: str  # E2E 암호화용
    
    subscription: Subscription
    encrypted_kiwoom_credentials: str  # 암호화됨
    encrypted_aws_credentials: str     # 암호화됨
    encrypted_discord_webhook: str     # 암호화됨
    
    created_at: datetime
    updated_at: datetime
```

### 7.2 Subscription 모델

```python
class Subscription(Base):
    id: int
    user_id: int
    plan_type: str  # "basic" / "freedom" / "pro" / "cloud24h"
    status: str     # "active" / "inactive" / "payment_failed" / "expired"
    
    stripe_subscription_id: str
    stripe_customer_id: str
    
    current_period_start: datetime
    current_period_end: datetime
    next_billing_date: datetime
    
    condition_mode: str  # "hts_only" / "secret_only" / "and" / "or"
    hts_condition_name: str  # (선택사항)
    
    aws_instance_id: str  # 클라우드 플랜용
    
    created_at: datetime
    updated_at: datetime
```

### 7.3 Signal 모델

```python
class Signal(Base):
    id: int
    user_id: int
    
    signal_type: str  # "BUY" / "SELL" / "HOLD"
    confidence: int   # 0-100
    strength: int     # 0-100
    
    market_data: dict  # JSON
    
    executed: bool
    executed_price: float
    executed_time: datetime
    
    created_at: datetime
```

---

## 8. 보안 및 암호화

### 8.1 E2E 암호화

```python
# backend/crypto/encryption.py

class E2EEncryption:
    
    def encrypt_credentials(self, plaintext, master_password):
        """
        사용자 자격증명 암호화
        """
        
        # Step 1: 마스터 비밀번호 해싱
        salt = os.urandom(16)
        key = pbkdf2_hmac(
            'sha256',
            master_password.encode(),
            salt,
            iterations=100000
        )
        
        # Step 2: AES-256 암호화
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode())
        
        # Step 3: salt + nonce + ciphertext + tag 저장
        encrypted = salt + cipher.nonce + tag + ciphertext
        
        return encrypted.hex()
    
    def decrypt_credentials(self, encrypted_hex, master_password):
        """
        암호화된 자격증명 복호화
        """
        
        encrypted = bytes.fromhex(encrypted_hex)
        
        # Step 1: 마스터 비밀번호 해싱
        salt = encrypted[:16]
        key = pbkdf2_hmac(
            'sha256',
            master_password.encode(),
            salt,
            iterations=100000
        )
        
        # Step 2: AES-256 복호화
        nonce = encrypted[16:32]
        tag = encrypted[32:48]
        ciphertext = encrypted[48:]
        
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        
        return plaintext.decode()
```

---

## 9. 기술 스택

### 백엔드
- **Framework**: FastAPI (Python)
- **DB**: PostgreSQL (RDS)
- **Cache**: Redis
- **Payment**: Stripe API
- **Cloud**: AWS (EC2, Lambda, RDS)
- **Containerization**: Docker

### 프론트엔드
- **웹**: Next.js / React
- **모바일**: React Native
- **실시간**: WebSocket

### 통합
- **Kiwoom**: OpenAPI
- **Discord**: Webhook
- **AWS**: SDK (boto3)

---

## 10. 배포 환경

### 로컬 개발
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 프로덕션 (AWS)
```bash
docker build -t k-trader:latest .
docker tag k-trader:latest 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/k-trader:latest
aws ecr push k-trader:latest
```

---

**K-Trader 기술 아키텍처는 안정성, 보안, 확장성을 동시에 제공합니다.** 🏗️
