import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import PrivateMediaKit from './pages/PrivateMediaKit'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mk/:token" element={<PrivateMediaKit />} />
        <Route path="/media-kit" element={<Navigate to="/" replace />} />
        <Route path="/media-kit/*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
