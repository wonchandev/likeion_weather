import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EntryPage from './pages/EntryPage'
import MapPage from './pages/MapPage'
import ComparePage from './pages/ComparePage'
import HistoryPage from './pages/HistoryPage'
import JournalPage from './pages/JournalPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<EntryPage />} />
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
