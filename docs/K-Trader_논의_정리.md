# K-Trader 구독형 SaaS 전환 - 논의 정리

**작성일:** 2024년 3월 4일  
**주제:** K-Trader 구독화, 멀티 플랫폼 확장, 수익화 전략

---

## 1. 핵심 결론

### 1.1 전략 결정
- **구독형 SaaS 모델**: 지속적 수익 창출
- **웹 개발 제외**: 앱만 개발으로 개발 시간 단축
- **클라우드 옵션**: 일부 사용자들이 24/7 자동 거래를 원함
- **Kiwoom 유지**: Windows 데스크톱은 Kiwoom 계속 사용

### 1.2 비즈니스 모델
```
기본 플랜 (월 9,900원):
  → K-Trader 로컬 설치, PC가 켜져 있어야 함
  → 웹/앱으로 신호 모니터링
  
클라우드 플랜 (월 49,900원):
  → AWS에서 24/7 자동 실행
  → 사용자가 AWS 자격증명 입력
  → 자동 배포 (당신이 제공)
  → 웹/앱에서 모니터링
  
추가 서비스 (Signal, Analytics 등):
  → 같은 결제 시스템에서 판매
  → 협력사 제품도 통합 가능
```

---

## 2. 아키텍처 및 기술 구현

### 2.1 사용자 관점 프로세스

#### 기본 플랜 (로컬)
```
1. 웹사이트에서 기본 플랜 구독 (월 9,900원)
2. Stripe 결제
3. K-Trader.exe 다운로드
4. 설치 후 로그인 (이메일 + 비밀번호)
5. K-Trader가 AWS에 요청: "내 구독 유효한가?"
6. AWS 응답: "유효함 (4월 4일까지)"
7. 프로그램 정상 실행
8. 매달 자동 청구 (Stripe)
9. 구독 만료 시 프로그램 실행 차단
10. 웹에서 다시 구독 → 즉시 해제
```

#### 클라우드 플랜 (AWS)
```
1. 웹사이트에서 클라우드 플랜 구독 (월 49,900원)
2. Stripe 결제
3. 웹 폼에서 입력:
   - AWS Access Key
   - AWS Secret Key
   - Kiwoom ID
   - Kiwoom PW
   - Discord Webhook
4. "배포" 버튼 클릭
5. 당신의 백엔드가 자동으로:
   - 사용자 AWS 계정에 접속
   - EC2 인스턴스 생성 (t3.micro)
   - Docker 컨테이너 실행
   - 환경 변수 설정
6. 24/7 자동 거래 실행
7. 웹/앱에서 모니터링
8. 프로그램 중지 버튼: AWS 인스턴스 정지
```

### 2.2 자격증명 관리 (E2E 암호화)

**핵심:** 서버는 평문을 절대 모름

```
과정:
1. 사용자가 마스터 비밀번호 설정
   → "MyPassword123!@#" (서버 안 감)

2. 초기 설정 시:
   Kiwoom ID/PW 입력
   → 클라이언트에서 마스터 비밀번호로 암호화
   → 암호화된 데이터만 서버로 전송
   → 서버는 암호화된 상태로 저장

3. 다른 기기에서 사용 시:
   이메일 + 마스터 비밀번호 입력
   → 서버에서 암호화된 데이터 다운로드
   → 클라이언트에서 마스터 비밀번호로 복호화
   → 자격증명 로드 완료

4. 프로그램 실행 시:
   K-Trader가 Kiwoom API 호출
   → 거래 실행 (로컬에서만)
   → 결과만 서버로 전송 (기록 목적)

보안:
✓ 사용자만 마스터 비밀번호 알고 있음
✓ 서버는 복호화 불가능
✓ 해킹돼도 암호화된 데이터만 노출
✓ 모든 기기에서 자동 동기화
```

### 2.3 온라인 검증

```
매일 아침 K-Trader 실행:

Step 1: AWS 연결 시도
  K-Trader → AWS: "내 구독 유효한가?"
  
Step 2: AWS 확인
  구독 테이블 조회
  status = 'active'? 
  next_billing_date < now()?
  
Step 3: 응답
  Case A: "active" (4월 4일까지)
    → ✓ 프로그램 계속 실행
  
  Case B: "expired" (3월 4일 초과)
    → ❌ "구독이 만료되었습니다"
    → 프로그램 실행 불가
  
  Case C: "payment_failed"
    → ❌ "결제 실패했습니다"
    → 프로그램 실행 불가

Step 4: 오프라인 모드
  만약 AWS 연결 실패?
  → 로컬에 저장된 마지막 상태 확인
  → 만료일이 지나지 않으면 7일간 오프라인 작동 가능
```

