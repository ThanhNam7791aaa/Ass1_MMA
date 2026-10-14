export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  code: string; // 6-character join code
  createdAt?: any;
}

export interface TeamMember {
  id?: string;
  teamId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'owner' | 'member';
  joinedAt?: any;
}
