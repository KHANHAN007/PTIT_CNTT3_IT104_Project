import { Spin } from "antd";
import { ProtectedRoute, AuthRoute } from './guards';
import { Suspense } from "react";
import { Login, Layout, Register, Projects, ProjectDetail, Profile, IncomingRequests, PersonalTasks } from "./lazyComponents";
import type { RouteObject } from "react-router-dom";

const PageLoading = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
    }}>
        <Spin size="large" />
    </div>
);

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Suspense fallback={<PageLoading />}>
        {children}
    </Suspense>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ProtectedRoute>
        <SuspenseWrapper>
            <Layout >
                {children}
            </Layout>
        </SuspenseWrapper>
    </ProtectedRoute>
);


export const routes: RouteObject[] = [
    {
        path: "/",
        element: (
            <ProtectedLayout>
                <Profile />
            </ProtectedLayout>
        ),
    },
    {
        path: "/login",
        element: <AuthRoute>
            <SuspenseWrapper><Login /></SuspenseWrapper>
        </AuthRoute>,
    },
    {
        path: "/register",
        element:
            <AuthRoute>
                <SuspenseWrapper><Register /></SuspenseWrapper>
            </AuthRoute>
    },
    {
        path: "/projects",
        element:
            <ProtectedLayout>
                <SuspenseWrapper>
                    <Projects />
                </SuspenseWrapper>
            </ProtectedLayout>,
    },
    {
        path: '/projects/:id',
        element: (
            <ProtectedLayout>
                <ProjectDetail />
            </ProtectedLayout>
        ),
    },
    {
        path: '/profile',
        element: (
            <ProtectedLayout>
                <Profile />
            </ProtectedLayout>
        ),
    },
    {
        path: '/requests',
        element: (
            <ProtectedLayout>
                <IncomingRequests />
            </ProtectedLayout>
        ),
    },
    {
        path: '/personal-tasks',
        element: (
            <ProtectedLayout>
                <PersonalTasks />
            </ProtectedLayout>
        ),
    },
    {
        path: '*',
        element: (
            <SuspenseWrapper>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column'
                }}>
                    <h1>404 - Trang không tồn tại</h1>
                    <p>Trang bạn đang tìm kiếm không tồn tại.</p>
                </div>
            </SuspenseWrapper>
        ),
    },
];