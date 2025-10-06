import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IncomingRequest } from '../types';
import { requestsService } from '../services/requestsService';
import { membersService } from '../services/memberService';

interface RequestsState {
    sentRequests: IncomingRequest[];
    receivedRequests: IncomingRequest[];
    loading: boolean;
    error: string | null;
}

const initialState: RequestsState = {
    sentRequests: [],
    receivedRequests: [],
    loading: false,
    error: null,
};

export const fetchRequestsForUser = createAsyncThunk(
    'requests/fetchForUser',
    async (userId: string) => {
        return await requestsService.getRequestsForUser(userId);
    }
);

export const acceptRequest = createAsyncThunk(
    'requests/accept',
    async ({ id }: { id: string }) => {
        return await requestsService.updateRequestStatus(id, 'accepted');
    }
);

export const acceptAndAddMember = createAsyncThunk(
    'requests/acceptAndAddMember',
    async ({ requestId, memberData }: { requestId: string; memberData: { projectId: string; userId?: string; email: string; role: string } }) => {
        // 1) create the member
        const createdMember = await membersService.addMember({
            projectId: memberData.projectId,
            userId: memberData.userId || '',
            email: memberData.email,
            role: memberData.role,
        } as any);

        // 2) mark the request accepted
        const updatedRequest = await requestsService.updateRequestStatus(requestId, 'accepted');

        return { updatedRequest, createdMember };
    }
);

export const rejectRequest = createAsyncThunk(
    'requests/reject',
    async ({ id }: { id: string }) => {
        return await requestsService.updateRequestStatus(id, 'rejected');
    }
);

export const deleteRequest = createAsyncThunk(
    'requests/delete',
    async (id: string) => {
        return await requestsService.deleteRequest(id);
    }
);

const requestsSlice = createSlice({
    name: 'requests',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRequestsForUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchRequestsForUser.fulfilled, (state, action: PayloadAction<{ sentRequests: IncomingRequest[]; receivedRequests: IncomingRequest[] }>) => {
                state.loading = false;
                state.sentRequests = action.payload.sentRequests;
                state.receivedRequests = action.payload.receivedRequests;
            })
            .addCase(fetchRequestsForUser.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Lấy yêu cầu thất bại'; })

            .addCase(acceptRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(acceptRequest.fulfilled, (state, action: PayloadAction<IncomingRequest>) => {
                state.loading = false;
                const update = (arr: IncomingRequest[]) => arr.map(r => r.id === action.payload.id ? action.payload : r);
                state.sentRequests = update(state.sentRequests);
                state.receivedRequests = update(state.receivedRequests);
            })
            .addCase(acceptRequest.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Xử lý yêu cầu thất bại'; })

            .addCase(rejectRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(rejectRequest.fulfilled, (state, action: PayloadAction<IncomingRequest>) => {
                state.loading = false;
                const update = (arr: IncomingRequest[]) => arr.map(r => r.id === action.payload.id ? action.payload : r);
                state.sentRequests = update(state.sentRequests);
                state.receivedRequests = update(state.receivedRequests);
            })
            .addCase(rejectRequest.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Từ chối yêu cầu thất bại'; })
            .addCase(deleteRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteRequest.fulfilled, (state, action: PayloadAction<void, string, { arg: string }>) => {
                state.loading = false;
                state.sentRequests = state.sentRequests.filter(r => r.id !== action.meta.arg);
                state.receivedRequests = state.receivedRequests.filter(r => r.id !== action.meta.arg);
            })
            .addCase(deleteRequest.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Xoá yêu cầu thất bại'; });
    }
});

export const { clearError } = requestsSlice.actions;
export default requestsSlice.reducer;
