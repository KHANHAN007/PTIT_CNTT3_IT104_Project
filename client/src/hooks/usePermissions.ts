import { useMemo } from 'react';
import { useAppSelector } from './redux';
import type {
    ProjectPermissions,
    MemberRoleType
} from '../types';
import {
    canUserPerformAction,
    RolePermissions
} from '../types';

export const usePermissions = (projectId?: string) => {
    const { user } = useAppSelector(state => state.auth);
    const { members } = useAppSelector(state => state.members);

    const currentMember = useMemo(() => {
        if (!user?.id || !projectId) return null;
        return members.find(member =>
            member.projectId === projectId && member.userId === user.id
        );
    }, [user?.id, projectId, members]);

    const userRole = currentMember?.role;
    const permissions = useMemo(() => {
        if (!userRole) return null;
        return RolePermissions[userRole];
    }, [userRole]);

    const checkPermission = useMemo(() => {
        return (permission: keyof ProjectPermissions, targetUserId?: string): boolean => {
            if (!userRole) return false;
            return canUserPerformAction(userRole, permission, targetUserId, user?.id);
        };
    }, [userRole, user?.id]);

    const hasRole = useMemo(() => {
        return (role: MemberRoleType): boolean => {
            return userRole === role;
        };
    }, [userRole]);

    const isOwner = useMemo(() => {
        return hasRole('Project owner');
    }, [hasRole]);

    const isManager = useMemo(() => {
        return hasRole('Project manager');
    }, [hasRole]);

    const canManage = useMemo(() => {
        return isOwner || isManager;
    }, [isOwner, isManager]);

    return {
        currentMember,
        userRole,
        permissions,
        checkPermission,
        hasRole,
        isOwner,
        isManager,
        canManage,
        canEditProject: checkPermission('canEditProject'),
        canDeleteProject: checkPermission('canDeleteProject'),
        canManageMembers: checkPermission('canManageMembers'),
        canCreateTask: checkPermission('canCreateTask'),
        canEditAnyTask: checkPermission('canEditAnyTask'),
        canDeleteAnyTask: checkPermission('canDeleteAnyTask'),
        canAssignTasks: checkPermission('canAssignTasks'),
        canInviteMembers: checkPermission('canInviteMembers'),
        canRemoveMembers: checkPermission('canRemoveMembers'),
        canChangeRoles: checkPermission('canChangeRoles'),
        canViewAllTasks: checkPermission('canViewAllTasks'),
        canViewProjectSettings: checkPermission('canViewProjectSettings'),
    };
};

export default usePermissions;