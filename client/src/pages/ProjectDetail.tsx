import React, { useEffect, useState } from 'react';
import {
    Card,
    Button,
    Table,
    Input,
    Modal,
    Form,
    Space,
    Alert,
    Row,
    Col,
    Typography,
    Tag,
    DatePicker,
    Select,
    Collapse,
    Spin,
    Dropdown,
    Menu,
    InputNumber
} from 'antd';
import { message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    DeleteOutlined,
    UserAddOutlined,
    SearchOutlined,
    TeamOutlined,
    CaretRightOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { tasksService } from '../services/tasksService';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchTasksAsync,
    fetchMembersAsync,
    createTaskAsync,
    updateTaskAsync,
    deleteTaskAsync,
    clearError as clearTasksError
} from '../store/tasksSlice';
import {
    updateMemberRoleAsync,
    removeMemberAsync,
    clearError as clearMembersError
} from '../store/membersSlice';
import { requestsService } from '../services/requestsService';
import { setCurrentProject, fetchProjects } from '../store/projectsSlice';
import { fetchAllUsers } from '../store/usersSlice';
import type { Task, ProjectMember, TaskPriorityType, MemberRoleType, TaskProgressType } from '../types';
import { TaskStatus, TaskPriority, MemberRole, TaskProgress, getRoleColor } from '../types';
import MemberAvatar from '../components/MemberAvatar';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TaskModalProps {
    visible: boolean;
    task?: Task;
    members: ProjectMember[];
    projectId: string;
    onCancel: () => void;
    onOk: (values: any) => void;
    loading: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({
    visible,
    task,
    members,
    projectId,
    onCancel,
    onOk,
    loading
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (task) {
                form.setFieldsValue({
                    ...task,
                    startDate: dayjs(task.startDate),
                    deadline: dayjs(task.deadline)
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, task, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            const formattedValues = {
                ...values,
                projectId,
                startDate: values.startDate.format('YYYY-MM-DD'),
                deadline: values.deadline.format('YYYY-MM-DD')
            };
            Promise.resolve(onOk(formattedValues)).catch(() => {
            });
        });
    };


    return (
        <Modal
            title={task ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ'}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                    {task ? 'Lưu' : 'Thêm nhiệm vụ'}
                </Button>,
            ]}
            width={600}
        >

            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên nhiệm vụ"
                    name="name"
                    rules={[
                        { required: true, message: 'Tên nhiệm vụ không được để trống' },
                        { min: 3, max: 100, message: 'Tên nhiệm vụ phải có độ dài từ 3-100 ký tự' },
                        {
                            validator: async (_, value) => {
                                if (!value || value.length < 3) return Promise.resolve();
                                try {
                                    const existing = await tasksService.getTasks(projectId);
                                    const duplicate = existing.find(t =>
                                        t.name.toLowerCase() === value.toLowerCase() &&
                                        (!task || t.id !== task.id)
                                    );
                                    if (duplicate) {
                                        return Promise.reject(new Error('Tên nhiệm vụ đã tồn tại trong dự án'));
                                    }
                                    return Promise.resolve();
                                } catch (error) {
                                    console.error('Error checking duplicate task name:', error);
                                    return Promise.resolve();
                                }
                            }
                        }
                    ]}
                    validateTrigger={['onBlur', 'onChange']}
                >
                    <Input placeholder="Soạn thảo đề cương dự án" />
                </Form.Item>

                <Form.Item
                    label="Người phụ trách"
                    name="assigneeId"
                    rules={[{ required: true, message: 'Vui lòng chọn người phụ trách' }]}
                >
                    <Select placeholder="Chọn người phụ trách">
                        {members.map(member => (
                            <Option key={member.userId} value={member.userId}>
                                {member.email}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Trạng thái"
                    name="status"
                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                    <Select placeholder="Chọn trạng thái nhiệm vụ">
                        <Option value={TaskStatus.TODO}>{TaskStatus.TODO}</Option>
                        <Option value={TaskStatus.IN_PROGRESS}>{TaskStatus.IN_PROGRESS}</Option>
                        <Option value={TaskStatus.PENDING}>{TaskStatus.PENDING}</Option>
                        <Option value={TaskStatus.DONE}>{TaskStatus.DONE}</Option>
                    </Select>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Ngày bắt đầu"
                            name="startDate"
                            rules={[
                                { required: true, message: 'Vui lòng chọn ngày bắt đầu' },
                                {
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const now = dayjs().startOf('day');
                                        if (value.isBefore(now) || value.isSame(now, 'day')) {
                                            return Promise.reject(new Error('Ngày bắt đầu phải lớn hơn ngày hiện tại'));
                                        }
                                        return Promise.resolve();
                                    }
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const deadline = getFieldValue('deadline');
                                        if (!value || !deadline || !deadline.isBefore(value, 'day')) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Hạn cuối phải sau hoặc bằng ngày bắt đầu'));
                                    }
                                })
                            ]}
                            validateTrigger={['onChange', 'onBlur']}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="mm/dd/yyyy"
                                disabledDate={(current) => {
                                    return current && current < dayjs().startOf('day');
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Hạn cuối"
                            name="deadline"
                            rules={[
                                { required: true, message: 'Vui lòng chọn hạn cuối' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const startDate = getFieldValue('startDate');
                                        if (!startDate) return Promise.resolve();

                                        if (value.isBefore(startDate, 'day')) {
                                            return Promise.reject(new Error('Hạn cuối phải sau hoặc bằng ngày bắt đầu'));
                                        }
                                        return Promise.resolve();
                                    }
                                })
                            ]}
                            validateTrigger={['onChange', 'onBlur']}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="mm/dd/yyyy"
                                disabledDate={(current) => {
                                    if (!current) return false;
                                    const today = dayjs().startOf('day');
                                    const startDate = form.getFieldValue('startDate');
                                    if (current < today) return true;
                                    if (startDate && current < startDate.startOf('day')) {
                                        return true;
                                    }

                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Độ ưu tiên"
                    name="priority"
                    rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên' }]}
                >
                    <Select placeholder="Chọn độ ưu tiên">
                        <Option value={TaskPriority.LOW}>Thấp</Option>
                        <Option value={TaskPriority.MEDIUM}>Trung bình</Option>
                        <Option value={TaskPriority.HIGH}>Cao</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Thời gian ước tính (giờ)"
                    name="estimatedHours"
                >
                    <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} placeholder="Nhập thời gian ước tính (giờ, ví dụ: 1.5)" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                >
                    <TextArea rows={3} placeholder="Mô tả chi tiết nhiệm vụ..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

interface MemberModalProps {
    visible: boolean;
    onCancel: () => void;
    onOk: (values: any) => void;
    loading: boolean;
    members: ProjectMember[];
    users: any[];
}
const AddMemberModal: React.FC<MemberModalProps> = ({
    visible,
    onCancel,
    onOk,
    loading,
    members,
    users
}) => {
    const [form] = Form.useForm();
    const [formError, setFormError] = useState<string | null>(null);
    const [method, setMethod] = useState<'email' | 'user'>('user');

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setFormError(null);
            setMethod('user');
        }
    }, [visible, form]);

    const availableUsers = users.filter(u => !members.some(m => m.userId === u.id));

    const handleOk = () => {
        form.validateFields().then(values => {
            const selectedRole = values.role;
            if (selectedRole === MemberRole.PROJECT_OWNER) {
                setFormError('Không thể gán vai trò Chủ dự án (Project owner)');
                return;
            }
            const hasManager = members.some(m => m.role === MemberRole.PROJECT_MANAGER);
            if (selectedRole === MemberRole.PROJECT_MANAGER && hasManager) {
                setFormError('Dự án đã có quản lý (Project manager). Không thể thêm thành viên khác với vai trò này.');
                return;
            }
            if (method === 'user') {
                if (!values.userId) { setFormError('Vui lòng chọn người dùng'); return; }
                if (members.some(m => m.userId === values.userId)) { setFormError('Người dùng đã là thành viên'); return; }
            } else {
                if (!values.email) { setFormError('Vui lòng nhập email'); return; }
                const emailLower = values.email.toLowerCase();
                if (members.some(m => (m.email || '').toLowerCase() === emailLower)) { setFormError('Người dùng đã là thành viên'); return; }
            }

            setFormError(null);
            onOk({ method, ...values });
        }).catch(() => {
            setFormError(null);
        });
    };

    return (
        <Modal
            title="Thêm thành viên"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                    Gửi yêu cầu
                </Button>,
            ]}
        >
            {formError && (
                <Alert
                    message={formError}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setFormError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form form={form} layout="vertical">
                <Form.Item label="Phương thức" name="method" initialValue={method}>
                    <Select value={method} onChange={(v: any) => setMethod(v)}>
                        <Option value="user">Chọn người dùng (trong hệ thống)</Option>
                        <Option value="email">Gửi lời mời qua Email</Option>
                    </Select>
                </Form.Item>

                {method === 'user' ? (
                    <Form.Item label="Chọn người dùng" name="userId" rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}>
                        <Select placeholder="Chọn người dùng">
                            {availableUsers.map(u => (
                                <Option key={u.id} value={u.id}>{u.name} - {u.email}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                ) : (
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Email không được để trống' },
                            { type: 'email', message: 'Email không đúng định dạng' }
                        ]}
                    >
                        <Input placeholder="nguyenquangan318@gmail.com" />
                    </Form.Item>
                )}

                <Form.Item
                    label="Vai trò"
                    name="role"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                >
                    <Select placeholder="Chọn vai trò">
                        <Option value={MemberRole.PROJECT_MANAGER} disabled={members.some(m => m.role === MemberRole.PROJECT_MANAGER)}>{MemberRole.PROJECT_MANAGER}</Option>
                        <Option value={MemberRole.FRONTEND_DEVELOPER}>{MemberRole.FRONTEND_DEVELOPER}</Option>
                        <Option value={MemberRole.BACKEND_DEVELOPER}>{MemberRole.BACKEND_DEVELOPER}</Option>
                        <Option value={MemberRole.FULLSTACK_DEVELOPER}>{MemberRole.FULLSTACK_DEVELOPER}</Option>
                        <Option value={MemberRole.DESIGNER}>{MemberRole.DESIGNER}</Option>
                        <Option value={MemberRole.TESTER}>{MemberRole.TESTER}</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { projects } = useAppSelector(state => state.projects);
    const { tasks, loading: tasksLoading, error: tasksError } = useAppSelector(state => state.tasks);
    const { members, loading: membersLoading, error: membersError } = useAppSelector(state => state.members);
    const { user } = useAppSelector(state => state.auth);
    const { users } = useAppSelector(state => state.users);

    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();
    const [deleteTaskModalVisible, setDeleteTaskModalVisible] = useState(false);
    const [deletingTask, setDeletingTask] = useState<Task | undefined>();
    const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const [membersModalVisible, setMembersModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState<'deadline' | 'priority'>('deadline');

    const currentProject = projects.find(p => p.id === id);

    useEffect(() => {
        if (user?.id && projects.length === 0) {
            dispatch(fetchProjects(user.id));
        }
        if (users.length === 0) {
            dispatch(fetchAllUsers());
        }
    }, [dispatch, user, projects.length, users.length]);

    useEffect(() => {
        if (currentProject) {
            dispatch(setCurrentProject(currentProject));
            dispatch(fetchTasksAsync(currentProject.id));
            dispatch(fetchMembersAsync(currentProject.id));
            console.log(currentProject);
        } else if (id && projects.length > 0) {
            navigate('/projects');
        }
    }, [dispatch, currentProject, id, navigate, projects.length]);

    useEffect(() => {
        return () => {
            dispatch(clearTasksError());
            dispatch(clearMembersError());
        };
    }, [dispatch]);

    const handleAddTask = () => {
        setEditingTask(undefined);
        setTaskModalVisible(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setTaskModalVisible(true);
    };

    const handleDeleteTask = (task: Task) => {
        setDeletingTask(task);
        setDeleteTaskModalVisible(true);
    };

    const handleTaskModalOk = async (values: any) => {
        try {
            dispatch(clearTasksError());
            if (editingTask) {
                await dispatch(updateTaskAsync({ id: editingTask.id, taskData: values })).unwrap();
            } else {
                await dispatch(createTaskAsync(values)).unwrap();
            }
            setTaskModalVisible(false);
        } catch (err: any) {
            throw err;
        }
    };

    const handleConfirmDeleteTask = async () => {
        if (deletingTask) {
            try {
                await dispatch(deleteTaskAsync(deletingTask.id)).unwrap();
                setDeleteTaskModalVisible(false);
                setDeletingTask(undefined);
            } catch (err) {
            }
        }
    };


    const handleAddMember = async (values: any) => {
        try {
            if (values.method === 'user') {
                const userId = values.userId;
                const userObj = users.find(u => u.id === userId);
                if (!userObj) throw new Error('Người dùng không tồn tại');

                await requestsService.createRequest({
                    type: 'invite',
                    senderId: user!.id,
                    recipientId: userId,
                    projectId: id!,
                    payload: { role: values.role, email: userObj.email, userId },
                });
                message.success('Đã gửi lời mời tới người dùng');
            } else {
                await requestsService.createRequest({
                    type: 'invite',
                    senderId: user!.id,
                    recipientId: '',
                    projectId: id!,
                    payload: { role: values.role, email: values.email },
                });
                message.success('Đã gửi lời mời qua email (thực tế gửi email chưa được cài đặt)');
            }

            setAddMemberModalVisible(false);
        } catch (err: any) {
            console.error(err);
            message.error(err?.message || 'Không thể gửi lời mời');
        }
    };

    const handleUpdateMemberRole = async (memberId: string, role: MemberRoleType) => {
        if (role === MemberRole.PROJECT_OWNER) {
            message.error('Không thể gán vai trò Chủ dự án (Project owner) cho thành viên');
            return;
        }
        const existingManager = members.find(m => m.role === MemberRole.PROJECT_MANAGER);
        if (role === MemberRole.PROJECT_MANAGER && existingManager && existingManager.id !== memberId) {
            message.error('Dự án đã có một quản lý (Project manager). Vui lòng đổi vai trò của quản lý hiện tại trước khi gán.');
            return;
        }

        try {
            await dispatch(updateMemberRoleAsync({ memberId, role })).unwrap();
            message.success('Cập nhật vai trò thành công');
        } catch (err) {
            message.error('Có lỗi xảy ra khi cập nhật vai trò');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await dispatch(removeMemberAsync(memberId)).unwrap();
        } catch (err) {
        }
    };

    const filteredTasks = tasks.filter(task =>
        task.name.toLowerCase().includes(searchText.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'deadline') {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } else {
            const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
    });

    const getPriorityColor = (priority: TaskPriorityType) => {
        switch (priority) {
            case TaskPriority.HIGH: return '#DC3545';
            case TaskPriority.MEDIUM: return '#FFA500';
            case TaskPriority.LOW: return '#0DCAF0';
            default: return 'default';
        }
    };

    const getPriorityText = (priority: TaskPriorityType) => {
        switch (priority) {
            case TaskPriority.HIGH: return 'Cao';
            case TaskPriority.MEDIUM: return 'Trung bình';
            case TaskPriority.LOW: return 'Thấp';
            default: return priority;
        }
    };

    const getProgressColor = (progress: TaskProgressType) => {
        switch (progress) {
            case TaskProgress.ON_TRACK: return '#198754';
            case TaskProgress.AT_RISK: return '#FFA500';
            case TaskProgress.DELAYED: return '#DC3545';
            case TaskProgress.DONE: return '#108ee9';
            default: return 'default';
        }
    };

    const getOwnerInfo = (ownerId: string) => {
        return users.find(u => u.id === ownerId);
    };
    const taskColumns: ColumnsType<Task> = [
        {
            title: 'Tên Nhiệm Vụ',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (name: string) => name,
            onCell: () => ({ className: 'table-col-task-name' }),
        },
        {
            title: 'Người Phụ Trách',
            dataIndex: 'assigneeId',
            key: 'assigneeId',
            width: '15%',
            render: (assigneeId: string) => {
                const assignee = users.find(u => u.id === assigneeId);
                return assignee ? assignee.name : 'Chưa phân công';
            },
            onCell: () => ({ className: 'table-col-assignee' }),
        },
        {
            title: 'Ưu Tiên',
            dataIndex: 'priority',
            key: 'priority',
            width: '10%',
            render: (priority: string) => (
                <Tag color={getPriorityColor(priority as any)} >
                    {getPriorityText(priority as any)}
                </Tag>
            ),
            onCell: () => ({ className: 'table-col-priority' }),
        },
        {
            title: 'Ngày Bắt Đầu',
            dataIndex: 'startDate',
            key: 'startDate',
            width: '12%',
            render: (date: string) => (
                <span style={{ color: '#1890ff' }}>
                    {dayjs(date).format('MM - DD')}
                </span>
            ),
            onCell: () => ({ className: 'table-col-start-date' }),
        },
        {
            title: 'Hạn Chót',
            dataIndex: 'deadline',
            key: 'deadline',
            width: '12%',
            render: (date: string) => (
                <span style={{ color: '#1890ff' }}>
                    {dayjs(date).format('MM - DD')}
                </span>
            ),
            onCell: () => ({ className: 'table-col-deadline' }),
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            width: '10%',
            onCell: () => ({ className: 'table-col-progress' }),
            render: (progress: string, record) => (
                <div>
                    <Tag color={getProgressColor(progress as any)}>
                        {progress}
                    </Tag>
                    {record.estimatedHours !== undefined && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                            {typeof record.timeSpentMinutes === 'number' && record.estimatedHours > 0
                                ? `Tiến độ: ${(record.timeSpentMinutes / 60).toFixed(2)}/${record.estimatedHours} giờ`
                                : `Ước tính: ${record.estimatedHours} giờ`}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: '11%',
            render: (_, record) => (
                <Space style={{ justifyContent: 'center', width: '100%' }}>
                    <Button
                        variant="solid"
                        color='gold'
                        size="small"
                        onClick={() => handleEditTask(record)}
                        style={{ color: 'black' }}
                    >
                        Sửa
                    </Button>
                    <Button
                        color='red'
                        variant="solid"
                        size="small"
                        onClick={() => handleDeleteTask(record)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
            onCell: () => ({ className: 'table-col-actions' }),
        },
    ];

    const memberColumns: ColumnsType<ProjectMember> = [
        {
            title: 'Thành viên',
            dataIndex: 'email',
            key: 'email',
            render: (email, record) => (
                <Space>
                    <MemberAvatar member={record} size="default" />
                    <div>
                        <div>{email.split('@')[0]}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role, record) => {
                const existingManager = members.find(m => m.role === MemberRole.PROJECT_MANAGER);
                const disableManagerOption = !!existingManager && existingManager.id !== record.id;

                return (
                    <Select
                        value={role}
                        style={{ width: '100%' }}
                        disabled={role === MemberRole.PROJECT_OWNER}
                        onChange={(value) => handleUpdateMemberRole(record.id, value)}
                    >
                        <Option value={MemberRole.PROJECT_OWNER} disabled>{MemberRole.PROJECT_OWNER}</Option>
                        <Option value={MemberRole.PROJECT_MANAGER} disabled={disableManagerOption}>{MemberRole.PROJECT_MANAGER}</Option>
                        <Option value={MemberRole.FRONTEND_DEVELOPER}>{MemberRole.FRONTEND_DEVELOPER}</Option>
                        <Option value={MemberRole.BACKEND_DEVELOPER}>{MemberRole.BACKEND_DEVELOPER}</Option>
                        <Option value={MemberRole.FULLSTACK_DEVELOPER}>{MemberRole.FULLSTACK_DEVELOPER}</Option>
                        <Option value={MemberRole.DESIGNER}>{MemberRole.DESIGNER}</Option>
                        <Option value={MemberRole.TESTER}>{MemberRole.TESTER}</Option>
                    </Select>
                );
            },
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_, record) => record.role !== MemberRole.PROJECT_OWNER && (
                <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveMember(record.id)}
                />
            ),
        },
    ];

    if (!currentProject && projects.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!currentProject) {
        return <div>Không tìm thấy dự án</div>;
    }

    return (
        <div>
            <Card style={{ marginBottom: 20, width: '100%' }}>
                <Row>
                    <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    width: 200,
                                    height: 160,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    background: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {currentProject.imageUrl ? (
                                        <img
                                            src={currentProject.imageUrl}
                                            alt={currentProject.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <Text style={{ fontSize: '12px', color: '#999' }}>Không có hình ảnh</Text>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Title level={3} style={{ margin: 0 }}>{currentProject.name}</Title>
                                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                        {currentProject.description}
                                    </Text>
                                    <Space>
                                        <Tag color={getRoleColor(MemberRole.PROJECT_OWNER)} >{getOwnerInfo(currentProject.ownerId)?.name}</Tag>
                                        {currentProject.managerId ? (
                                            <Tag color={getRoleColor(MemberRole.PROJECT_MANAGER)}>{getOwnerInfo(currentProject.managerId)?.name || 'Không rõ'}</Tag>
                                        ) : (
                                            <Tag color={getRoleColor(MemberRole.PROJECT_MANAGER)}>Chưa phân công</Tag>
                                        )}
                                        <Tag color="blue">{dayjs(currentProject.createdAt).format('DD/MM/YYYY')}</Tag>
                                    </Space>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                style={{ marginTop: 12 }}
                                onClick={handleAddTask}
                            >
                                Thêm nhiệm vụ
                            </Button>
                        </div>
                    </Col>
                    <Col span={3}></Col>
                    <Col span={9}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: 5, width: '100%' }}>
                                <Title level={4}>Thành viên</Title>
                                <Dropdown
                                    overlay={
                                        <Menu>
                                            <Menu.Item
                                                key="view"
                                                icon={<TeamOutlined />}
                                                onClick={() => setMembersModalVisible(true)}
                                            >
                                                Xem danh sách thành viên
                                            </Menu.Item>
                                            <Menu.Item
                                                key="add"
                                                icon={<UserAddOutlined />}
                                                onClick={() => setAddMemberModalVisible(true)}
                                            >
                                                Mời thành viên mới
                                            </Menu.Item>
                                        </Menu>
                                    }
                                    trigger={['click']}
                                >
                                    <Button
                                        className='team-management-btn'
                                        color="default"
                                        variant="outlined"
                                        shape="circle"
                                        icon={<TeamOutlined />}
                                        size="large"
                                        style={{
                                            backgroundColor: '#E2E3E5',
                                            color: 'black',
                                        }}
                                    />
                                </Dropdown>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, width: '100%' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    marginBottom: 10,
                                    marginLeft: 5,
                                    width: '100%',
                                    marginRight: 35
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                        width: '100%'
                                    }}>
                                        {members.slice(0, 2).map(member => (
                                            <div key={member.id} style={{ minWidth: '180px', textAlign: 'center' }}>
                                                <MemberAvatar
                                                    member={member}
                                                    size={50}
                                                    showName={true}
                                                    nameStyle={{ fontSize: '10px', marginTop: 2 }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                        width: '100%'
                                    }}>
                                        {members.slice(2, 4).map(member => (
                                            <div key={member.id} style={{ minWidth: '180px', textAlign: 'center' }}>
                                                <MemberAvatar
                                                    member={member}
                                                    size={50}
                                                    showName={true}
                                                    nameStyle={{ fontSize: '10px', marginTop: 2 }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {members.length > 4 && (
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        backgroundColor: '#f0f0f0',
                                        border: '2px solid #d9d9d9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#666'
                                    }}>
                                        +{members.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Card>
                {(tasksError || membersError) && (
                    <Alert
                        message={tasksError || membersError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => {
                            dispatch(clearTasksError());
                            dispatch(clearMembersError());
                        }}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4}>Danh Sách Nhiệm Vụ</Title>
                    <Space>
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 200 }}
                            placeholder="Sắp xếp theo"
                        >
                            <Option value="deadline">Sắp xếp theo hạn chót</Option>
                            <Option value="priority">Sắp xếp theo độ ưu tiên</Option>
                        </Select>
                        <Input
                            placeholder="Tìm kiếm nhiệm vụ"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                    </Space>
                </div>

                <div className="task-table-header">
                    <div className="header-col-task-name">Tên Nhiệm Vụ</div>
                    <div className="header-col-assignee">Người Phụ Trách</div>
                    <div className="header-col-priority">Ưu Tiên</div>
                    <div className="header-col-start-date">Ngày Bắt Đầu</div>
                    <div className="header-col-deadline">Hạn Chót</div>
                    <div className="header-col-progress">Tiến độ</div>
                    <div className="header-col-actions">Hành động</div>
                </div>

                <Collapse
                    className="task-collapse"
                    ghost
                    expandIcon={({ isActive }) => (
                        <div style={{
                            transition: 'transform 0.3s ease',
                            transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '14px',
                        }}>
                            <CaretRightOutlined />
                        </div>
                    )}
                >
                    {[
                        { key: 'todo', status: TaskStatus.TODO, title: 'To do' },
                        { key: 'inprogress', status: TaskStatus.IN_PROGRESS, title: 'In Progress' },
                        { key: 'pending', status: TaskStatus.PENDING, title: 'Pending' },
                        { key: 'done', status: TaskStatus.DONE, title: 'Done' }
                    ].map(section => {
                        const sectionTasks = filteredTasks.filter(task => task.status === section.status);
                        return (
                            <Collapse.Panel
                                key={section.key}
                                header={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            fontWeight: 600,
                                            fontSize: '16px'
                                        }}>
                                            {section.title}
                                        </span>
                                        <span style={{
                                            color: '#999',
                                            fontSize: '14px'
                                        }}>
                                            ({sectionTasks.length})
                                        </span>
                                    </div>
                                }
                                style={{
                                    marginBottom: 0,
                                    border: 'none',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                            >
                                <Table
                                    className="custom-ant-table"
                                    columns={taskColumns}
                                    dataSource={sectionTasks}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    showHeader={false}
                                    style={{
                                        border: 'none',
                                        borderTop: '1px solid #f0f0f0',
                                    }}
                                />
                            </Collapse.Panel>
                        );
                    })}
                </Collapse>
            </Card>

            <TaskModal
                visible={taskModalVisible}
                task={editingTask}
                members={members}
                projectId={currentProject.id}
                loading={tasksLoading}
                onCancel={() => setTaskModalVisible(false)}
                onOk={handleTaskModalOk}
            />

            <Modal
                title="Xác nhận xoá"
                open={deleteTaskModalVisible}
                onOk={handleConfirmDeleteTask}
                onCancel={() => setDeleteTaskModalVisible(false)}
                okText="Xoá"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                confirmLoading={tasksLoading}
            >
                <p>Xác nhận cập nhật trạng thái nhiệm vụ</p>
            </Modal>

            <AddMemberModal
                visible={addMemberModalVisible}
                loading={membersLoading}
                members={members}
                users={users}
                onCancel={() => setAddMemberModalVisible(false)}
                onOk={handleAddMember}
            />

            <Modal
                title="Danh sách thành viên"
                open={membersModalVisible}
                onCancel={() => setMembersModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setMembersModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Button key="invite" type="primary" onClick={() => {
                        setMembersModalVisible(false);
                        handleUpdateMemberRole('', MemberRole.PROJECT_MANAGER);
                    }}>
                        Lưu
                    </Button>,
                ]}
                width={600}
            >
                <Table
                    columns={memberColumns}
                    dataSource={members}
                    rowKey="id"
                    loading={membersLoading}
                    pagination={false}
                />
            </Modal>
        </div>
    );
};

export default ProjectDetail;