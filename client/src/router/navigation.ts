import { useLocation, useNavigate, useParams } from "react-router-dom";

export const useAppNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const goToProjects = () => navigate('/projects');
    const goToProject = (id: string) => navigate(`/projects/${id}`);
    const goToPersonalTasks = () => navigate('/personal-tasks');
    const goToProfile = () => navigate('/profile');
    const goToLogin = () => navigate('/login');
    const goToRegister = () => navigate('/register');
    const goBack = () => navigate(-1);

    return {
        navigate,
        location,
        params,
        goToProjects,
        goToProject,
        goToPersonalTasks,
        goToProfile,
        goToLogin,
        goToRegister,
        goBack,
    };
}

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    PROJECTS: '/projects',
    PROJECT_DETAIL: '/projects/:id',
    PERSONAL_TASKS: '/personal-tasks',
    PROFILE: '/profile',
} as const;