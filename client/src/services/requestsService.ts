import { api } from './api';
import type { IncomingRequest } from '../types';

export const requestsService = {
    async getRequestsForUser(userId: string): Promise<{ sentRequests: IncomingRequest[]; receivedRequests: IncomingRequest[] }> {
        // Lấy yêu cầu đã gửi
        const sentRes = await api.get(`/requests?senderId=${userId}`);
        // Lấy yêu cầu đã nhận
        const receivedRes = await api.get(`/requests?recipientId=${userId}`);
        return {
            sentRequests: sentRes.data,
            receivedRequests: receivedRes.data,
        };
    },

    async createRequest(requestData: Omit<IncomingRequest, 'id' | 'createdAt' | 'status'> & { status?: string }): Promise<IncomingRequest> {
        const payload = { ...requestData, status: requestData.status || 'pending', createdAt: new Date().toISOString() };
        const response = await api.post('/requests', payload);
        const createdRequest = response.data;

        // Add to sender's sentRequests
        if (createdRequest.senderId) {
            try {
                const senderRes = await api.get(`/users/${createdRequest.senderId}`);
                const sender = senderRes.data;
                const sentRequests = Array.isArray(sender.sentRequests) ? sender.sentRequests : [];
                await api.patch(`/users/${createdRequest.senderId}`, {
                    sentRequests: [...sentRequests, createdRequest]
                });
            } catch (err) {
                // ignore if user not found
            }
        }
        // Add to recipient's receivedRequests
        if (createdRequest.recipientId) {
            try {
                const recipientRes = await api.get(`/users/${createdRequest.recipientId}`);
                const recipient = recipientRes.data;
                const receivedRequests = Array.isArray(recipient.receivedRequests) ? recipient.receivedRequests : [];
                await api.patch(`/users/${createdRequest.recipientId}`, {
                    receivedRequests: [...receivedRequests, createdRequest]
                });
            } catch (err) {
                // ignore if user not found
            }
        }
        return createdRequest;
    },

    async updateRequestStatus(id: string, status: 'accepted' | 'rejected' | 'pending') {
        let patch: any = { status };
        const now = new Date().toISOString();
        if (status === 'accepted') patch.acceptedAt = now;
        if (status === 'rejected') patch.rejectedAt = now;
        if (status === 'pending') {
            patch.acceptedAt = null;
            patch.rejectedAt = null;
        }
        const response = await api.patch(`/requests/${id}`, patch);
        return response.data;
    },

    async deleteRequest(id: string) {
        // Lấy request để biết senderId
        const reqRes = await api.get(`/requests/${id}`);
        const request = reqRes.data;
        // Update status trong sentRequests của user
        if (request.senderId) {
            const userRes = await api.get(`/users/${request.senderId}`);
            const user = userRes.data;
            if (Array.isArray(user.sentRequests)) {
                const updatedSentRequests = user.sentRequests.map((r: any) =>
                    r.id === id ? { ...r, status: 'rejected' } : r
                );
                await api.patch(`/users/${request.senderId}`, { sentRequests: updatedSentRequests });
            }
        }
        await api.delete(`/requests/id=${id}`);
    }
};
