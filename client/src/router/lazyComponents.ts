import { lazy } from 'react';
export const Login = lazy(() => import('../pages/Login'));
export const Register = lazy(() => import('../pages/Register'));
export const Projects = lazy(() => import('../pages/Projects'));
export const ProjectDetail = lazy(() => import('../pages/ProjectDetail'));
export const Profile = lazy(() => import('../pages/Profile'));
// export const PersonalTasks = lazy(() => import('../pages/PersonalTasks'));
// export const UserProfile = lazy(() => import('../pages/UserProfile'));

export const Layout = lazy(() => import('../components/Layout'));