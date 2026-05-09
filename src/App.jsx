import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import MediaKit from './pages/MediaKit'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/media-kit" element={<MediaKit />} />
        <Route path="/media-kit/*" element={<Navigate to="/media-kit" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
