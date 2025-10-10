import React, { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Input,
    Modal,
    Space,
    Alert,
    Row,
    Col,
    Typography,
    Tag,
    Select,
    Collapse,
    Button,
    Badge,
    Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchUserTasksAsync,
    fetchTasksByIdsAsync,
    updateTaskStatusAsync,
    clearError
} from '../store/tasksSlice';
import type { Task, TaskStatusType, TaskPriorityType, TaskProgressType } from '../types';
import { TaskStatus, TaskPriority, TaskProgress } from '../types';
import { fetchProjectsByIds, fetchProjects } from '../store/projectsSlice';

const { Title } = Typography;
const { Option } = Select;

interface StatusUpdateModalProps {
    visible: boolean;
    task?: Task;
    onCancel: () => void;
    onOk: (status: TaskStatusType) => void;
    loading: boolean;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    visible,
    task,
    onCancel,
    onOk,
    loading
}) => {
    const [selectedStatus, setSelectedStatus] = useState<TaskStatusType | undefined>();

    useEffect(() => {
        if (visible && task) {
            setSelectedStatus(task.status);
        }
    }, [visible, task]);

    const handleOk = () => {
        if (selectedStatus) {
            onOk(selectedStatus);
        }
    };

    const availableStatuses = [TaskStatus.IN_PROGRESS, TaskStatus.PENDING];

    return (
        <Modal
            title="Cập nhật trạng thái nhiệm vụ"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                    Xác nhận
                </Button>,
            ]}
        >
            <p>Xác nhận cập nhật trạng thái nhiệm vụ</p>
            <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%' }}
                placeholder="Chọn trạng thái mới"
            >
                {availableStatuses.map(status => (
                    <Option key={status} value={status}>{status}</Option>
                ))}
            </Select>
        </Modal>
    );
};

