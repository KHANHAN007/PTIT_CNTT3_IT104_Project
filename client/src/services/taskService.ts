import type { Task } from "../types";
import { api } from "./api"

export const tasksService = {
    async getTasks(projectId: string): Promise<Task[]>{
        const response = await api.get(`/tasks?projectId=${projectId}`);
        return response.data;
    },

    async getUserTasks(userId: string): Promise<Task[]>{
        const res= await api.get('/tasks?assignedTo='+userId);
        return res.data;
    }

}