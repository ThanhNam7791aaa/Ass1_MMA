import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types/task';

const TASKS_COLLECTION = 'tasks';

/**
 * Real-time listener for tasks list, ordered by createdAt descending.
 * Falls back gracefully if ordering index is missing.
 */
export const subscribeToTasks = (
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const collectionRef = collection(db, TASKS_COLLECTION);
  
  // Try ordered query first
  const q = query(collectionRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'To Do',
          priority: data.priority || 'Medium',
          dueDate: data.dueDate || '',
          createdAt: data.createdAt,
          teamId: data.teamId ?? null,
          assigneeId: data.assigneeId ?? null,
        } as Task;
      });
      onUpdate(tasks);
    },
    (error) => {
      console.warn('Realtime listener fallback without order:', error.message);
      // Fallback query without orderBy if index/field issue occurs
      return onSnapshot(collectionRef, (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'To Do',
            priority: data.priority || 'Medium',
            dueDate: data.dueDate || '',
            createdAt: data.createdAt,
            teamId: data.teamId ?? null,
            assigneeId: data.assigneeId ?? null,
          } as Task;
        });
        onUpdate(tasks);
      }, onError);
    }
  );
};

/**
 * Create a new task document in Firestore
 */
export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    title: task.title.trim(),
    description: task.description?.trim() || '',
    status: task.status || 'To Do',
    priority: task.priority || 'Medium',
    dueDate: task.dueDate || '',
    teamId: task.teamId ?? null,
    assigneeId: task.assigneeId ?? null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Update an existing task document in Firestore
 */
export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  const dataToUpdate: Record<string, any> = {};

  if (updates.title !== undefined) dataToUpdate.title = updates.title.trim();
  if (updates.description !== undefined) dataToUpdate.description = updates.description.trim();
  if (updates.status !== undefined) dataToUpdate.status = updates.status;
  if (updates.priority !== undefined) dataToUpdate.priority = updates.priority;
  if (updates.dueDate !== undefined) dataToUpdate.dueDate = updates.dueDate;
  if (updates.teamId !== undefined) dataToUpdate.teamId = updates.teamId;
  if (updates.assigneeId !== undefined) dataToUpdate.assigneeId = updates.assigneeId;

  await updateDoc(taskRef, dataToUpdate);
};

/**
 * Delete a task document from Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
};
