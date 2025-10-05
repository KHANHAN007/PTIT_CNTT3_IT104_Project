import { api } from './api';
import type { Task, TaskStatusType } from '../types';

export const tasksService = {
    async getTasks(projectId: string): Promise<Task[]> {
        const response = await api.get(`/tasks?projectId=${projectId}`);
        return response.data;
    },

    async getUserTasks(userId: string): Promise<Task[]> {
        const response = await api.get(`/tasks?assigneeId=${userId}`);
        return response.data;
    },

    async getTask(id: string): Promise<Task> {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
        if (!taskData.name.trim()) {
            throw new Error('Tên nhiệm vụ không được để trống');
        }

        if (taskData.name.length < 3 || taskData.name.length > 100) {
            throw new Error('Tên nhiệm vụ phải có độ dài từ 3-100 ký tự');
        }
        const existingTasksResponse = await api.get(`/tasks?projectId=${taskData.projectId}`);
        const existingTasks = existingTasksResponse.data;

        const duplicateTask = existingTasks.find(
            (t: Task) => t.name.toLowerCase() === taskData.name.toLowerCase()
        );

        if (duplicateTask) {
            throw new Error('Tên nhiệm vụ đã tồn tại trong dự án');
        }

        const startDate = new Date(taskData.startDate);
        const deadline = new Date(taskData.deadline);
        const now = new Date();

        if (startDate <= now) {
            throw new Error('Ngày bắt đầu phải lớn hơn ngày hiện tại');
        }

        if (deadline <= startDate) {
            throw new Error('Hạn chót phải lớn hơn ngày bắt đầu');
        }

        const newTask: Partial<Task> = {
            ...taskData,
            timeSpentMinutes: taskData.timeSpentMinutes || 0,
            completedAt: taskData.status === 'Done' ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await api.post('/tasks', newTask);
        return response.data;
    },

    async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
        if (taskData.name) {
            if (!taskData.name.trim()) {
                throw new Error('Tên nhiệm vụ không được để trống');
            }

            if (taskData.name.length < 3 || taskData.name.length > 100) {
                throw new Error('Tên nhiệm vụ phải có độ dài từ 3-100 ký tự');
            }
            const currentTaskResponse = await api.get(`/tasks/${id}`);
            const currentTask = currentTaskResponse.data;

            const existingTasksResponse = await api.get(`/tasks?projectId=${currentTask.projectId}`);
            const existingTasks = existingTasksResponse.data;

            const duplicateTask = existingTasks.find(
                (t: Task) => t.name.toLowerCase() === taskData.name!.toLowerCase() && t.id !== id
            );

            if (duplicateTask) {
                throw new Error('Tên nhiệm vụ đã tồn tại trong dự án');
            }
        }

        if (taskData.startDate && taskData.deadline) {
            const startDate = new Date(taskData.startDate);
            const deadline = new Date(taskData.deadline);
            const now = new Date();

            if (startDate <= now) {
                throw new Error('Ngày bắt đầu phải lớn hơn ngày hiện tại');
            }

            if (deadline <= startDate) {
                throw new Error('Hạn chót phải lớn hơn ngày bắt đầu');
            }
        }

        const updatedData: Partial<Task> = {
            ...taskData,
            completedAt: taskData.status === 'Done' ? (taskData.completedAt || new Date().toISOString()) : null,
            updatedAt: new Date().toISOString()
        };

        const response = await api.patch(`/tasks/${id}`, updatedData);
        return response.data;
    },

    async updateTaskStatus(id: string, status: TaskStatusType): Promise<Task> {
        const currentTaskResponse = await api.get(`/tasks/${id}`);
        const currentTask = currentTaskResponse.data;
        const allowedStatuses = ['In Progress', 'Pending'];

        if (!allowedStatuses.includes(currentTask.status)) {
            throw new Error('Chỉ có thể thay đổi trạng thái giữa "In Progress" và "Pending"');
        }

        if (!allowedStatuses.includes(status)) {
            throw new Error('Chỉ có thể chuyển đổi giữa "In Progress" và "Pending"');
        }

        const updatedData = {
            status,
            updatedAt: new Date().toISOString()
        };

        const response = await api.patch(`/tasks/${id}`, updatedData);
        return response.data;
    },

    async deleteTask(id: string): Promise<void> {
        await api.delete(`/tasks/${id}`);
    }
};