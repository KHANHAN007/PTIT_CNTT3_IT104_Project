import type { Project } from "../types";
import { api } from "./api";

export const projectsService = {
    async getProjects(userId: string): Promise<Project[]> {
        const res = await api.get(`/projects?ownerId=${userId}`);
        return res.data;
    },
    async getProjectById(projectId: string): Promise<Project> {
        const res = await api.get(`/projects/${projectId}`);
        return res.data;
    },
    async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
        if (!projectData.name.trim()) {
            throw new Error('Tên dự án không được để trống');
        }

        if (!projectData.description.trim()) {
            throw new Error('Mô tả dự án không được để trống');
        }

        if (projectData.name.length < 3 || projectData.name.length > 100) {
            throw new Error('Tên dự án phải có độ dài từ 3-100 ký tự');
        }

        if (projectData.description.length < 10 || projectData.description.length > 500) {
            throw new Error('Mô tả dự án phải có độ dài từ 10-500 ký tự');
        }
        const existingProjectsResponse = await api.get(`/projects?ownerId=${projectData.ownerId}`);
        const existingProjects = existingProjectsResponse.data;

        const duplicateProject = existingProjects.find(
            (p: Project) => p.name.toLowerCase() === projectData.name.toLowerCase()
        );
        if (duplicateProject) {
            throw new Error('Tên dự án đã tồn tại');
        }
        const newProject = {
            ...projectData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await api.post('/projects', newProject);
        return response.data;
    },

    async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
        if (projectData.name) {
            if (!projectData.name.trim()) {
                throw new Error('Tên dự án không được để trống');
            }
            if (projectData.name.length < 3 || projectData.name.length > 100) {
                throw new Error('Tên dự án phải có độ dài từ 3-100 ký tự');
            }

            const currentProjectRes = await api.get(`/projects/${id}`);
            const currentProject: Project = currentProjectRes.data;

            const existingProjectsRes = await api.get(`/projects?ownerId=${currentProject.ownerId}`);
            const existingProjects: Project[] = existingProjectsRes.data;

            const duplicateProject = existingProjects.find(
                (p: Project) => p.name.toLowerCase() === projectData.name!.toLowerCase() && p.id !== id
            );
            if (duplicateProject) {
                throw new Error('Tên dự án đã tồn tại');
            }
        }
        if (projectData.description) {
            if (!projectData.description.trim()) {
                throw new Error('Mô tả dự án không được để trống');
            }
            if (projectData.description.length < 10 || projectData.description.length > 500) {
                throw new Error('Mô tả dự án phải có độ dài từ 10-500 ký tự');
            }
        }

        const updatedProject = {
            ...projectData,
            updatedAt: new Date().toISOString()
        };

        const response = await api.patch(`/projects/${id}`, updatedProject);
        return response.data;
    },
    async deleteProject(id: string): Promise<void> {
        await api.delete(`/projects/${id}`);
        const tasksResponse = await api.get(`/tasks?projectId=${id}`);
        const tasks = tasksResponse.data;

        const membersResponse = await api.get(`/members?projectId=${id}`);
        const members = membersResponse.data;
        await Promise.all(tasks.map((task: any) => api.delete(`/tasks/${task.id}`)));
        await Promise.all(members.map((member: any) => api.delete(`/members/${member.id}`)));
    }
}