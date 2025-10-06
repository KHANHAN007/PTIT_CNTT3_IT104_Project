import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjects, createProject, updateProject, deleteProject } from '../store/projectsSlice';
import { fetchAllUsers } from '../store/usersSlice';
import { fetchMembersForProjectsAsync } from '../store/membersSlice';
import type { Project } from '../types';
import { getRoleDisplayName, getRoleColor, MemberRole } from '../types';
import type { ColumnsType } from 'antd/es/table';
import {
    Card,
    Button,
    Table,
    Input,
    Modal,
    Form,
    Space,
    Alert,
    message,
    Tag,
    Tooltip,
    Row,
    Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { Select } from 'antd';


function Projects() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { projects, loading, error } = useAppSelector(state => state.projects);
    const { users } = useAppSelector(state => state.users);
    const { members } = useAppSelector(state => state.members);
    const user = useAppSelector(state => state.auth.user);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [form] = Form.useForm();
    const [managerId, setManagerId] = useState<string | undefined>(undefined);
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const pageSize = 10;

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchProjects(user.id));
            dispatch(fetchAllUsers());
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (projects.length === 0) return;
        const projectIds = projects.map(p => p.id);
        dispatch(fetchMembersForProjectsAsync(projectIds));
    }, [projects, dispatch]);
    const getOwnerInfo = (ownerId: string) => {
        return users.find(u => u.id === ownerId);
    };
    const getUserRoleInProject = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project && user?.id && project.ownerId === user.id) {
            return MemberRole.PROJECT_OWNER;
        }

        const membership = members.find(m =>
            m.projectId === projectId && m.userId === user?.id
        );
        return membership?.role;
    };
    const canUserManageProject = (projectId: string) => {
        const userRole = getUserRoleInProject(projectId);
        return userRole === MemberRole.PROJECT_OWNER || userRole === MemberRole.PROJECT_MANAGER;
    };
    const getUserProjects = () => {
        if (!user?.id) return [];
        return projects.filter(p =>
            p.ownerId === user.id || members.some(m => m.projectId === p.id && m.userId === user.id)
        );
    };

    const handleViewProject = (project: Project) => {
        navigate(`/projects/${project.id}`);
    };

    const handleAddProject = () => {
        setEditingProject(null);
        form.resetFields();
        setManagerId(undefined);
        setMemberIds([]);
        setIsProjectModalVisible(true);
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        form.setFieldsValue({
            name: project.name,
            description: project.description,
            imageUrl: project.imageUrl,
        });
        setIsProjectModalVisible(true);
    };

    const handleDeleteProject = (project: Project) => {
        setDeletingProject(project);
        setIsDeleteModalVisible(true);
    };

    const handleProjectModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (!managerId) {
                message.error('Vui lòng chọn quản lý dự án (manager)');
                return;
            }
            if (!users.find(u => u.id === managerId)) {
                message.error('Quản lý dự án không hợp lệ');
                return;
            }
            const ownerId = user!.id;
            const invalidMembers = memberIds.filter(id => id === ownerId || id === managerId);
            if (invalidMembers.length > 0) {
                message.error('Danh sách thành viên không được chứa chủ dự án hoặc quản lý');
                return;
            }

            const projectData = {
                ...values,
                ownerId: ownerId,
                managerId: managerId,
                members: memberIds.map(id => ({ userId: id })),
            };

            if (editingProject) {
                await dispatch(updateProject({ id: editingProject.id, projectData: values })).unwrap();
                message.success('Cập nhật dự án thành công!');
            } else {
                await dispatch(createProject(projectData)).unwrap();
                message.success('Tạo dự án thành công!');
            }

            setIsProjectModalVisible(false);
            form.resetFields();
        } catch (error) {
            message.error('Có lỗi xảy ra!');
        }
    };

    const handleConfirmDelete = async () => {
        if (deletingProject) {
            try {
                await dispatch(deleteProject(deletingProject.id)).unwrap();
                message.success('Xóa dự án thành công!');
                setIsDeleteModalVisible(false);
                setDeletingProject(null);
            } catch (error) {
                message.error('Có lỗi xảy ra khi xóa dự án!');
            }
        }
    };

    const filteredProjects = getUserProjects().filter(project =>
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.description.toLowerCase().includes(searchText.toLowerCase())
    );

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + pageSize);

    const columns: ColumnsType<Project> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: '4%',
            align: 'center',
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: "8%",
            render: (imageUrl: string) => (
                <div style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="project"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: '10px', color: '#999' }}>No Image</span>
                    )}
                </div>
            ),
        },
        {
            title: 'Tên Dự Án',
            dataIndex: 'name',
            key: 'name',
            width: '12%',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: '22%',
        },
        {
            title: 'Chủ Sở Hữu',
            key: 'owner',
            width: '11%',
            align: 'center',
            render: (_, record) => {
                const owner = getOwnerInfo(record.ownerId);
                return (
                    <Tag color={getRoleColor(MemberRole.PROJECT_OWNER)} style={{ fontWeight: 600 }}>
                        {owner?.name || 'Unknown'}
                    </Tag>
                );
            },
        },
        {
            title: 'Thành viên',
            key: 'members',
            width: '18%',
            render: (_, record) => {
                const projectMembers = members.filter(m => m.projectId === record.id);

                const managerItems = projectMembers
                    .filter(m => m.role === MemberRole.PROJECT_MANAGER)
                    .map(m => {
                        const u = users.find(x => x.id === m.userId);
                        return { label: u ? u.name : m.email, role: m.role };
                    });

                const memberItems = projectMembers
                    .filter(m => m.role !== MemberRole.PROJECT_MANAGER && m.userId !== record.ownerId)
                    .map(m => {
                        const u = users.find(x => x.id === m.userId);
                        return { label: u ? u.name : m.email, role: m.role };
                    });

                const items = [...managerItems, ...memberItems];

                if (items.length === 0) {
                    return <span style={{ color: '#888' }}>Không có</span>;
                }

                const maxVisible = 4;
                const displayed = items.slice(0, maxVisible);
                const extra = items.length - displayed.length;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {displayed.map((it, idx) => {
                            const isManager = it.role === MemberRole.PROJECT_MANAGER;

                            const color = isManager ? 'purple' : 'blue';

                            return (
                                <Tag key={`lab-${record.id}-${idx}`} color={color} style={{ fontWeight: 500, marginRight: 6 }}>
                                    {it.label}
                                </Tag>
                            );
                        })}

                        {extra > 0 && (
                            <Tooltip title={items.slice(maxVisible).map(i => i.label).join(', ')}>
                                <Tag color="blue" style={{ cursor: 'pointer' }}>+{extra}</Tag>
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Vai Trò Của Bạn',
            key: 'userRole',
            width: '10%',
            align: 'center',
            render: (_, record) => {
                const userRole = getUserRoleInProject(record.id);
                if (!userRole) {
                    return <Tag color="default">Không có</Tag>;
                }

                const isOwner = record.ownerId === user?.id;
                const isManager = userRole === MemberRole.PROJECT_MANAGER;

                return (
                    <Tag
                        color={getRoleColor(userRole)}
                        style={{ fontWeight: 500 }}
                    >
                        {getRoleDisplayName(userRole)}
                        {(isOwner || isManager) && (
                            <Tooltip title="Có quyền quản lý">
                                <TeamOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                        )}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành Động',
            key: 'actions',
            width: '15%',
            align: 'center',
            render: (_, record) => {
                const isOwner = record.ownerId === user?.id;
                const canManage = canUserManageProject(record.id);

                return (
                    <Space size="small" wrap>
                        <Button
                            color='blue'
                            variant='outlined'
                            size='small'
                            icon={<EyeOutlined />}
                            onClick={() => handleViewProject(record)}
                        >Chi tiết
                        </Button>
                        <Tooltip title={!canManage ? 'Bạn không có quyền chỉnh sửa dự án' : ''}>
                            <Button
                                color='gold'
                                variant='outlined'
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => canManage && handleEditProject(record)}
                                disabled={!canManage}
                            >
                                Sửa
                            </Button>
                        </Tooltip>

                        <Tooltip title={!isOwner ? 'Chỉ chủ sở hữu mới có thể xóa dự án' : ''}>
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => isOwner && handleDeleteProject(record)}
                                disabled={!isOwner}
                            >
                                Xóa
                            </Button>
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];


    return (
        <div>
            <Card>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Title level={3} style={{ margin: 0 }}>Quản Lý Dự Án Nhóm</Title>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 25,
                        marginBottom: 16
                    }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddProject}
                        >
                            Thêm Dự Án
                        </Button>
                        <Input
                            placeholder="Tìm kiếm dự án"
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />

                    </div>
                </div>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ marginBottom: 16 }}>
                    <Title level={4}>Danh Sách Dự Án</Title>
                </div>


                <div className="projects-table-wrapper">
                    <Table
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        dataSource={paginatedProjects}
                        bordered
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredProjects.length,
                            onChange: (page) => setCurrentPage(page),
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} dự án`,
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
                                            border: '1px solid #373B3E',
                                            textAlign: 'center',
                                        }}
                                    />
                                ),
                            },
                        }}
                    />
                </div>
            </Card>

            <Modal
                title={editingProject ? 'Sửa Dự Án' : 'Thêm Dự Án'}
                open={isProjectModalVisible}
                onOk={handleProjectModalOk}
                onCancel={() => setIsProjectModalVisible(false)}
                okText={editingProject ? 'Cập nhật' : 'Tạo'}
                cancelText="Hủy"
                confirmLoading={loading}
                width={600}
            >
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item
                        label="Tên dự án"
                        name="name"
                        rules={[
                            { required: true, message: 'Tên dự án không được để trống' },
                            { min: 3, max: 100, message: 'Tên dự án phải có độ dài từ 3-100 ký tự' }
                        ]}
                    >
                        <Input placeholder="Nhập tên dự án" />
                    </Form.Item>



                    <Row gutter={0} align="top">
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Hình ảnh dự án"
                                name="imageUrl"
                            >
                                <ImageUpload />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={16}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <Form.Item label="Quản lý dự án (Manager)">
                                        <Select
                                            placeholder="Chọn quản lý dự án"
                                            value={managerId}
                                            onChange={(val) => {
                                                setManagerId(val);
                                                setMemberIds(prev => prev.filter(id => id !== val));
                                            }}
                                            allowClear
                                        >
                                            {users.map(u => (
                                                <Select.Option key={u.id} value={u.id}>{u.name} ({u.email})</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <Form.Item label="Thêm thành viên">
                                        <Select
                                            mode="multiple"
                                            placeholder="Chọn thành viên"
                                            value={memberIds}
                                            onChange={(vals) => setMemberIds(vals)}
                                            optionFilterProp="children"
                                            maxTagCount={5}
                                        >
                                            {users.map(u => (
                                                <Select.Option
                                                    key={u.id}
                                                    value={u.id}
                                                    disabled={u.id === user?.id || u.id === managerId}
                                                >
                                                    {u.name} ({u.email})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[
                            { required: true, message: 'Mô tả không được để trống' },
                            { min: 10, max: 500, message: 'Mô tả phải có độ dài từ 10-500 ký tự' }
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Nhập mô tả dự án"
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Xác nhận xóa"
                open={isDeleteModalVisible}
                onOk={handleConfirmDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                confirmLoading={loading}
            >
                <p>Bạn chắc chắn muốn xóa dự án "{deletingProject?.name}"?</p>
                <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
                    Lưu ý: Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan đến dự án.
                </p>
            </Modal>
        </div>
    )
}

export default Projects