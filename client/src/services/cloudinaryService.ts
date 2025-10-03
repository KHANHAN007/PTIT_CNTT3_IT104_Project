import axios from "axios";

export const cloudinaryService = {
    async uploadImage(file: File): Promise<string> {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);

        if (response.status !== 200) {
            throw new Error("Failed to upload image");
        }

        const data = response.data;
        return data.secure_url;
    }
}