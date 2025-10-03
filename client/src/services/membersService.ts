import type { ProjectMember } from "../types";
import { api } from "./api";

export const membersService = {
    async getMembers(projectId: string): Promise<ProjectMember[]> {
        const res = await api.get(`/members?projectId=${projectId}`);
        return res.data;
    },

    async getMemberById(memberId: string): Promise<ProjectMember> {
        const res = await api.get(`/members/${memberId}`);
        return res.data;
    }
}