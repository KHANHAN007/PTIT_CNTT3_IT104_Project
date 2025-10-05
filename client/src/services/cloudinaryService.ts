export interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
    url: string;
    [key: string]: any;
}

export const cloudinaryService = {
    async uploadImage(file: File): Promise<CloudinaryUploadResponse> {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary configuration is missing');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload image to Cloudinary');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
        }
    },

    async deleteImage(publicId: string): Promise<void> {
        console.log('Delete image:', publicId);
    }
};