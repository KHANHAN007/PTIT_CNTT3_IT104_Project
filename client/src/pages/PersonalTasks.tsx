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
    Divider,
    Form,
    message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    EditOutlined,
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
    fetchUserTasksAsync,
    clearError
} from '../store/tasksSlice';
import { createRequest } from '../store/requestsSlice';
import type { Task, TaskStatusType, TaskPriorityType, TaskProgressType } from '../types';
import { TaskStatus, TaskPriority, TaskProgress } from '../types';
import { fetchProjectsByIds, fetchProjects } from '../store/projectsSlice';
import { fetchAllUsers } from '../store/usersSlice';
import { usePassiveTimeTracking } from '../hooks/usePassiveTimeTracking';
import { formatTime } from '../services/passiveTimeService';

const { Title } = Typography;
const { Option } = Select;

// Hàm tính toán độ ưu tiên tự động
const calculateTaskAutoPriority = (task: Task): TaskPriorityType => {
    if (!task.estimatedHours) return task.priority;

    const startTime = new Date(task.startDate).getTime();
    const deadlineTime = new Date(task.deadline).getTime();
    const currentTime = Date.now();
    const totalDuration = deadlineTime - startTime;
    const elapsedTime = Math.max(0, currentTime - startTime);
    const timeSpentHours = (task.timeSpentMinutes || 0) / 60;

    // 1. TIME PRESSURE (0-1): Tỷ lệ thời gian đã trôi qua
    const timePressure = Math.min(1, Math.max(0, elapsedTime / totalDuration));

    // 2. WORK EFFICIENCY (0-2): Tỷ lệ thời gian làm việc vs ước tính
    const workEfficiency = task.estimatedHours > 0 ? timeSpentHours / task.estimatedHours : 0;

    // 3. DEADLINE RISK (0-1): Nguy cơ trễ deadline
    let deadlineRisk = 0;
    const daysToDeadline = (deadlineTime - currentTime) / (1000 * 60 * 60 * 24);

    if (daysToDeadline < 0) {
        deadlineRisk = 1; // Đã quá hạn
    } else if (daysToDeadline < 1) {
        deadlineRisk = 0.9; // Trong 1 ngày
    } else if (daysToDeadline < 3) {
        deadlineRisk = 0.7; // Trong 3 ngày
    } else if (daysToDeadline < 7) {
        deadlineRisk = 0.5; // Trong 1 tuần
    } else {
        deadlineRisk = Math.max(0, 0.3 - (daysToDeadline - 7) * 0.02);
    }

    // 4. BUSINESS IMPACT: Dựa trên progress hiện tại
    let businessImpact = 0.5; // Default
    switch (task.progress) {
        case TaskProgress.DELAYED:
            businessImpact = 1.0; // Ảnh hưởng cao nhất
            break;
        case TaskProgress.AT_RISK:
            businessImpact = 0.8;
            break;
        case TaskProgress.ON_TRACK:
            businessImpact = 0.4;
            break;
        case TaskProgress.DONE:
            businessImpact = 0.1;
            break;
    }

    // 5. STATUS MULTIPLIER: Trọng số theo trạng thái
    let statusMultiplier = 1.0;
    switch (task.status) {
        case TaskStatus.PENDING:
            // Pending: Tính dựa trên time pressure và deadline risk chủ yếu
            statusMultiplier = 1.2; // Tăng nhẹ vì đang tạm dừng
            break;
        case TaskStatus.IN_PROGRESS:
            statusMultiplier = 1.0; // Bình thường
            break;
        case TaskStatus.TODO:
            statusMultiplier = 0.8; // Giảm vì chưa bắt đầu
            break;
        case TaskStatus.DONE:
            return TaskPriority.LOW; // Done luôn là low priority
    }

    // 6. WORK EFFICIENCY PENALTY: Phạt nếu làm quá chậm hoặc quá nhanh
    let efficiencyMultiplier = 1.0;
    if (workEfficiency > 2.0) {
        efficiencyMultiplier = 1.3; // Làm quá lâu so với ước tính
    } else if (workEfficiency > 1.5) {
        efficiencyMultiplier = 1.2;
    } else if (workEfficiency > 1.0) {
        efficiencyMultiplier = 1.1;
    } else if (workEfficiency < 0.1 && task.status === TaskStatus.IN_PROGRESS) {
        efficiencyMultiplier = 0.9; // Vừa bắt đầu, giảm nhẹ
    }

    // 7. TÍNH TOÁN PRIORITY SCORE
    const priorityScore = (
        timePressure * 0.3 +
        Math.min(workEfficiency, 2.0) * 0.25 +
        deadlineRisk * 0.25 +
        businessImpact * 0.2
    ) * statusMultiplier * efficiencyMultiplier;

    // 8. MAPPING SCORE TO PRIORITY
    if (priorityScore >= 0.8) {
        return TaskPriority.HIGH;
    } else if (priorityScore >= 0.5) {
        return TaskPriority.MEDIUM;
    } else {
        return TaskPriority.LOW;
    }
};

