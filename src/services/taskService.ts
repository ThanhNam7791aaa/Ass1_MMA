import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  or,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types/task';

const TASKS_COLLECTION = 'tasks';

/**
 * Real-time listener for tasks belonging to a specific user (created by or assigned to),
 * ordered by createdAt descending.
 */
export const subscribeToTasks = (
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const collectionRef = collection(db, TASKS_COLLECTION);
  const q = query(
    collectionRef,
    or(
      where('userId', '==', userId),
      where('assigneeId', '==', userId)
    )
  );

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
          teamName: data.teamName || '',
          assigneeId: data.assigneeId ?? null,
          assigneeName: data.assigneeName || '',
          userId: data.userId || null,
        } as Task;
      });

      // Sort client-side by createdAt descending for reliable ordering without composite index requirement
      tasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      onUpdate(tasks);
    },
    (error) => {
      console.warn('Realtime listener fallback with client-side filter:', error.message);
      return onSnapshot(
        collectionRef,
        (snapshot) => {
          const tasks: Task[] = snapshot.docs
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
                teamId: data.teamId ?? null,
                teamName: data.teamName || '',
                assigneeId: data.assigneeId ?? null,
                assigneeName: data.assigneeName || '',
                userId: data.userId || null,
              } as Task;
            })
            .filter((t) => t.userId === userId || t.assigneeId === userId);

          tasks.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
          });

          onUpdate(tasks);
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
    teamId: task.teamId ?? null,
    teamName: task.teamName || null,
    assigneeId: task.assigneeId ?? null,
    assigneeName: task.assigneeName || null,
    userId: task.userId ?? null,
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
  if (updates.userId !== undefined) dataToUpdate.userId = updates.userId;

  await updateDoc(taskRef, dataToUpdate);
};

/**
 * Delete a task document from Firestore
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
};
