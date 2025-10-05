import React, { useState, useRef } from 'react';
import { Button, message, Modal, Tooltip } from 'antd';
import { LoadingOutlined, UploadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { cloudinaryService } from '../services/cloudinaryService';

interface ImageUploadProps {
    value?: string;
    onChange?: (url: string) => void;
    disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, disabled }) => {
    const [loading, setLoading] = useState(false);


    const beforeUpload = (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Chỉ có thể tải lên file JPG/PNG!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Hình ảnh phải nhỏ hơn 2MB!');
            return false;
        }
        return true;
    };

    const handleCustomUpload = async (file: File) => {
        setLoading(true);
        try {
            const response = await cloudinaryService.uploadImage(file);
            onChange?.(response.secure_url);
            message.success('Tải ảnh lên thành công!');
        } catch (error) {
            message.error('Tải ảnh lên thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!beforeUpload(file)) {
            e.currentTarget.value = '';
            return;
        }
        handleCustomUpload(file);
        e.currentTarget.value = '';
    };
    const uploadButton = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loading ? <LoadingOutlined /> : <UploadOutlined />}
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
        </div>
    );
    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 8,
        background: '#fafafa',
        border: '1px dashed #d9d9d9',
        position: 'relative',
    };

    const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        gap: 8,
        zIndex: 10,
    };

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);

    const openPreview = (url?: string) => {
        setPreviewImage(url || value);
        setPreviewVisible(true);
    };

    return (
        <div>
            <div style={containerStyle}>
                {value && (
                    <div style={overlayStyle}>
                        <Tooltip title="Xem">
                            <Button size="small" shape="circle" icon={<EyeOutlined />} onClick={() => openPreview(value)} />
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <Button size="small" danger shape="circle" icon={<DeleteOutlined />} onClick={() => onChange?.('')} />
                        </Tooltip>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={disabled || loading}
                />

                {value ? (
                    <img
                        src={value}
                        alt="project"
                        style={{
                            width: '100%',
                            height: '100%',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'pointer'
                        }}
                        onClick={() => openPreview(value)}
                    />
                ) : (
                    <div
                        role="button"
                        onClick={() => !disabled && !loading && fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                        tabIndex={0}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled || loading ? 'not-allowed' : 'pointer' }}
                    >
                        {uploadButton}
                    </div>
                )}
            </div>
            <Modal
                open={previewVisible}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
            >
                {previewImage && <img alt="preview" style={{ width: '100%' }} src={previewImage} />}
            </Modal>
            {value && (
                <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => onChange?.('')}
                    disabled={disabled || loading}
                    style={{ marginTop: 8 }}
                >
                    Xóa ảnh
                </Button>
            )}
        </div>
    );
};

export default ImageUpload;