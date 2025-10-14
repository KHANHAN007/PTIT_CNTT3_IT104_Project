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

export const fetchProjectById = createAsyncThunk(
    'projects/fetchById',
    async (projectId: string) => {
        return await projectsService.getProjectById(projectId);
    }
);

export const fetchProjectsByIds = createAsyncThunk(
    'projects/fetchByIds',
    async (ids: string[]) => {
        return await projectsService.getProjectsByIds(ids);
    }
);

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
                const existingIndex = state.projects.findIndex(p => p.id === action.payload.id);
                if (existingIndex === -1) {
                    state.projects.push(action.payload);
                } else {
                    state.projects[existingIndex] = action.payload;
                }
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
            })

            .addCase(fetchProjectById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProject = action.payload;
            })
            .addCase(fetchProjectById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi tải dự án';
            });
        builder
            .addCase(fetchProjectsByIds.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectsByIds.fulfilled, (state, action) => {
                state.loading = false;
                // merge projects without duplicates
                const existingIds = new Set(state.projects.map(p => p.id));
                action.payload.forEach((p: any) => {
                    if (!existingIds.has(p.id)) state.projects.push(p);
                });
            })
            .addCase(fetchProjectsByIds.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi tải dự án';
            });
    }
});

export const { setCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;