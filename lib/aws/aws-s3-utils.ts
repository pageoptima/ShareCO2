/**
 * -------------------------------------------------------------------------------------------------------------
 * AWS S3 Bucket File Upload and Manipulation Library
 * 
 * AUTHOR: Bikash Santra
 * EMAIl: santrabikash921@gmail.com
 * VERSION: 1.0.0
 * 
 * Description: A TypeScript library for uploading, retrieving, and deleting files in AWS S3,with support for image validation and pre-signed URL generation.
 * -------------------------------------------------------------------------------------------------------------
 */

import logger from "@/config/logger";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Validates that the image size is within the allowed limit
function validateImageSize(imageBuffer: Buffer, maxSizeInBytes: number = 5 * 1024 * 1024): void {
  if (imageBuffer.length > maxSizeInBytes) {
    throw new Error("Image size exceeds 5MB limit");
  }
}

// Validates that the MIME type is allowed
function validateMimeType(mimeType: string, allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', "image/webp", "image/heic", "image/heif"]): void {
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    throw new Error("Only JPG, JPEG, PNG WEBP, HEIC, HEIF and GIF image types are allowed");
  }
}

// Removes spaces from username and ensures it's not empty
function cleanUserName(userName: string): string {
  const cleanedUserName = userName.replace(/\s+/g, '');
  if (!cleanedUserName) {
    throw new Error("Username cannot be empty!");
  }
  return cleanedUserName;
}

/**
 * Uploads an image to AWS S3 and returns the S3 key
 * @param {Buffer} imageBuffer - Binary data of the image
 * @param {string} userName - Username of the user
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg')
 * @param {string} userId - Unique identifier for the user
 * @param {number} [expiresIn=3600] - Expiration time for the pre-signed URL in seconds
 * @returns {Promise<string>} - S3 key
 * @throws {Error} - If validation fails or upload fails
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  userName: string,
  mimeType: string,
  userId: string
): Promise<string> {
  try {
    // Validate environment variables
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_S3_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS environment variables");
    }

    // Validate inputs
    validateImageSize(imageBuffer);
    validateMimeType(mimeType);

    const cleanedUserName = cleanUserName(userName);

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Generate timestamp and filename for consistency
    const timestamp = Date.now();
    const filename = `${timestamp}-${cleanedUserName}`;

    // Generate a unique key with /prod/profile_pic/ prefix
    const uniqueKey = `prod/profile_pic/${userId}/${filename}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueKey,
      Body: imageBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(uploadCommand);

    return uniqueKey;
  } catch (error) {
    logger.error("Error uploading to S3:", error);
    throw new Error(`Failed to upload image to S3: ${(error as Error).message}`);
  }
}


/**
 * Generates a pre-signed URL for an S3 object
 * @param {string} key - S3 object key
 * @param {number} [expiresIn=3600] - Expiration time in seconds
 * @returns {Promise<string>} - Pre-signed URL
 * @throws {Error} - If generating pre-signed URL fails
 */
export async function getProfileImageUrl(key: string, expiresIn: number = 604800): Promise<string> {
  try {
    // Validate environment variables
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_S3_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS environment variables");
    }

    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, getCommand, { expiresIn });
  } catch (error) {
    logger.error("Error generating pre-signed URL:", error);
    throw new Error(`Failed to generate pre-signed URL: ${(error as Error).message}`);
  }
}


/**
 * Deletes an object from AWS S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 * @throws {Error} - If deletion fails
 */
export async function deleteS3Object(key: string): Promise<void> {
  try {
    // Validate environment variables
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_S3_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS environment variables");
    }

    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
  } catch (error) {
    logger.error("Error deleting S3 object:", error);
    throw new Error(`Failed to delete S3 object: ${(error as Error).message}`);
  }
}