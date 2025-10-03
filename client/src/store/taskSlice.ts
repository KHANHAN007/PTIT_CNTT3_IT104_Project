import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Task } from "../types"
import { tasksService } from "../services/taskService";

const initialState = {
    tasks: [] as Task[],
    loading: false,
    error: null as string | null,
}

export const featchTasks = createAsyncThunk(`tasks/fetchAll`, async (projectId: string) => {
    return await tasksService.getTasks(projectId);
})

const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(featchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(featchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload;
            })
            .addCase(featchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải nhiểm vụ';
            })
    }
})
export default taskSlice.reducer;