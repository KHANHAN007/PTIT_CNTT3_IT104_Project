import { useState, useEffect, useCallback } from 'react';
import { passiveTimeService } from '../services/passiveTimeService';
import type { Task } from '../types';

export interface UsePassiveTimeTrackingReturn {
    // State queries
    isTracking: (taskId: string) => boolean;
    getTaskSummary: (taskId: string) => ReturnType<typeof passiveTimeService.getTaskSummary>;
    getActiveTaskIds: () => string[];

    // Control methods
    startTracking: (taskId: string, currentTime?: number) => void;
    stopTracking: (taskId: string) => number;
    clearTaskTracking: (taskId: string) => void;

    // Batch operations
    initializeFromTasks: (tasks: Task[]) => Promise<void>;
    updateTrackingFromTaskChanges: (tasks: Task[]) => void;
    syncAllToServer: () => Promise<void>;
    syncTaskToServer: (taskId: string) => Promise<boolean>;

    // State for re-rendering (minimal)
    activeTaskIds: string[];
    lastUpdate: number;
}

export const usePassiveTimeTracking = (): UsePassiveTimeTrackingReturn => {
    const [activeTaskIds, setActiveTaskIds] = useState<string[]>(() =>
        passiveTimeService.getActiveTaskIds()
    );
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    // Update state only when needed (much more optimized)
    useEffect(() => {
        const updateState = () => {
            const currentIds = passiveTimeService.getActiveTaskIds();
            setActiveTaskIds(prev => {
                // Only update if actually changed (deep comparison)
                const prevSorted = [...prev].sort();
                const currentSorted = [...currentIds].sort();

                if (prevSorted.length !== currentSorted.length ||
                    !prevSorted.every((id, index) => id === currentSorted[index])) {
                    return currentIds;
                }
                return prev;
            });
            setLastUpdate(Date.now());
        };

        // Update every minute instead of 30 seconds to reduce overhead
        const interval = setInterval(updateState, 60000);

        return () => clearInterval(interval);
    }, []);

    // Stable methods
    const startTracking = useCallback((taskId: string, currentTime?: number) => {
        passiveTimeService.startPassiveTracking(taskId, currentTime);
        setActiveTaskIds(passiveTimeService.getActiveTaskIds());
    }, []);

    const stopTracking = useCallback((taskId: string): number => {
        const timeWorked = passiveTimeService.stopPassiveTracking(taskId);
        setActiveTaskIds(passiveTimeService.getActiveTaskIds());
        return timeWorked;
    }, []);

    const clearTaskTracking = useCallback((taskId: string) => {
        passiveTimeService.clearTaskTracking(taskId);
        setActiveTaskIds(passiveTimeService.getActiveTaskIds());
        setLastUpdate(Date.now());
    }, []);

    // Pass-through methods (no state updates needed)
    const isTracking = useCallback((taskId: string) =>
        passiveTimeService.isTracking(taskId), []
    );

    const getTaskSummary = useCallback((taskId: string) =>
        passiveTimeService.getTaskSummary(taskId), [lastUpdate] // Re-calculate when lastUpdate changes
    );

    const getActiveTaskIds = useCallback(() =>
        passiveTimeService.getActiveTaskIds(), []
    );

    const initializeFromTasks = useCallback(async (tasks: Task[]) => {
        await passiveTimeService.initializeFromTasks(tasks);
        setActiveTaskIds(passiveTimeService.getActiveTaskIds());
    }, []);

    const updateTrackingFromTaskChanges = useCallback((tasks: Task[]) => {
        passiveTimeService.updateTrackingFromTaskChanges(tasks);
        setActiveTaskIds(passiveTimeService.getActiveTaskIds());
    }, []);

    const syncAllToServer = useCallback(() =>
        passiveTimeService.syncAllToServer(), []
    );

    const syncTaskToServer = useCallback((taskId: string) =>
        passiveTimeService.syncTaskToServer(taskId), []
    );

    return {
        // State
        activeTaskIds,
        lastUpdate,

        // Queries
        isTracking,
        getTaskSummary,
        getActiveTaskIds,

        // Control methods
        startTracking,
        stopTracking,
        clearTaskTracking,

        // Batch operations
        initializeFromTasks,
        updateTrackingFromTaskChanges,
        syncAllToServer,
        syncTaskToServer,
    };
};