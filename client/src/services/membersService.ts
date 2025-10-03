import type { ProjectMember, MemberWithUserInfo, User } from "../types";
import { api } from "./api";

export const membersService = {
    async getMembers(projectId: string): Promise<MemberWithUserInfo[]> {
        const [membersRes, usersRes] = await Promise.all([
            api.get(`/members?projectId=${projectId}`),
            api.get('/users')
        ]);

        const members: ProjectMember[] = membersRes.data;
        const users: User[] = usersRes.data;
        const membersWithUserInfo: MemberWithUserInfo[] = members.map(member => {
            const user = users.find(u => u.id === member.userId);
            return {
                ...member,
                name: user?.name || '',
                email: user?.email || '',
                avatar: user?.avatar,
                bio: user?.bio,
                phone: user?.phone
            };
        });

        return membersWithUserInfo;
    },

    async getMemberById(memberId: string): Promise<MemberWithUserInfo> {
        const [memberRes, usersRes] = await Promise.all([
            api.get(`/members/${memberId}`),
            api.get('/users')
        ]);

        const member: ProjectMember = memberRes.data;
        const users: User[] = usersRes.data;
        const user = users.find(u => u.id === member.userId);

        return {
            ...member,
            name: user?.name || '',
            email: user?.email || '',
            avatar: user?.avatar,
            bio: user?.bio,
            phone: user?.phone
        };
    }
}