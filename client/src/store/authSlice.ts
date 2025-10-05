import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User, UpdateProfileRequest } from "../types";
import { authService } from "../services/authService";

const getUserFromStorage = (): User | null => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
        return null;
    }
};

const storedUser = getUserFromStorage();

const initialState: AuthState = {
    user: storedUser,
    isAuthenticated: !!storedUser,
    loading: false,
    error: null,
}

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string, password: string }) => {
        return await authService.login({ email, password });
    }
)

export const register = createAsyncThunk(
    'auth/register',
    async ({ name, email, password, confirmPassword }: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        return await authService.register({ name, email, password, confirmPassword });
    }
);

export const getUserProfile = createAsyncThunk(
    'auth/getUserProfile',
    async (userId: string) => {
        return await authService.getUserProfile(userId);
    }
)

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async ({ userId, updateData }: { userId: string; updateData: UpdateProfileRequest }) => {
        return await authService.updateProfile(userId, updateData);
    }
)
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
            try {
                localStorage.removeItem('user');
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
            authService.logout();
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                try {
                    localStorage.setItem('user', JSON.stringify(action.payload));
                } catch (error) {
                    console.error('Error saving user to localStorage:', error);
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Đăng nhập thất bại';
            })

            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
                try {
                    localStorage.setItem('user', JSON.stringify(action.payload));
                } catch (error) {
                    console.error('Error saving user to localStorage:', error);
                }
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Đăng ký thất bại';
            })


            .addCase(getUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
                try {
                    localStorage.setItem('user', JSON.stringify(action.payload));
                } catch (error) {
                    console.error('Error saving user to localStorage:', error);
                }
            })
            .addCase(getUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Lấy thông tin người dùng thất bại';
            })

            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
                try {
                    localStorage.setItem('user', JSON.stringify(action.payload));
                } catch (error) {
                    console.error('Error saving user to localStorage:', error);
                }
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Cập nhật thông tin thất bại';
            });
    }
})

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;