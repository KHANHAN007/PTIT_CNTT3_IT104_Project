import type { User } from '../types';
import { api } from './api';

export const userService = {
    async getSentRequests(userId: string) {
        const res = await api.get(`/users/${userId}`);
        return res.data.sentRequests || [];
    },

    async getReceivedRequests(userId: string) {
        const res = await api.get(`/users/${userId}`);
        return res.data.receivedRequests || [];
    },
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
    },

    async getUsersByIds(ids: string[]): Promise<User[]> {
        if (!ids || ids.length === 0) return [];
        const query = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
        const response = await api.get(`/users?${query}`);
        return response.data.map((user: User) => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    },

    async removeRequestFromUser(userId: string, requestId: string, type: string) {
        const res = await api.get(`/users/${userId}`);
        const user = res.data;
        let updatedRequests;
        if (type === 'sent') {
            updatedRequests = Array.isArray(user.sentRequests)
                ? user.sentRequests.filter((r: any) => r.id !== requestId)
                : [];
            await api.patch(`/users/${userId}`, { sentRequests: updatedRequests });
        } else if (type === 'received') {
            updatedRequests = Array.isArray(user.receivedRequests)
                ? user.receivedRequests.filter((r: any) => r.id !== requestId)
                : [];
            await api.patch(`/users/${userId}`, { receivedRequests: updatedRequests });
        }
    }
};