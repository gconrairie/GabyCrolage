import { Navigate, useParams } from 'react-router-dom'
import MediaKit from './MediaKit'

/** Jeton défini dans VITE_MEDIA_KIT_SECRET — même valeur que le segment d’URL /mk/<jeton> */
const mediaKitSecret = import.meta.env.VITE_MEDIA_KIT_SECRET

export default function PrivateMediaKit() {
  const { token } = useParams()

  if (!mediaKitSecret || token !== mediaKitSecret) {
    return <Navigate to="/" replace />
  }

  return <MediaKit />
}
