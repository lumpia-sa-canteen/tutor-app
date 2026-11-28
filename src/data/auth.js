// Google sign-in through Firebase Authentication
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

export const authEnabled = Boolean(auth)

// calls fn(user) now and whenever the sign-in changes; user is null when signed out.
// Firebase remembers the user, so returning visitors come back already signed in.
export const onAuthChange = (fn) => onAuthStateChanged(auth, fn)

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })   // always lets them pick the account

  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    // some phones block popups: fall back to a full-page sign-in
    if (err?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider)
      return
    }
    throw err
  }
}

export const signOutUser = () => signOut(auth)

// a short message for the box ('' = show nothing, the person just closed the popup)
export function signInMessage(err) {
  switch (err?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''
    case 'auth/unauthorized-domain':
      return 'This website is not allowed to sign in yet. Add it under Authorized domains in Firebase.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not turned on in Firebase yet.'
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.'
    default:
      return 'Could not sign in. Please try again.'
  }
}