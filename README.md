# RPI Kiosk

라즈베리파이용 키오스크 디스플레이 애플리케이션. Next.js와 TypeScript 기반.

## 주요 기능

- 🕐 시계 (타임존 지원)
- 🌤️ 날씨 (온도, 습도, 풍속)
- 📅 캘린더 (Google Calendar 연동)
- 📰 뉴스 (RSS 피드)
- ⚙️ 웹 기반 설정 페이지

## 요구사항

- Raspberry Pi 3 이상
- Raspberry Pi OS
- Node.js 22 LTS

## 설치

```bash
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk
./scripts/install.sh
```

설치 스크립트가 자동으로 처리:
- 시스템 패키지 설치 (chromium, unclutter 등)
- Node.js 22 설치
- npm 의존성 설치 및 빌드
- systemd 서비스 등록 및 시작

## 제거

```bash
./scripts/uninstall.sh
```

systemd 서비스만 제거됩니다. 앱 파일과 시스템 패키지는 유지됩니다.

## 설정

### 방법 1: 웹 UI (권장)

브라우저에서 `설정` 버튼 클릭하여 변경 가능:

### 방법 2: 설정 파일 (config.json)

쉘 스크립트로 설정 관리:

```bash
# 설정 파일 생성
./scripts/config.sh init

# 값 변경
./scripts/config.sh set timezone "America/New_York"
./scripts/config.sh set weatherLocation.lat 40.7128
./scripts/config.sh set weatherLocation.lon -74.0060
./scripts/config.sh set displayLimits.rssItems 10

# 값 확인
./scripts/config.sh get timezone

# 전체 설정 보기
./scripts/config.sh list
```

**우선순위**: 브라우저 설정 > config.json > 기본값

### 설정 항목

**시간**
- 타임존 (예: Asia/Seoul)

**날씨**
- 도시명, 위도/경도
- 새로고침 간격 (분)

**캘린더**
- Google Calendar iCal URL
- 새로고침 간격 (분)
- 표시할 일정 개수 (1-10)

**RSS**
- 피드 URL 추가/삭제
- 새로고침 간격 (분)
- 표시할 뉴스 개수 (1-10)

### Google Calendar URL 얻기

1. Google Calendar → 설정 및 공유
2. 캘린더 통합 → 비공개 주소
3. iCal 형식 URL 복사

## 서비스 관리

```bash
# 상태 확인
sudo systemctl status rpi-kiosk

# 재시작
sudo systemctl restart rpi-kiosk

# 로그 확인
sudo journalctl -u rpi-kiosk -f

# 중지
sudo systemctl stop rpi-kiosk
```

## 개발

```bash
npm run dev
```

http://localhost:3000

## 기술 스택

- Node.js 22, Next.js 16, React 19, TypeScript 5
- Tailwind CSS, date-fns, ical.js, rss-parser
- Weather API: Open-Meteo (무료)

## 프로젝트 구조

```
app/
├── api/              # API Routes
│   ├── calendar/
│   ├── rss/
│   └── weather/
├── settings/         # 설정 페이지
└── page.tsx          # 메인 페이지

components/           # 위젯
├── Calendar/
├── Clock/
├── RSS/
└── Weather/

lib/
├── config.ts         # 설정 타입 및 기본값
├── constants.ts      # 시스템 상수
├── storage.ts        # localStorage 관리
└── urlValidation.ts  # SSRF 보호

scripts/
├── install.sh        # 설치 및 서비스 등록
├── uninstall.sh      # 서비스 제거
└── start-kiosk.sh    # 키오스크 실행
```

## 문제 해결

**날씨가 안 보일 때**
- 인터넷 연결 확인
- 설정에서 올바른 위도/경도 입력

**캘린더가 안 보일 때**
- iCal URL 형식 확인
- 캘린더 공유 설정 확인

**RSS가 안 보일 때**
- 유효한 RSS URL인지 확인
- 브라우저 콘솔에서 에러 확인

## 라이선스

MIT License