### 2.4 Stripe 자동 갱신

```
3월 4일:
  Stripe가 자동으로 카드 청구
  ↓
결제 성공:
  Stripe → 당신의 백엔드 (웹훅)
  "invoice.payment_succeeded"
  ↓
  AWS DB 업데이트:
  status = "active"
  next_billing_date = "2024-04-04"
  
다음날 프로그램 실행:
  AWS: "구독 활성 (4월 4일까지)"
  ↓
  ✓ 계속 사용 가능

결제 실패:
  Stripe → 백엔드 (웹훅)
  "invoice.payment_failed"
  ↓
  AWS DB 업데이트:
  status = "payment_failed"
  
프로그램 실행 시:
  AWS: "결제 실패"
  ↓
  ❌ 실행 불가
```

---

## 3. 수익화 모델

### 3.1 가격 책정

```
기본 플랜:        월 9,900원
클라우드 플랜:    월 49,900원 (+ 사용자 AWS 비용)
프로 플랜:       월 29,900원 (선택사항)
엔터프라이즈:    월 99,900원+

연간 할인:       20% 할인
```

### 3.2 수익 예측

```
시나리오 1 (3개월 목표):
  기본: 50명 × 9,900원 = 495,000원
  클라우드: 10명 × 49,900원 = 499,000원
  월 수익: 약 994,000원

시나리오 2 (6개월 목표):
  기본: 150명 × 9,900원 = 1,485,000원
  클라우드: 30명 × 49,900원 = 1,497,000원
  월 수익: 약 2,982,000원

시나리오 3 (1년 목표):
  기본: 300명 × 9,900원 = 2,970,000원
  클라우드: 100명 × 49,900원 = 4,990,000원
  월 수익: 약 7,960,000원

운영 비용:
  AWS: 월 200-300 USD (기본 앱)
  Stripe 수수료: 2.9% + $0.30
  개발/유지보수: 월 500만원 (초기)

순이익:
  3개월: 약 700,000원
  6개월: 약 2,500,000원
  1년: 약 7,000,000원+
```

### 3.3 추가 수익 모델

```
추가 서비스 (같은 플랫폼에서):

Signal 서비스:
  신호만 제공
  기본: 월 4,900원
  고급: 월 14,900원

Analytics 도구:
  기본: 월 9,900원
  프로: 월 19,900원

교육/강의:
  기본: 월 29,900원
  프로: 월 79,900원

협력사 제품:
  수익 배분 (50/50, 70/30 등)
  → 당신이 플랫폼만 제공

결과:
  1,000명 규모 시 월 10,000,000원+ 가능
```

---

## 4. 개발 로드맵

### 4.1 Phase 1 (1개월) - 기본 구독 시스템

```
작업:
1. K-Trader.exe 라이선스 검증 추가
   - AWS에 구독 상태 확인
   - 만료 시 프로그램 실행 차단
   - 오프라인 캐시 처리

2. AWS FastAPI 백엔드
   - 구독 관리 API
   - 라이선스 검증 엔드포인트
   - 거래 기록 저장

3. Stripe 연동
   - 구독 생성
   - 자동 갱신
   - 웹훅 처리

4. 웹 결제 페이지
   - 간단한 HTML
   - 3가지 플랜 선택
   - Stripe Checkout

기간: 1개월
인력: 당신 혼자 가능
비용: 거의 없음 (기존 인프라 활용)
```

### 4.2 Phase 2 (2개월) - 웹/모바일 추가

```
작업:
1. React Native 앱 (iOS/Android)
   - 신호 실시간 표시
   - 거래 기록 조회
   - 구독 관리
   - 푸시 알림

2. React 웹 대시보드
   - 신호 표시
   - 거래 기록
   - 성과 분석
   - 구독 관리

3. 자격증명 관리
   - E2E 암호화
   - 마스터 비밀번호 기반
   - 클라우드 동기화

기간: 2개월
인력: 당신 (또는 프리랜서 1-2명)
비용: 약 300-500만원
```

### 4.3 Phase 3 (2개월) - 클라우드 플랜

```
작업:
1. Docker 이미지 생성
   - K-Trader 엔진을 Docker로
   - 환경 변수 설정 가능

2. AWS 자동 배포
   - 사용자 AWS 계정에 접속
   - EC2 인스턴스 생성
   - Docker 실행
   - 모니터링 설정

3. 웹 폼
   - AWS 자격증명 입력
   - Kiwoom 자격증명 입력
   - "배포" 버튼
   - 자동 배포 확인 메시지

4. 대시보드
   - 실행 중인 인스턴스 표시
   - 시작/중지 버튼
   - 모니터링 데이터

기간: 2개월
비용: 약 500만원
```

