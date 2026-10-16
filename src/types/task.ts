export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt?: any;
  teamId?: string | null;
  teamName?: string;
  assigneeId?: string | null;
  assigneeName?: string;
  userId?: string | null;
}
