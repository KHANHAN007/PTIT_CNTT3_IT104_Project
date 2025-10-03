export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface UpdateProfileRequest {
    name?: string;
    bio?: string;
    phone?: string;
    address?: string;
    avatar?: string;
}


export interface Project {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectsState {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    error: string | null;
}


export const TaskStatus = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    PENDING: 'Pending',
    DONE: 'Done'
} as const;

export const TaskPriority = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
} as const;
export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export interface Task {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    assigneeId: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    startDate: string;
    deadline: string;
    createdAt: string;
    updatedAt: string;
}
export interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
}


export const MemberRole = {
    PROJECT_OWNER: 'Project owner',
    FRONTEND_DEVELOPER: 'Frontend Developer',
    BACKEND_DEVELOPER: 'Backend Developer',
    FULLSTACK_DEVELOPER: 'Fullstack developer',
    TESTER: 'Tester',
    DESIGNER: 'Designer',
} as const;
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole];
export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: MemberRoleType;
    email: string;
}
export interface MembersState {
    members: ProjectMember[];
    loading: boolean;
    error: string | null;
}