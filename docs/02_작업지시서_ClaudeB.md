# 작업지시서 — Claude-B (K-Trader 데스크톱 앱)
> 모델: Sonnet
> 역할: K-Trader.exe 리팩토링 + Rich-Signal API 연동
> 첨부 필수: 00_공통스펙_v2.md
> Phase: 2 (Phase 1 완료 후 시작)

---

## 역할 선언 (첫 메시지로 전송)

```
당신은 Claude-B입니다. K-Trader 데스크톱 앱(PyQt5) 개발자입니다.
기존 K-Trader 프로그램을 리팩토링하여 Rich-Signal API와 연동합니다.
반드시 첨부된 공통 스펙 문서를 읽고 모든 규칙을 준수하세요.
조건식 로직은 프로그램 내부에만 존재하며, 외부에 절대 노출하지 마세요.
```

---

## 기술 환경

| 항목 | 기술 |
|------|------|
| 언어 | Python 3.11+ |
| GUI | PyQt5 |
| 증권 API | 키움 OpenAPI+ |
| 서버 API | Rich-Signal FastAPI |
| 인증 | JWT 토큰 |

---

## Task B-1: 라이선스 검증 시스템 (Week 5)

### 핵심 원칙
- **프로그램은 모든 유저에게 동일한 파일** (구독 정보가 내장되지 않음)
- **실행 시마다 AWS API로 구독 상태 확인**
- **Stripe가 자동 갱신 처리** (사용자는 아무것도 안 해도 됨)
- **오프라인 캐시 지원** (인터넷 없을 때 최대 7일 허용)

### 라이선스 검증 흐름
```
K-Trader.exe 실행
  ↓
[첫 실행] 이메일 + 비밀번호 입력 (로그인) → JWT 토큰 발급 → 로컬 저장
[이후 실행] 저장된 JWT 토큰 사용
  ↓
GET /api/v1/license/verify (Authorization: Bearer {token})
  ↓
서버 응답:
  Case 1: { status: "active", plan: "ktrader_pro", expires_at: "2026-05-01" }
    → ✅ 프로그램 시작 + 로컬 캐시 저장
  Case 2: { status: "expired" }
    → ❌ "구독이 만료되었습니다" + 웹 결제 페이지 안내 + 앱 종료
  Case 3: { status: "payment_failed" }
    → ❌ "결제가 실패했습니다. 카드를 업데이트하세요" + 앱 종료
  Case 4: 네트워크 오류
    → 오프라인 캐시 확인 (마지막 확인일 기준 7일 이내이면 허용)
```

### 구현 항목
1. **온라인 라이선스 체크**: 실행 시 + 이후 하루 1회 AWS에 구독 상태 확인
2. **오프라인 캐시**: 마지막 확인 결과를 로컬에 암호화 저장, 7일간 유효
3. **플랜별 기능 분기**:
   - ktrader_basic: 사용자 조건식만 사용 가능
   - ktrader_pro: 오너 검증 조건식 자동 활성화
   - ktrader_cloud: 오너 조건식 + AWS 24h
4. **구독 만료 처리**: 만료/실패 시 프로그램 실행 차단 + 결제 페이지 안내
5. **수급주 데이터 표시**: /api/v1/supply/today 호출하여 앱 내 표시

### 참고 코드 (구조)
```python
class LicenseCheck:
    def verify_subscription(self):
        try:
            response = requests.get(
                "https://api.rich-signal.com/api/v1/license/verify",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.save_to_cache(data)  # 오프라인 캐시 저장
                return self.check_status(data)
            else:
                return self.check_offline_cache()
        except requests.exceptions.RequestException:
            return self.check_offline_cache()

    def check_offline_cache(self):
        cached = self.load_cache()
        if not cached:
            self.show_message("인터넷 연결이 필요합니다")
            return False
        expiry = datetime.fromisoformat(cached['expires_at'])
        last_check = cached['last_check']
        if expiry > datetime.now() and (datetime.now() - last_check).days < 7:
            return True
        self.show_message("구독이 만료되었습니다. 인터넷 연결 후 갱신하세요")
        return False
```

---

## Task B-2: UI 리팩토링 (Week 5~6)

### 구현 항목
1. **로그인 화면**: Rich-Signal 계정으로 로그인
2. **메인 대시보드**: 주도주/수급주 요약 + 자동매매 상태
3. **조건식 설정**: ktrader_pro는 오너 조건식 자동 활성화
4. **거래 로그**: 매매 이력 표시

---

## 보안 원칙

1. **조건식 로직은 프로그램 바이너리 내부에만 존재**
2. API로 조건식 데이터를 전송하지 않음
3. 키움 ID/PW는 로컬에만 저장 (서버 전송 금지)
4. 매매 신호만 생성 (BUY/SELL), 조건식 과정은 비공개
