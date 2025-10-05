import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Project, ProjectsState } from "../types"
import { projectsService, type CreateProjectRequest, type UpdateProjectRequest } from "../services/projectsService";

const initialState: ProjectsState = {
    projects: [] as Project[],
    currentProject: null,
    loading: false,
    error: null,
};

export const fetchProjects = createAsyncThunk(`projects/fetchAll`, async (userId: string) => {
    return await projectsService.getProjects(userId);
});

export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData: CreateProjectRequest) => {
        return await projectsService.createProject(projectData);
    }
);

export const updateProject = createAsyncThunk(
    'projects/update',
    async ({ id, projectData }: { id: string; projectData: UpdateProjectRequest }) => {
        return await projectsService.updateProject(id, projectData);
    }
);

export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (projectId: string) => {
        await projectsService.deleteProject(projectId);
        return projectId;
    }
);
const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
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
                state.error = action.error.message || 'Lỗi tải danh sách dự án';
            })
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi tạo dự án';
            })

            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
                if (state.currentProject?.id === action.payload.id) {
                    state.currentProject = action.payload;
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi cập nhật dự án';
            })

            .addCase(deleteProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.filter(p => p.id !== action.payload);
                if (state.currentProject?.id === action.payload) {
                    state.currentProject = null;
                }
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi xóa dự án';
            });
    }
})
export const { setCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;