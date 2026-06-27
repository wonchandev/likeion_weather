import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MapPage from './pages/MapPage'
import ComparePage from './pages/ComparePage'
import HistoryPage from './pages/HistoryPage'
import JournalPage from './pages/JournalPage'
import SupportPage from './pages/SupportPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<Navigate to="/map" replace />} />
          <Route path="/map"      element={<MapPage />} />
          <Route path="/map/:region" element={<MapPage />} />
          <Route path="/compare"  element={<ComparePage />} />
          <Route path="/history"  element={<HistoryPage />} />
          <Route path="/journal"  element={<JournalPage />} />
          <Route path="/support"  element={<SupportPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/signup"   element={<SignupPage />} />
          <Route path="/terms"    element={<TermsPage />} />
          <Route path="/privacy"  element={<PrivacyPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
