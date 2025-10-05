import { configureStore } from "@reduxjs/toolkit";
import authReducer from './authSlice';
import projectsReducer from './projectsSlice';
import tasksReducer from './tasksSlice';
import membersReducer from './membersSlice';
import usersReducer from './usersSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        projects: projectsReducer,
        tasks: tasksReducer,
        members: membersReducer,
        users: usersReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;