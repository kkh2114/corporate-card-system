import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  bucket: {
    receipts: process.env.S3_BUCKET_RECEIPTS || 'corporate-card-receipts',
  },
  presignedUrl: {
    uploadExpiry: parseInt(process.env.S3_UPLOAD_EXPIRY || '300', 10),
    downloadExpiry: parseInt(process.env.S3_DOWNLOAD_EXPIRY || '3600', 10),
  },
}));
