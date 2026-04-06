import { Navigate, useParams } from 'react-router-dom'
import MediaKit from './MediaKit'

/** Jeton défini dans VITE_MEDIA_KIT_SECRET — même valeur que le segment d’URL /mk/<jeton> (inliné au build Vite). */
const mediaKitSecret = String(import.meta.env.VITE_MEDIA_KIT_SECRET ?? '').trim()

export default function PrivateMediaKit() {
  const { token } = useParams()
  const tokenNorm = String(token ?? '').trim()

  if (!mediaKitSecret || tokenNorm !== mediaKitSecret) {
    return <Navigate to="/" replace />
  }

  return <MediaKit />
}
