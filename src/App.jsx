import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MediaKit from './pages/MediaKit'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/media-kit" element={<MediaKit />} />
      </Routes>
    </BrowserRouter>
  )
}