const PersonalTasks: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tasks, loading, error } = useAppSelector(state => state.tasks);
    const user = useAppSelector(state => state.auth.user);
    const projects = useAppSelector(state => state.projects.projects);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'createdAt' | 'name'>('deadline');

    // Filter states
    const [filterStatus, setFilterStatus] = useState<TaskStatusType | undefined>(undefined);
    const [filterPriority, setFilterPriority] = useState<TaskPriorityType | undefined>(undefined);
    const [filterProgress, setFilterProgress] = useState<TaskProgressType | undefined>(undefined);
    const [filterProject, setFilterProject] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    console.log(tasks);
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchUserTasksAsync(user.id));
            dispatch(fetchProjects(user.id));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);
    console.log(projects);

    const handleStatusModalOk = async (status: TaskStatusType) => {
        if (editingTask) {
            try {
                await dispatch(updateTaskStatusAsync({ id: editingTask.id, status })).unwrap();
                setStatusModalVisible(false);
            } catch (err) {
            }
        }
    };

    const handleResetFilters = () => {
        setSearchText('');
        setFilterStatus(undefined);
        setFilterPriority(undefined);
        setFilterProgress(undefined);
        setFilterProject(undefined);
        setSortBy('deadline');
        setSortOrder('asc');
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (searchText) count++;
        if (filterStatus) count++;
        if (filterPriority) count++;
        if (filterProgress) count++;
        if (filterProject) count++;
        return count;
    };



    const filteredTasks = tasks
        .filter(task => {
            // Text search filter
            const matchesSearch = searchText === '' ||
                task.name.toLowerCase().includes(searchText.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()));

            // Status filter
            const matchesStatus = !filterStatus || task.status === filterStatus;

            // Priority filter
            const matchesPriority = !filterPriority || task.priority === filterPriority;

            // Progress filter
            const matchesProgress = !filterProgress || task.progress === filterProgress;

            // Project filter
            const matchesProject = !filterProject || task.projectId === filterProject;

            return matchesSearch && matchesStatus && matchesPriority && matchesProgress && matchesProject;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'deadline':
                    comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    break;
                case 'priority':
                    const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
                    comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    useEffect(() => {
        if (user?.id) {
            if (user && 'tasks' in user && Array.isArray((user as any).tasks) && (user as any).tasks.length > 0 && (user as any).tasks.every((t: any) => typeof t === 'string')) {
                dispatch(fetchTasksByIdsAsync((user as any).tasks as string[]));
            } else {
                dispatch(fetchUserTasksAsync(user.id));
            }
        }
    }, [dispatch, user?.id]);
    useEffect(() => {
        const projectIds = Array.from(new Set(filteredTasks.map(t => t.projectId).filter(Boolean)));
        if (projectIds.length > 0) {
            dispatch(fetchProjectsByIds(projectIds));
        }
    }, [dispatch, filteredTasks]);
    const sections = Array.from(
        filteredTasks.reduce((map, task) => {
            if (!map.has(task.projectId)) {
                const project = projects.find(p => p.id === task.projectId);
                map.set(task.projectId, {
                    projectId: task.projectId,
                    key: `project-${task.projectId}`,
                    title: project ? project.name : `Project ${task.projectId}`,
                });
            }
            return map;
        }, new Map())
    ).map(([, v]) => v as { projectId: string; key: string; title: string; color: string });

    const getProgressColor = (progress: TaskProgressType) => {
        switch (progress) {
            case TaskProgress.ON_TRACK: return 'green';
            case TaskProgress.AT_RISK: return 'orange';
            case TaskProgress.DELAYED: return 'red';
            case TaskProgress.DONE: return 'blue';
            default: return 'default';
        }
    };
    const taskColumns: ColumnsType<Task> = [
        {
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            className: 'table-col-task-name',
            render: (text) => <span>{text}</span>,
        },
        {
            dataIndex: 'priority',
            width: '15%',
            key: 'priority',
            className: 'table-col-priority',
            render: (priority) => (
                <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
            ),
        },
        {
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            className: 'table-col-status',
            render: (status) => <span>{status}<EditOutlined style={{ color: "#999" }} /></span>,
        },
        {
            dataIndex: 'startDate',
            key: 'startDate',
            width: '12%',
            className: 'table-col-start-date',
            render: (date) => dayjs(date).format('DD-MM'),
        },
        {
            dataIndex: 'deadline',
            width: '12%',
            key: 'deadline',
            className: 'table-col-deadline',
            render: (date) => dayjs(date).format('DD-MM'),
        },
        {
            dataIndex: 'progress',
            key: 'progress',
            className: 'table-col-progress',
            render: (progress: string, record) => (
                <div>
                    <Tag color={getProgressColor(progress as TaskProgressType)}>
                        {progress}
                    </Tag>
                    {record.estimatedHours !== undefined && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                            {typeof record.timeSpentMinutes === 'number' && record.estimatedHours > 0
                                ? `🚀 ${(record.timeSpentMinutes / 60).toFixed(2)}/${record.estimatedHours} giờ`
                                : `Ước tính: ${record.estimatedHours} giờ`}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    const getPriorityColor = (priority: TaskPriorityType) => {
        switch (priority) {
            case TaskPriority.HIGH: return 'red';
            case TaskPriority.MEDIUM: return 'orange';
            case TaskPriority.LOW: return 'blue';
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

    return (
        <div>
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>Danh sách nhiệm vụ</Title>
                    </Col>
                    <Col>
                        <Input
                            placeholder="Tìm kiếm nhiệm vụ"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                        />
                    </Col>
                </Row>

                {/* Advanced Filters */}
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={6} lg={3}>
                            <div style={{ marginBottom: 8 }}>
                                <Badge count={getActiveFiltersCount()} offset={[10, 0]}>
                                    <FilterOutlined /> Bộ lọc
                                </Badge>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6} lg={4}>
                            <Select
                                placeholder="Trạng thái"
                                style={{ width: '100%' }}
                                value={filterStatus}
                                onChange={setFilterStatus}
                                allowClear
                            >
                                <Select.Option value={TaskStatus.TODO}>To do</Select.Option>
                                <Select.Option value={TaskStatus.IN_PROGRESS}>In Progress</Select.Option>
                                <Select.Option value={TaskStatus.PENDING}>Pending</Select.Option>
                                <Select.Option value={TaskStatus.DONE}>Done</Select.Option>
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={6} lg={4}>
                            <Select
                                placeholder="Độ ưu tiên"
                                style={{ width: '100%' }}
                                value={filterPriority}
                                onChange={setFilterPriority}
                                allowClear
                            >
                                <Select.Option value={TaskPriority.HIGH}>Cao</Select.Option>
                                <Select.Option value={TaskPriority.MEDIUM}>Trung bình</Select.Option>
                                <Select.Option value={TaskPriority.LOW}>Thấp</Select.Option>
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={6} lg={4}>
                            <Select
                                placeholder="Tiến độ"
                                style={{ width: '100%' }}
                                value={filterProgress}
                                onChange={setFilterProgress}
                                allowClear
                            >
                                <Select.Option value={TaskProgress.ON_TRACK}>Đúng tiến độ</Select.Option>
                                <Select.Option value={TaskProgress.AT_RISK}>Có rủi ro</Select.Option>
                                <Select.Option value={TaskProgress.DELAYED}>Trễ hẹn</Select.Option>
                                <Select.Option value={TaskProgress.DONE}>Hoàn thành</Select.Option>
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={6} lg={4}>
                            <Select
                                placeholder="Dự án"
                                style={{ width: '100%' }}
                                value={filterProject}
                                onChange={setFilterProject}
                                allowClear
                            >
                                {projects.map(project => (
                                    <Select.Option key={project.id} value={project.id}>
                                        {project.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={6} lg={5}>
                            <Space>
                                <Select
                                    placeholder="Sắp xếp"
                                    style={{ width: 140 }}
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(value) => {
                                        const [field, order] = value.split('-');
                                        setSortBy(field as 'deadline' | 'priority' | 'createdAt' | 'name');
                                        setSortOrder(order as 'asc' | 'desc');
                                    }}
                                >
                                    <Select.Option value="deadline-asc">Hạn chót sớm</Select.Option>
                                    <Select.Option value="deadline-desc">Hạn chót muộn</Select.Option>
                                    <Select.Option value="priority-desc">Ưu tiên cao</Select.Option>
                                    <Select.Option value="priority-asc">Ưu tiên thấp</Select.Option>
                                    <Select.Option value="name-asc">Tên A-Z</Select.Option>
                                    <Select.Option value="name-desc">Tên Z-A</Select.Option>
                                    <Select.Option value="createdAt-desc">Mới nhất</Select.Option>
                                    <Select.Option value="createdAt-asc">Cũ nhất</Select.Option>
                                </Select>

                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={handleResetFilters}
                                    title="Xóa tất cả bộ lọc"
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    {/* Filter Summary */}
                    {getActiveFiltersCount() > 0 && (
                        <>
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                <Space wrap>
                                    {searchText && (
                                        <Tag closable onClose={() => setSearchText('')}>
                                            Tìm kiếm: "{searchText}"
                                        </Tag>
                                    )}
                                    {filterStatus && (
                                        <Tag closable onClose={() => setFilterStatus(undefined)}>
                                            Trạng thái: {filterStatus}
                                        </Tag>
                                    )}
                                    {filterPriority && (
                                        <Tag closable onClose={() => setFilterPriority(undefined)}>
                                            Độ ưu tiên: {getPriorityText(filterPriority)}
                                        </Tag>
                                    )}
                                    {filterProgress && (
                                        <Tag closable onClose={() => setFilterProgress(undefined)}>
                                            Tiến độ: {filterProgress}
                                        </Tag>
                                    )}
                                    {filterProject && (
                                        <Tag closable onClose={() => setFilterProject(undefined)}>
                                            Dự án: {projects.find(p => p.id === filterProject)?.name}
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                        </>
                    )}
                </Card>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => dispatch(clearError())}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div className="task-table-header">
                    <div className="header-col-task-name">Tên Nhiệm Vụ</div>
                    <div className="header-col-assignee">Độ Ưu Tiên</div>
                    <div className="header-col-priority">Trạng thái</div>
                    <div className="header-col-start-date">Ngày Bắt Đầu</div>
                    <div className="header-col-deadline">Hạn Chót</div>
                    <div className="header-col-progress" style={{ flex: 1 }}>Tiến độ</div>
                </div>

                <Collapse
                    className="task-collapse"
                    ghost
                >
                    {sections.map(section => {
                        const sectionTasks = filteredTasks.filter(task => task.projectId === section.projectId);
                        return (
                            <Collapse.Panel
                                key={section.key}
                                header={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            color: section.color,
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
                                    rowClassName={(_record, index) => `personal-task-row row-${index}`}
                                    onRow={(record) => ({
                                        onClick: () => {
                                            setEditingTask(record);
                                            setStatusModalVisible(true);
                                        }
                                    })}
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

            <StatusUpdateModal
                visible={statusModalVisible}
                task={editingTask}
                loading={loading}
                onCancel={() => setStatusModalVisible(false)}
                onOk={handleStatusModalOk}
            />
        </div>
    );
};

export default PersonalTasks;