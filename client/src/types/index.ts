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