import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Project, ProjectsState } from "../types"
import { projectsService } from "../services/projectsService";
import { cloudinaryService } from "../services/cloudinaryService";

const initialState: ProjectsState = {
    projects: [] as Project[],
    currentProject: null,
    loading: false,
    uploadingImage: false,
    error: null,
};

export const fetchProjects = createAsyncThunk(`projects/fetchAll`, async (userId: string) => {
    return await projectsService.getProjects(userId);
});

export const uploadProjectImage = createAsyncThunk(
    'projects/uploadImage',
    async (file: File) => {
        return await cloudinaryService.uploadImage(file);
    }
);

export const createProjectAsync = createAsyncThunk('projects/create', async (projectData: Project) => {
    return await projectsService.createProject(projectData);
});

export const updateProjectAsync = createAsyncThunk(
    'projects/updateProject',
    async ({ id, projectData }: { id: string; projectData: Partial<Project> }) => {
        return await projectsService.updateProject(id, projectData);
    }
);

export const deleteProjectAsync = createAsyncThunk<string, string>(
    'projects/deleteProject',
    async (id: string) => {
        await projectsService.deleteProject(id);
        return id;
    }
);

const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        setCurrentProject(state, action: PayloadAction<Project | null>) {
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
            })

            .addCase(uploadProjectImage.pending, (state) => {
                state.uploadingImage = true;
                state.error = null;
            })
            .addCase(uploadProjectImage.fulfilled, (state) => {
                state.uploadingImage = false;
            })
            .addCase(uploadProjectImage.rejected, (state, action) => {
                state.uploadingImage = false;
                state.error = action.error.message || 'Lỗi khi upload ảnh';
            })

            .addCase(createProjectAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProjectAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.projects.push(action.payload);
            })
            .addCase(createProjectAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi ';
            })

            .addCase(updateProjectAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProjectAsync.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
                if (state.currentProject?.id === action.payload.id) {
                    state.currentProject = action.payload;
                }
            })
            .addCase(updateProjectAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi ';
            })


            .addCase(deleteProjectAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProjectAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.filter(p => p.id !== action.payload);
                if (state.currentProject?.id === action.payload) {
                    state.currentProject = null;
                }
            })
            .addCase(deleteProjectAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi ';
            });
    }
});

export const { setCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;