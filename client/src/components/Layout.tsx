import React from 'react'
import { Layout as AntLayout, Avatar, Dropdown, Button, type MenuProps } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { CheckSquareOutlined, ProjectOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useAppNavigation, ROUTES } from '../router/navigation';
import { logout } from '../store/authSlice';

interface LayoutProps {
    children: React.ReactNode;
}
function Layout({ children }: LayoutProps) {
    const { navigate, location, goToProfile, goToProjects, goToPersonalTasks } = useAppNavigation();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);

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
            <Content style={{ padding: '20px' }}>
                {children}
            </Content>
            <Footer style={{ textAlign: 'center', background: '#212529', color: 'white' }}>
                © 2025 Team management. All rights reserved.
            </Footer>
        </AntLayout>
    )
}

export default Layout