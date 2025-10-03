import type { UploadProps } from 'antd/lib/upload/Upload';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { uploadProjectImage } from '../store/projectsSlice';

interface ImageUploadProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    width?: number;
    height?: number;
}
function ImageUpload({ value, onChange, placeholder = 'Chọn ảnh cho dự án', width = 300, height = 180 }: ImageUploadProps) {
    const dispatch = useAppDispatch();
    const { uploadingImage } = useAppSelector(state => state.projects);

    const handleUpload = async (file: File) => {
        try {
            const resultAction = await dispatch(uploadProjectImage(file));
            if (uploadProjectImage.fulfilled.match(resultAction)) {
                const imageUrl = resultAction.payload;
                onChange?.(imageUrl);
                message.success('Upload ảnh thành công!');
            } else {
                message.error('Upload ảnh thất bại!');
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error('Upload ảnh thất bại!');
        }
    };
    const uploadProps: UploadProps = {
        accept: 'image/*',
        beforeUpload: (file) => {
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ảnh phải nhỏ hơn 5MB!');
                return false;
            }

            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ được upload file ảnh!');
                return false;
            }
            handleUpload(file);
            return false;
        },
        showUploadList: false,
        disabled: uploadingImage,
    };
    return (
        <div>
            <Upload {...uploadProps}>
                <div
                    style={{
                        width,
                        height,
                        border: '2px dashed #d9d9d9',
                        borderRadius: 6,
                        background: value ? 'transparent' : '#fafafa',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    className="upload-area"
                >
                    {uploadingImage ? (
                        <div style={{ textAlign: 'center' }}>
                            <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            <div style={{ marginTop: 8, color: '#666' }}>Đang upload...</div>
                        </div>
                    ) : value ? (
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img
                                src={value}
                                alt="Project preview"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.3s'
                                }}
                                className="upload-overlay"
                            >
                                <div style={{ color: 'white', textAlign: 'center' }}>
                                    <UploadOutlined style={{ fontSize: 20, marginBottom: 4 }} />
                                    <div>Thay đổi ảnh</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#999' }}>
                            <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                            <div>{placeholder}</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                PNG, JPG tối đa 5MB
                            </div>
                        </div>
                    )}
                </div>
            </Upload>

            {value && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <Button
                        type="text"
                        size="small"
                        danger
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange?.('');
                        }}
                        disabled={uploadingImage}
                    >
                        Xóa ảnh
                    </Button>
                </div>
            )}

            <style>{`
                .upload-area:hover {
                    border-color: #1890ff !important;
                }
                .upload-area:hover .upload-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}

export default ImageUpload