import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import SideMenu from '../components/SideMenu'

// 시행일: 2026년 6월 27일
// ⚠️ 배포 전 운영자가 채워야 하는 항목은 「대괄호」로 표시했습니다.
export default function TermsPage() {
  return (
    <div className="page-container">
      <SideMenu />
      <main className="page-content legal-page">
        <Link to="/support" className="legal-back"><ChevronLeft size={18} /> 정보 · 출처로 돌아가기</Link>

        <header className="page-header">
          <h1 className="page-title" style={{ fontWeight: 700, letterSpacing: 0 }}>이용약관</h1>
          <p className="support-header-sub">시행일: 2026년 6월 27일</p>
        </header>

        <section className="support-card legal-prose">
          <h2 className="legal-h2">제1조 (목적)</h2>
          <p className="legal-text">
            본 약관은 감정 날씨 지도(이하 “서비스”)가 제공하는 서비스의 이용 조건 및 절차, 이용자와 서비스의 권리·
            의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="legal-h2">제2조 (정의)</h2>
          <ul className="legal-list">
            <li>“이용자”란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>“회원”이란 이메일로 가입하여 로그인 기능을 이용하는 자를 말합니다.</li>
            <li>“기록”이란 이용자가 등록한 감정, 한 줄 코멘트, 위치 정보 등을 말합니다.</li>
          </ul>

          <h2 className="legal-h2">제3조 (약관의 효력 및 변경)</h2>
          <p className="legal-text">
            본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 서비스는 관련 법령을 위반하지 않는 범위에서
            약관을 변경할 수 있으며, 변경 시 시행일과 변경 사유를 명시하여 시행 7일 전부터 공지합니다.
          </p>

          <h2 className="legal-h2">제4조 (서비스의 내용)</h2>
          <ul className="legal-list">
            <li>지역별 감정의 지도 시각화 및 통계 제공</li>
            <li>실제 기상 정보와 감정의 비교 제공</li>
            <li>개인 감정 일기장 및 인사이트 제공</li>
            <li>그 밖에 서비스가 정하는 기능</li>
          </ul>
          <p className="legal-text">
            서비스의 일부 기능은 로그인 없이 익명으로 이용할 수 있습니다.
          </p>

          <h2 className="legal-h2">제5조 (이용자의 의무 및 금지행위)</h2>
          <p className="legal-text">이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="legal-list">
            <li>타인을 비방·모욕하거나 명예를 훼손하는 코멘트 등록</li>
            <li>음란·폭력적이거나 법령·공서양속에 반하는 콘텐츠 등록</li>
            <li>타인의 개인정보를 무단으로 게시하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하거나 자동화 수단으로 부정 이용하는 행위</li>
            <li>타인의 계정을 도용하거나 허위 정보를 등록하는 행위</li>
          </ul>

          <h2 className="legal-h2">제6조 (게시물의 관리)</h2>
          <p className="legal-text">
            서비스는 이용자가 등록한 코멘트 등 게시물이 제5조를 위반하거나 신고된 경우, 사전 통지 없이 삭제하거나
            노출을 제한할 수 있습니다. 이용자는 본인의 기록을 일기장에서 직접 삭제할 수 있습니다.
          </p>

          <h2 className="legal-h2">제7조 (서비스 제공의 중단)</h2>
          <p className="legal-text">
            서비스는 시스템 점검, 설비 보수, 외부 데이터 제공처의 사정 등 부득이한 경우 서비스의 전부 또는 일부를
            일시 중단할 수 있으며, 이 경우 가능한 범위에서 사전에 공지합니다.
          </p>

          <h2 className="legal-h2">제8조 (책임의 제한)</h2>
          <ul className="legal-list">
            <li>서비스가 제공하는 날씨 정보는 외부 제공처의 데이터에 기반하며, 그 정확성·완전성을 보증하지 않습니다.</li>
            <li>서비스는 무료로 제공되며, 천재지변·이용자의 귀책 등 서비스의 합리적 통제를 벗어난 사유로 인한 손해에 대해 책임을 지지 않습니다.</li>
            <li>이용자가 등록한 기록에 대한 책임은 해당 이용자에게 있습니다.</li>
          </ul>

          <h2 className="legal-h2">제9조 (준거법 및 분쟁 해결)</h2>
          <p className="legal-text">
            본 약관은 대한민국 법령에 따라 해석되며, 서비스와 이용자 간 분쟁에 관한 소송의 관할은 「관할 법원 기재
            (예: 민사소송법상 관할 법원)」으로 합니다.
          </p>

          <h2 className="legal-h2">문의</h2>
          <p className="legal-text">
            약관에 관한 문의는 「운영자 이메일 기재」로 연락 바랍니다.
          </p>

          <p className="legal-meta">최종 업데이트: 2026년 6월 27일</p>
        </section>
      </main>
    </div>
  )
}
