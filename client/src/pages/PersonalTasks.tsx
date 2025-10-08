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
    Button
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
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
    const [sortBy, setSortBy] = useState<'deadline' | 'priority'>('deadline');
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
            render: (status) => <span>{status}</span>,
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
                    </Col>
                </Row>

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