### 4.4 Phase 4 - 확장 서비스

```
Signal 서비스:
  신호만 제공
  별도 앱/웹

Analytics:
  K-Trader 데이터 분석
  수익성 분석
  월별 추이

협력사 통합:
  동일 결제 시스템
  수익 배분 자동화
```

---

## 5. 자금 조달 계획

### 5.1 정부 지원금 (우선순위 1)

```
프로그램:
  중소벤처기업부 "스타트업 성장사다리"
  또는 창업진흥원 "기술 스타트업 고도화"

조건:
  ✓ 설립 3-7년 개인사업자
  ✓ 당신은 4년 운영 (딱 맞음!)
  
지원액:
  최대 5,000만원
  
용도:
  AWS 클라우드 비용
  개발비
  마케팅비
  
가능성:
  ⭐⭐⭐⭐⭐ (매우 높음)
  이유: 4년 실적 + 기술력 우수 + AWS 투자 증거

실행:
  1. 지역 창업센터 방문 (무료 상담)
  2. 사업계획서 제출
  3. 심사 (2-4주)
  4. 선정 시 자금 수령
```

### 5.2 AWS Partner Network (우선순위 2)

```
조건:
  AWS와 파트너 관계
  기술력 입증
  
지원:
  파트너 크레딧
  마케팅 개발 펀드
  기술 지원
  
가능성:
  ⭐⭐⭐⭐ (높음)
  이유: 이미 AWS 사용 중
```

### 5.3 AWS Activate (우선순위 3)

```
조건:
  "초기 단계 스타트업"
  = 설립 후 1-3년 (최대 5년)
  
당신:
  설립 2020년 = 4년 운영
  → "초기 단계" 벗어났을 가능성
  
가능성:
  ⭐⭐ (낮음)
  
추천:
  신청해봐도 괜찮음 (거절해도 손해 없음)
  하지만 기대는 말 것
  정부 지원금 + Partner가 더 현실적
```

---

## 6. 3개월 실행 계획

### 6.1 이번 주 (1주차)

```
☐ 정부 지원금 신청 준비
  - 지역 창업센터 찾기
  - 무료 상담 예약
  - 필요 서류 준비

☐ AWS Partner Network 신청 준비
  - AWS Partner Central 가입
  - 필요 정보 정리

☐ Stripe 계정 생성
  - 결제 수단 연결
  - 요금제 설정
```

### 6.2 2-3주차

```
☐ K-Trader 라이선스 검증 로직 추가
  - AWS 호출 추가
  - 구독 상태 확인
  - 오프라인 캐시

☐ AWS FastAPI 백엔드
  - 라이선스 검증 API
  - 구독 관리
  - Stripe 웹훅
```

### 6.3 3-4주차

```
☐ Stripe 결제 테스트
  - 실제 결제 테스트
  - 자동 갱신 확인

☐ 웹 결제 페이지 배포
  - 간단한 HTML 완성
  - 라이브 배포

☐ 정부 지원금 신청서 제출
  - 마감 전 제출
```

### 6.4 4-5주차

```
☐ 베타 테스트
  - 5-10명 친구에게 배포
  - 피드백 수집

☐ 마케팅 준비
  - 소개 페이지 작성
  - SNS 계획
```

---

## 7. 기술 상세 사항

### 7.1 K-Trader 수정 부분

```python
# k_trader_main.py 추가 코드

def check_subscription():
    """
    프로그램 실행 시 첫번째로 호출
    """
    try:
        # AWS에 요청
        response = requests.get(
            "https://api.k-trader.com/api/v1/license/verify",
            headers={"Authorization": f"Bearer {self.token}"},
            timeout=5
        )
        
        data = response.json()
        
        if data['status'] == 'active':
            # ✓ 계속 진행
            self.start_trading()
        
        elif data['status'] == 'expired':
            # ❌ 구독 만료
            self.show_dialog(
                "구독 필요",
                "K-Trader 구독이 만료되었습니다.\n"
                "웹사이트에서 구독을 갱신하세요.\n"
                "https://k-trader.com/subscribe"
            )
            self.exit()
        
        elif data['status'] == 'payment_failed':
            # ❌ 결제 실패
            self.show_dialog(
                "결제 실패",
                "결제가 실패했습니다.\n"
                "카드 정보를 업데이트하세요."
            )
            self.exit()
    
    except requests.exceptions.RequestException:
        # 인터넷 오프라인 모드
        if self.check_offline_cache():
            self.start_trading()
        else:
            self.show_dialog(
                "인터넷 필요",
                "인터넷 연결 후 다시 시도하세요."
            )
            self.exit()
```

