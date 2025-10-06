import type { Project } from "../types";
import { api } from "./api";
import { MemberRole } from '../types';

export interface CreateProjectRequest {
    name: string;
    description: string;
    imageUrl?: string;
    ownerId: string;
    managerId?: string;
    members?: Array<{ userId: string; role?: string; email?: string }>;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    imageUrl?: string;
}

export const projectsService = {
    async getProjects(userId: string): Promise<Project[]> {
        const ownedRes = await api.get(`/projects?ownerId=${userId}`);
        const ownedProjects: Project[] = ownedRes.data || [];
        const managerRes = await api.get(`/projects?managerId=${userId}`);
        const managerProjects: Project[] = managerRes.data || [];
        const membersRes = await api.get(`/members?userId=${userId}`);
        const memberRecords: any[] = membersRes.data || [];

        const memberProjectIds = Array.from(new Set(memberRecords.map(m => m.projectId)));

        const ownedIds = new Set(ownedProjects.map(p => p.id));
        const otherProjectIds = memberProjectIds.filter(id => !ownedIds.has(id));

        let memberProjects: Project[] = [];
        if (otherProjectIds.length > 0) {
            const query = otherProjectIds.map(id => `id=${id}`).join('&');
            const memberProjRes = await api.get(`/projects?${query}`);
            memberProjects = memberProjRes.data || [];
        }
        console.log('Fetched projects:', { ownedProjects, managerProjects, memberProjects });
        return [...ownedProjects, ...memberProjects, ...managerProjects];
    },

    async getProjectById(projectId: string): Promise<Project> {
        const res = await api.get(`/projects/${projectId}`);
        return res.data;
    },

    async createProject(projectData: CreateProjectRequest): Promise<Project> {
        const newProject = {
            ...projectData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const res = await api.post('/projects', newProject);
        const created = res.data;
        const createdAt = new Date().toISOString();
        try {
            const ownerRes = await api.get(`/users/${projectData.ownerId}`);
            const owner = ownerRes.data;
            const ownerMember = {
                projectId: created.id,
                userId: projectData.ownerId,
                role: MemberRole.PROJECT_OWNER,
                email: owner?.email || '',
                joinedAt: createdAt
            };
            await api.post('/members', ownerMember);
            if (projectData.managerId) {
                try {
                    const manRes = await api.get(`/users/${projectData.managerId}`);
                    const man = manRes.data;
                    const mgrMember = {
                        projectId: created.id,
                        userId: projectData.managerId,
                        role: MemberRole.PROJECT_MANAGER,
                        email: man?.email || '',
                        joinedAt: createdAt
                    };
                    await api.post('/members', mgrMember);
                } catch (err) {
                    console.error('Failed', err);
                }
            }
            if (Array.isArray(projectData.members)) {
                for (const m of projectData.members) {
                    if (!m || !m.userId) continue;
                    if (m.userId === projectData.ownerId) continue;
                    if (projectData.managerId && m.userId === projectData.managerId) continue;

                    const memberPayload = {
                        projectId: created.id,
                        userId: m.userId,
                        role: m.role || MemberRole.FULLSTACK_DEVELOPER,
                        email: m.email || '',
                        joinedAt: createdAt
                    };
                    try {
                        await api.post('/members', memberPayload);
                    } catch (err) {
                        console.error('Failed to create member', memberPayload, err);
                    }
                }
            }
        } catch (err) {
            console.error('Failed', created?.id, err);
        }

        return created;
    },

    async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<Project> {
        const updateData = {
            ...projectData,
            updatedAt: new Date().toISOString()
        };
        const res = await api.put(`/projects/${projectId}`, updateData);
        return res.data;
    },

    async deleteProject(projectId: string): Promise<void> {
        await api.delete(`/projects/${projectId}`);
    }
}