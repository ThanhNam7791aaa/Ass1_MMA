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
 * Real-time listener for tasks associated with the current user
 * (created by user OR assigned to user), ordered by createdAt descending.
 */
export const subscribeToTasks = (
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const collectionRef = collection(db, TASKS_COLLECTION);
  const q = query(collectionRef, orderBy('createdAt', 'desc'));

  const mapAndFilterTasks = (docs: any[]): Task[] => {
    return docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'To Do',
          priority: data.priority || 'Medium',
          dueDate: data.dueDate || '',
          createdAt: data.createdAt,
          userId: data.userId || null,
          teamId: data.teamId ?? null,
          teamName: data.teamName || '',
          assigneeId: data.assigneeId ?? null,
          assigneeName: data.assigneeName || '',
        } as Task;
      })
      .filter((t) => {
        if (!userId) return false;
        // Show task if current user created it OR is assigned to it
        if (t.userId === userId) return true;
        if (t.assigneeId === userId) return true;
        return false;
      });
  };

  return onSnapshot(
    q,
    (snapshot) => {
      const userTasks = mapAndFilterTasks(snapshot.docs);
      onUpdate(userTasks);
    },
    (error) => {
      console.warn('Realtime listener fallback without order:', error.message);
      return onSnapshot(
        collectionRef,
        (snapshot) => {
          const userTasks = mapAndFilterTasks(snapshot.docs);
          onUpdate(userTasks);
        },
        onError
      );
    }
  );
};

/**
 * Create a new task document in Firestore with Team and Assignee associations
 */
export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    title: task.title.trim(),
    description: task.description?.trim() || '',
    status: task.status || 'To Do',
    priority: task.priority || 'Medium',
    dueDate: task.dueDate || '',
    userId: task.userId || null,
    teamId: task.teamId ?? null,
    teamName: task.teamName || null,
    assigneeId: task.assigneeId ?? null,
    assigneeName: task.assigneeName || null,
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
  if (updates.teamName !== undefined) dataToUpdate.teamName = updates.teamName;
  if (updates.assigneeId !== undefined) dataToUpdate.assigneeId = updates.assigneeId;
  if (updates.assigneeName !== undefined) dataToUpdate.assigneeName = updates.assigneeName;

  await updateDoc(taskRef, dataToUpdate);
};

/**
 * Delete a task document from Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
};