### 7.2 AWS 백엔드

```python
# backend/api.py

@app.get("/api/v1/license/verify")
async def verify_license(token = Depends(get_jwt_token), db = Depends()):
    """
    K-Trader 앱에서 호출
    """
    user = db.query(User).filter(User.id == token['user_id']).first()
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription or subscription.status != 'active':
        return {"status": "inactive"}
    
    if subscription.next_billing_date < datetime.now():
        return {"status": "expired"}
    
    return {
        "status": "active",
        "plan": subscription.plan,
        "expires": subscription.next_billing_date.isoformat()
    }
```

---

## 8. 해결된 주요 질문들

### Q1: 웹서비스 필요한가?
**A:** 처음에는 고려했지만, 앱만으로 충분합니다.
- 웹 개발 제외 → 1개월 단축
- 비용 감소 (CDN, S3 불필요)
- 모바일 앱이 핵심

### Q2: Kiwoom API는 어떻게?
**A:** 세 가지 옵션 중 선택:

1. **Windows 프록시** (현재 추천 안 함)
   - AWS에 Windows 서버 필요
   - 월 $200-500 비용 증가
   - 복잡함

2. **eBEST로 변경** (장기 솔루션)
   - RESTful API (모든 기기 지원)
   - Kiwoom보다 현대적
   - 마이그레이션 필요

3. **현재 유지** (추천)
   - 기본 플랜: 로컬 (Kiwoom 유지)
   - 클라우드 플랜: Windows 프록시 또는 eBEST
   - 장기적으로 eBEST로 전환

→ **당신의 선택:** 현재는 로컬만 지원, 나중에 클라우드 추가

### Q3: 모바일에서 거래 가능한가?
**A:** 기본적으로 불가능:
- iOS/Android는 Kiwoom 미지원
- 신호 보기 + 모니터링만 가능
- 거래는 PC나 클라우드에서만

### Q4: 사용자가 AWS에 배포할 때 비용은?
**A:** 사용자가 부담:
- t3.micro: 월 $10-20
- 프리 티어: 첫해 무료
- 당신은 구독료만 수령

### Q5: 보안은?
**A:** E2E 암호화:
- 마스터 비밀번호만 사용자가 알고 있음
- 서버는 암호화된 데이터만 저장
- 복호화 불가능
- 한 기기에서 도난당해도 다른 기기 안전

### Q6: 협력사와 판매할 수 있나?
**A:** 네, 같은 결제 시스템에서:
- Signal 서비스 (당신)
- Analytics (당신)
- 다른 거래 도구 (협력사)
- 수익 배분 자동화 가능

---

## 9. 최종 체크리스트

### 신청/준비 (이번 주)
- [ ] 지역 창업센터 방문 예약
- [ ] Stripe 계정 생성
- [ ] AWS Partner Network 신청 준비
- [ ] 사업계획서 작성 완료 ✓

### 개발 시작 (2-3주)
- [ ] K-Trader 라이선스 검증 추가
- [ ] AWS 백엔드 API 개발
- [ ] Stripe 웹훅 처리

### 배포 (4-5주)
- [ ] 웹 결제 페이지 배포
- [ ] 베타 테스트
- [ ] 정부 지원금 신청

---

## 10. 핵심 메시지

```
당신은 이미:
✓ 4년 운영한 실제 서비스가 있음
✓ 고객 기반이 있음
✓ 기술력이 증명됨 (조건식, 자동 거래)
✓ AWS 경험이 있음

따라서:
✓ 구독화는 어렵지 않음
✓ 정부 지원금 충분히 가능
✓ 1개월이면 기본 시스템 완성
✓ 3개월이면 수익화 시작 가능

최우선:
1. 지역 창업센터 방문 (정부 지원금)
2. Stripe 결제 시스템 구축
3. K-Trader 라이선스 검증 추가

화이팅! 🚀
```

---

## 부록: 명령어 및 참고

### AWS 크레딧 신청
- AWS Partner Network: https://aws.amazon.com/ko/partners/
- AWS Activate: https://aws.amazon.com/startups/

### 정부 지원금
- 중소벤처기업부: https://www.mafra.go.kr/
- 창업진흥원: https://www.k-startup.go.kr/

### 결제 연동
- Stripe: https://stripe.com/
- Apple IAP: https://developer.apple.com/
- Google Play: https://play.google.com/apps/publish/

---

**문서 작성자:** Claude  
**최종 수정:** 2024년 3월 4일
