import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export async function uploadToCloudinary(
  filePath: string,
  folder: string = 'invera'
): Promise<{ url: string; publicId: string }> {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey) {
    throw new Error('Cloudinary not configured');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!env.cloudinaryCloudName) return;
  await cloudinary.uploader.destroy(publicId);
}
