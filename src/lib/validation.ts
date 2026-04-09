import { z } from 'zod';

export const loginSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

export const s3SettingsSchema = z.object({
    bucketName: z.string().min(1, 'Bucket name is required'),
    prefix: z.string().default(''),
    endpoint: z.string().url('Must be a valid URL'),
    region: z.string().min(1, 'Region is required'),
    accessKeyId: z.string().min(1, 'Access key is required'),
    secretAccessKey: z.string().min(1, 'Secret key is required'),
    multipartThreshold: z.coerce.number().int().positive().default(5242880),
    maxFileSize: z.coerce.number().int().positive().default(10485760),
});

export const slideshowSettingsSchema = z.object({
    speedS: z.coerce.number().int().min(10).max(600).default(200),
    rows: z.coerce.number().int().min(1).max(10).default(3),
    minCountForMarquee: z.coerce.number().int().min(1).max(50).default(6),
    cacheTtlS: z.coerce.number().int().min(5).max(300).default(30),
});

export const passwordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
