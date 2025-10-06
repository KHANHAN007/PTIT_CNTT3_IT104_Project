import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
}

export const AuthRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const location = useLocation();

    if (isAuthenticated) {
        const from = (location.state as any)?.from?.pathname || '/profile';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};