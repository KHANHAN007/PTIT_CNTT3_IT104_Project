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
    }
}