interface TaskUpdateRequestModalProps {
    visible: boolean;
    task?: Task;
    projects: any[];
    onCancel: () => void;
    onOk: (values: any) => void;
    loading: boolean;
}

const TaskUpdateRequestModal: React.FC<TaskUpdateRequestModalProps> = ({
    visible,
    task,
    projects,
    onCancel,
    onOk,
    loading
}) => {
    const [form] = Form.useForm();
    const [selectedStatus, setSelectedStatus] = useState<TaskStatusType | undefined>();

    useEffect(() => {
        if (visible && task) {
            setSelectedStatus(task.status);
            form.setFieldsValue({
                currentStatus: task.status,
                newStatus: task.status,
                requestContent: ''
            });
        }
    }, [visible, task, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            const changes: any = {};
            if (values.newStatus !== task?.status && task?.status !== TaskStatus.DONE) {
                if (values.newStatus === TaskStatus.TODO &&
                    (task?.status === TaskStatus.IN_PROGRESS || task?.status === TaskStatus.PENDING)) {
                    return;
                }

                if (values.newStatus === TaskStatus.PENDING &&
                    task?.status === TaskStatus.IN_PROGRESS &&
                    task?.progress !== TaskProgress.ON_TRACK) {
                    return;
                }

                changes.status = values.newStatus;
            }
            const calculatedPriority = getAutoPriority(task);
            if (calculatedPriority !== task?.priority) {
                changes.priority = calculatedPriority;
            }

            const requestData = {
                status: changes.status,
                priority: changes.priority,
                reason: values.requestContent
            };

            onOk(requestData);
        });
    };

    const getAutoPriority = (task?: Task): TaskPriorityType => {
        if (!task) return TaskPriority.MEDIUM;
        return calculateTaskAutoPriority(task);
    };


    const getAvailableStatuses = (): TaskStatusType[] => {
        if (!task) return [];
        const statuses: TaskStatusType[] = [];
        statuses.push(task.status);
        switch (task.status) {
            case TaskStatus.TODO:
                statuses.push(TaskStatus.IN_PROGRESS);
                break;

            case TaskStatus.IN_PROGRESS:
                if (task.progress === TaskProgress.ON_TRACK) {
                    statuses.push(TaskStatus.PENDING);
                }
                statuses.push(TaskStatus.DONE);
                break;

            case TaskStatus.PENDING:
                statuses.push(TaskStatus.IN_PROGRESS);
                break;

            case TaskStatus.DONE:
                break;
        }

        return [...new Set(statuses)];
    }; const availableStatuses = getAvailableStatuses();

    const project = projects.find(p => p.id === task?.projectId);

    return (
        <Modal
            title="Yêu cầu cập nhật nhiệm vụ"
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
            width={600}
        >
            <Form form={form} layout="vertical">
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                    <h4 style={{ margin: 0, marginBottom: 8 }}>THÔNG TIN NHIỆM VỤ</h4>
                    <p style={{ margin: 0 }}><strong>Tên:</strong> {task?.name}</p>
                    <p style={{ margin: 0 }}><strong>Dự án:</strong> {project?.name}</p>
                    <p style={{ margin: 0 }}><strong>Tiến độ hiện tại:</strong> {task?.progress}</p>

                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                            <li><strong>Todo</strong> (mặc định) → <strong>In Progress</strong>: Bắt đầu tính thời gian</li>
                            <li><strong>In Progress</strong> → <strong>Pending</strong>: Tạm dừng (tiến độ = "Tạm dừng", chỉ khi "Đúng tiến độ")</li>
                            <li><strong>In Progress</strong> → <strong>Done</strong>: Hoàn thành (tiến độ = "Hoàn thành")</li>
                            <li><strong>Pending</strong> → <strong>In Progress</strong>: Tiếp tục làm việc (tiến độ quay về trước đó)</li>
                            <li><strong>Lưu ý:</strong> Không thể quay về Todo sau khi đã bắt đầu</li>
                            <li><strong>Done:</strong> Hoàn thành Task.</li>
                        </ul>
                    </div>
                </div>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Trạng thái hiện tại" name="currentStatus">
                            <Input disabled />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Trạng thái mới" name="newStatus">
                            {task?.status === TaskStatus.DONE ? (
                                <div>
                                    <Input value="Done (Không thể thay đổi)" disabled />
                                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                        Task đã hoàn thành, không thể thay đổi trạng thái
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Select
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        style={{ width: '100%' }}
                                    >
                                        {availableStatuses.map(status => (
                                            <Option key={status} value={status}>{status}</Option>
                                        ))}
                                    </Select>

                                    {/* Thông báo về hạn chế chuyển trạng thái */}
                                    {task?.status === TaskStatus.IN_PROGRESS && task?.progress !== TaskProgress.ON_TRACK && (
                                        <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
                                            ⚠️ Không thể chuyển sang "Pending" khi tiến độ không phải "Đúng tiến độ"
                                        </div>
                                    )}

                                    {selectedStatus === TaskStatus.PENDING && task?.status === TaskStatus.IN_PROGRESS && (
                                        <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                                            ℹ️ Chuyển sang "Pending" sẽ tạm dừng tracking và tiến độ thành "Tạm dừng"
                                        </div>
                                    )}

                                    {selectedStatus === TaskStatus.IN_PROGRESS && task?.status === TaskStatus.TODO && (
                                        <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                                            ✅ Bắt đầu task: sẽ tracking thời gian, không thể quay về Todo
                                        </div>
                                    )}

                                    {selectedStatus === TaskStatus.DONE && task?.status === TaskStatus.IN_PROGRESS && (
                                        <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                                            🎉 Hoàn thành task: tiến độ sẽ chuyển thành "Hoàn thành", kết thúc vòng đời
                                        </div>
                                    )}

                                    {selectedStatus === TaskStatus.IN_PROGRESS && task?.status === TaskStatus.PENDING && (
                                        <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                                            ▶️ Tiếp tục làm việc: sẽ tracking thời gian và tiến độ quay về trước đó
                                        </div>
                                    )}
                                </>
                            )}
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item label="Độ ưu tiên (Tự động tính toán)" name="autoPriority">
                            <div>
                                <Input
                                    value={`${getAutoPriority(task) === TaskPriority.HIGH ? 'Cao' :
                                        getAutoPriority(task) === TaskPriority.MEDIUM ? 'Trung bình' : 'Thấp'}`}
                                    disabled
                                />
                                <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.4 }}>
                                    {task && (
                                        <div style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 4, backgroundColor: '#fafafa' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>📊 Phân tích độ ưu tiên:</div>

                                            {(() => {
                                                const startTime = new Date(task.startDate).getTime();
                                                const deadlineTime = new Date(task.deadline).getTime();
                                                const currentTime = Date.now();
                                                const daysToDeadline = Math.ceil((deadlineTime - currentTime) / (1000 * 60 * 60 * 24));
                                                const timeSpentHours = (task.timeSpentMinutes || 0) / 60;
                                                const workEfficiency = task.estimatedHours ? (timeSpentHours / task.estimatedHours * 100) : 0;
                                                const timePressure = Math.max(0, Math.min(100, (currentTime - startTime) / (deadlineTime - startTime) * 100));

                                                return (
                                                    <>
                                                        <div>⏰ <strong>Áp lực thời gian:</strong> {timePressure.toFixed(0)}%</div>
                                                        <div>⚡ <strong>Hiệu suất làm việc:</strong> {workEfficiency.toFixed(0)}% ({timeSpentHours.toFixed(1)}h/{task.estimatedHours}h)</div>
                                                        <div>🎯 <strong>Thời hạn:</strong> {daysToDeadline > 0 ? `${daysToDeadline} ngày` : daysToDeadline === 0 ? 'Hôm nay' : `Quá ${Math.abs(daysToDeadline)} ngày`}</div>
                                                        <div>📈 <strong>Tiến độ:</strong> {task.progress}</div>
                                                        <div>🔄 <strong>Trạng thái:</strong> {task.status}</div>

                                                        <div style={{ marginTop: 4, fontSize: 10, fontStyle: 'italic' }}>
                                                            {workEfficiency > 150 && '⚠️ Vượt quá thời gian ước tính đáng kể'}
                                                            {daysToDeadline < 0 && '🚨 Đã quá deadline'}
                                                            {daysToDeadline <= 1 && daysToDeadline >= 0 && '⏳ Sắp đến deadline'}
                                                            {task.progress === TaskProgress.DELAYED && '❗ Task đang bị trễ'}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Nội dung yêu cầu"
                    name="requestContent"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung yêu cầu' }]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập lý do và nội dung yêu cầu cập nhật nhiệm vụ..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const PersonalTasks: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tasks, loading, error } = useAppSelector(state => state.tasks);
    const user = useAppSelector(state => state.auth.user);
    const projects = useAppSelector(state => state.projects.projects);
    const { users } = useAppSelector(state => state.users);
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

    // Passive time tracking integration
    const passiveTracking = usePassiveTimeTracking();
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchUserTasksAsync(user.id));
            dispatch(fetchProjects(user.id));
            dispatch(fetchAllUsers()); // Fetch all users to get owner info
        }
    }, [dispatch, user?.id]);

    // Fetch all users to get owner names
    useEffect(() => {
        const uniqueOwnerIds = Array.from(new Set(
            projects.map(p => p.ownerId).filter(Boolean)
        ));

        // Tạm thời log để debug
        console.log('Projects:', projects);
        console.log('Users in store:', users);
        console.log('Unique owner IDs:', uniqueOwnerIds);
    }, [projects, users]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    // Update passive tracking when tasks change
    useEffect(() => {
        if (tasks.length > 0) {
            // Update tracking based on task status changes
            passiveTracking.updateTrackingFromTaskChanges(tasks);

            // Log for debugging
            const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
            if (inProgressTasks.length > 0) {
                console.log('PersonalTasks: Found In Progress tasks:', inProgressTasks.map(t => ({ id: t.id, name: t.name })));
            }
        }
    }, [tasks]); // Remove passiveTracking dependency

    // Auto-update task priorities every 5 minutes
    useEffect(() => {
        if (tasks.length === 0) return;

        const updateTaskPriorities = async () => {
            const tasksToUpdate = tasks.filter(task => {
                if (task.status === TaskStatus.DONE) return false;

                const newPriority = calculateTaskAutoPriority(task);
                return newPriority !== task.priority;
            });

            if (tasksToUpdate.length > 0) {
                console.log(`Auto-updating priority for ${tasksToUpdate.length} tasks`);
                // Refresh tasks to get updated priorities from server
                if (user?.id) {
                    dispatch(fetchUserTasksAsync(user.id));
                }
            }
        };

        // Update immediately
        updateTaskPriorities();

        // Set interval for auto-updates every 5 minutes
        const interval = setInterval(updateTaskPriorities, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [tasks, dispatch, user?.id]);

    const handleTaskUpdateRequest = async (formData: {
        status?: TaskStatusType;
        priority?: TaskPriorityType;
        reason: string;
    }) => {
        if (!editingTask) return;

        const project = projects.find(p => p.id === editingTask.projectId);
        if (!project) return;

        try {
            const changes = [];
            const newPriority = calculateTaskAutoPriority(editingTask);

            // Kiểm tra điều kiện chuyển trạng thái theo vòng đời task
            if (formData.status && formData.status !== editingTask.status) {
                if (editingTask.status === TaskStatus.DONE) {
                    message.error('Không thể thay đổi trạng thái của task đã hoàn thành');
                    setStatusModalVisible(false);
                    return;
                }
                if (formData.status === TaskStatus.PENDING) {
                    if (editingTask.progress !== TaskProgress.ON_TRACK) {
                        message.error('Chỉ có thể tạm dừng task khi tiến độ "Đúng tiến độ"');
                        setStatusModalVisible(false);
                        return;
                    }
                }
                changes.push(`trạng thái từ "${editingTask.status}" thành "${formData.status}"`);
                if (formData.status === TaskStatus.DONE) {
                    changes.push(`tiến độ thành "${TaskProgress.DONE}" (tự động khi hoàn thành)`);
                }
                if (formData.status === TaskStatus.PENDING) {
                    changes.push(`tiến độ thành "${TaskProgress.PAUSED}" (tự động khi tạm dừng)`);
                }
            }
            if (newPriority !== editingTask.priority) {
                changes.push(`độ ưu tiên từ "${editingTask.priority}" thành "${newPriority}" (tự động tính toán)`);
            }
            if (changes.length === 0) {
                message.info('Không có thay đổi nào cần yêu cầu');
                setStatusModalVisible(false);
                return;
            }
            const requestMessage = `Yêu cầu cập nhật task "${editingTask.name}" - ${changes.join(' và ')}. Lý do: ${formData.reason}`;
            // Tạo danh sách người nhận (owner và manager nếu khác nhau)
            const recipients: string[] = [];
            if (project.ownerId) recipients.push(project.ownerId);
            if (project.managerId && project.managerId !== project.ownerId) {
                recipients.push(project.managerId);
            }
            await dispatch(createRequest({
                projectId: editingTask.projectId,
                type: 'task_update',
                content: requestMessage,
                senderId: user?.id || '',
                recipientId: recipients, // truyền mảng
                metadata: {
                    taskId: editingTask.id,
                    originalTask: editingTask,
                    requestedChanges: {
                        status: editingTask.status !== TaskStatus.DONE ? formData.status : undefined,
                        priority: newPriority,
                        progress: formData.status === TaskStatus.DONE ? TaskProgress.DONE :
                            formData.status === TaskStatus.PENDING ? TaskProgress.PAUSED : undefined
                    },
                    recipients: recipients // Lưu danh sách tất cả người nhận để hiển thị
                }
            })).unwrap();
            message.success(`Yêu cầu cập nhật task đã được gửi thành công đến ${recipients.length} người quản lý!`);
            setStatusModalVisible(false);
        } catch (error) {
            console.error('Failed to create task update request:', error);
            message.error('Không thể gửi yêu cầu cập nhật task');
        }
    }; const handleResetFilters = () => {
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
            // **CRITICAL**: Only show tasks assigned to current user
            const matchesUser = task.assigneeId === user?.id;

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

            return matchesUser && matchesSearch && matchesStatus && matchesPriority && matchesProgress && matchesProject;
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
            case TaskProgress.PAUSED: return 'default'; // Màu xám
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
            render: (priority, record) => {
                const autoPriority = calculateTaskAutoPriority(record);
                const isAutoCalculated = autoPriority !== priority;

                return (
                    <div>
                        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
                        {isAutoCalculated && (
                            <div style={{ fontSize: 10, color: '#ff6b6b' }}>
                                → {getPriorityText(autoPriority)} (auto)
                            </div>
                        )}
                    </div>
                );
            },
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
            render: (progress: string, record) => {
                const summary = passiveTracking.getTaskSummary(record.id);
                const sessionTimeMinutes = summary.totalMinutes;
                // Kết hợp thời gian từ database và session hiện tại
                const totalTimeMinutes = (record.timeSpentMinutes || 0) + sessionTimeMinutes;

                return (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4, flexDirection: 'column'
                    }}>
                        <Tag color={getProgressColor(progress as TaskProgressType)} style={{ marginRight: 0 }}>
                            {progress}
                        </Tag>
                        <div style={{ fontSize: 12, color: '#888' }}>
                            {record.estimatedHours !== undefined && (
                                <div style={{ marginBottom: 4 }}>
                                    {/* Hiển thị định dạng tiến độ cho task tạm dừng hoặc có thời gian > 0 */}
                                    {((record.status === TaskStatus.PENDING && record.progress === TaskProgress.PAUSED) ||
                                        (totalTimeMinutes > 0 && record.estimatedHours > 0))
                                        ? `🚀 ${formatTime(totalTimeMinutes)}/${record.estimatedHours}h`
                                        : record.estimatedHours > 0
                                            ? `🕛 Ước tính: ${record.estimatedHours}h`
                                            : totalTimeMinutes > 0
                                                ? `⏱️ Đã làm: ${formatTime(totalTimeMinutes)}`
                                                : 'Chưa theo dõi thời gian'
                                    }
                                </div>
                            )}

                            {record.status === TaskStatus.PENDING && record.progress === TaskProgress.PAUSED && (
                                <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                                    {(() => {
                                        const pausedTime = record.pausedAt ? new Date(record.pausedAt) : null;

                                        return (
                                            <div>
                                                <div>
                                                    ⏸️ Tạm dừng lúc: {pausedTime ?
                                                        `${pausedTime.toLocaleDateString('vi-VN')} ${pausedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` :
                                                        'Chưa xác định'
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
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
                            <Input
                                placeholder="Tìm kiếm nhiệm vụ"
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 300 }}
                            />
                        </Space>
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
                                <Select.Option value={TaskProgress.PAUSED}>Tạm dừng</Select.Option>
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
                        const project = projects.find(p => p.id === section.projectId);
                        const ownerUser = project?.ownerId ? users.find(u => u.id === project.ownerId) : null;

                        // Debug log
                        if (project?.ownerId) {
                            console.log(`Project ${project.name} - Owner ID: ${project.ownerId}, Found user:`, ownerUser);
                        }

                        const owner = project?.ownerId ?
                            (user?.id === project.ownerId ? 'Bạn' :
                                ownerUser ? ownerUser.name : `User ${project.ownerId}`) : 'Không xác định';

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
                                        <Tag color="purple">{owner}</Tag>
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

            <TaskUpdateRequestModal
                visible={statusModalVisible}
                onCancel={() => setStatusModalVisible(false)}
                task={editingTask}
                projects={projects}
                loading={loading}
                onOk={handleTaskUpdateRequest}
            />
        </div>
    );
};

export default PersonalTasks;