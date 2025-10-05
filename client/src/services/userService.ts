import type { User } from '../types';
import { api } from './api';

export const userService = {
    async getUserById(userId: string): Promise<User> {
        const response = await api.get(`/users/${userId}`);
        const { password, ...userWithoutPassword } = response.data;
        return userWithoutPassword;
    },

    async getAllUsers(): Promise<User[]> {
        const response = await api.get('/users');
        return response.data.map((user: User) => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
};