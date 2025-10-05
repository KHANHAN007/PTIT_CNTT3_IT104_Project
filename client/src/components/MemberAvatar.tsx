import React, { useEffect } from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchUserById } from '../store/usersSlice';
import type { ProjectMember } from '../types';
import { MemberRole } from '../types';

interface MemberAvatarProps {
    member: ProjectMember;
    size?: number | "large" | "small" | "default";
    showName?: boolean;
    nameStyle?: React.CSSProperties;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({
    member,
    size = "default",
    showName = false,
    nameStyle = {}
}) => {
    const dispatch = useAppDispatch();
    const { users } = useAppSelector(state => state.users);

    const user = users.find(u => u.id === member.userId);

    useEffect(() => {
        if (!user) {
            dispatch(fetchUserById(member.userId));
        }
    }, [dispatch, member.userId, user]);

    const avatarBackgroundColor = member.role === MemberRole.PROJECT_OWNER ? '#52c41a' : '#1890ff';

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
                size={size}
                src={user?.avatar}
                icon={!user?.avatar && <UserOutlined />}
                style={{
                    backgroundColor: user?.avatar ? undefined : avatarBackgroundColor,
                    border: '2px solid #f0f0f0'
                }}
            >
                {!user?.avatar && member.email.charAt(0).toUpperCase()}
            </Avatar>
            {showName && (
                <div style={{ ...nameStyle, textAlign: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                        {user?.name || member.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        {member.role}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberAvatar;