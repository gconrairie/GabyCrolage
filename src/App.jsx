import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Insights from './pages/Insights'
import MediaKit from './pages/MediaKit'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/media-kit" element={<MediaKit />} />
        <Route path="/media-kit/*" element={<Navigate to="/media-kit" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
