import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setCurrentProject } from '../store/projectsSlice';
import { featchTasks } from '../store/taskSlice';
import { fetchMembers } from '../store/membersSlice';
import { useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { MemberRole, TaskPriority, TaskStatus, type Project, type ProjectMember, type Task, type TaskPriorityType, type TaskStatusType } from '../types';
import { Alert, Avatar, Button, Card, Col, Collapse, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserAddOutlined,
    SearchOutlined,
    FormOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
function ProjectDetail() {
    const { id } = useParams();
    const dispatch = useAppDispatch();
    const { projects } = useAppSelector(state => state.projects);
    const { tasks, loading: tasksLoading, error: tasksError } = useAppSelector(state => state.tasks);
    const { members, loading: membersLoading, error: membersError } = useAppSelector(state => state.members);

    const project = projects.find(p => p.id === id);

    useEffect(() => {
        if (project) {
            dispatch(setCurrentProject(project));
            dispatch(featchTasks(project.id));
            dispatch(fetchMembers(project.id));
        }
    }, [project, dispatch]);

    const getPriorityColor = (priority: TaskPriorityType) => {
        switch (priority) {
            case TaskPriority.HIGH: return '#0DCAF0';
            case TaskPriority.MEDIUM: return '#FFA500';
            case TaskPriority.LOW: return '#DC3545';
            default: return 'default';
        }
    };
    console.log(tasks);
    const getStatusColor = (status: TaskStatusType) => {
        switch (status) {
            case TaskStatus.TODO: return 'blue';
            case TaskStatus.IN_PROGRESS: return 'orange';
            case TaskStatus.PENDING: return 'red';
            case TaskStatus.DONE: return 'green';
            default: return 'default';
        }
    };

    const tasksByStatus = {
        [TaskStatus.TODO]: tasks.filter(task => task.status === TaskStatus.TODO),
        [TaskStatus.IN_PROGRESS]: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
        [TaskStatus.PENDING]: tasks.filter(task => task.status === TaskStatus.PENDING),
        [TaskStatus.DONE]: tasks.filter(task => task.status === TaskStatus.DONE),
    };
    const taskColumns: ColumnsType<Task> = [
        {
            title: "Tên nhiệm vụ",
            dataIndex: "name",
            key: "name",
            render: (name) => (
                <Text style={{
                    fontWeight: 400,
                    color: '#212529',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}>
                    {name}
                </Text>
            )
        },
        {
            title: "Người Phụ Trách",
            dataIndex: "assigneeId",
            key: "assigneeId",
            render: (assigneeId) => {
                const member = members.find(m => m.userId === assigneeId);
                return (
                    <Text style={{
                        fontWeight: 400,
                        color: '#212529',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}>
                        {member ? member.email.split('@')[0] : 'Không xác định'}
                    </Text>
                )
            }
        },
        {
            title: "Độ ưu Tiên",
            dataIndex: "priority",
            key: "priority",
            render: (priority) => (
                <Tag color={getPriorityColor(priority)}>
                    {getPriorityColor(priority)}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Space>
                    <Text style={{
                        fontWeight: 400,
                        color: '#212529',
                        fontSize: '14px'
                    }}>
                        {status}
                    </Text>
                    <FormOutlined />
                </Space>
            )
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "startDate",
            key: "startDate",
            render: (date) => {
                return (
                    <Text style={{
                        fontWeight: 400,
                        color: '#212529',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}>
                        {dayjs(date).format('DD/MM')}
                    </Text>
                )
            }
        },
        {
            title: "Hạn chót",
            dataIndex: "deadline",
            key: "deadline",
            render: (date) => dayjs(date).format('DD/MM')
        },
        {
            title: "Tiến độ",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusColor(status)}
                </Tag>
            )
        },
        {
            title: "Hành động",
            key: "action", render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                    >
                        Sửa
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        }
    ];

    const memberColumns: ColumnsType<ProjectMember> = [
        {
            title: "Thành viên",
            dataIndex: "email",
            key: "email",
            render: (email, record) => (
                <Space>
                    <Avatar style={{
                        backgroundColor: record.role === MemberRole.PROJECT_OWNER ? '#52c41a' : '#1890ff'
                    }}>
                        {email.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div>{email.split('@')[0]}</div>
                        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{email}</Typography.Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role, record) => (
                <Select
                    value={{ role }}
                    style={{ width: '100%' }}
                    disabled={role === MemberRole.PROJECT_OWNER}
                >
                    <Option value={MemberRole.PROJECT_OWNER}>{MemberRole.PROJECT_OWNER}</Option>
                    <Option value={MemberRole.FRONTEND_DEVELOPER}>{MemberRole.FRONTEND_DEVELOPER}</Option>
                    <Option value={MemberRole.BACKEND_DEVELOPER}>{MemberRole.BACKEND_DEVELOPER}</Option>
                    <Option value={MemberRole.FULLSTACK_DEVELOPER}>{MemberRole.FULLSTACK_DEVELOPER}</Option>
                    <Option value={MemberRole.DESIGNER}>{MemberRole.DESIGNER}</Option>
                    <Option value={MemberRole.TESTER}>{MemberRole.TESTER}</Option>
                </Select>
            )
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
                />
            ),
        },
    ];
    return (
        <div>
            <Card style={{ marginBottom: 20 }}>
                <Row>
                    <Col span={16}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                            <div style={{
                                width: 100,
                                height: 100,
                                background: '#f0f0f0',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Text style={{ fontSize: '12px', color: '#999' }}>Hình ảnh dự án</Text>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Title level={3} style={{ margin: 0 }}>{project?.name}</Title>
                                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                    {project?.description}
                                </Text>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    style={{ marginTop: 12 }}
                                >
                                    + Thêm nhiệm vụ
                                </Button>
                            </div>
                        </div>
                    </Col>
                    <Col span={8}>
                        <div style={{ textAlign: 'right' }}>
                            <Title level={4}>Thành viên</Title>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginBottom: 10 }}>
                                {members.slice(0, 2).map(member => (
                                    <div key={member.id} style={{ textAlign: 'center' }}>
                                        <Avatar
                                            style={{ backgroundColor: member.role === MemberRole.PROJECT_OWNER ? '#52c41a' : '#1890ff' }}
                                        >
                                            {member.email.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <div style={{ fontSize: '10px', marginTop: 2 }}>
                                            {member.email.split('@')[0]}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>
                                            {member.role}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                            <Button
                                icon={<UserAddOutlined />}
                                style={{ marginRight: 8 }}
                            >
                                + Thêm thành viên
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Tasks Section */}
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Space>
                            <Select
                                style={{ width: 200 }}
                                placeholder="Sắp xếp theo"
                            >
                                <Option value="deadline">Sắp xếp theo hạn chót</Option>
                                <Option value="priority">Sắp xếp theo độ ưu tiên</Option>
                            </Select>
                            <Input
                                placeholder="Tìm kiếm nhiệm vụ"
                                prefix={<SearchOutlined />}
                                style={{ width: 250 }}
                            />
                        </Space>
                    </Col>
                </Row>

                {(tasksError || membersError) && (
                    <Alert
                        message={tasksError || membersError}
                        type="error"
                        showIcon
                        closable
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ marginBottom: 16 }}>
                    <Title level={4}>Danh Sách Nhiệm Vụ</Title>
                </div>

                <Collapse
                // activeKey={collapsedPanels}
                >
                    {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                        <Panel
                            header={`▼ ${status} (${statusTasks.length})`}
                            key={status.toLowerCase().replace(' ', '')}
                            style={{ fontWeight: 500, color: '#212529', fontSize: '16.106px', fontStyle: 'normal' }}
                        >
                            <Table
                                columns={taskColumns}
                                dataSource={statusTasks}
                                rowKey="id"
                                loading={tasksLoading}
                                pagination={false}
                                size="small"
                            />
                        </Panel>
                    ))}
                </Collapse>
            </Card>
        </div>
    )
}

export default ProjectDetail
