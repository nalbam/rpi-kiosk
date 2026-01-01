# Development Guide

## 요구사항

- Node.js 22 LTS
- npm

## 개발 환경 설정

```bash
git clone https://github.com/nalbam/rpi-kiosk.git
cd rpi-kiosk
npm install
npm run dev
```

http://localhost:3000

## 프로젝트 구조

```
app/
├── api/              # API Routes
│   ├── calendar/
│   ├── rss/
│   └── weather/
├── settings/
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── Calendar/
├── Clock/
├── RSS/
└── Weather/

lib/
├── config.ts         # 설정 타입 및 기본값
├── constants.ts      # 시스템 상수 (API 제한, 검증 범위)
├── storage.ts        # localStorage 관리
└── urlValidation.ts  # SSRF 보호

scripts/
├── install.sh
├── uninstall.sh
└── start-kiosk.sh
```

## 스크립트

- `npm run dev` - 개발 서버
- `npm run build` - 프로덕션 빌드
- `npm start` - 프로덕션 실행
- `npm run lint` - ESLint

## 개발 가이드

### 코드 스타일

- TypeScript 사용
- Functional components + hooks
- Tailwind CSS
- 작고 집중된 컴포넌트

### 새 기능 추가

1. `components/` 에 컴포넌트 생성
2. 필요시 `app/api/` 에 API 라우트 추가
3. `lib/config.ts` 설정 타입 업데이트
4. `app/page.tsx` 에 컴포넌트 추가
5. 설정 페이지 업데이트

### API 라우트 패턴

```typescript
import { NextResponse } from 'next/server';
import { validateCalendarUrl, fetchWithTimeout } from '@/lib/urlValidation';
import { API, PROCESSING_LIMITS } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  // SSRF 검증 필수
  const validation = validateCalendarUrl(url);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    // 타임아웃과 크기 제한 적용
    const response = await fetchWithTimeout(url, API.TIMEOUT_MS, API.MAX_RSS_SIZE);
    const data = await response.text();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
```

### 보안 체크리스트

외부 URL을 가져오는 모든 API 라우트는:
- [ ] `validateCalendarUrl()` 로 URL 검증
- [ ] `fetchWithTimeout()` 사용
- [ ] `constants.ts` 의 상수 사용
- [ ] 검증 실패 시 400 반환
- [ ] 적절한 타임아웃과 크기 제한 설정

### 컴포넌트 패턴

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getConfig } from '@/lib/storage';

export default function MyWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/my-endpoint');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const config = getConfig();
    const interval = setInterval(
      fetchData,
      config.refreshIntervals.myFeature * 60 * 1000
    );
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* UI */}</div>;
}
```

## 상수 관리

### constants.ts (시스템 제약)

```typescript
export const API = {
  TIMEOUT_MS: 10000,
  MAX_RSS_SIZE: 5 * 1024 * 1024,
} as const;

export const PROCESSING_LIMITS = {
  MAX_RSS_ITEMS_PER_FEED: 10,
  MAX_RSS_ITEMS_TOTAL: 20,
} as const;
```

### config.ts (사용자 설정)

```typescript
export interface KioskConfig {
  timezone: string;
  refreshIntervals: { weather: number; calendar: number; rss: number };
  displayLimits: { calendarEvents: number; rssItems: number };
  // ...
}
```

## 빌드 및 배포

```bash
npm run build
npm start
```

라즈베리파이 배포: `./scripts/install.sh` 참조

## Node.js 버전

`.nvmrc` 파일 포함:

```bash
nvm use
```

## 문제 해결

**포트 사용 중**
```bash
PORT=3001 npm run dev
```

**의존성 문제**
```bash
rm -rf node_modules package-lock.json
npm install
```

**빌드 오류**
```bash
node --version  # v22.x.x 확인
```
