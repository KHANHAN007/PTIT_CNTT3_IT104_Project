import React, { useEffect, useState } from 'react';
import { GlobalAlertContext } from '../components/Layout';
import { useContext } from 'react';
import { userService } from '../services/userService';
import { projectsService } from '../services/projectsService';
import { tasksService } from '../services/tasksService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { UserOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchRequestsForUser, rejectRequest, acceptRequest, acceptAndAddMember, deleteRequest } from '../store/requestsSlice';
import {
    Card,
    Avatar,
    Button,
    Popconfirm,
    Typography,
    Tag,
    Descriptions,
    Table,
} from 'antd';

const IncomingRequests: React.FC = () => {
    const [tab, setTab] = useState<'received' | 'sent'>('received');
    const { showAlert } = useContext(GlobalAlertContext) || {};
    const [localProjectMap, setLocalProjectMap] = useState<Record<string, any>>({});
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((s) => s.auth);
    const receivedRequests = useAppSelector((s) => s.requests.receivedRequests);
    const sentRequests = useAppSelector((s) => s.requests.sentRequests);
    const { users = [] } = useAppSelector((s) => s.users);
    const { projects = [] } = useAppSelector((s) => s.projects);
    const { loading } = useAppSelector((s) => s.requests);

    const [localUserMap, setLocalUserMap] = useState<Record<string, any>>({});
    const [expandedPendingKeys, setExpandedPendingKeys] = useState<React.Key[]>([]);
    const [expandedHistoryKeys, setExpandedHistoryKeys] = useState<React.Key[]>([]);
    const [collapsingRows, setCollapsingRows] = useState<Record<string, boolean>>({});
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            dispatch(fetchRequestsForUser(user.id));
        }
    }, [user, dispatch]);

    // Debug: Log requests để xem dữ liệu
    useEffect(() => {
        if (receivedRequests.length > 0 || sentRequests.length > 0) {
            console.log('Received Requests:', receivedRequests);
            console.log('Sent Requests:', sentRequests);
        }
    }, [receivedRequests, sentRequests]);
    useEffect(() => {
        const expandedRows = document.querySelectorAll(".ant-table-expanded-row");
        expandedRows.forEach((row) => {
            row.classList.remove("show");
            requestAnimationFrame(() => {
                row.classList.add("show");
            });
        });
    }, [expandedPendingKeys, expandedHistoryKeys]);
    const allRequests = [...receivedRequests, ...sentRequests];
    useEffect(() => {
        if (allRequests.length === 0) return;

        const missingUserIds = new Set<string>();
        const missingProjectIds = new Set<string>();

        for (const r of allRequests) {
            // Check senderId
            if (r.senderId && !users.find((u: any) => u.id === r.senderId) && !localUserMap[r.senderId]) {
                missingUserIds.add(r.senderId);
            }
            // Check recipientId (important for task_update requests)
            if (r.recipientId) {
                const recipientIds = Array.isArray(r.recipientId) ? r.recipientId : [r.recipientId];
                for (const id of recipientIds) {
                    if (!users.find((u: any) => u.id === id) && !localUserMap[id]) {
                        missingUserIds.add(id);
                    }
                }
            }
            // Check payload userId
            if (r.payload && r.payload.userId && !users.find((u: any) => u.id === r.payload.userId) && !localUserMap[r.payload.userId]) {
                missingUserIds.add(r.payload.userId);
            }
            // Check projectId
            if (r.projectId && !projects.find((p: any) => p.id === r.projectId) && !localProjectMap[r.projectId]) {
                missingProjectIds.add(r.projectId);
            }
        }

        if (missingUserIds.size === 0 && missingProjectIds.size === 0) return;

        console.log('Loading missing data:', { missingUserIds: Array.from(missingUserIds), missingProjectIds: Array.from(missingProjectIds) });

        (async () => {
            try {
                if (missingUserIds.size > 0) {
                    const ids = Array.from(missingUserIds);
                    console.log('Fetching users with IDs:', ids);
                    const results = await Promise.all(ids.map(id => userService.getUserById(id).catch((err) => {
                        console.error(`Failed to fetch user ${id}:`, err);
                        return null;
                    })));
                    const nextUsers: Record<string, any> = {};
                    results.forEach((u, i) => {
                        if (u) {
                            nextUsers[ids[i]] = u;
                            console.log(`Successfully loaded user ${ids[i]}:`, u.name);
                        }
                    });
                    if (Object.keys(nextUsers).length > 0) {
                        console.log('Adding users to localUserMap:', nextUsers);
                        setLocalUserMap(prev => ({ ...prev, ...nextUsers }));
                    }
                }

                if (missingProjectIds.size > 0) {
                    const ids = Array.from(missingProjectIds);
                    const results = await Promise.all(ids.map(id => projectsService.getProjectById(id).catch(() => null)));
                    const nextProjects: Record<string, any> = {};
                    results.forEach((p, i) => { if (p) nextProjects[ids[i]] = p; });
                    if (Object.keys(nextProjects).length > 0) setLocalProjectMap(prev => ({ ...prev, ...nextProjects }));
                }
            } catch (err) {
                console.error('Failed to fetch referenced users/projects', err);
            }
        })();
    }, [allRequests, users, projects, localUserMap, localProjectMap]);

    const resolveUser = (id?: string): any => {
        if (!id) return null;
        const foundUser = users.find((u: any) => u.id === id) || localUserMap[id];
        if (!foundUser) {
            console.log(`User not found for ID: ${id}`, { users, localUserMap });
        }
        return foundUser || null;
    };

    const resolveProject = (id?: string): any => {
        if (!id) return null;
        return projects.find((p: any) => p.id === id) || localProjectMap[id] || null;
    };

    const onAccept = async (request: any) => {
        setProcessingRequests(prev => new Set(prev.add(request.id)));
        try {
            if (request.type === 'invite') {
                const payload = request.payload || {};
                const memberData = {
                    projectId: request.projectId || payload.projectId || '',
                    userId: payload.userId || request.senderId || '',
                    email: payload.email || request.senderId || '',
                    role: payload.role || 'Member',
                };

                await dispatch(acceptAndAddMember({ requestId: request.id, memberData })).unwrap();
            } else if (request.type === 'task_update') {
                // Accept request trước
                await dispatch(acceptRequest({ id: request.id })).unwrap();

                // Sau đó cập nhật task với những thay đổi được yêu cầu
                if (request.metadata?.taskId && request.metadata?.requestedChanges) {
                    const taskId = request.metadata.taskId;
                    const changes = request.metadata.requestedChanges;

                    try {
                        // Cập nhật task sử dụng service
                        await tasksService.updateTask(taskId, changes);

                        console.log('Task updated successfully:', taskId, changes);
                    } catch (taskUpdateError) {
                        console.error('Error updating task:', taskUpdateError);
                        if (showAlert) {
                            showAlert({ type: 'warning', message: 'Chú ý', description: 'Yêu cầu đã được chấp nhận nhưng cập nhật task thất bại!' });
                        }
                    }
                }
            } else {
                // Xử lý các loại request khác
                await dispatch(acceptRequest({ id: request.id })).unwrap();
            }

            if (showAlert) {
                showAlert({ type: 'success', message: 'Thành công', description: 'Yêu cầu đã được chấp nhận!' });
            }
            if (user) dispatch(fetchRequestsForUser(user.id));
        } catch (err: any) {
            if (showAlert) {
                showAlert({ type: 'error', message: 'Lỗi', description: 'Chấp nhận yêu cầu thất bại!' });
            }
            console.error(err);
        } finally {
            setProcessingRequests(prev => {
                const next = new Set(prev);
                next.delete(request.id);
                return next;
            });
        }
    };
    const onCancelRequest = async (id: string) => {
        try {
            await dispatch(rejectRequest({ id })).unwrap();
            await dispatch(deleteRequest(id)).unwrap();
            if (showAlert) {
                showAlert({ type: 'success', message: 'Thành công', description: 'Yêu cầu đã được huỷ!' });
            }
            if (user) dispatch(fetchRequestsForUser(user.id));
        } catch (err) {
            if (showAlert) {
                showAlert({ type: 'error', message: 'Lỗi', description: 'Huỷ yêu cầu thất bại!' });
            }
            console.error(err);
        }
    };
    const onReject = async (id: string) => {
        setProcessingRequests(prev => new Set(prev.add(id)));
        try {
            await dispatch(rejectRequest({ id })).unwrap();
            if (showAlert) {
                showAlert({ type: 'success', message: 'Thành công', description: 'Yêu cầu đã được từ chối!' });
            }
            if (user) dispatch(fetchRequestsForUser(user.id));
        } catch (err) {
            if (showAlert) {
                showAlert({ type: 'error', message: 'Lỗi', description: 'Từ chối yêu cầu thất bại!' });
            }
            console.error(err);
        } finally {
            setProcessingRequests(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };


    const pending = (tab === 'received' ? receivedRequests : sentRequests).filter((r: any) => r.status === 'pending');
    const history = (tab === 'received' ? receivedRequests : sentRequests).filter((r: any) => r.status !== 'pending');

    const expandedRowRender = (item: any): React.ReactNode => {
        const sender = resolveUser(item.senderId);
        // Nếu recipientId là mảng, lấy danh sách user
        let recipients: any[] = [];
        if (Array.isArray(item.recipientId)) {
            recipients = item.recipientId.map((id: string) => resolveUser(id)).filter(Boolean);
        } else if (item.recipientId) {
            const r = resolveUser(item.recipientId);
            if (r) recipients = [r];
        }
        const project = resolveProject(item.projectId);
        const p = item.payload || {};
        const payloadUser = resolveUser(p.userId);
        const isCollapsing = collapsingRows[item.id];
        const isPending = item.status === 'pending';
        const isSentTab = tab === 'sent';
        return (
            <div className={`collapse-anim-wrapper${isCollapsing ? ' collapsing' : ' expanded'}`}
                style={{ padding: 0, background: 'transparent' }}>
                <Descriptions
                    column={2}
                    size="small"
                    layout="horizontal"
                    style={{ background: '#fff', borderRadius: 8, padding: 12 }}
                    labelStyle={{ fontWeight: 600, minWidth: 100 }}
                    contentStyle={{ width: '50%' }}
                >
                    <Descriptions.Item label="Dự án">{project?.name || '—'}</Descriptions.Item>
                    {isSentTab ? (
                        <Descriptions.Item label="Người nhận">
                            <div style={{ display: 'flex', gap: 12 }}>
                                {recipients.length > 0 ? recipients.map((r, idx) => (
                                    <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Avatar size={20} src={r.avatar} style={{ marginRight: 6 }} />
                                        {r.name}
                                        <span style={{ color: '#888', fontSize: 12 }}>({r.email})</span>
                                        {idx < recipients.length - 1 && <span style={{ margin: '0 4px' }}>|</span>}
                                    </span>
                                )) : item.recipientId}
                            </div>
                        </Descriptions.Item>
                    ) : (
                        <Descriptions.Item label="Gửi bởi">{sender ? <span><Avatar size={20} src={sender.avatar} style={{ marginRight: 6 }} />{sender.name} <span style={{ color: '#888', fontSize: 12 }}>({sender.email})</span></span> : item.senderId}</Descriptions.Item>
                    )}
                    {item.type === 'invite' && (
                        <>
                            <Descriptions.Item label="Vai trò">{p.role || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Email">{p.email || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Người dùng">{payloadUser ? <span><Avatar size={20} src={payloadUser.avatar} style={{ marginRight: 6 }} />{payloadUser.name} <span style={{ color: '#888', fontSize: 12 }}>({payloadUser.email})</span></span> : (p.userId || '—')}</Descriptions.Item>
                        </>
                    )}
                    {item.type === 'task_update' && item.metadata && (
                        <>
                            <Descriptions.Item label="Nhiệm vụ">{item.metadata.originalTask?.name || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Thay đổi yêu cầu">
                                <div style={{ fontSize: 12 }}>
                                    {item.metadata.requestedChanges?.status && (
                                        <div>• Trạng thái: {item.metadata.requestedChanges.status}</div>
                                    )}
                                    {item.metadata.requestedChanges?.priority && (
                                        <div>• Độ ưu tiên: {item.metadata.requestedChanges.priority}</div>
                                    )}
                                    {item.metadata.requestedChanges?.progress && (
                                        <div>• Tiến độ: {item.metadata.requestedChanges.progress}</div>
                                    )}
                                </div>
                            </Descriptions.Item>
                        </>
                    )}
                    {item.content && (
                        <Descriptions.Item label="Nội dung" span={2}>
                            <div style={{
                                background: '#f8f9fa',
                                padding: 8,
                                borderRadius: 4,
                                fontSize: 12,
                                border: '1px solid #e9ecef'
                            }}>
                                {item.content}
                            </div>
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label={
                        item.status === 'accepted'
                            ? 'Thời gian đồng ý'
                            : item.status === 'rejected'
                                ? 'Thời gian từ chối'
                                : 'Thời gian gửi'
                    }>
                        {item.status === 'accepted' && item.acceptedAt
                            ? dayjs(item.acceptedAt).format('HH:mm DD/MM/YYYY')
                            : item.status === 'rejected' && item.rejectedAt
                                ? dayjs(item.rejectedAt).format('HH:mm DD/MM/YYYY')
                                : item.createdAt
                                    ? dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')
                                    : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái"><Tag color={item.status === 'accepted' ? 'green' : item.status === 'rejected' ? 'red' : 'orange'}>{item.status}</Tag></Descriptions.Item>
                    <div>
                        {isPending && (
                            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                {isSentTab ? (
                                    <Popconfirm
                                        title="Bạn chắc chắn muốn hủy yêu cầu này?"
                                        onConfirm={() => onCancelRequest(item.id)}
                                        okText="Hủy yêu cầu"
                                        cancelText="Đóng"
                                    >
                                        <Button
                                            danger
                                            size="small"
                                            loading={processingRequests.has(item.id)}
                                            disabled={processingRequests.has(item.id)}
                                        >
                                            Hủy yêu cầu
                                        </Button>
                                    </Popconfirm>
                                ) : (
                                    <>
                                        <Popconfirm
                                            title="Bạn chắc chắn muốn chấp nhận yêu cầu này?"
                                            onConfirm={() => onAccept(item)}
                                            okText="Chấp nhận"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                type="primary"
                                                size="small"
                                                loading={processingRequests.has(item.id)}
                                                disabled={processingRequests.has(item.id)}
                                            >
                                                Chấp nhận
                                            </Button>
                                        </Popconfirm>
                                        <Popconfirm
                                            title="Bạn chắc chắn muốn từ chối yêu cầu này?"
                                            onConfirm={() => onReject(item.id)}
                                            okText="Từ chối"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                danger
                                                size="small"
                                                loading={processingRequests.has(item.id)}
                                                disabled={processingRequests.has(item.id)}
                                            >
                                                Từ chối
                                            </Button>
                                        </Popconfirm>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </Descriptions>
            </div>
        );
    };

    const pendingColumns = [
        {
            title: 'Loại yêu cầu',
            dataIndex: 'type',
            width: '25%',
            key: 'type',
            render: (_: any, record: any): React.ReactNode => {
                let typeLabel = '';
                let color = 'purple';
                switch (record.type) {
                    case 'invite':
                        typeLabel = '🤝 Mời thành viên vào dự án';
                        color = 'blue';
                        break;
                    case 'progress_update':
                        typeLabel = '📈 Cập nhật tiến độ';
                        color = 'cyan';
                        break;
                    case 'task_update':
                        typeLabel = '📝 Cập nhật nhiệm vụ';
                        color = 'orange';
                        break;
                    case 'edit':
                        typeLabel = '✏️ Chỉnh sửa dự án';
                        color = 'green';
                        break;
                    default:
                        typeLabel = record.type || '❓ Khác';
                        color = 'default';
                }
                return <span style={{ color, fontWeight: 500 }}>{typeLabel}</span>;
            },
        },
        {
            title: tab === 'sent' ? 'Người nhận' : 'Người gửi',
            dataIndex: tab === 'sent' ? 'recipientId' : 'senderId',
            width: '25%',
            align: 'center' as const,
            key: tab === 'sent' ? 'recipient' : 'sender',
            render: (_: any, record: any): React.ReactNode => {
                if (tab === 'sent') {
                    let recipients: any[] = [];
                    if (Array.isArray(record.recipientId)) {
                        recipients = record.recipientId.map((id: string) => resolveUser(id)).filter(Boolean);
                    } else if (record.recipientId) {
                        const r = resolveUser(record.recipientId);
                        if (r) recipients = [r];
                    }
                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                {recipients.length > 0 ? recipients.map((r, idx) => (
                                    <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Avatar size={32} src={r.avatar} icon={!r.avatar && <UserOutlined />} />
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: 500 }}>{r.name}</div>
                                            <div style={{ fontSize: 12, color: '#888' }}>{r.email}</div>
                                        </div>
                                        {idx < recipients.length - 1 && <span style={{ margin: '0 4px' }}>|</span>}
                                    </span>
                                )) : record.recipientId}
                            </div>
                        </div>
                    );
                } else {
                    const sender = resolveUser(record.senderId);
                    const isMe = sender?.id === user?.id;
                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                <Avatar size={32} src={sender?.avatar} icon={!sender?.avatar && <UserOutlined />} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>
                                        {isMe ? 'Bạn' : sender?.name || `User ${record.senderId}` || 'Đang tải...'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#888' }}>
                                        {sender?.email || record.senderId || ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
            },
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            width: '25%',
            key: 'createdAt',
            align: 'center' as const,
            textAlign: 'center',
            render: (t: any): React.ReactNode => <div>{t ? dayjs(t).fromNow() : '—'}</div>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '25%',
            align: 'center' as const,
            render: (s: string): React.ReactNode => <Tag color={s === 'accepted' ? 'green' : s === 'rejected' ? 'red' : 'orange'}>{s}</Tag>,
        },
    ];

    const historyColumns = tab === 'sent'
        ? [
            {
                title: 'Loại yêu cầu',
                dataIndex: 'type',
                width: '25%',
                key: 'type',
                render: (_: any, record: any): React.ReactNode => {
                    let typeLabel = '';
                    let color = 'purple';
                    switch (record.type) {
                        case 'invite':
                            typeLabel = '🤝 Mời thành viên vào dự án';
                            color = 'blue';
                            break;
                        case 'progress_update':
                            typeLabel = '📈 Cập nhật tiến độ';
                            color = 'cyan';
                            break;
                        case 'task_update':
                            typeLabel = '📝 Cập nhật nhiệm vụ';
                            color = 'orange';
                            break;
                        case 'edit':
                            typeLabel = '✏️ Chỉnh sửa dự án';
                            color = 'green';
                            break;
                        default:
                            typeLabel = record.type || '❓ Khác';
                            color = 'default';
                    }
                    return <span style={{ color, fontWeight: 500 }}>{typeLabel}</span>;
                },
            },
            {
                title: 'Người nhận',
                dataIndex: 'recipientId',
                width: '25%',
                align: 'center' as const,
                key: 'recipient',
                render: (_: any, record: any): React.ReactNode => {
                    let recipients: any[] = [];
                    if (Array.isArray(record.recipientId)) {
                        recipients = record.recipientId.map((id: string) => resolveUser(id)).filter(Boolean);
                    } else if (record.recipientId) {
                        const r = resolveUser(record.recipientId);
                        if (r) recipients = [r];
                    }

                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                {recipients.length > 0 ? recipients.map((r, idx) => (
                                    <div key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Avatar size={32} src={r.avatar} icon={!r.avatar && <UserOutlined />} />
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: 500 }}>{r.name}</div>
                                            <div style={{ fontSize: 12, color: '#888' }}>{r.email}</div>
                                        </div>
                                        {idx < recipients.length - 1 && <span style={{ margin: '0 4px' }}>|</span>}
                                    </div>
                                )) : record.recipientId}
                            </div>
                        </div>
                    );
                },
            },
            {
                title: 'Thời gian',
                dataIndex: 'createdAt',
                width: '25%',
                key: 'createdAt',
                align: 'center' as const,
                textAlign: 'center',
                render: (t: any): React.ReactNode => <div>{t ? dayjs(t).fromNow() : '—'}</div>,
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: '25%',
                align: 'center' as const,
                render: (s: string): React.ReactNode => <Tag color={s === 'accepted' ? 'green' : s === 'rejected' ? 'red' : 'orange'}>{s}</Tag>,
            },
        ]
        : [
            {
                title: 'Loại yêu cầu',
                dataIndex: 'type',
                width: '25%',
                key: 'type',
                render: (_: any, record: any): React.ReactNode => {
                    let typeLabel = '';
                    let color = 'purple';
                    switch (record.type) {
                        case 'invite':
                            typeLabel = '🤝 Mời thành viên vào dự án';
                            color = 'blue';
                            break;
                        case 'progress_update':
                            typeLabel = '📈 Cập nhật tiến độ';
                            color = 'cyan';
                            break;
                        case 'task_update':
                            typeLabel = '📝 Cập nhật nhiệm vụ';
                            color = 'orange';
                            break;
                        case 'edit':
                            typeLabel = '✏️ Chỉnh sửa dự án';
                            color = 'green';
                            break;
                        default:
                            typeLabel = record.type || '❓ Khác';
                            color = 'default';
                    }
                    return <span style={{ color, fontWeight: 500 }}>{typeLabel}</span>;
                },
            },
            {
                title: 'Người gửi',
                dataIndex: 'senderId',
                width: '25%',
                align: 'center' as const,
                key: 'sender',
                render: (_: any, record: any): React.ReactNode => {
                    const sender = resolveUser(record.senderId);
                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                <Avatar size={32} src={sender?.avatar} icon={!sender?.avatar && <UserOutlined />} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{sender?.name || record.payload?.email || record.senderId}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{sender?.email || record.payload?.email || ''}</div>
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                align: 'center' as const,
                width: '25%',
                render: (s: string): React.ReactNode => (
                    <Tag color={s === 'accepted' ? 'green' : s === 'rejected' ? 'red' : 'orange'}>
                        {s === 'accepted' ? 'Đã chấp nhận' : s === 'rejected' ? 'Đã từ chối' : s}
                    </Tag>
                ),
            },
            {
                title: 'Thời gian xử lý',
                dataIndex: 'updatedAt',
                key: 'updatedAt',
                align: 'center' as const,
                width: '25%',
                render: (t: any, record: any): React.ReactNode => {
                    if (!t && record.createdAt) return <div>{dayjs(record.createdAt).fromNow()}</div>;
                    return <div>{t ? dayjs(t).fromNow() : '—'}</div>;
                },
            },
        ];


    const handleExpandPending = (expanded: boolean, record: any): void => {
        const id = record.id;

        if (expanded) {
            setExpandedPendingKeys([id]);
            setCollapsingRows(prev => ({ ...prev, [id]: true }));
            requestAnimationFrame(() => {
                setCollapsingRows(prev => ({ ...prev, [id]: false }));
            });
        } else {
            setCollapsingRows(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setExpandedPendingKeys([]);
                setCollapsingRows(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }, 200);
        }
    };

    const handleExpandHistory = (expanded: boolean, record: any): void => {
        const id = record.id;

        if (expanded) {
            setExpandedHistoryKeys([id]);
            setCollapsingRows(prev => ({ ...prev, [id]: true }));
            requestAnimationFrame(() => {
                setCollapsingRows(prev => ({ ...prev, [id]: false }));
            });
        } else {
            setCollapsingRows(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setExpandedHistoryKeys([]);
                setCollapsingRows(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }, 400);
        }
    };



    return (
        <div>
            <div style={{
                marginBottom: 16,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Button
                        type={tab === 'received' ? 'primary' : 'default'}
                        onClick={() => setTab('received')}
                        size="large"
                    >
                        📨 Yêu cầu đến ({receivedRequests.length})
                    </Button>
                    <Button
                        type={tab === 'sent' ? 'primary' : 'default'}
                        onClick={() => setTab('sent')}
                        size="large"
                    >
                        📤 Yêu cầu đã gửi ({sentRequests.length})
                    </Button>
                </div>
                {loading && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        🔄 Đang tải...
                    </div>
                )}
            </div>
            <Card>
                <div style={{ marginBottom: 18 }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>Chờ xử lý</Typography.Title>
                </div>
                <Table
                    className="animated-expand-table"
                    dataSource={pending}
                    columns={pendingColumns}
                    rowKey={record => record.id}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
                        hideOnSinglePage: true
                    }}
                    bordered={true}
                    expandIconColumnIndex={0}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys: expandedPendingKeys,
                        onExpand: handleExpandPending,
                        expandRowByClick: true,
                        expandIcon: ({ record }) => {
                            const idx = pending.findIndex((r: any) => r.id === record.id);
                            return <span className="custom-id-cell">{idx + 1}</span>;
                        },
                    }}
                    scroll={{ x: 800 }}
                    loading={loading}
                    locale={{
                        emptyText: pending.length === 0 && !loading ?
                            `📝 Không có yêu cầu ${tab === 'received' ? 'đến' : 'đã gửi'} nào đang chờ xử lý` :
                            undefined
                    }}
                    components={{
                        header: {
                            cell: (props: any) => (
                                <th
                                    {...props}
                                    style={{
                                        ...props.style,
                                        backgroundColor: '#212529',
                                        color: 'white',
                                        borderBottom: '1px solid #495057',
                                        textAlign: 'center',
                                    }}
                                />
                            ),
                        },
                    }}
                />
            </Card>
            <Card style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 18 }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>Lịch sử</Typography.Title>
                </div>
                <Table
                    className="animated-expand-table"
                    dataSource={history}
                    columns={historyColumns}
                    rowKey={record => record.id}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                    bordered={true}
                    expandIconColumnIndex={0}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys: expandedHistoryKeys,
                        onExpand: handleExpandHistory,
                        expandRowByClick: true,
                        expandIcon: ({ record }) => {
                            const idx = history.findIndex((r: any) => r.id === record.id);
                            return <span className="custom-id-cell">{idx + 1}</span>;
                        },
                    }}
                    scroll={{ x: 800 }}
                    loading={loading}
                    locale={{
                        emptyText: history.length === 0 && !loading ?
                            `📜 Không có lịch sử yêu cầu ${tab === 'received' ? 'đến' : 'đã gửi'} nào` :
                            undefined
                    }}
                    components={{
                        header: {
                            cell: (props: any) => (
                                <th
                                    {...props}
                                    style={{
                                        ...props.style,
                                        backgroundColor: '#212529',
                                        color: 'white',
                                        borderBottom: '1px solid #495057',
                                        textAlign: 'center',
                                    }}
                                />
                            ),
                        },
                    }}
                />
            </Card>
        </div>




    );
};

export default IncomingRequests;
