import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { createProjectAsync, deleteProjectAsync, fetchProjects, updateProjectAsync } from '../store/projectsSlice';
import type { Project } from '../types';
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
} from 'antd'; import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';
import { useNavigate } from 'react-router';
import TextArea from 'antd/lib/input/TextArea';
import ImageUpload from '../components/ImageUpload';

interface ProjectModalProps {
    visible: boolean;
    project?: Project;
    loading: boolean;
    onCancel: () => void;
    onOk: (project: Project) => void;
}
const ProjectModal: React.FC<ProjectModalProps> = ({
    visible,
    project,
    onCancel,
    onOk,
    loading
}) => {
    const [form] = Form.useForm();
    const { uploadingImage } = useAppSelector(state => state.projects);

    useEffect(() => {
        if (visible) {
            if (project) {
                form.setFieldsValue({
                    name: project.name,
                    description: project.description,
                    image: project.imageUrl
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, project, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            const projectData = {
                ...values,
                imageUrl: values.image
            };
            delete projectData.image;
            onOk(projectData);
        });
    };

    return (
        <Modal
            title={project ? 'Sửa dự án' : 'Thêm/sửa dự án'}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel} disabled={loading || uploadingImage}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    disabled={uploadingImage}
                    onClick={handleOk}
                >
                    {uploadingImage ? 'Đang upload...' : 'Lưu'}
                </Button>,
            ]}
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
                    <Input placeholder="Xây dựng website thương mại điện tử" />
                </Form.Item>
                <Form.Item
                    label="Ảnh dự án"
                    name="image"
                    rules={[{ required: true, message: 'Ảnh dự án không được để trống' }]}
                >
                    <ImageUpload
                        width={300}
                        height={180}
                        placeholder="Chọn ảnh cho dự án"
                    />
                </Form.Item>
                <Form.Item
                    label="Mô tả dự án"
                    name="description"
                    rules={[
                        { required: true, message: 'Mô tả dự án không được để trống' },
                        { min: 10, max: 500, message: 'Mô tả dự án phải có độ dài từ 10-500 ký tự' }
                    ]}
                >
                    <TextArea rows={4} placeholder="Dự án nhằm phát triển..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

function Projects() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { projects, loading, error } = useAppSelector(state => state.projects);
    const user = useAppSelector(state => state.auth.user);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
    const [deletingProject, setDeletingProject] = useState<Project | undefined>();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const pageSize = 10;

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchProjects(user.id));
        }
    }, [dispatch, user]);
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.description.toLowerCase().includes(searchText.toLowerCase())
    );
    const handleViewProject = (projectId: string) => {
        navigate('/projects/' + projectId);
    }
    const handleAddProject = () => {
        setEditingProject(undefined);
        setModalVisible(true);
    }
    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setModalVisible(true);
    }
    const handleDeleteProject = (project: Project) => {
        setDeletingProject(project);
        setDeleteModalVisible(true);
    }
    const handleModalOk = async (values: any) => {
        try {
            if (editingProject) {
                await dispatch(updateProjectAsync({ id: editingProject.id, projectData: values })).unwrap();
            } else {
                await dispatch(createProjectAsync({ ...values, ownerId: user!.id })).unwrap();
            }
            setModalVisible(false);
        } catch (err) {
        }
    };
    const handleConfirmDelete = async () => {
        if (deletingProject) {
            try {
                await dispatch(deleteProjectAsync(deletingProject.id)).unwrap();
                setDeleteModalVisible(false);
                setDeletingProject(undefined);
            } catch (err) {
                // Error is handled by the slice
            }
        }
    };
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + pageSize);

    const columns: ColumnsType<Project> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            align: 'center',
        },
        {
            title: 'Tên Dự Án',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Hành Động',
            key: 'actions',
            width: 200,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        variant="solid"
                        color="gold"
                        size="middle"
                        onClick={() => handleEditProject(record)}
                        style={{
                            color: 'black',
                            fontSize: 13.702,
                            fontStyle: 'normal',
                            fontWeight: 450,
                        }}
                    >
                        Sửa
                    </Button>
                    <Button
                        variant="solid"
                        color="red"
                        size="middle"
                        onClick={() => handleDeleteProject(record)}

                    >
                        Xóa
                    </Button>
                    <Button
                        type="primary"
                        size='middle'
                        onClick={() => handleViewProject(record.id)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
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

                <Table
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    dataSource={paginatedProjects}
                    bordered={true}
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
                                        borderRight: '1px solid #495057',
                                        borderRadius: 0,
                                    }}
                                />
                            ),
                        },
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredProjects.length,
                        onChange: (page) => setCurrentPage(page),
                        showSizeChanger: false,
                        showQuickJumper: false,
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                        },
                        itemRender: (page, type, originalElement) => {
                            if (type === 'page') {
                                return <a style={{ display: 'inline-block' }}>{page}</a>;
                            }
                            return originalElement;
                        }
                    }}
                />
            </Card>

            <ProjectModal
                visible={modalVisible}
                project={editingProject}
                loading={loading}
                onCancel={() => setModalVisible(false)}
                onOk={handleModalOk}
            />
            <Modal
                title="Xác nhận xoá"
                open={deleteModalVisible}
                onOk={handleConfirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="Xoá"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                confirmLoading={loading}
            >
                <p>Bạn chắc chắn muốn xoá dự án này?</p>
            </Modal>
        </div>
    )
}

export default Projects