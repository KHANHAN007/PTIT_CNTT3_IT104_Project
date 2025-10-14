import { api } from './api';
import type { Task, TaskStatusType, TaskProgressType } from '../types';
import { TaskProgress } from '../types';

export const tasksService = {
    async getTasks(projectId: string): Promise<Task[]> {
        const response = await api.get(`/tasks?projectId=${projectId}`);
        return response.data;
    },

    async getUserTasks(userId: string): Promise<Task[]> {
        const response = await api.get(`/tasks?assigneeId=${userId}`);
        return response.data;
    },

    async getTasksByIds(ids: string[]): Promise<Task[]> {
        if (!ids || ids.length === 0) return [];
        const query = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
        const response = await api.get(`/tasks?${query}`);
        return response.data;
    },

    async getTask(id: string): Promise<Task> {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {

        const computeProgress = (timeMinutes: number | undefined, estimatedHours: number | undefined): TaskProgressType => {
            if (!estimatedHours || estimatedHours <= 0) return TaskProgress.ON_TRACK;
            const ratio = (timeMinutes || 0) / (estimatedHours * 60);
            if (ratio < 0.5) return TaskProgress.ON_TRACK;
            if (ratio < 1) return TaskProgress.AT_RISK;
            return TaskProgress.DELAYED;
        };

        const initialTime = taskData.timeSpentMinutes || 0;
        const initialProgress = computeProgress(initialTime, (taskData as any).estimatedHours);

        const newTask: Partial<Task> = {
            ...taskData,
            timeSpentMinutes: initialTime,
            progress: taskData.status === 'Done' ? TaskProgress.DONE : initialProgress,
            completedAt: taskData.status === 'Done' ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await api.post('/tasks', newTask);
        return response.data;
    },

    async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
        const computeProgress = (timeMinutes: number | undefined, estimatedHours: number | undefined): TaskProgressType => {
            if (!estimatedHours || estimatedHours <= 0) return TaskProgress.ON_TRACK;
            const ratio = (timeMinutes || 0) / (estimatedHours * 60);
            if (ratio < 0.5) return TaskProgress.ON_TRACK;
            if (ratio < 1) return TaskProgress.AT_RISK;
            return TaskProgress.DELAYED;
        };

        const updatedData: Partial<Task> = {
            ...taskData,
            completedAt: taskData.status === 'Done' ? (taskData.completedAt || new Date().toISOString()) : null,
            updatedAt: new Date().toISOString()
        };

        if ('timeSpentMinutes' in taskData || 'estimatedHours' in taskData) {
            const currentTaskResponse = await api.get(`/tasks/${id}`);
            const currentTask = currentTaskResponse.data;
            const time = ('timeSpentMinutes' in taskData) ? taskData.timeSpentMinutes : currentTask.timeSpentMinutes;
            const estimated = ('estimatedHours' in taskData) ? (taskData as any).estimatedHours : currentTask.estimatedHours;
            updatedData.progress = computeProgress(time as number | undefined, estimated as number | undefined);
        }

        const response = await api.patch(`/tasks/${id}`, updatedData);
        return response.data;
    },

    async updateTaskStatus(id: string, status: TaskStatusType): Promise<Task> {
        const currentTaskResponse = await api.get(`/tasks/${id}`);
        const currentTask: Task = currentTaskResponse.data;

        const validStatuses = [
            'To do',
            'In Progress',
            'Pending',
            'Done'
        ];

        if (!validStatuses.includes(status)) {
            throw new Error('Trạng thái không hợp lệ');
        }

        const updatedData: Partial<Task> = {
            status,
            updatedAt: new Date().toISOString()
        };

        const now = new Date().toISOString();

        if (status === 'In Progress') {
            if (currentTask.status === 'To do') {
                updatedData.progress = TaskProgress.ON_TRACK;
            }
        }

        if (status === 'Done') {
            updatedData.progress = TaskProgress.DONE;
            updatedData.completedAt = currentTask.completedAt || now;
        }

        if (status === 'Pending') {
        }

        const response = await api.patch(`/tasks/${id}`, updatedData);
        return response.data;
    },

    async deleteTask(id: string): Promise<void> {
        await api.delete(`/tasks/${id}`);
    }
};