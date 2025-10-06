import React, { useEffect } from 'react'
import { Layout as AntLayout, Avatar, Dropdown, Button, Badge, Alert, type MenuProps } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { createContext, useState, useCallback, useMemo } from 'react';
import { CheckSquareOutlined, ProjectOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useAppNavigation, ROUTES } from '../router/navigation';
import { logout } from '../store/authSlice';

interface LayoutProps {
    children: React.ReactNode;
}

// Global Alert Context
export interface GlobalAlert {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    description?: string;
}

export const GlobalAlertContext = createContext<{ showAlert: (alert: GlobalAlert) => void } | undefined>(undefined);

const Layout: React.FC<LayoutProps> = ({ children }) => {
    // ...existing code...
    // ...existing code...
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    // ...other hooks and variables...
    useEffect(() => {
        if (user?.id) {
            dispatch({ type: 'requests/fetchRequestsForUser/pending' }); // trigger loading state
            dispatch({ type: 'requests/fetchRequestsForUser', payload: user.id });
        }
    }, [user, dispatch]);
    const [alert, setAlert] = useState<GlobalAlert | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const showAlert = useCallback((a: GlobalAlert) => {
        setAlert(a);
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3500);
    }, []);
    const alertContextValue = useMemo(() => ({ showAlert }), [showAlert]);
    const { navigate, location, goToProfile, goToProjects, goToPersonalTasks, goToRequests } = useAppNavigation();
    const pendingRequestCount = useAppSelector(state => {
        const sent = Array.isArray(state.requests.sentRequests) ? state.requests.sentRequests : [];
        const received = Array.isArray(state.requests.receivedRequests) ? state.requests.receivedRequests : [];
        return [...sent, ...received].filter((r: any) => r.status === 'pending').length;
    });
    const handleLogout = () => {
        dispatch(logout());
        navigate(ROUTES.LOGIN)
    }
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: goToProfile,
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
            onClick: () => { },
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout,
        },
    ];

    return (
        <GlobalAlertContext.Provider value={alertContextValue}>
            <AntLayout style={{ minHeight: '100vh' }}>
                <Header style={{
                    background: '#212529',
                    padding: '0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ color: 'white', margin: '0 20px 0 0' }}>Quản Lý Dự Án</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Button
                            type="text"
                            icon={<ProjectOutlined />}
                            onClick={goToProjects}
                            style={{
                                color: location.pathname === ROUTES.PROJECTS ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                                border: 'none',
                                height: '40px',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            Quản Lý Dự Án
                        </Button>
                        <Button
                            type="text"
                            icon={<CheckSquareOutlined />}
                            onClick={goToPersonalTasks}
                            style={{
                                color: location.pathname === ROUTES.PERSONAL_TASKS ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                                border: 'none',
                                height: '40px',
                                background: 'transparent',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            Nhiệm Vụ Cá Nhân
                        </Button>
                        <Badge count={pendingRequestCount} size='small' offset={[1, 1]} style={{ background: '#ff4d4f', fontWeight: 600 }}>
                            <Button
                                type="text"
                                icon={<CheckSquareOutlined />}
                                onClick={goToRequests}
                                style={{
                                    color: location.pathname === ROUTES.REQUESTS ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                                    border: 'none',
                                    height: '40px',
                                    background: 'transparent',
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                Yêu cầu
                            </Button>
                        </Badge>
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar
                                    src={user?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <span style={{ color: 'white' }}>{user?.name || 'User'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                {alertVisible && alert && (
                    <div style={{ position: 'fixed', top: 70, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            description={alert.description}
                            showIcon
                            closable
                            onClose={() => setAlertVisible(false)}
                            style={{ minWidth: 320, maxWidth: 480, fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        />
                    </div>
                )}
                <Content style={{ padding: '20px', width: '90%', display: 'block', margin: '0 auto' }}>
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center', background: '#212529', color: 'white' }}>
                    © 2025 Team management. All rights reserved.
                </Footer>
            </AntLayout>
        </GlobalAlertContext.Provider>
    )
}

export default Layout