import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setCurrentProject, fetchProjects } from '../store/projectsSlice';
import { fetchTasks } from '../store/taskSlice';
import { fetchMembers } from '../store/membersSlice';
import { useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { MemberRole, TaskPriority, TaskStatus, type Project, type MemberWithUserInfo, type Task, type TaskPriorityType, type TaskStatusType, type TaskProgressType } from '../types';
import { Alert, Avatar, Button, Card, Col, Collapse, Dropdown, Input, Menu, Progress, Row, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserAddOutlined,
    SearchOutlined,
    EyeOutlined,
    UserSwitchOutlined,
    UserOutlined
} from '@ant-design/icons';
import { getAvatarBackgroundColor } from '../types';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
function ProjectDetail() {
    const { id } = useParams();
    const dispatch = useAppDispatch();
    const { projects, loading: projectsLoading } = useAppSelector(state => state.projects);
    const { tasks, loading: tasksLoading, error: tasksError } = useAppSelector(state => state.tasks);
    const { members, loading: membersLoading, error: membersError } = useAppSelector(state => state.members);
    const { user } = useAppSelector(state => state.auth);

    const project = projects.find(p => p.id === id);

    useEffect(() => {
        if (projects.length === 0 || !project) {
            if (user?.id) {
                dispatch(fetchProjects(user.id));
            }
        }
    }, [dispatch, projects.length, project, user?.id]);

    useEffect(() => {
        if (project && id) {
            dispatch(setCurrentProject(project));
            dispatch(fetchTasks(id));
            dispatch(fetchMembers(id));
        }
    }, [project, id, dispatch]);

    const getPriorityColor = (priority: TaskPriorityType) => {
        switch (priority) {
            case TaskPriority.HIGH: return '#DC3545';
            case TaskPriority.MEDIUM: return '#FFA500';
            case TaskPriority.LOW: return '#0DCAF0';
            default: return 'default';
        }
    };
    console.log(tasks);
    const getProgressColor = (progress: TaskProgressType) => {
        switch (progress) {
            case 'Hoàn thành': return 'green';
            case 'Đúng tiến độ': return 'blue';
            case 'Có rủi ro': return 'orange';
            case 'Trễ hẹn': return 'red';
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
            width: '30%',
            render: (name) => (
                <Text style={{
                    fontWeight: 400,
                    color: '#212529',
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    paddingLeft: 10
                }}>
                    {name}
                </Text>
            )
        },
        {
            title: "Người Phụ Trách",
            dataIndex: "assigneeId",
            key: "assigneeId",
            width: '14%',
            render: (assigneeId) => {
                const member = members.find(m => m.userId === assigneeId);
                return (
                    <div style={{ textAlign: 'center' }}>
                        <Text style={{
                            fontWeight: 400,
                            color: '#212529',
                            fontSize: '14.5px',
                            cursor: 'pointer',
                        }}>
                            {member ? (member.name || member.email.split('@')[0]) : 'Không xác định'}
                        </Text>
                    </div>
                )
            }
        },
        {
            title: "Độ ưu Tiên",
            dataIndex: "priority",
            key: "priority",
            width: '9%',
            render: (priority) => (
                <div style={{ textAlign: 'center' }}>
                    <Tag color={getPriorityColor(priority)}>
                        {priority === TaskPriority.HIGH ? 'Cao' : priority === TaskPriority.MEDIUM ? 'Trung bình' : 'Thấp'}
                    </Tag>
                </div>
            )
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "startDate",
            key: "startDate",
            width: '12%',
            render: (date) => (
                <div style={{ textAlign: 'center' }}>
                    <Text style={{
                        fontWeight: 400,
                        color: '#0D6EFD',
                        fontSize: '15px'
                    }}>
                        {dayjs(date).format('DD-MM')}
                    </Text>
                </div>
            )
        },
        {
            title: "Hạn chót",
            dataIndex: "deadline",
            key: "deadline",
            width: '9%',
            render: (date) => (
                <div style={{ textAlign: 'center' }}>
                    <Text style={{
                        fontWeight: 400,
                        color: '#0D6EFD',
                        fontSize: '15px'
                    }}>
                        {dayjs(date).format('DD-MM')}
                    </Text>
                </div>
            )
        },
        {
            title: "Tiến độ",
            dataIndex: "progress",
            key: "progress",
            width: '11%',
            render: (progress) => (
                <div style={{ textAlign: 'center' }}>
                    <Tag color={getProgressColor(progress)}>
                        {progress}
                    </Tag>
                </div>
            )
        },
        {
            title: "Hành động",
            key: "action",
            render: (_,) => (
                <div style={{ textAlign: 'center' }}>
                    <Space>
                        <Button
                            color="orange"
                            size="small"
                            variant="outlined"
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
                </div>
            ),
        }
    ];

    // const memberColumns: ColumnsType<MemberWithUserInfo> = [
    //     {
    //         title: "Thành viên",
    //         dataIndex: "email",
    //         key: "email",
    //         render: (email, record) => (
    //             <Space>
    //                 <Avatar
    //                     src={record.avatar}
    //                     style={{
    //                         backgroundColor: record.avatar ? undefined : getAvatarBackgroundColor(record.role)
    //                     }}
    //                 >
    //                     {!record.avatar && (record.name ?
    //                         record.name.charAt(0).toUpperCase() :
    //                         record.email.charAt(0).toUpperCase())
    //                     }
    //                 </Avatar>
    //                 <div>
    //                     <div>{record.name || record.email.split('@')[0]}</div>
    //                     <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Typography.Text>
    //                 </div>
    //             </Space>
    //         )
    //     },
    //     {
    //         title: 'Vai trò',
    //         dataIndex: 'role',
    //         key: 'role',
    //         render: (role) => (
    //             <Select
    //                 value={{ role }}
    //                 style={{ width: '100%' }}
    //                 disabled={role === MemberRole.PROJECT_OWNER}
    //             >
    //                 <Option value={MemberRole.PROJECT_OWNER}>{MemberRole.PROJECT_OWNER}</Option>
    //                 <Option value={MemberRole.FRONTEND_DEVELOPER}>{MemberRole.FRONTEND_DEVELOPER}</Option>
    //                 <Option value={MemberRole.BACKEND_DEVELOPER}>{MemberRole.BACKEND_DEVELOPER}</Option>
    //                 <Option value={MemberRole.FULLSTACK_DEVELOPER}>{MemberRole.FULLSTACK_DEVELOPER}</Option>
    //                 <Option value={MemberRole.DESIGNER}>{MemberRole.DESIGNER}</Option>
    //                 <Option value={MemberRole.TESTER}>{MemberRole.TESTER}</Option>
    //             </Select>
    //         )
    //     },
    //     {
    //         title: '',
    //         key: 'actions',
    //         width: 50,
    //         render: (_, record) => record.role !== MemberRole.PROJECT_OWNER && (
    //             <Button
    //                 size="small"
    //                 danger
    //                 icon={<DeleteOutlined />}
    //             />
    //         ),
    //     },
    // ];


    return (
        <div>
            {projectsLoading && !project ? (
                <Card style={{ marginBottom: 20 }}>
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text>Đang tải thông tin dự án...</Text>
                    </div>
                </Card>
            ) : !project ? (
                <Card style={{ marginBottom: 20 }}>
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text type="danger">Không tìm thấy dự án</Text>
                    </div>
                </Card>
            ) : (
                <>
                    <Card style={{ marginBottom: 20 }}>
                        <Row>
                            <Col span={13}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                }}>
                                    <Title level={3} style={{ margin: 0 }}>{project?.name}</Title>
                                    <div style={{
                                        display: 'flex',
                                        gap: '15px',
                                    }}>
                                        <div
                                            style={{ width: 280, height: 165, overflow: 'hidden', borderRadius: 8 }}
                                        >{project?.imageUrl ? (
                                            <img
                                                src={project.imageUrl}
                                                alt={project.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                            />
                                        ) : (
                                            <Text style={{ fontSize: '12px', color: '#999' }}>Hình ảnh dự án</Text>)
                                            }</div>
                                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                            {project?.description}
                                        </Text>
                                    </div>
                                    <Button
                                        type="primary"
                                        size='middle'
                                        icon={<PlusOutlined />}
                                        style={{
                                            marginTop: 12,
                                            width: 'fit-content'
                                        }}
                                    >
                                        Thêm nhiệm vụ
                                    </Button>
                                </div>
                            </Col>
                            <Col span={2}></Col>
                            <Col span={9}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                            <Title level={4}>Thành viên</Title>
                                            <Dropdown
                                                overlay={
                                                    <Menu>
                                                        <Menu.Item key="view-all" icon={<EyeOutlined />}>
                                                            Xem tất cả thành viên
                                                        </Menu.Item>
                                                        <Menu.Item key="manage" icon={<UserSwitchOutlined />}>
                                                            Quản lý thành viên
                                                        </Menu.Item>
                                                        <Menu.Item key="invite" icon={<UserAddOutlined />}>
                                                            Mời thành viên mới
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item key="export" icon={<EditOutlined />}>
                                                            Xuất danh sách
                                                        </Menu.Item>
                                                    </Menu>
                                                }
                                                trigger={['click']}
                                                placement="bottomRight"
                                            >
                                                <Button
                                                    type="text"
                                                    size="middle"
                                                    icon={<UserOutlined />}
                                                    style={{
                                                        background: 'transparent',
                                                        borderRadius: '50%',
                                                    }}
                                                />
                                            </Dropdown>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', gap: 8, width: "100%" }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                                        {members.slice(0, 2).map(member => (
                                                            <div key={member.id} style={{ display: 'flex', gap: 8, alignItems: 'center', width: "calc(60% - 8px)" }}>
                                                                <Avatar
                                                                    size={45}
                                                                    src={member.avatar}
                                                                    style={{
                                                                        backgroundColor: member.avatar ? undefined : getAvatarBackgroundColor(member.role)
                                                                    }}
                                                                >
                                                                    {!member.avatar && (member.name ?
                                                                        member.name.charAt(0).toUpperCase() :
                                                                        member.email.charAt(0).toUpperCase())
                                                                    }
                                                                </Avatar>
                                                                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                    {member.name || member.email.split('@')[0]}
                                                                    <Text type="secondary" style={{ fontSize: '10px' }}>
                                                                        {member.role}
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>


                                                    {members.length > 2 && (
                                                        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                                            {members.slice(2, 4).map(member => (
                                                                <div key={member.id} style={{ display: 'flex', gap: 8, alignItems: 'center', width: "calc(50% - 8px)" }}>
                                                                    <Avatar
                                                                        size={45}
                                                                        src={member.avatar}
                                                                        style={{
                                                                            backgroundColor: member.avatar ? undefined : getAvatarBackgroundColor(member.role)
                                                                        }}
                                                                    >
                                                                        {!member.avatar && (member.name ?
                                                                            member.name.charAt(0).toUpperCase() :
                                                                            member.email.charAt(0).toUpperCase())
                                                                        }
                                                                    </Avatar>
                                                                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                        {member.name || member.email.split('@')[0]}
                                                                        <Text type="secondary" style={{ fontSize: '10px' }}>
                                                                            {member.role}
                                                                        </Text>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                </div>
                                                {
                                                    members.length > 4 && (
                                                        <Avatar style={{ backgroundColor: '#f5f5f5', color: '#999', fontSize: '15px' }} size={30}>
                                                            +{members.length - 4}
                                                        </Avatar>
                                                    )
                                                }
                                            </div>



                                        </div>
                                    </div>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Space>
                                                <Select
                                                    size="middle"
                                                    defaultValue="Sắp xếp theo"
                                                // placeholder="Sắp xếp theo"
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
                                </div>

                            </Col>
                        </Row>
                    </Card>

                    {tasks.length === 0 ? (
                        <Card style={{ marginBottom: 20 }}>
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Text type="secondary">Không có nhiệm vụ nào trong dự án này</Text>
                            </div>
                        </Card>
                    ) : (
                        <Card>
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

                            <div style={{
                                display: 'flex',
                                background: '#fafafa',
                                fontWeight: 600,
                                fontSize: '14px',
                                borderBottom: '2px solid #f0f0f0',
                                color: '#262626',
                                borderRadius: '6px 6px 0 0',
                                border: '1px solid #d9d9d9',
                                width: '100%',
                            }}>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '30%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center'
                                }}>
                                    Tên Nhiệm Vụ
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '14%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}>
                                    Người Phụ Trách
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '9%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}>
                                    Ưu Tiên
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '12%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}>
                                    Ngày Bắt Đầu
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '9%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}>
                                    Hạn Chót
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    width: '11%',
                                    borderRight: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}>
                                    Tiến Độ
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    padding: '8px 0',
                                    fontSize: '15px',
                                    flex: 1,
                                    textAlign: 'center',
                                    minWidth: 150
                                }}>
                                    Hành động
                                </div>
                            </div>
                            <Collapse style={{ borderRadius: 0 }}>
                                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                                    <Panel
                                        header={`${status} (${statusTasks.length})`}
                                        key={status.toLowerCase().replace(' ', '')}
                                        style={{ fontWeight: 500, color: '#212529', fontSize: '16.106px', fontStyle: 'normal', background: '#fff', padding: 0 }}
                                    >
                                        <Table
                                            columns={taskColumns}
                                            dataSource={statusTasks}
                                            showHeader={false}
                                            rowKey="id"
                                            loading={tasksLoading}
                                            pagination={false}
                                            size="small"
                                            bordered={true}
                                        />
                                    </Panel>
                                ))}
                            </Collapse>
                        </Card>
                    )}
                </>
            )}


        </div>
    )
}

export default ProjectDetail
