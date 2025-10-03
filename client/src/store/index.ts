import { configureStore } from "@reduxjs/toolkit";
import authReducer from './authSlice';
import projectsReducer from './projectsSlice';
import taskSlice from "./taskSlice";
import membersSlice from "./membersSlice";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        projects: projectsReducer,
        tasks: taskSlice,
        members: membersSlice
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;