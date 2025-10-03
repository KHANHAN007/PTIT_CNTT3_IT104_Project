import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Project, ProjectsState } from "../types"
import { projectsService } from "../services/projectsService";

const initialState: ProjectsState = {
    projects: [] as Project[],
    currentProject: null,
    loading: false,
    error: null,
};

export const fetchProjects = createAsyncThunk(`projects/fetchAll`, async (userId: string) => {
    return await projectsService.getProjects(userId);
});
const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        setCurrentProject(state, action:PayloadAction<Project|null>) {
            state.currentProject = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi ';
            });
    }
})

export const { setCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;