import { tasksService } from './tasksService';
import type { Task } from '../types';

interface TaskTimeRecord {
    taskId: string;
    startTime: number; // timestamp khi bắt đầu
    lastSyncTime: number; // thời gian sync cuối cùng
    totalMinutesWhenStarted: number; // thời gian đã có trước khi bắt đầu session này
}

class PassiveTimeService {
    private activeTaskRecords: Map<string, TaskTimeRecord> = new Map();
    private readonly STORAGE_KEY = 'passive_task_times';

    constructor() {
        this.loadFromStorage();

        // Tự động sync khi page unload hoặc khi tab bị ẩn
        window.addEventListener('beforeunload', () => {
            this.syncAllToServer();
        });

        // Sync khi tab bị ẩn (user chuyển tab khác)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.syncAllToServer();
            }
        });
    }

    // Bắt đầu theo dõi thời gian cho task (khi chuyển sang In Progress)
    public startPassiveTracking(taskId: string, currentTimeSpentMinutes: number = 0): void {
        const now = Date.now();

        const record: TaskTimeRecord = {
            taskId,
            startTime: now,
            lastSyncTime: now,
            totalMinutesWhenStarted: currentTimeSpentMinutes
        };

        this.activeTaskRecords.set(taskId, record);
        this.saveToStorage();

        console.log(`✅ PassiveTimeService: Started tracking for task ${taskId} at ${new Date(now).toLocaleTimeString()}`);
    }

    // Dừng tracking (khi task không còn In Progress)
    public stopPassiveTracking(taskId: string): number {
        const record = this.activeTaskRecords.get(taskId);
        if (!record) return 0;

        const timeWorked = this.calculateTimeWorked(taskId);
        this.activeTaskRecords.delete(taskId);
        this.saveToStorage();

        console.log(`⏹️ PassiveTimeService: Stopped tracking for task ${taskId}, worked: ${timeWorked} minutes`);
        return timeWorked;
    }

    // Tính thời gian đã làm cho task
    public calculateTimeWorked(taskId: string): number {
        const record = this.activeTaskRecords.get(taskId);
        if (!record) return 0;

        const now = Date.now();
        const timeWorkedMs = now - record.startTime;
        const timeWorkedMinutes = Math.floor(timeWorkedMs / (1000 * 60)); // convert to minutes

        return timeWorkedMinutes;
    }

    // Lấy tổng thời gian (bao gồm thời gian trước đó + thời gian session hiện tại)
    public getTotalTimeForTask(taskId: string): number {
        const record = this.activeTaskRecords.get(taskId);
        if (!record) return 0;

        const sessionTime = this.calculateTimeWorked(taskId);
        return record.totalMinutesWhenStarted + sessionTime;
    }

    public isTracking(taskId: string): boolean {
        return this.activeTaskRecords.has(taskId);
    }

    public getActiveTaskIds(): string[] {
        return Array.from(this.activeTaskRecords.keys());
    }

    public async syncTaskToServer(taskId: string): Promise<boolean> {
        const record = this.activeTaskRecords.get(taskId);
        if (!record) return false;

        try {
            const totalTime = this.getTotalTimeForTask(taskId);

            // Chỉ sync nếu có thời gian đáng kể (ít nhất 1 phút)
            if (totalTime <= record.totalMinutesWhenStarted) return false;

            await tasksService.updateTask(taskId, {
                timeSpentMinutes: totalTime
            });

            // Cập nhật thời gian sync cuối
            record.lastSyncTime = Date.now();
            record.totalMinutesWhenStarted = totalTime; // Reset base time
            record.startTime = Date.now(); // Reset start time
            this.saveToStorage();

            console.log(`🔄 PassiveTimeService: Synced ${totalTime} minutes for task ${taskId}`);
            return true;
        } catch (error) {
            console.error(`❌ PassiveTimeService: Failed to sync task ${taskId}:`, error);
            return false;
        }
    }

    // Đồng bộ tất cả task lên server
    public async syncAllToServer(): Promise<void> {
        const syncPromises = this.getActiveTaskIds().map(taskId =>
            this.syncTaskToServer(taskId)
        );

        await Promise.all(syncPromises);
    }

    // Tự động bắt đầu tracking cho các task In Progress
    public async initializeFromTasks(tasks: Task[]): Promise<void> {
        const inProgressTasks = tasks.filter(task => task.status === 'In Progress');

        for (const task of inProgressTasks) {
            if (!this.isTracking(task.id)) {
                this.startPassiveTracking(task.id, task.timeSpentMinutes || 0);
            }
        }

        console.log(`🚀 PassiveTimeService: Initialized tracking for ${inProgressTasks.length} In Progress tasks`);
    }

    // Cập nhật tracking dựa trên thay đổi task status
    public updateTrackingFromTaskChanges(tasks: Task[]): void {
        const inProgressTaskIds = new Set(
            tasks.filter(task => task.status === 'In Progress').map(task => task.id)
        );

        // Dừng tracking cho task không còn In Progress
        for (const taskId of this.getActiveTaskIds()) {
            if (!inProgressTaskIds.has(taskId)) {
                this.stopPassiveTracking(taskId);
            }
        }

        // Bắt đầu tracking cho task mới chuyển sang In Progress
        for (const task of tasks) {
            if (task.status === 'In Progress' && !this.isTracking(task.id)) {
                this.startPassiveTracking(task.id, task.timeSpentMinutes || 0);
            }
        }
    }

    // Lấy thông tin tổng quan về task
    public getTaskSummary(taskId: string): {
        isTracking: boolean;
        startTime: Date | null;
        currentSessionMinutes: number;
        totalMinutes: number;
        lastSyncTime: Date | null;
    } {
        const record = this.activeTaskRecords.get(taskId);

        return {
            isTracking: !!record,
            startTime: record ? new Date(record.startTime) : null,
            currentSessionMinutes: record ? this.calculateTimeWorked(taskId) : 0,
            totalMinutes: record ? this.getTotalTimeForTask(taskId) : 0,
            lastSyncTime: record ? new Date(record.lastSyncTime) : null
        };
    }

    // Lưu vào localStorage
    private saveToStorage(): void {
        try {
            const data = {
                records: Array.from(this.activeTaskRecords.entries()),
                lastSave: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('PassiveTimeService: Failed to save to localStorage:', error);
        }
    }

    // Load từ localStorage
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return;

            const parsed = JSON.parse(data);
            if (parsed.records) {
                for (const [taskId, record] of parsed.records) {
                    this.activeTaskRecords.set(taskId, record);
                }
            }

            console.log(`📱 PassiveTimeService: Loaded ${this.activeTaskRecords.size} task records from storage`);
        } catch (error) {
            console.error('PassiveTimeService: Failed to load from localStorage:', error);
        }
    }

    // Xóa tracking cho task
    public clearTaskTracking(taskId: string): void {
        this.activeTaskRecords.delete(taskId);
        this.saveToStorage();
    }

    // Cleanup
    public destroy(): void {
        this.syncAllToServer();
        this.activeTaskRecords.clear();
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

// Export singleton instance
export const passiveTimeService = new PassiveTimeService();

// Helper function để format thời gian
export const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
};

export const formatTimeDetailed = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} phút`;
    return `${hours} giờ ${mins} phút`;
};