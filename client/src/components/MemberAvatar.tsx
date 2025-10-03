import React from 'react';
import { Avatar } from 'antd';
import type { MemberWithUserInfo } from '../types';
import { getAvatarBackgroundColor } from '../types';

interface MemberAvatarProps {
    member: MemberWithUserInfo;
    size?: number | 'small' | 'default' | 'large';
    style?: React.CSSProperties;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
    member,
    size = 'default',
    style = {}
}) => {
    const backgroundColor = getAvatarBackgroundColor(member.role);

    return (
        <Avatar
            src={member.avatar}
            size={size}
            style={{
                backgroundColor: member.avatar ? undefined : backgroundColor,
                ...style
            }}
        >
            {!member.avatar && member.name ?
                member.name.charAt(0).toUpperCase() :
                member.email.charAt(0).toUpperCase()
            }
        </Avatar>
    );
};

export default MemberAvatar;