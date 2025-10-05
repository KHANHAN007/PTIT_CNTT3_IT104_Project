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
    imageUrl: string;
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

export interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
}

export interface MembersState {
    members: ProjectMember[];
    loading: boolean;
    error: string | null;
}
export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: MemberRoleType;
    email: string;
    joinedAt?: string;
    invitedBy?: string;
}
export interface ProjectMemberWithUser extends ProjectMember {
    user?: User;
    permissions?: ProjectPermissions;
}
export const hasPermission = (
    role: MemberRoleType,
    permission: keyof ProjectPermissions
): boolean => {
    return RolePermissions[role][permission];
};

export const canUserPerformAction = (
    userRole: MemberRoleType,
    action: keyof ProjectPermissions,
    targetUserId?: string,
    currentUserId?: string
): boolean => {
    const basePermission = hasPermission(userRole, action);
    if (action === 'canEditAnyTask' && targetUserId === currentUserId) {
        return true;
    }

    return basePermission;
};

export const getRoleDisplayName = (role: MemberRoleType): string => {
    const roleNames: Record<MemberRoleType, string> = {
        [MemberRole.PROJECT_OWNER]: 'Chủ dự án',
        [MemberRole.PROJECT_MANAGER]: 'Quản lý dự án',
        [MemberRole.FRONTEND_DEVELOPER]: 'Frontend Developer',
        [MemberRole.BACKEND_DEVELOPER]: 'Backend Developer',
        [MemberRole.FULLSTACK_DEVELOPER]: 'Fullstack Developer',
        [MemberRole.DESIGNER]: 'Designer',
        [MemberRole.TESTER]: 'Tester',
    };

    return roleNames[role] || role;
};

export const getRoleColor = (role: MemberRoleType): string => {
    const roleColors: Record<MemberRoleType, string> = {
        [MemberRole.PROJECT_OWNER]: 'red',
        [MemberRole.PROJECT_MANAGER]: 'purple',
        [MemberRole.FRONTEND_DEVELOPER]: 'geekblue',
        [MemberRole.BACKEND_DEVELOPER]: 'green',
        [MemberRole.FULLSTACK_DEVELOPER]: 'gold',
        [MemberRole.DESIGNER]: 'cyan',
        [MemberRole.TESTER]: 'lime',
    };

    return roleColors[role] || '#666';
};

export const MemberRole = {
    PROJECT_OWNER: 'Project owner',
    PROJECT_MANAGER: 'Project manager',
    FRONTEND_DEVELOPER: 'Frontend developer',
    BACKEND_DEVELOPER: 'Backend developer',
    FULLSTACK_DEVELOPER: 'Fullstack developer',
    DESIGNER: 'Designer',
    TESTER: 'Tester'
} as const;

export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole];
export interface ProjectPermissions {
    canDeleteProject: boolean;
    canEditProject: boolean;
    canManageMembers: boolean;
    canCreateTask: boolean;
    canEditAnyTask: boolean;
    canDeleteAnyTask: boolean;
    canAssignTasks: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canChangeRoles: boolean;
    canViewAllTasks: boolean;
    canViewProjectSettings: boolean;
}

export const RolePermissions: Record<MemberRoleType, ProjectPermissions> = {
    [MemberRole.PROJECT_OWNER]: {
        canDeleteProject: true,
        canEditProject: true,
        canManageMembers: true,
        canCreateTask: true,
        canEditAnyTask: true,
        canDeleteAnyTask: true,
        canAssignTasks: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
        canViewAllTasks: true,
        canViewProjectSettings: true,
    },
    [MemberRole.PROJECT_MANAGER]: {
        canDeleteProject: false,
        canEditProject: true,
        canManageMembers: true,
        canCreateTask: true,
        canEditAnyTask: true,
        canDeleteAnyTask: true,
        canAssignTasks: true,
        canInviteMembers: true,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: true,
    },
    [MemberRole.FRONTEND_DEVELOPER]: {
        canDeleteProject: false,
        canEditProject: false,
        canManageMembers: false,
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteAnyTask: false,
        canAssignTasks: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: false,
    },
    [MemberRole.BACKEND_DEVELOPER]: {
        canDeleteProject: false,
        canEditProject: false,
        canManageMembers: false,
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteAnyTask: false,
        canAssignTasks: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: false,
    },
    [MemberRole.FULLSTACK_DEVELOPER]: {
        canDeleteProject: false,
        canEditProject: false,
        canManageMembers: false,
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteAnyTask: false,
        canAssignTasks: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: false,
    },
    [MemberRole.DESIGNER]: {
        canDeleteProject: false,
        canEditProject: false,
        canManageMembers: false,
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteAnyTask: false,
        canAssignTasks: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: false,
    },
    [MemberRole.TESTER]: {
        canDeleteProject: false,
        canEditProject: false,
        canManageMembers: false,
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteAnyTask: false,
        canAssignTasks: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
        canViewAllTasks: true,
        canViewProjectSettings: false,
    },
};

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export type TaskProgressType = typeof TaskProgress[keyof typeof TaskProgress];
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
    timeSpentMinutes?: number;
    completedAt?: string | null;
    estimatedHours?: number;
    createdAt: string;
    updatedAt: string;
}

export const TaskStatus = {
    TODO: 'To do',
    IN_PROGRESS: 'In Progress',
    PENDING: 'Pending',
    DONE: 'Done'
} as const;

export const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
} as const;

export const TaskProgress = {
    ON_TRACK: 'Đúng tiến độ',
    AT_RISK: 'Có rủi ro',
    DELAYED: 'Trễ hẹn',
    DONE: 'Hoàn thành'
} as const;