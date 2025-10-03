import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { MembersState } from "../types";
import { membersService } from "../services/membersService";

const initialState: MembersState = {
    members: [],
    loading: false,
    error: null,
}

export const fetchMembers = createAsyncThunk('members/fetchAll', async (projectId: string) => {
    return await membersService.getMembers(projectId);
});


const membersSlice = createSlice({
    name: 'members',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder 
            .addCase(fetchMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.members = action.payload;
            })
            .addCase(fetchMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lỗi khi tải thành viên';
            })
    }
})

export const { } = membersSlice.actions;

export default membersSlice.reducer;