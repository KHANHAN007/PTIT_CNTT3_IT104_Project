import type { LoginRequest, RegisterRequest, User, UpdateProfileRequest } from "../types";
import { api } from "./api";

export const authService = {
    async login(credentials: LoginRequest): Promise<User> {
        const response = await api.get('/users');
        const users = response.data;

        const user = users.find((u: User) => u.email === credentials.email && u.password === credentials.password);
        if (!user) {
            throw new Error("Invalid email or password");
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    async register(userData: RegisterRequest): Promise<User> {
        if (!userData.name.trim())
            throw new Error('Họ và tên không được để trống');

        if (!userData.email.trim())
            throw new Error('Email không được để trống');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Email không đúng định dạng');
        }

        if (!userData.password) {
            throw new Error('Mật khẩu không được để trống');
        }

        if (userData.password.length < 8) {
            throw new Error('Mật khẩu phải có tối thiểu 8 ký tự');
        }

        if (!userData.confirmPassword) {
            throw new Error('Mật khẩu xác nhận không được để trống');
        }

        if (userData.password !== userData.confirmPassword) {
            throw new Error('Mật khẩu xác nhận không trùng khớp');
        }

        const existingUsersResponse = await api.get('/users');
        const existingUsers = existingUsersResponse.data;

        if (existingUsers.some((u: User) => u.email === userData.email)) {
            throw new Error('Email đã tồn tại');
        }

        const newUser = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            avatar: '',
            bio: '',
            phone: '',
            address: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const res = await api.post('/users', newUser);
        const { password, ...userWithoutPassword } = res.data;
        return userWithoutPassword;
    },

    async getUserProfile(userId: string): Promise<User> {
        const response = await api.get(`/users/${userId}`);
        const { password, ...userWithoutPassword } = response.data;
        return userWithoutPassword;
    },

    async logout(): Promise<void> {
        localStorage.removeItem('user');
        return Promise.resolve();
    },

    async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<User> {
        const currentUserResponse = await api.get(`/users/${userId}`);
        const currentUser = currentUserResponse.data;

        const updatedUser = {
            ...currentUser,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const response = await api.put(`/users/${userId}`, updatedUser);
        const { password, ...userWithoutPassword } = response.data;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.id === userId) {
                localStorage.setItem('user', JSON.stringify(userWithoutPassword));
            }
        }

        return userWithoutPassword;
    }
}