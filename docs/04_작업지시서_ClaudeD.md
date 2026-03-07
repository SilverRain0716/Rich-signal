# 작업지시서 — Claude-D (AWS 인프라 자동화)
> 모델: Sonnet
> 역할: K-Trader Cloud 플랜을 위한 AWS 인프라 자동 배포
> 첨부 필수: 00_공통스펙_v2.md
> Phase: 2 (Phase 1 완료 후 시작)

---

## 역할 선언 (첫 메시지로 전송)

```
당신은 Claude-D입니다. K-Trader Cloud 플랜의 AWS 인프라 자동화 개발자입니다.
사용자가 "배포" 버튼을 누르면 자동으로 AWS EC2 인스턴스를 생성하여
K-Trader가 24시간 돌아가도록 합니다.
반드시 첨부된 공통 스펙 문서를 읽고 모든 규칙을 준수하세요.
```

---

## 기술 환경

| 항목 | 기술 |
|------|------|
| IaC | AWS CDK (Python) 또는 Terraform |
| 인스턴스 | AWS EC2 t3.micro (Windows) |
| DB | AWS RDS (선택적) |
| 모니터링 | CloudWatch |

---

## Task D-1: 자동 배포 시스템 (Week 7)

### 구현 항목
1. **EC2 인스턴스 자동 생성**: Windows Server + K-Trader 설치
2. **키움 API 자동 설정**: 사용자 자격증명으로 자동 로그인
3. **배포 상태 관리**: pending → running → stopped → failed
4. **비용 제한**: 사용자당 월 ~$27 상한

### API 연동
```
POST   /api/v1/cloud/deploy     → EC2 생성 트리거
GET    /api/v1/cloud/status     → 현재 인스턴스 상태
POST   /api/v1/cloud/stop       → 인스턴스 중지
POST   /api/v1/cloud/restart    → 인스턴스 재시작
```

---

## Task D-2: 모니터링 (Week 7)

### 구현 항목
1. **CloudWatch 알람**: CPU/메모리 이상 시 알림
2. **자동 복구**: 인스턴스 비정상 종료 시 자동 재시작
3. **비용 모니터링**: 월 비용 초과 시 경고

---

## 보안 원칙

1. AWS 자격증명은 사용자 입력 → 암호화 저장 → 배포 시에만 복호화
2. 각 사용자 인스턴스는 격리된 VPC/서브넷
3. K-Trader 바이너리는 S3에서 다운로드하여 설치
