import multer from "multer";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import crypto from "crypto";
import sharp from "sharp";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config({ path: "./config/config.env" });

// تكوين AWS S3 client
export const s3Client = new S3Client({
  region: process.env.Bucket_Region, // اختر المنطقة التي ترغب في استخدامها
  credentials: {
    accessKeyId: process.env.AWS_Access_key,
    secretAccessKey: process.env.AWS_key_secret,
  },
});

export const allowedExtensions = {
  Image: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/heif",
    "image/heic",
    "image/avif",
    "image/jfif",
  ],
  Files: ["application/pdf"],
  Videos: ["video/mp4"],
};

export const multerCloud = (allowedExtensionsArr) => {
  if (!allowedExtensionsArr) {
    allowedExtensionsArr = allowedExtensions.Image;
  }
  //================================== Storage =============================
  const storage = multer.memoryStorage({});

  //================================== File Filter =============================
  const fileFilter = function (req, file, cb) {
    if (allowedExtensionsArr.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("invalid extension", { cause: 400 }), false);
  };

  const upload = multer({
    fileFilter,
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
  return upload;
};

const generateHexName = async () => {
  const randomBytes = crypto.randomBytes(32);
  const hexString = randomBytes.toString("hex");
  return { hexString };
};

export const createImg = async ({ folder, file }) => {
  const { hexString } = await generateHexName();
  const buffer = await sharp(file.buffer)
    .resize({
      width: 800,
      height: 600,
      fit: "inside",
    })
    .png({ quality: 80 })
    .toBuffer();

  const imgName = `${folder}/${hexString}`;
  const params = {
    Key: imgName,
    Bucket: process.env.Bucket_name,
    Body: buffer,
    ContentType: file.mimetype,
  };
  const command = new PutObjectCommand(params);
  const response = await s3Client.send(command);

  return { response, imgName };
};

export const GetsingleImg = async ({ ImgName }) => {
  const getObjectParams = {
    Key: ImgName,
    Bucket: process.env.Bucket_name,
  };
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3Client, command);
  return { url };
};

export const deleteImg = async ({ imgName }) => {
  const params = {
    Key: imgName,
    Bucket: process.env.Bucket_name,
  };
  const command = new DeleteObjectCommand(params);
  const response = await s3Client.send(command);

  return { response };
};

export const updateImg = async ({ imgName, file }) => {
  const buffer = await sharp(file.buffer)
    .resize({ width: 800, height: 600, fit: "contain" })
    .png({ quality: 80 })
    .toBuffer();

  const params = {
    Key: imgName,
    Bucket: process.env.Bucket_name,
    Body: buffer,
    ContentType: file.mimetype,
  };
  const command = new PutObjectCommand(params);
  const response = await s3Client.send(command);
  return { response, imgName };
};
