import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Typography,
    Space,
    Row,
    Col,
    message,
    Divider
} from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateProfile } from '../store/authSlice';
import AvatarUpload from '../components/AvatarUpload';
import type { UpdateProfileRequest } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Profile: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector(state => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                bio: user.bio || '',
                phone: user.phone || '',
                address: user.address || '',
            });
        }
    }, [user, form]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                bio: user.bio || '',
                phone: user.phone || '',
                address: user.address || '',
            });
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (!user?.id) return;

            const updateData: UpdateProfileRequest = {
                name: values.name,
                bio: values.bio,
                phone: values.phone,
                address: values.address,
            };

            await dispatch(updateProfile({ userId: user.id, updateData })).unwrap();
            message.success('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (error: any) {
            message.error(error.message || 'Cập nhật thông tin thất bại');
        }
    };

    const handleAvatarChange = async (avatarUrl: string) => {
        if (!user?.id) return;

        try {
            await dispatch(updateProfile({
                userId: user.id,
                updateData: { avatar: avatarUrl }
            })).unwrap();
            message.success('Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
            message.error(error.message || 'Cập nhật ảnh đại diện thất bại');
        }
    };

    if (!user) {
        return <div>Không tìm thấy thông tin người dùng</div>;
    }

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
            <Card>
                <Row gutter={24}>
                    <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                            <AvatarUpload
                                currentAvatar={user.avatar}
                                onAvatarChange={handleAvatarChange}
                                size={120}
                            />
                            <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                                {user.name}
                            </Title>
                            <Text type="secondary">{user.email}</Text>
                        </div>
                    </Col>

                    <Col span={16}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Title level={3} style={{ margin: 0 }}>Thông tin cá nhân</Title>
                            {!isEditing ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleEdit}
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : (
                                <Space>
                                    <Button
                                        icon={<SaveOutlined />}
                                        onClick={handleSave}
                                        loading={loading}
                                        type="primary"
                                    >
                                        Lưu
                                    </Button>
                                    <Button
                                        icon={<CloseOutlined />}
                                        onClick={handleCancel}
                                    >
                                        Hủy
                                    </Button>
                                </Space>
                            )}
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            disabled={!isEditing}
                        >
                            <Form.Item
                                label="Họ và tên"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                            >
                                <Input placeholder="Nhập họ và tên" />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                            >
                                <Input placeholder="Email" disabled />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    {
                                        pattern: /^[0-9]{10,11}$/,
                                        message: 'Số điện thoại không hợp lệ'
                                    }
                                ]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>

                            <Form.Item
                                label="Địa chỉ"
                                name="address"
                            >
                                <Input placeholder="Nhập địa chỉ" />
                            </Form.Item>

                            <Form.Item
                                label="Giới thiệu bản thân"
                                name="bio"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Viết một vài dòng giới thiệu về bản thân..."
                                />
                            </Form.Item>
                        </Form>

                        <Divider />

                        <div>
                            <Text type="secondary">
                                <strong>Ngày tạo tài khoản:</strong> {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                            <br />
                            <Text type="secondary">
                                <strong>Cập nhật lần cuối:</strong> {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default Profile;