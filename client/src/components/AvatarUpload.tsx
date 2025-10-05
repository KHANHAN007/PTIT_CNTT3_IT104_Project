import React, { useState } from 'react';
import { Upload, Button, Avatar, message, Spin } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { cloudinaryService } from '../services/cloudinaryService';

interface AvatarUploadProps {
    currentAvatar?: string;
    onAvatarChange: (avatarUrl: string) => void;
    size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentAvatar,
    onAvatarChange,
    size = 80
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatar);

    const beforeUpload = (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
        if (!isJpgOrPng) {
            message.error('Chỉ có thể upload file JPG/PNG!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Kích thước ảnh phải nhỏ hơn 2MB!');
            return false;
        }
        return true;
    };

    const handleUpload = async (file: File) => {
        if (!beforeUpload(file)) {
            return;
        }

        setUploading(true);
        try {
            const response = await cloudinaryService.uploadImage(file);
            const avatarUrl = response.secure_url;

            setPreviewUrl(avatarUrl);
            onAvatarChange(avatarUrl);
            message.success('Tải ảnh đại diện thành công!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            message.error('Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: 'avatar',
        showUploadList: false,
        beforeUpload: (file) => {
            handleUpload(file);
            return false;
        },
        accept: 'image/*',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
                <Avatar
                    size={size}
                    src={previewUrl}
                    icon={!previewUrl && <UserOutlined />}
                    style={{
                        border: '2px solid #f0f0f0',
                        cursor: 'pointer'
                    }}
                />
                {uploading && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '50%'
                        }}
                    >
                        <Spin size="small" />
                    </div>
                )}
            </div>

            <Upload {...uploadProps}>
                <Button
                    icon={<UploadOutlined />}
                    loading={uploading}
                    size="small"
                >
                    {uploading ? 'Đang tải...' : 'Thay đổi ảnh đại diện'}
                </Button>
            </Upload>
        </div>
    );
};

export default AvatarUpload;