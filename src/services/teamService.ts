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
  updateDoc,
  deleteDoc,
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

  let teamUnsubscribes: Unsubscribe[] = [];
  const teamsMap = new Map<string, Team>();

  const mainUnsubscribe = onSnapshot(q, (snapshot) => {
    // Unsubscribe from previous team listeners
    teamUnsubscribes.forEach((unsub) => unsub());
    teamUnsubscribes = [];

    const teamIds = snapshot.docs.map((docSnap) => docSnap.data().teamId as string);

    if (teamIds.length === 0) {
      teamsMap.clear();
      onUpdate([]);
      return;
    }

    // Clean up cached teams that user is no longer a member of
    const currentTeamIds = new Set(teamIds);
    for (const id of Array.from(teamsMap.keys())) {
      if (!currentTeamIds.has(id)) {
        teamsMap.delete(id);
      }
    }

    const emitUpdatedTeams = () => {
      const list = teamIds
        .map((id) => teamsMap.get(id))
        .filter((t): t is Team => t !== undefined);
      onUpdate(list);
    };

    // Attach real-time listener to each team doc
    teamIds.forEach((tId) => {
      const unsub = onSnapshot(
        doc(db, TEAMS_COLLECTION, tId),
        (tDoc) => {
          if (tDoc.exists()) {
            const data = tDoc.data();
            teamsMap.set(tId, {
              id: tDoc.id,
              name: data.name || '',
              description: data.description || '',
              ownerId: data.ownerId || '',
              ownerName: data.ownerName || '',
              code: data.code || '',
              createdAt: data.createdAt,
            });
          } else {
            teamsMap.delete(tId);
          }
          emitUpdatedTeams();
        },
        (err) => {
          console.error(`Error listening to team ${tId}:`, err);
        }
      );
      teamUnsubscribes.push(unsub);
    });
  });

  return () => {
    mainUnsubscribe();
    teamUnsubscribes.forEach((unsub) => unsub());
  };
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

/**
 * Real-time listener for a single team's details
 */
export const subscribeTeamDetails = (
  teamId: string,
  onUpdate: (team: Team | null) => void
): Unsubscribe => {
  return onSnapshot(
    doc(db, TEAMS_COLLECTION, teamId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          id: docSnap.id,
          name: data.name,
          description: data.description || '',
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          code: data.code,
          createdAt: data.createdAt,
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Error subscribing to team details:', err);
    }
  );
};

/**
 * Update an existing team's name and description
 */
export const updateTeam = async (
  teamId: string,
  data: { name: string; description: string }
): Promise<void> => {
  const cleanName = data.name.trim();
  const cleanDesc = data.description.trim();

  if (!cleanName) {
    throw new Error('Team name cannot be empty.');
  }

  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    name: cleanName,
    description: cleanDesc,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Leave a team (for regular members)
 */
export const leaveTeam = async (teamId: string, userId: string): Promise<void> => {
  // 1. Verify team and check if user is owner
  const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, teamId));
  if (teamDoc.exists()) {
    const teamData = teamDoc.data();
    if (teamData.ownerId === userId) {
      throw new Error('Team owners cannot leave the team. You can disband the team instead.');
    }
  }

  // 2. Find membership doc in teamMembers
  const qMembers = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('teamId', '==', teamId),
    where('userId', '==', userId)
  );
  const snapMembers = await getDocs(qMembers);

  if (snapMembers.empty) {
    throw new Error('You are not a member of this team.');
  }

  // 3. Delete the member document
  const deletePromises = snapMembers.docs.map((d) =>
    deleteDoc(doc(db, TEAM_MEMBERS_COLLECTION, d.id))
  );
  await Promise.all(deletePromises);

  // 4. Unassign tasks assigned to this user in this team
  try {
    const qTasks = query(
      collection(db, TASKS_COLLECTION),
      where('teamId', '==', teamId),
      where('assigneeId', '==', userId)
    );
    const snapTasks = await getDocs(qTasks);
    const unassignPromises = snapTasks.docs.map((d) =>
      updateDoc(doc(db, TASKS_COLLECTION, d.id), {
        assigneeId: null,
        assigneeName: '',
      })
    );
    await Promise.all(unassignPromises);
  } catch (err) {
    console.warn('Could not unassign tasks upon leaving team:', err);
  }
};

/**
 * Remove a member from the team (for team owner)
 */
export const removeTeamMember = async (
  teamId: string,
  targetUserId: string,
  currentUserId: string
): Promise<void> => {
  // 1. Check if current user is owner
  const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, teamId));
  if (!teamDoc.exists()) {
    throw new Error('Team does not exist.');
  }

  const teamData = teamDoc.data();
  if (teamData.ownerId !== currentUserId) {
    throw new Error('Only the team owner can remove members.');
  }

  if (targetUserId === teamData.ownerId) {
    throw new Error('You cannot remove the team owner.');
  }

  // 2. Find target member in teamMembers
  const qMembers = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('teamId', '==', teamId),
    where('userId', '==', targetUserId)
  );
  const snapMembers = await getDocs(qMembers);

  if (snapMembers.empty) {
    throw new Error('This user is not a member of the team.');
  }

  // 3. Delete member doc
  const deletePromises = snapMembers.docs.map((d) =>
    deleteDoc(doc(db, TEAM_MEMBERS_COLLECTION, d.id))
  );
  await Promise.all(deletePromises);

  // 4. Unassign tasks assigned to this member in this team
  try {
    const qTasks = query(
      collection(db, TASKS_COLLECTION),
      where('teamId', '==', teamId),
      where('assigneeId', '==', targetUserId)
    );
    const snapTasks = await getDocs(qTasks);
    const unassignPromises = snapTasks.docs.map((d) =>
      updateDoc(doc(db, TASKS_COLLECTION, d.id), {
        assigneeId: null,
        assigneeName: '',
      })
    );
    await Promise.all(unassignPromises);
  } catch (err) {
    console.warn('Could not unassign tasks upon member removal:', err);
  }
};

/**
 * Delete a team (for team owner)
 */
export const deleteTeam = async (teamId: string, userId: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    throw new Error('Team does not exist.');
  }

  const teamData = teamSnap.data();
  if (teamData.ownerId !== userId) {
    throw new Error('Only the team owner can delete the team.');
  }

  // 1. Delete all teamMembers records
  const qMembers = query(
    collection(db, TEAM_MEMBERS_COLLECTION),
    where('teamId', '==', teamId)
  );
  const snapMembers = await getDocs(qMembers);
  const deleteMembers = snapMembers.docs.map((d) =>
    deleteDoc(doc(db, TEAM_MEMBERS_COLLECTION, d.id))
  );
  await Promise.all(deleteMembers);

  // 2. Delete team doc
  await deleteDoc(teamRef);
};

