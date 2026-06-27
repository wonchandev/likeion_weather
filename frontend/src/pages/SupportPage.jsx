import { Link } from "react-router-dom";
import SideMenu from "../components/SideMenu";

const DATA_SOURCES = [
  {
    name: "Open-Meteo",
    desc: "시간대별 날씨 예보 데이터",
    url: "https://open-meteo.com/",
    license: "CC BY 4.0 · 무료",
  },
  {
    name: "OpenWeatherMap",
    desc: "현재 날씨 및 날씨 아이콘",
    url: "https://openweathermap.org/",
    license: "Free Plan · 출처 표기",
  },
  {
    name: "SouthKorea Maps",
    desc: "대한민국 시·도 경계 지도 (GeoJSON)",
    url: "https://github.com/southkorea/southkorea-maps",
    license: "통계청 공공데이터 기반",
  },
  {
    name: "Lucide Icons",
    desc: "날씨 · 감정 아이콘",
    url: "https://lucide.dev/",
    license: "ISC License",
  },
];

const TECH_STACK = ["React", "Vite", "Django", "d3-geo", "React Router"];

const DEVELOPERS = [
  { name: "홍길동", email: "example1@email.com", emoji: "🦁" },
  { name: "김철수", email: "example2@email.com", emoji: "🦁" },
];

export default function SupportPage() {
  return (
    <div className="page-container">
      <SideMenu />
      <main className="page-content support-page">
        <header className="page-header">
          <div>
            <h1
              className="page-title"
              style={{ fontWeight: 700, letterSpacing: 0 }}
            >
              정보 · 출처
            </h1>
            <p className="support-header-sub">
              이 서비스가 사용하는 데이터와 오픈소스 정보입니다.
            </p>
          </div>
        </header>

        {/* 서비스 소개 */}
        <section className="support-card">
          <h2 className="support-card-title">🌤️ 감정 날씨 지도</h2>
          <p className="support-card-text">
            전국 사람들의 감정을 날씨로 표현하고, 실제 기상과 비교해보는
            서비스입니다. 매일의 감정을 기록하고 전국의 감정 흐름을 한눈에
            살펴보세요.
          </p>
        </section>

        {/* 데이터 출처 */}
        <section className="support-card">
          <h2 className="support-card-title">데이터 · 라이선스 출처</h2>
          <div className="support-source-list">
            {DATA_SOURCES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="support-source-item"
              >
                <div className="support-source-info">
                  <span className="support-source-name">{s.name}</span>
                  <span className="support-source-desc">{s.desc}</span>
                </div>
                <span className="support-source-license">{s.license}</span>
              </a>
            ))}
          </div>
        </section>

        {/* 개발자 정보 */}
        <section className="support-card">
          <h2 className="support-card-title">만든 사람들</h2>
          <div className="support-dev-list">
            {DEVELOPERS.map((d) => (
              <a
                key={d.name}
                href={`mailto:${d.email}`}
                className="support-dev-item"
              >
                <span className="support-dev-emoji">{d.emoji}</span>
                <div className="support-dev-info">
                  <span className="support-dev-name">{d.name}</span>
                  <span className="support-dev-role">{d.email}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 기술 스택 */}
        <section className="support-card">
          <h2 className="support-card-title">사용 기술</h2>
          <div className="support-tech-tags">
            {TECH_STACK.map((t) => (
              <span key={t} className="support-tech-tag">
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* 푸터 */}
        <footer className="support-footer">
          <div className="support-footer-links">
            <Link to="/terms" className="support-footer-link">
              이용약관
            </Link>
            <span className="support-divider">|</span>
            <Link to="/privacy" className="support-footer-link support-strong">
              개인정보처리방침
            </Link>
          </div>
          <p className="support-copyright">© 2026 감정 날씨 지도</p>
        </footer>
      </main>
    </div>
  );
}
