import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage } from '../types/message';

/**
 * Send a new real-time message inside a team's subcollection: teams/{teamId}/messages
 */
export const sendChatMessage = async (
  teamId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<string> => {
  const cleanText = text.trim();
  if (!cleanText) return '';

  const messagesRef = collection(db, 'teams', teamId, 'messages');
  const docRef = await addDoc(messagesRef, {
    senderId,
    senderName,
    text: cleanText,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Real-time listener for messages of a specific team, ordered chronologically
 */
export const subscribeTeamChat = (
  teamId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const messagesRef = collection(db, 'teams', teamId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          senderId: data.senderId || '',
          senderName: data.senderName || 'Anonymous',
          text: data.text || '',
          createdAt: data.createdAt,
        };
      });
      onUpdate(messages);
    },
    (error) => {
      console.warn('Realtime chat fallback without orderBy:', error.message);
      return onSnapshot(
        messagesRef,
        (snapshot) => {
          const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              senderId: data.senderId || '',
              senderName: data.senderName || 'Anonymous',
              text: data.text || '',
              createdAt: data.createdAt,
            };
          });
          onUpdate(messages);
        },
        onError
      );
    }
  );
};
