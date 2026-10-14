import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, TeamMember } from '../types/team';
import { UserProfile } from '../types/user';
import { Task } from '../types/task';

const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERS_COLLECTION = 'teamMembers';
const TASKS_COLLECTION = 'tasks';

/**
 * Generate a random 6-character uppercase alphanumeric code (e.g. "PRJ789")
 */
const generateTeamCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a new team and add creator as owner
 */
export const createTeam = async (
  name: string,
  description: string,
  user: UserProfile
): Promise<Team> => {
  const cleanName = name.trim();
  const cleanDesc = description.trim();
  const code = generateTeamCode();

  // 1. Create Team Document
  const teamRef = await addDoc(collection(db, TEAMS_COLLECTION), {
    name: cleanName,
    description: cleanDesc,
    ownerId: user.id,
    ownerName: user.name,
    code,
    createdAt: serverTimestamp(),
  });

  // 2. Add creator into teamMembers collection as owner
  await addDoc(collection(db, TEAM_MEMBERS_COLLECTION), {
    teamId: teamRef.id,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });

  return {
    id: teamRef.id,
    name: cleanName,
    description: cleanDesc,
    ownerId: user.id,
    ownerName: user.name,
    code,
  };
};

/**
 * Join an existing team using its 6-character code
 */
export const joinTeamByCode = async (
  code: string,
  user: UserProfile
): Promise<Team> => {
  const cleanCode = code.trim().toUpperCase();

  // 1. Find team by code
  const qTeam = query(
    collection(db, TEAMS_COLLECTION),
    where('code', '==', cleanCode)
  );
  const snapTeam = await getDocs(qTeam);

  if (snapTeam.empty) {
    throw new Error('No team found matching code "' + cleanCode + '". Please check the code.');
  }

  const teamDoc = snapTeam.docs[0];
  const teamData = teamDoc.data();
  const teamId = teamDoc.id;

  // 2. Check if user already joined
  const qMember = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('teamId', '==', teamId),
    where('userId', '==', user.id)
  );
  const snapMember = await getDocs(qMember);

  if (!snapMember.empty) {
    throw new Error('You are already a member of "' + teamData.name + '".');
  }

  // 3. Add user as member
  await addDoc(collection(db, TEAM_MEMBERS_COLLECTION), {
    teamId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: 'member',
    joinedAt: serverTimestamp(),
  });

  return {
    id: teamId,
    name: teamData.name,
    description: teamData.description || '',
    ownerId: teamData.ownerId,
    ownerName: teamData.ownerName,
    code: teamData.code,
  };
};

/**
 * Real-time listener for teams that the current user belongs to
 */
export const subscribeUserTeams = (
  userId: string,
  onUpdate: (teams: Team[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, async (snapshot) => {
    const teamIds = snapshot.docs.map((docSnap) => docSnap.data().teamId as string);

    if (teamIds.length === 0) {
      onUpdate([]);
      return;
    }

    try {
      const teamsList: Team[] = [];
      for (const tId of teamIds) {
        const tDoc = await getDoc(doc(db, TEAMS_COLLECTION, tId));
        if (tDoc.exists()) {
          const data = tDoc.data();
          teamsList.push({
            id: tDoc.id,
            name: data.name || '',
            description: data.description || '',
            ownerId: data.ownerId || '',
            ownerName: data.ownerName || '',
            code: data.code || '',
            createdAt: data.createdAt,
          });
        }
      }
      onUpdate(teamsList);
    } catch (err) {
      console.error('Error fetching user teams details:', err);
    }
  });
};

/**
 * Real-time listener for team members of a specific team
 */
export const subscribeTeamMembers = (
  teamId: string,
  onUpdate: (members: TeamMember[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('teamId', '==', teamId)
  );

  return onSnapshot(q, (snapshot) => {
    const members: TeamMember[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        teamId: data.teamId,
        userId: data.userId,
        userName: data.userName || 'Member',
        userEmail: data.userEmail || '',
        role: data.role || 'member',
        joinedAt: data.joinedAt,
      };
    });
    onUpdate(members);
  });
};

/**
 * Real-time listener for tasks assigned to a specific team
 */
export const subscribeTeamTasks = (
  teamId: string,
  onUpdate: (tasks: Task[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('teamId', '==', teamId)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'To Do',
        priority: data.priority || 'Medium',
        dueDate: data.dueDate || '',
        teamId: data.teamId,
        teamName: data.teamName,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        createdAt: data.createdAt,
      } as Task;
    });
    onUpdate(tasks);
  });
};

/**
 * Get single team details by ID
 */
export const getTeamById = async (teamId: string): Promise<Team | null> => {
  const docSnap = await getDoc(doc(db, TEAMS_COLLECTION, teamId));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      description: data.description || '',
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      code: data.code,
      createdAt: data.createdAt,
    };
  }
  return null;
};
