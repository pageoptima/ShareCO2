import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// AWS Configuration
const AWS_CONFIG = {
  ACCESS_KEY_ID: 'AKIAXK2LUP5EUEIDQ4FS',
  SECRET_ACCESS_KEY: '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',
  S3_BUCKET_NAME: 'shareco2-user-profiles',
  S3_REGION: 'ap-south-1',
  S3_BASE_URL: 'https://shareco2-user-profiles.s3.ap-south-1.amazonaws.com'
};

// Validates that the image size is within the allowed limit
function validateImageSize(imageBuffer: Buffer, maxSizeInBytes: number = 1 * 1024 * 1024): void {
  if (imageBuffer.length > maxSizeInBytes) {
    throw new Error("Image size exceeds 1MB limit");
  }
}

// Validates that the MIME type is allowed
function validateMimeType(mimeType: string, allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']): void {
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    throw new Error("Only JPG, JPEG, PNG and GIF image types are allowed");
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
 * Uploads an image to AWS S3 and returns the public URL
 * @param {Buffer} imageBuffer - Binary data of the image
 * @param {string} userName - Username of the user
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg')
 * @param {string} userId - Unique identifier for the user (used in key)
 * @returns {Promise<string>} - Public URL of the uploaded image
 * @throws {Error} - If validation fails or upload fails
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  userName: string,
  mimeType: string,
  userId: string
): Promise<string> {
  try {
    // Validate inputs
    validateImageSize(imageBuffer);
    validateMimeType(mimeType);

    const cleanedUserName = cleanUserName(userName);

    // Initialize S3 client
    const s3Client = new S3Client({
      region: AWS_CONFIG.S3_REGION,
      credentials: {
        accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
        secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY,
      },
    });

    // Generate a unique key for the image using cleaned username
    const uniqueKey = `${userId}/${Date.now()}-${cleanedUserName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: AWS_CONFIG.S3_BUCKET_NAME,
      Key: uniqueKey,
      Body: imageBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(uploadCommand);

    // Construct and return the public URL
    const imageUrl = `${AWS_CONFIG.S3_BASE_URL}/${uniqueKey}`;
    return imageUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`Failed to upload image to S3: ${(error as Error).message}`);
  }
}