import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MapPage from './pages/MapPage'
import ComparePage from './pages/ComparePage'
import HistoryPage from './pages/HistoryPage'
import JournalPage from './pages/JournalPage'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/"         element={<Navigate to="/map" replace />} />
        <Route path="/map"      element={<MapPage />} />
        <Route path="/map/:region" element={<MapPage />} />
        <Route path="/compare"  element={<ComparePage />} />
        <Route path="/history"  element={<HistoryPage />} />
        <Route path="/journal"  element={<JournalPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
