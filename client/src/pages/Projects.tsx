import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjects } from '../store/projectsSlice';
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
} from 'antd'; import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import Title from 'antd/lib/typography/Title';


function Projects() {
    const dispatch = useAppDispatch();
    const { projects, loading, error } = useAppSelector(state => state.projects);
    const user = useAppSelector(state => state.auth.user);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
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
                        type="primary"
                        size='small'
                        icon={<EyeOutlined />}
                    >Chi tiết
                    </Button>
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
                    components={{
                        header: {
                            cell: (props: any) => (
                                <th
                                    {...props}
                                    style={{
                                        ...props.style,
                                        backgroundColor: '#212529',
                                        color: 'white',
                                        borderBottom: '1px solid #495057'
                                    }}
                                />
                            ),
                        },
                    }}
                />
            </Card>
            <Modal
                title="Xác nhận xoá"
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