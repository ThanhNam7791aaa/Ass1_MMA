import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types/user';

const USERS_COLLECTION = 'users';

/**
 * Sign up a new user with Email, Password, and Display Name.
 * Automatically provisions matching document in Firestore 'users' collection.
 */
export const signUpUser = async (
  name: string,
  email: string,
  pass: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    pass
  );
  const user = userCredential.user;

  // Set displayName in Firebase Auth
  try {
    await updateProfile(user, { displayName: cleanName });
  } catch (err) {
    console.warn('Could not update profile displayName:', err);
  }

  // Provision Firestore user document
  const userProfile: UserProfile = {
    id: user.uid,
    name: cleanName,
    email: cleanEmail,
    avatarUrl: '',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), userProfile);
  } catch (firestoreErr) {
    console.warn('Could not write user profile to Firestore (check Firestore Rules):', firestoreErr);
  }

  return userProfile;
};


/**
 * Sign in an existing user with Email and Password
 */
export const loginUser = async (email: string, pass: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  return credential.user;
};

/**
 * Sign out the currently logged-in user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Fetch a user's profile document from Firestore by UID
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Change the user's password with re-authentication
 */
export const changeUserPassword = async (
  currentPass: string,
  newPass: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user is currently authenticated.');
  }

  // 1. Re-authenticate with current credentials
  const credential = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, credential);

  // 2. Update to new password
  await updatePassword(user, newPass);
};
