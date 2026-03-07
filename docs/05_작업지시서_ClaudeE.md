# 작업지시서 — Claude-E (데이터 수집 엔진)
> 모델: Sonnet
> 역할: LS API를 통한 시장 데이터 수집 + Gemini AI 예상 주도주 생성
> 첨부 필수: 00_공통스펙_v2.md

---

## 역할 선언 (첫 메시지로 전송)

```
당신은 Claude-E입니다. Rich-Signal 프로젝트의 데이터 수집 엔진 개발자입니다.
LS증권 XingAPI/Open-API로 시장 데이터를 수집하고, DART/네이버금융에서 공시/뉴스를 가져와 Supabase DB에 저장합니다.
또한 Gemini API를 활용하여 AI 예상 주도주를 생성합니다.
반드시 첨부된 공통 스펙 문서를 읽고 모든 규칙을 준수하세요.
```

---

## 기술 환경

| 항목 | 기술 |
|------|------|
| 실행 환경 | Windows AWS EC2 (LS API가 Windows 전용) |
| 언어 | Python 3.11+ |
| 증권 API | LS증권 XingAPI 또는 Open-API |
| 공시 | DART Open API |
| 뉴스 | 네이버 금융 크롤링 (robots.txt 준수) |
| AI | Google Generative AI (Gemini) |
| DB | Supabase (supabase-py) |
| 스케줄러 | APScheduler 또는 Windows Task Scheduler |

---

## Task E-1: LS API 연동 (Week 1)

### 구현 항목
1. **LS API 로그인/인증** 처리
2. **실시간 시세 수집**: 거래대금 상위, 거래량 상위, 등락률
3. **섹터별 데이터 수집**: LS 제공 섹터 분류 기준 상승률
4. **외국인/기관 순매수 데이터 수집**
5. **KRX + NXT 통합 데이터 처리**

### NXT 데이터 처리 원칙
- LS API에서 NXT 통합 조회 지원 시: 통합 데이터 직접 사용
- 미지원 시: KRX/NXT 개별 조회 후 서버에서 거래대금 합산
- 장중 현재 주도주는 반드시 KRX+NXT 통합 거래대금 기준

### 데이터 저장 대상 테이블
```
leader_stocks      — category별 분류하여 저장
sector_rankings    — 섹터별 상승률 순위
supply_stocks      — 14:30 수급주
```

---

## Task E-2: DART + 뉴스 수집 (Week 2)

### 구현 항목
1. **DART API 연동**: 당일 공시 목록 수집
2. **네이버 금융 뉴스 크롤링**: 종목별 관련 뉴스 수집
3. **수급주 ↔ 공시/뉴스 매칭**: 수급주 리스트 확정 시 해당 종목의 공시/뉴스 자동 연결

### 저장 테이블
```
stock_news         — 종목별 뉴스
stock_disclosures  — 종목별 공시
```

### DART API 사용 주의
- 일일 요청 한도: 1,000건
- 수급주 종목만 선별 조회하면 충분

---

## Task E-3: AI 예상 주도주 (Week 3)

### 구현 항목
1. **Gemini API 연동**
2. **프롬프트 설계**: 전일 거래 데이터 + 뉴스 요약을 입력으로, 당일 예상 주도주 출력
3. **매일 장 전(08:00~08:30) 자동 실행**
4. **결과를 leader_stocks 테이블에 category='ai_predicted'로 저장**

### Gemini 프롬프트 구조 (초안)
```
당신은 한국 주식 시장 분석 전문가입니다.
아래 데이터를 기반으로 오늘 장에서 주도할 가능성이 높은 종목 10개를 선정하세요.

[전일 거래 데이터]
{전일 거래대금 상위 30개 종목 + 등락률 + 섹터}

[전일 NXT 애프터마켓 동향]
{애프터마켓 거래대금 상위 10개}

[당일 주요 뉴스/공시]
{DART + 네이버금융 요약}

응답 형식: JSON
[{"stock_code": "005930", "stock_name": "삼성전자", "prediction_reason": "...", "confidence": 85}]
```

> 이 프롬프트는 PM과 조율하여 최종 확정합니다.

---

## Task E-4: 스케줄러 (전체)

### 자동 실행 스케줄
```
07:30  — 시장 지표 업데이트 (미국장 마감 데이터)
08:00  — NXT 프리마켓 수집 시작
08:15  — Gemini AI 예상 주도주 생성
09:00  — KRX+NXT 장중 실시간 수집 시작 (30초~1분 간격)
14:30  — 수급주 리스트 확정 + 공시/뉴스 매칭
15:30  — 정규장 마감 데이터 정리
15:35  — NXT 애프터마켓 수집 시작
20:00  — 전체 마감 데이터 정리 + 다음날 전일 주도주 준비
```

---

## 코드 구조

```
collector/
├── ls_api/
│   ├── client.py          # LS API 인증/연결
│   ├── market_data.py     # 시세/거래대금/수급 수집
│   └── sector_data.py     # 섹터별 데이터 수집
├── dart_api/
│   └── client.py          # DART 공시 수집
├── news_scraper/
│   └── naver_finance.py   # 네이버 금융 뉴스 크롤링
├── ai_predictor/
│   └── gemini_client.py   # Gemini AI 예상 주도주
├── db/
│   └── supabase_client.py # Supabase 저장
├── scheduler.py           # APScheduler 메인
├── config.py              # 환경 변수
└── requirements.txt
```

---

## 코드 규칙

1. 수집 데이터는 반드시 공통 스펙의 DB 스키마에 맞춰 저장
2. leader_stocks의 category 값: 'previous' | 'ai_predicted' | 'current' | 'nxt_after' | 'nxt_pre'
3. 에러 발생 시 로그 남기고 다음 주기 계속 실행 (수집 서버 죽으면 안 됨)
4. **조건식 관련 데이터는 절대 수집하지 않음**
5. LS API 요청 간격 준수 (초당 제한 확인)
