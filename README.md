# RPI Kiosk

라즈베리파이용 키오스크 모드 디스플레이 애플리케이션입니다. Next.js와 TypeScript로 작성되었으며, 깔끔하고 현대적인 디자인을 제공합니다.

## 주요 기능

- 🕐 **시계**: 시스템 시간 표시 및 타임존 지원
- 🌤️ **날씨**: 현재 날씨 정보 (온도, 습도, 풍속, 날씨 상태)
- 📅 **캘린더**: Google 캘린더 통합으로 일정 표시
- 📰 **뉴스**: RSS 피드를 통한 최신 뉴스 표시
- ⚙️ **설정**: 모든 기능을 커스터마이징할 수 있는 설정 페이지
- 🎨 **현대적인 UI**: 검은색 배경의 깔끔하고 현대적인 디자인

## 스크린샷

키오스크 모드에서 실행되며, 시계, 날씨, 캘린더, 뉴스를 한 화면에 표시합니다.

## 설치 방법

### 필수 요구사항

- Raspberry Pi (3, 4, 또는 최신 모델)
- Raspberry Pi OS (Bullseye 또는 최신)
- Node.js 18 이상

### 자동 설치

```bash
# 저장소 클론
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk

# 설치 스크립트 실행
chmod +x scripts/install.sh
./scripts/install.sh
```

### 수동 설치

```bash
# 저장소 클론
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk

# 의존성 설치
npm install

# 빌드
npm run build

# 실행
npm start
```

## 키오스크 모드 설정

### 자동 시작 설정

#### 방법 1: Autostart 사용 (LXDE)

```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

다음 라인 추가:
```
@/home/pi/rpi-kiosk/scripts/start-kiosk.sh
```

#### 방법 2: Systemd 서비스 사용

```bash
# 서비스 파일 복사
sudo cp scripts/rpi-kiosk.service /etc/systemd/system/

# 서비스 활성화
sudo systemctl enable rpi-kiosk.service
sudo systemctl start rpi-kiosk.service

# 서비스 상태 확인
sudo systemctl status rpi-kiosk.service
```

## 설정

애플리케이션을 실행한 후 우측 상단의 "설정" 버튼을 클릭하여 다음 항목을 설정할 수 있습니다:

### 시간 설정
- **타임존**: Asia/Seoul, America/New_York 등
- **시간 서버**: NTP 서버 주소 (선택사항)

### 날씨 설정
- **도시**: 표시할 도시 이름
- **위도/경도**: 정확한 위치 좌표
- **새로고침 간격**: 날씨 정보 갱신 주기 (분)

### 캘린더 설정
- **Google 캘린더 URL**: iCal 형식의 공유 캘린더 URL
- **새로고침 간격**: 캘린더 갱신 주기 (분)

#### Google 캘린더 URL 얻는 방법:
1. Google Calendar에서 공유할 캘린더 선택
2. 설정 및 공유 → 캘린더 통합
3. "비공개 주소" 섹션에서 iCal 형식 URL 복사

### RSS 피드 설정
- **RSS 피드 추가**: RSS 피드 URL 추가/삭제
- **새로고침 간격**: 뉴스 갱신 주기 (분)

기본 RSS 피드:
- Google News Korea: https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko

## 개발

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

### 프로젝트 구조

```
rpi-kiosk/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── calendar/        # 캘린더 API
│   │   ├── rss/             # RSS 피드 API
│   │   └── weather/         # 날씨 API
│   ├── settings/            # 설정 페이지
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 메인 페이지
│   └── globals.css          # 전역 스타일
├── components/              # React 컴포넌트
│   ├── Calendar/           # 캘린더 위젯
│   ├── Clock/              # 시계 위젯
│   ├── RSS/                # RSS 뉴스 위젯
│   └── Weather/            # 날씨 위젯
├── lib/                    # 유틸리티 라이브러리
│   ├── config.ts          # 설정 타입 및 기본값
│   └── storage.ts         # 로컬 스토리지 관리
├── scripts/               # 설치 및 실행 스크립트
│   ├── install.sh        # 설치 스크립트
│   ├── start-kiosk.sh    # 키오스크 모드 시작 스크립트
│   └── rpi-kiosk.service # Systemd 서비스 파일
└── public/               # 정적 파일
```

## 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns, date-fns-tz
- **Calendar**: ical.js
- **RSS**: rss-parser
- **Weather API**: Open-Meteo (무료, API 키 불필요)

## 문제 해결

### 날씨가 표시되지 않을 때
- 인터넷 연결 확인
- 설정에서 올바른 위도/경도 입력 확인

### 캘린더가 표시되지 않을 때
- Google 캘린더 URL이 올바른지 확인
- iCal 형식의 URL인지 확인 (일반 공유 링크가 아님)
- 캘린더가 공개 또는 링크로 공유되었는지 확인

### RSS 피드가 표시되지 않을 때
- RSS 피드 URL이 유효한지 확인
- 인터넷 연결 확인
- 브라우저 콘솔에서 에러 확인

## 라이선스

MIT License

## 기여

기여는 언제나 환영합니다! 이슈를 등록하거나 Pull Request를 보내주세요.

## 작성자

nalbam