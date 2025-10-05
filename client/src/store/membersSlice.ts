import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MembersState, ProjectMember, MemberRoleType } from '../types';
import { membersService } from '../services';

export const fetchMembersByProjectAsync = createAsyncThunk(
    'members/fetchMembersByProject',
    async (projectId: string) => {
        return await membersService.getMembers(projectId);
    }
);

export const fetchMembersForProjectsAsync = createAsyncThunk(
    'members/fetchMembersForProjects',
    async (projectIds: string[]) => {
        const results = await Promise.all(projectIds.map(id => membersService.getMembers(id)));
        return results.flat();
    }
);

export const addMemberAsync = createAsyncThunk(
    'members/addMember',
    async (memberData: Omit<ProjectMember, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await membersService.addMember(memberData);
    }
);

export const removeMemberAsync = createAsyncThunk(
    'members/removeMember',
    async (memberId: string) => {
        await membersService.removeMember(memberId);
        return memberId;
    }
);

export const updateMemberRoleAsync = createAsyncThunk(
    'members/updateMemberRole',
    async ({ memberId, role }: { memberId: string; role: MemberRoleType }) => {
        return await membersService.updateMemberRole(memberId, role);
    }
);

const initialState: MembersState = {
    members: [],
    loading: false,
    error: null,
};

const membersSlice = createSlice({
    name: 'members',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMembersByProjectAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembersByProjectAsync.fulfilled, (state, action: PayloadAction<ProjectMember[]>) => {
                state.loading = false;
                state.members = action.payload;
            })
            .addCase(fetchMembersByProjectAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải thành viên';
            })
            .addCase(addMemberAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addMemberAsync.fulfilled, (state, action: PayloadAction<ProjectMember>) => {
                state.loading = false;
                state.members.push(action.payload);
            })
            .addCase(addMemberAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi thêm thành viên';
            })
            .addCase(removeMemberAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeMemberAsync.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.members = state.members.filter(m => m.id !== action.payload);
            })
            .addCase(removeMemberAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi xóa thành viên';
            })
            .addCase(updateMemberRoleAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMemberRoleAsync.fulfilled, (state, action: PayloadAction<ProjectMember>) => {
                state.loading = false;
                const index = state.members.findIndex(m => m.id === action.payload.id);
                if (index !== -1) {
                    state.members[index] = action.payload;
                }
            })
            .addCase(updateMemberRoleAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi cập nhật vai trò';
            })
            .addCase(fetchMembersForProjectsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembersForProjectsAsync.fulfilled, (state, action: PayloadAction<ProjectMember[]>) => {
                state.loading = false;
                state.members = action.payload;
            })
            .addCase(fetchMembersForProjectsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải danh sách thành viên cho các dự án';
            });
    },
});

export const { clearError } = membersSlice.actions;
export default membersSlice.reducer;