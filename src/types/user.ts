export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: any;
}
