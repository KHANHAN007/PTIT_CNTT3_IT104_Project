import React, { useEffect, useState } from 'react';
import { GlobalAlertContext } from '../components/Layout';
import { useContext } from 'react';
import { userService } from '../services/userService';
import { projectsService } from '../services/projectsService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { UserOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { fetchRequestsForUser, rejectRequest, acceptAndAddMember, deleteRequest } from '../store/requestsSlice';
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

    const [localUserMap, setLocalUserMap] = useState<Record<string, any>>({});
    const [expandedPendingKeys, setExpandedPendingKeys] = useState<React.Key[]>([]);
    const [expandedHistoryKeys, setExpandedHistoryKeys] = useState<React.Key[]>([]);
    const [collapsingRows, setCollapsingRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) {
            dispatch(fetchRequestsForUser(user.id));
        }
    }, [user, dispatch]);
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
            if (r.senderId && !users.find((u: any) => u.id === r.senderId) && !localUserMap[r.senderId]) {
                missingUserIds.add(r.senderId);
            }
            if (r.payload && r.payload.userId && !users.find((u: any) => u.id === r.payload.userId) && !localUserMap[r.payload.userId]) {
                missingUserIds.add(r.payload.userId);
            }
            if (r.projectId && !projects.find((p: any) => p.id === r.projectId) && !localProjectMap[r.projectId]) {
                missingProjectIds.add(r.projectId);
            }
        }

        if (missingUserIds.size === 0 && missingProjectIds.size === 0) return;

        (async () => {
            try {
                if (missingUserIds.size > 0) {
                    const ids = Array.from(missingUserIds);
                    const results = await Promise.all(ids.map(id => userService.getUserById(id).catch(() => null)));
                    const nextUsers: Record<string, any> = {};
                    results.forEach((u, i) => { if (u) nextUsers[ids[i]] = u; });
                    if (Object.keys(nextUsers).length > 0) setLocalUserMap(prev => ({ ...prev, ...nextUsers }));
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
        return users.find((u: any) => u.id === id) || localUserMap[id] || null;
    };

    const resolveProject = (id?: string): any => {
        if (!id) return null;
        return projects.find((p: any) => p.id === id) || localProjectMap[id] || null;
    };

    const onAccept = async (request: any) => {
        try {
            const payload = request.payload || {};
            const memberData = {
                projectId: request.projectId || payload.projectId || '',
                userId: payload.userId || request.senderId || '',
                email: payload.email || request.senderId || '',
                role: payload.role || 'Member',
            };

            await dispatch(acceptAndAddMember({ requestId: request.id, memberData })).unwrap();
            if (showAlert) {
                showAlert({ type: 'success', message: 'Thành công', description: 'Yêu cầu đã được chấp nhận!' });
            }
            if (user) dispatch(fetchRequestsForUser(user.id));
        } catch (err: any) {
            if (showAlert) {
                showAlert({ type: 'error', message: 'Lỗi', description: 'Chấp nhận yêu cầu thất bại!' });
            }
            console.error(err);
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
        }
    };


    const pending = (tab === 'received' ? receivedRequests : sentRequests).filter((r: any) => r.status === 'pending');
    const history = (tab === 'received' ? receivedRequests : sentRequests).filter((r: any) => r.status !== 'pending');

    const expandedRowRender = (item: any): React.ReactNode => {
        const sender = resolveUser(item.senderId);
        const recipient = resolveUser(item.recipientId);
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
                        <Descriptions.Item label="Người nhận">{recipient ? <span><Avatar size={20} src={recipient.avatar} style={{ marginRight: 6 }} />{recipient.name} <span style={{ color: '#888', fontSize: 12 }}>({recipient.email})</span></span> : item.recipientId}</Descriptions.Item>
                    ) : (
                        <Descriptions.Item label="Gửi bởi">{sender ? <span><Avatar size={20} src={sender.avatar} style={{ marginRight: 6 }} />{sender.name} <span style={{ color: '#888', fontSize: 12 }}>({sender.email})</span></span> : item.senderId}</Descriptions.Item>
                    )}
                    <Descriptions.Item label="Vai trò">{p.role || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{p.email || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Người dùng">{payloadUser ? <span><Avatar size={20} src={payloadUser.avatar} style={{ marginRight: 6 }} />{payloadUser.name} <span style={{ color: '#888', fontSize: 12 }}>({payloadUser.email})</span></span> : (p.userId || '—')}</Descriptions.Item>
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
                                        onConfirm={() => onReject(item.id)}
                                        okText="Hủy yêu cầu"
                                        cancelText="Đóng"
                                    >
                                        <Button danger size="small" onClick={() => onCancelRequest(item.id)}>Hủy yêu cầu</Button>
                                    </Popconfirm>
                                ) : (
                                    <>
                                        <Popconfirm
                                            title="Bạn chắc chắn muốn chấp nhận yêu cầu này?"
                                            onConfirm={() => onAccept(item)}
                                            okText="Chấp nhận"
                                            cancelText="Hủy"
                                        >
                                            <Button type="primary" size="small">Chấp nhận</Button>
                                        </Popconfirm>
                                        <Popconfirm
                                            title="Bạn chắc chắn muốn từ chối yêu cầu này?"
                                            onConfirm={() => onReject(item.id)}
                                            okText="Từ chối"
                                            cancelText="Hủy"
                                        >
                                            <Button danger size="small">Từ chối</Button>
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
                switch (record.type) {
                    case 'invite':
                        typeLabel = 'Thêm thành viên vào project';
                        break;
                    case 'progress_update':
                        typeLabel = 'Yêu cầu cập nhật tiến độ';
                        break;
                    default:
                        typeLabel = record.type || 'Khác';
                }
                const color = record.type === 'progress_update' ? 'cyan' : 'purple';
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
                    const recipient = resolveUser(record.recipientId);
                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                <Avatar size={32} src={recipient?.avatar} icon={!recipient?.avatar && <UserOutlined />} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{recipient?.name || record.recipientId}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{recipient?.email || ''}</div>
                                </div>
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
                                    <div style={{ fontWeight: 500 }}>{isMe ? 'Bạn' : sender?.name || record.senderId}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{sender?.email || ''}</div>
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
                    switch (record.type) {
                        case 'invite':
                            typeLabel = 'Thêm thành viên vào project';
                            break;
                        case 'progress_update':
                            typeLabel = 'Yêu cầu cập nhật tiến độ';
                            break;
                        default:
                            typeLabel = record.type || 'Khác';
                    }
                    const color = record.type === 'progress_update' ? 'cyan' : 'purple';
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
                    const recipient = resolveUser(record.recipientId);
                    return (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                <Avatar size={32} src={recipient?.avatar} icon={!recipient?.avatar && <UserOutlined />} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>{recipient?.name || record.recipientId}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{recipient?.email || ''}</div>
                                </div>
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
                    switch (record.type) {
                        case 'invite':
                            typeLabel = 'Thêm thành viên vào project';
                            break;
                        case 'progress_update':
                            typeLabel = 'Yêu cầu cập nhật tiến độ';
                            break;
                        default:
                            typeLabel = record.type || 'Khác';
                    }
                    const color = record.type === 'progress_update' ? 'cyan' : 'purple';
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
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <Button type={tab === 'received' ? 'primary' : 'default'} onClick={() => setTab('received')}>
                    Yêu cầu đến
                </Button>
                <Button type={tab === 'sent' ? 'primary' : 'default'} onClick={() => setTab('sent')}>
                    Yêu cầu đã gửi
                </Button>
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
                    pagination={false}
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
                    pagination={false}
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
