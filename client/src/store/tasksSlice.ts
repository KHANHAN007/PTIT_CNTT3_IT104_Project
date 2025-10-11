import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TasksState, Task } from '../types';
import { tasksService } from '../services';
import { fetchMembersByProjectAsync } from './membersSlice';

export const fetchTasksByProjectAsync = createAsyncThunk(
    'tasks/fetchTasksByProject',
    async (projectId: string) => {
        return await tasksService.getTasks(projectId);
    }
);

export const fetchTasksByUserAsync = createAsyncThunk(
    'tasks/fetchTasksByUser',
    async (userId: string) => {
        const tasks = await tasksService.getUserTasks(userId);
        return { userId, tasks };
    }
);

export const fetchTasksByIdsAsync = createAsyncThunk(
    'tasks/fetchTasksByIds',
    async (ids: string[]) => {
        return await tasksService.getTasksByIds(ids);
    }
);

export const createTaskAsync = createAsyncThunk(
    'tasks/createTask',
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        try {
            return await tasksService.createTask(taskData);
        } catch (err: any) {
            const payload = err?.messages || err?.message || 'Lỗi khi tạo nhiệm vụ';
            return rejectWithValue(payload);
        }
    }
);

export const updateTaskAsync = createAsyncThunk(
    'tasks/updateTask',
    async ({ id, taskData }: { id: string; taskData: Partial<Task> }, { rejectWithValue }) => {
        try {
            return await tasksService.updateTask(id, taskData);
        } catch (err: any) {
            const payload = err?.messages || err?.message || 'Lỗi khi cập nhật nhiệm vụ';
            return rejectWithValue(payload);
        }
    }
);

export const deleteTaskAsync = createAsyncThunk(
    'tasks/deleteTask',
    async (id: string) => {
        await tasksService.deleteTask(id);
        return id;
    }
);

export const fetchUserTasksAsync = fetchTasksByUserAsync;

export const updateTaskStatusAsync = createAsyncThunk(
    'tasks/updateTaskStatus',
    async ({ id, status }: { id: string; status: string }) => {
        return await tasksService.updateTaskStatus(id, status as any);
    }
);

export const updateTaskTimeAsync = createAsyncThunk(
    'tasks/updateTaskTime',
    async ({ id, minutes }: { id: string; minutes: number }) => {
        const currentTask = await tasksService.getTask(id);

        const newMinutes = (currentTask.timeSpentMinutes || 0) + minutes;

        const updatedTask = await tasksService.updateTask(id, { timeSpentMinutes: newMinutes });
        return updatedTask;
    }
);

const initialState: TasksState = {
    tasks: [],
    loading: false,
    error: null,
    errorForm: null,
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearFormError: (state) => {
            state.errorForm = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasksByProjectAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksByProjectAsync.fulfilled, (state, action: PayloadAction<Task[]>) => {
                state.loading = false;
                const projectTasks = action.payload;
                if (projectTasks.length > 0) {
                    const projectId = projectTasks[0].projectId;
                    // Xóa tasks cũ của project này
                    state.tasks = state.tasks.filter(task => task.projectId !== projectId);
                    // Thêm tất cả tasks của project
                    state.tasks.push(...projectTasks);
                }
            })
            .addCase(fetchTasksByProjectAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải nhiệm vụ';
            })
            .addCase(fetchTasksByUserAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksByUserAsync.fulfilled, (state, action: PayloadAction<{ userId: string; tasks: Task[] }>) => {
                state.loading = false;
                const { userId, tasks } = action.payload;
                const validTasks = tasks.filter(task => task.assigneeId === userId);
                if (validTasks.length !== tasks.length) {
                    console.warn(`[TasksSlice] ${tasks.length - validTasks.length} invalid tasks removed for user ${userId}`);
                }
                const hasProjectTasks = state.tasks.some(task => task.assigneeId !== userId);
                if (hasProjectTasks) {
                    console.info(`[TasksSlice] Project context detected, merging user tasks instead of overwriting`);
                    const nonUserTasks = state.tasks.filter(task => task.assigneeId !== userId);
                    state.tasks = [...nonUserTasks, ...validTasks];
                } else {
                    state.tasks = validTasks;
                }
            })
            .addCase(fetchTasksByUserAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải nhiệm vụ';
            })
            .addCase(createTaskAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.errorForm = null;
            })
            .addCase(createTaskAsync.fulfilled, (state, action: PayloadAction<Task>) => {
                state.loading = false;
                state.tasks.push(action.payload);
                state.errorForm = null;
            })
            .addCase(createTaskAsync.rejected, (state, action) => {
                state.loading = false;
                state.errorForm = (action.payload as string | string[]) || null;
                state.error = state.errorForm ? null : (action.error.message || 'Lỗi khi tạo nhiệm vụ');
            })
            .addCase(updateTaskAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.errorForm = null;
            })
            .addCase(updateTaskAsync.fulfilled, (state, action: PayloadAction<Task>) => {
                state.loading = false;
                const updatedTask = action.payload;
                const index = state.tasks.findIndex(t => t.id === updatedTask.id);

                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                } else {
                    // Task không có trong state hiện tại, có thể là task mới được assign
                    state.tasks.push(updatedTask);
                }
                state.errorForm = null;
            })
            .addCase(updateTaskAsync.rejected, (state, action) => {
                state.loading = false;
                state.errorForm = (action.payload as string | string[]) || null;
                state.error = state.errorForm ? null : (action.error.message || 'Lỗi khi cập nhật nhiệm vụ');
            })
            .addCase(deleteTaskAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTaskAsync.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.tasks = state.tasks.filter(t => t.id !== action.payload);
            })
            .addCase(deleteTaskAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi xóa nhiệm vụ';
            })
            .addCase(updateTaskStatusAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTaskStatusAsync.fulfilled, (state, action: PayloadAction<Task>) => {
                state.loading = false;
                const updatedTask = action.payload;
                const index = state.tasks.findIndex(t => t.id === updatedTask.id);

                if (index !== -1) {
                    state.tasks[index] = updatedTask;
                }
            })
            .addCase(updateTaskStatusAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi cập nhật trạng thái nhiệm vụ';
            });

        builder
            .addCase(updateTaskTimeAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTaskTimeAsync.fulfilled, (state, action: PayloadAction<Task>) => {
                state.loading = false;
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) state.tasks[index] = action.payload;
            })
            .addCase(updateTaskTimeAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi cập nhật thời gian nhiệm vụ';
            });
    },
});

export const { clearError, clearFormError } = tasksSlice.actions;
export default tasksSlice.reducer;
export const fetchTasksAsync = fetchTasksByProjectAsync;
export const fetchMembersAsync = fetchMembersByProjectAsync;