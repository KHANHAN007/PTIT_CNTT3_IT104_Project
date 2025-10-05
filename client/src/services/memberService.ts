import { api } from './api';
import type { ProjectMember, MemberRoleType } from '../types';

export const membersService = {
    async getMembers(projectId: string): Promise<ProjectMember[]> {
        const response = await api.get(`/members?projectId=${projectId}`);
        return response.data;
    },

    async getMember(id: string): Promise<ProjectMember> {
        const response = await api.get(`/members/${id}`);
        return response.data;
    },

    async addMember(memberData: Omit<ProjectMember, 'id'>): Promise<ProjectMember> {
        if (!memberData.email.trim()) {
            throw new Error('Email không được để trống');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(memberData.email)) {
            throw new Error('Email không đúng định dạng');
        }

        if (!memberData.role) {
            throw new Error('Vai trò không được để trống');
        }
        const existingMembersResponse = await api.get(`/members?projectId=${memberData.projectId}`);
        const existingMembers = existingMembersResponse.data;

        const duplicateMember = existingMembers.find(
            (m: ProjectMember) => m.email.toLowerCase() === memberData.email.toLowerCase()
        );

        if (duplicateMember) {
            throw new Error('Người dùng đã có trong danh sách thành viên');
        }

        const response = await api.post('/members', memberData);
        return response.data;
    },

    async updateMemberRole(id: string, role: MemberRoleType): Promise<ProjectMember> {
        const updatedData = { role };
        const response = await api.patch(`/members/${id}`, updatedData);
        return response.data;
    },

    async removeMember(id: string): Promise<void> {
        await api.delete(`/members/${id}`);
    }
};