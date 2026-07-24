import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;

// ─── Upload Helpers ──────────────────────────────────────────────────────────

export type UploadType =
  | "item"
  | "category"
  | "branding-logo"
  | "branding-cover"
  | "branding-video";

const FOLDER_MAP: Record<UploadType, string> = {
  item: "regalia/menu/items",
  category: "regalia/menu/categories",
  "branding-logo": "regalia/branding",
  "branding-cover": "regalia/branding",
  "branding-video": "regalia/branding/videos",
};

const MAX_SIZE_BYTES: Record<UploadType, number> = {
  item: 500 * 1024, // 500 KB
  category: 500 * 1024, // 500 KB
  "branding-logo": 500 * 1024, // 500 KB
  "branding-cover": 2 * 1024 * 1024, // 2 MB
  "branding-video": 20 * 1024 * 1024, // 20 MB
};

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes: number;
}

/**
 * Upload a file Buffer to Cloudinary.
 * Called from API routes — runs server-side only.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  uploadType: UploadType,
  publicIdPrefix?: string,
): Promise<UploadResult> {
  const maxBytes = MAX_SIZE_BYTES[uploadType];
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `File too large. Max ${Math.round(maxBytes / 1024)} KB for ${uploadType}.`,
    );
  }

  const folder = FOLDER_MAP[uploadType];
  const isVideo = uploadType === "branding-video";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicIdPrefix
          ? `${publicIdPrefix}_${Date.now()}`
          : undefined,
        resource_type: isVideo ? "video" : "image",
        transformation: isVideo
          ? undefined
          : [{ quality: "auto:good", fetch_format: "auto" }],
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Extract public ID from a Cloudinary URL for deletion.
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl);
    const parts = url.pathname.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    // Skip version segment (v1234567) if present
    const afterUpload = parts.slice(uploadIndex + 1);
    const pathWithoutVersion = afterUpload[0]?.match(/^v\d+$/)
      ? afterUpload.slice(1)
      : afterUpload;
    const withExtension = pathWithoutVersion.join("/");
    return withExtension.replace(/\.[^/.]+$/, ""); // remove extension
  } catch {
    return null;
  }
}
