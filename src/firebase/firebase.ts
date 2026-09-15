import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCTIEajht49mKgIsJDdxXoDUeopCXxnx44',
  authDomain: 'ionic-daily-task-c1562.firebaseapp.com',
  databaseURL: 'https://ionic-daily-task-c1562-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ionic-daily-task-c1562',
  storageBucket: 'ionic-daily-task-c1562.firebasestorage.app',
  messagingSenderId: '604325219359',
  appId: '1:604325219359:web:54067486600006131dd92a'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getDatabase(app)

export async function authenticateAnonymously() {
  if (auth.currentUser) {
    return auth.currentUser
  }

  const credential = await signInAnonymously(auth)
  return credential.user
}