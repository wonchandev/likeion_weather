# 🌤️ 감정 날씨 지도 (Mood Weather Map)

`감정날씨지도_기획서.pdf`의 기획 의도와 핵심 기능 요구사항(MVP)을 충족하도록 전면 개편된 풀스택 웹 애플리케이션 서비스입니다.
실시간 전국 지도 시각화, 실제 날씨 비교, 역사 기록 트렌드, 개인 감정 다이어리까지 완벽하게 통합된 프리미엄 서비스를 제공합니다.

---

## 📌 기획서 기반 구현 완료 사항

### 1. 화면 구성 (페이지 단위)
- **감정 입력 메인 페이지 (`/` - [EntryPage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/EntryPage.jsx))**:
  - 화면 중앙 4개 감정 단추(맑음 ☀️, 흐림 ⛅, 비 🌧️, 폭풍 ⛈️) 선택기
  - 선택 시 등장하는 한 줄 코멘트 입력기 (최대 50자 제한)
  - 오늘 전국 기분의 지배적 감정 상태 요약 배너 자동 표출
  - 제출 시 실시간 전국 감정 지도로 화면 자동 전환
  - 위치 수집 허용 시 자동 좌표 매핑, 거부 시 지역 직접 선택(드롭다운) 기능
  - **하루 1회 기록 제한**: 자정 기준(KST) 초기화, 오늘 이미 작성한 이력이 있다면 자동으로 내용 수정(Update) 처리 수행
- **전국 감정 지도 페이지 (`/map` - [MapPage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/MapPage.jsx))**:
  - 시·도 단위의 전국 대표 감정 날씨 아이콘 및 지배 색상 렌더링
  - 개별 사용자의 상세 마커 조회 (줌인 시 마크 클릭 팝업 출력)
  - 우측 하단 Floating Action Button (`+`) 클릭 시 기분 입력 페이지(`/`)로 이동
- **지역 상세 페이지/드로어 (`/map/:region` - [MapPage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/MapPage.jsx))**:
  - 특정 지역 클릭 시 우측에서 슬라이드 오픈되는 정보 드로어
  - 직접 구현한 반응형 **SVG 도넛 차트**를 이용한 지역 감정 날씨 비율 통계 분석
  - 해당 지역 실시간 익명 코멘트 피드 리스트
- **날씨 비교 페이지 (`/compare` - [ComparePage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/ComparePage.jsx))**:
  - **OpenWeatherMap API 연동** ([weather_service.py](file:///Users/iwonchan/Documents/likeion_weather/backend/main/weather_service.py)): 17개 각 지역 기상청 데이터(기온 및 실시간 날씨 정보) 수집
  - 기상 데이터가 없거나 API 키 미등록 시 날짜 기반 결정론적 가상 날씨 폴백(Fallback) 보장
  - 실제 날씨 카드 vs 당일 평균 감정 날씨 카드를 한눈에 나란히 비교
  - 상단 검색창을 활용해 거주지 검색 필터링 가능
  - 기상과 사람들의 감정 일치 여부를 매칭 뱃지(💚 일치 / 🧐 다름)로 표시
- **히스토리 페이지 (`/history` - [HistoryPage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/HistoryPage.jsx))**:
  - 지난 일주일간 매일 기입된 4가지 감정 상태의 누적 빈도 분석
  - 직접 구현한 동적 **SVG 꺾은선(Line) 그래프** (마우스 오버 시 말풍선 툴팁 출력)
  - 원시 데이터 조회를 위한 일자별 테이블 그리드 뷰 제공
- **나의 감정 일기장 (`/journal` - [JournalPage.jsx](file:///Users/iwonchan/Documents/likeion_weather/frontend/src/pages/JournalPage.jsx))**:
  - 사용자의 로컬 기록 보관용 기분 다이어리 타임라인 및 항목별/전체 삭제 기능 지원

### 2. 데이터베이스 모델 및 API 인프라 ([models.py](file:///Users/iwonchan/Documents/likeion_weather/backend/main/models.py))
- **`EmotionEntry`**: 유저 고유 세션 ID(`session_id`), 매핑된 지역(`region`), 감정 타입, 50자 코멘트, 위경도 좌표 보관
- **`WeatherComparison`**: 일자별/지역별 실제 날씨 기온 데이터와 감정 날씨 분석 캐싱 로그 적재
- **자동 목업 적재 알고리즘 ([views.py](file:///Users/iwonchan/Documents/likeion_weather/backend/main/views.py))**:
  - 최초 실행 시 데이터가 비어 있다면 지난 7일간의 풍부한 테스트용 목업 데이터(요일 가중치가 적용된 60여 개의 이력 코멘트 및 좌표 마크들)를 데이터베이스에 자동 생성하여 페이지 로드 직후 바로 히스토리 라인 차트와 지도가 예쁘게 동작하는 것을 확인할 수 있습니다.

---

## 🚀 실행 방법

### 1. 백엔드 서버 실행
```bash
cd backend
# 가상환경 활성화 (Mac/Linux 기준)
source .venv/bin/activate

# (선택) OpenWeatherMap API 사용을 원할 시 API 키를 환경변수에 등록하세요. 
# 등록하지 않아도 자연스러운 가상 날씨 데이터 폴백으로 모든 기능이 완벽 동작합니다.
export OPENWEATHERMAP_API_KEY="your_api_key_here"

# 서버 구동
python manage.py runserver
```
*백엔드 서버는 기본적으로 `http://127.0.0.1:8000/` 에서 실행됩니다.*

### 2. 프론트엔드 실행
```bash
cd frontend
# 의존성 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```
*프론트엔드 개발 서버는 기본적으로 `http://localhost:5173/` 에서 실행됩니다.*
*전체 화면 네비게이션 드로어는 왼쪽 위의 ☰ 햄버거 메뉴 버튼을 눌러 열 수 있습니다.*
