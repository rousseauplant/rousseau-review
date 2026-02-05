import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dk7tsjufx',
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET || '',
});

export async function uploadImage(base64Image: string): Promise<string | null> {
  try {
    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageData}`,
      {
        folder: 'rousseau-review',
        transformation: [
          { width: 800, height: 1067, crop: 'fill' }, // 3:4 ratio
          { quality: 'auto:good' }
        ]
      }
    );
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}