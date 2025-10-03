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
    imageUrl: string;
    description: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectsState {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    uploadingImage: boolean;
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
export type TaskProgressType = 'Hoàn thành' | 'Đúng tiến độ' | 'Có rủi ro' | 'Trễ hẹn';
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export interface Task {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    assigneeId: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    progress: TaskProgressType;
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
    FRONTEND_DEVELOPER: 'Frontend developer',
    BACKEND_DEVELOPER: 'Backend developer',
    MOBILE_DEVELOPER: 'Mobile developer',
    FULLSTACK_DEVELOPER: 'Fullstack developer',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
    DESIGNER: 'Designer',
} as const;
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole];

export const getAvatarBackgroundColor = (role: MemberRoleType): string => {
    switch (role) {
        case MemberRole.PROJECT_OWNER:
            return '#52c41a';
        case MemberRole.FRONTEND_DEVELOPER:
        case MemberRole.BACKEND_DEVELOPER:
        case MemberRole.FULLSTACK_DEVELOPER:
        case MemberRole.MOBILE_DEVELOPER:
        case MemberRole.DEVELOPER:
            return '#1890ff';
        case MemberRole.DESIGNER:
            return '#722ed1';
        case MemberRole.TESTER:
            return '#fa8c16';
        default:
            return '#1890ff';
    }
};
export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: MemberRoleType;
    joinedAt: string;
    permissions: string[];
}

export interface MemberWithUserInfo extends ProjectMember {
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    phone?: string;
}

export interface MembersState {
    members: MemberWithUserInfo[];
    loading: boolean;
    error: string | null;
}