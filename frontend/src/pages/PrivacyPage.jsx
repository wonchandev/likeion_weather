import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import SideMenu from '../components/SideMenu'

// 시행일: 2026년 6월 27일
// ⚠️ 배포 전 운영자가 채워야 하는 항목은 「대괄호」로 표시했습니다.
export default function PrivacyPage() {
  return (
    <div className="page-container">
      <SideMenu />
      <main className="page-content legal-page">
        <Link to="/support" className="legal-back"><ChevronLeft size={18} /> 정보 · 출처로 돌아가기</Link>

        <header className="page-header">
          <h1 className="page-title" style={{ fontWeight: 700, letterSpacing: 0 }}>개인정보처리방침</h1>
          <p className="support-header-sub">시행일: 2026년 6월 27일</p>
        </header>

        <section className="support-card legal-prose">
          <p className="legal-text">
            감정 날씨 지도(이하 “서비스”)는 「개인정보 보호법」 및 「위치정보의 보호 및 이용 등에 관한 법률」을
            준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같은 처리방침을 둡니다.
          </p>

          <h2 className="legal-h2">1. 수집하는 개인정보 항목 및 방법</h2>
          <p className="legal-text">서비스는 다음 정보를 수집합니다.</p>
          <ul className="legal-list">
            <li><b>위치정보</b>: 감정 기록 시 브라우저 위치 권한 동의를 통해 수집되는 위·경도 좌표(이동통신 단말장치의 위치정보에 해당). 권한을 거부한 경우 이용자가 직접 선택한 시·도 단위 지역만 수집됩니다.</li>
            <li><b>감정 기록</b>: 선택한 감정 유형, 한 줄 코멘트(익명), 기록 시각</li>
            <li><b>회원 정보(로그인 이용 시에 한함)</b>: 아이디(닉네임), 비밀번호(암호화 저장)</li>
            <li><b>비회원 식별값</b>: 중복 기록 방지를 위해 브라우저에 저장되는 임의의 익명 식별자(session id)</li>
            <li><b>자동 수집 정보</b>: 접속 일시, 브라우저·기기 정보, 서비스 이용 기록, 쿠키 및 로컬 스토리지</li>
          </ul>

          <h2 className="legal-h2">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="legal-list">
            <li>지도상 지역별 감정·날씨 시각화 및 통계 제공</li>
            <li>실제 기상 정보와 감정의 비교 기능 제공</li>
            <li>회원 식별 및 로그인, 본인의 기록 관리</li>
            <li>중복·부정 이용 방지 및 서비스 운영·개선</li>
          </ul>

          <h2 className="legal-h2">3. 위치정보의 처리</h2>
          <p className="legal-text">
            서비스는 감정을 지도에 표시하기 위한 목적에 한하여 위치정보를 이용하며, 개별 이용자를 식별할 수 있는
            형태로 위치정보를 제3자에게 제공하지 않습니다. 이용자는 브라우저 설정에서 위치 권한을 언제든지 철회할 수
            있으며, 위치정보는 수집 목적 달성 시 또는 기록 삭제 시 지체 없이 파기됩니다.
          </p>

          <h2 className="legal-h2">4. 보유 및 이용 기간</h2>
          <ul className="legal-list">
            <li>회원 정보: 회원 탈퇴 시까지. 탈퇴 시 지체 없이 파기합니다.</li>
            <li>감정·위치 기록: 이용자가 삭제하거나 수집 목적 달성 시까지.</li>
            <li>관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</li>
          </ul>

          <h2 className="legal-h2">5. 개인정보의 제3자 제공</h2>
          <p className="legal-text">
            서비스는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나 수사기관의 적법한
            요청이 있는 경우에 한해 제공할 수 있습니다. 날씨 정보 표시를 위해 Open-Meteo·OpenWeatherMap에
            좌표를 조회하나, 이는 이용자를 식별하는 개인정보 제공에 해당하지 않습니다.
          </p>

          <h2 className="legal-h2">6. 개인정보 처리의 위탁</h2>
          <p className="legal-text">
            서비스는 원활한 운영을 위해 호스팅·인프라 등 일부 업무를 외부에 위탁할 수 있으며, 위탁이 발생하는 경우
            수탁자와 위탁 업무 내용을 본 방침에 공개합니다. (현재 위탁 내역: 「해당 시 기재」)
          </p>

          <h2 className="legal-h2">7. 쿠키 및 로컬 스토리지</h2>
          <p className="legal-text">
            서비스는 로그인 상태 유지, 중복 기록 방지, 일기장 보관 등을 위해 브라우저의 쿠키·로컬 스토리지를
            사용합니다. 이용자는 브라우저 설정을 통해 저장을 거부할 수 있으며, 이 경우 일부 기능이 제한될 수 있습니다.
          </p>

          <h2 className="legal-h2">8. 정보주체의 권리와 행사 방법</h2>
          <p className="legal-text">
            이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다. 본인의 감정 기록은
            서비스 내 일기장에서 직접 삭제할 수 있으며, 그 밖의 요청은 아래 개인정보 보호책임자에게 연락하시면 지체
            없이 처리합니다.
          </p>

          <h2 className="legal-h2">9. 개인정보의 파기</h2>
          <p className="legal-text">
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구가
            불가능한 방법으로 영구 삭제하며, 출력물은 분쇄 또는 소각합니다.
          </p>

          <h2 className="legal-h2">10. 만 14세 미만 아동</h2>
          <p className="legal-text">
            서비스는 만 14세 미만 아동의 회원가입을 받지 않으며, 법정대리인의 동의 없이 아동의 개인정보를 수집하지
            않습니다.
          </p>

          <h2 className="legal-h2">11. 개인정보 보호책임자</h2>
          <ul className="legal-list">
            <li>책임자: 「성명/직책 기재」</li>
            <li>연락처: 「이메일 / 전화번호 기재」</li>
          </ul>
          <p className="legal-text">
            개인정보 침해에 대한 상담이 필요한 경우 개인정보분쟁조정위원회(1833-6972), 개인정보침해신고센터
            (118), 대검찰청(1301), 경찰청(182) 등에 문의할 수 있습니다.
          </p>

          <h2 className="legal-h2">12. 처리방침의 변경</h2>
          <p className="legal-text">
            본 방침의 내용 추가·삭제·수정이 있을 경우 시행 최소 7일 전부터 서비스 내 공지를 통해 고지합니다.
          </p>

          <p className="legal-meta">최종 업데이트: 2026년 6월 27일</p>
        </section>
      </main>
    </div>
  )
}
