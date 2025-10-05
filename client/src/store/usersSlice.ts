import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types";
import { userService } from "../services/userService";

interface UsersState {
    users: User[];
    loading: boolean;
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    loading: false,
    error: null,
};

export const fetchAllUsers = createAsyncThunk(
    'users/fetchAllUsers',
    async () => {
        return await userService.getAllUsers();
    }
);

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (userId: string) => {
        return await userService.getUserById(userId);
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
                state.loading = false;
                state.users = action.payload;
                state.error = null;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lấy danh sách người dùng thất bại';
            })

            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
                state.loading = false;
                const existingIndex = state.users.findIndex(user => user.id === action.payload.id);
                if (existingIndex >= 0) {
                    state.users[existingIndex] = action.payload;
                } else {
                    state.users.push(action.payload);
                }
                state.error = null;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lấy thông tin người dùng thất bại';
            });
    }
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;