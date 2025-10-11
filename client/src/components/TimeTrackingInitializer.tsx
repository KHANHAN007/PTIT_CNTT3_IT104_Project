import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { usePassiveTimeTracking } from '../hooks/usePassiveTimeTracking';
import { fetchUserTasksAsync } from '../store/tasksSlice';

const TimeTrackingInitializer: React.FC = () => {
    const user = useAppSelector(state => state.auth.user);
    const tasks = useAppSelector(state => state.tasks.tasks);
    const dispatch = useAppDispatch();
    const passiveTracking = usePassiveTimeTracking();
    const initializeRef = useRef<boolean>(false);
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize tracking when user logs in
    useEffect(() => {
        if (user?.id && !initializeRef.current) {
            console.log('🚀 TimeTrackingInitializer: User logged in, initializing passive time tracking...');
            initializeRef.current = true;

            // Fetch user tasks first, then initialize tracking
            dispatch(fetchUserTasksAsync(user.id));
        }
    }, [user?.id, dispatch]);

    // Initialize passive tracking when tasks are loaded
    useEffect(() => {
        if (tasks.length > 0 && user?.id) {
            console.log('📋 TimeTrackingInitializer: Tasks loaded, initializing tracking for In Progress tasks...');
            passiveTracking.initializeFromTasks(tasks);
        }
    }, [tasks, user?.id]); // Remove passiveTracking dependency

    // Update tracking when task status changes
    useEffect(() => {
        if (tasks.length > 0) {
            passiveTracking.updateTrackingFromTaskChanges(tasks);
        }
    }, [tasks]); // Remove passiveTracking dependency

    // Auto-sync every 2 minutes (much less frequent)
    useEffect(() => {
        if (user?.id) {
            // Clear existing interval
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }

            syncIntervalRef.current = setInterval(async () => {
                try {
                    const activeIds = passiveTracking.getActiveTaskIds();
                    if (activeIds.length > 0) {
                        console.log('🔄 TimeTrackingInitializer: Auto-syncing active tasks:', activeIds);
                        await passiveTracking.syncAllToServer();

                        // Refresh tasks to see updated time
                        dispatch(fetchUserTasksAsync(user.id));
                    }
                } catch (error) {
                    console.error('❌ TimeTrackingInitializer: Auto-sync failed:', error);
                }
            }, 120000); // 2 minutes

            return () => {
                if (syncIntervalRef.current) {
                    clearInterval(syncIntervalRef.current);
                }
            };
        }
    }, [user?.id, dispatch]); // Remove passiveTracking dependency

    return null; // This component doesn't render anything
};

export default TimeTrackingInitializer;