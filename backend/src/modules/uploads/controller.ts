import { Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import File from '../files/model';
import Project from '../projects/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { uploadToCloudinary } from '../../services/cloudinary.service';
import { env } from '../../config/env';

const STAFF_ROLES = ['admin', 'super_admin'];

export async function assertProjectMembership(req: AuthRequest, projectId: string) {
  if (!projectId) return;
  const project = await Project.findById(projectId).select('clientId assignedTeam');
  if (!project) throw new AppError('Project not found', 404);
  if (STAFF_ROLES.includes(req.user!.role)) return;
  if (
    req.user!.role === 'client' &&
    project.clientId.toString() === req.user!._id.toString()
  ) {
    return;
  }
  if (
    req.user!.role === 'team' &&
    project.assignedTeam.some((t: any) => t.toString() === req.user!._id.toString())
  ) {
    return;
  }
  throw new AppError('Access denied', 403);
}

export class UploadController {
  async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const projectId = req.body.projectId as string | undefined;
      await assertProjectMembership(req, projectId as string);

      const contentHash = await sha256(req.file.path);

      if (projectId) {
        const existing = await File.findOne({ projectId, contentHash });
        if (existing) {
          await unlink(req.file.path).catch(() => {});
          return sendSuccess(res, existing, 'Duplicate file skipped, existing file returned');
        }
      }

      let fileUrl = `/uploads/${req.file.filename}`;

      if (env.cloudinaryCloudName && env.cloudinaryApiKey) {
        try {
          const result = await uploadToCloudinary(req.file.path);
          fileUrl = result.url;
        } catch (cloudinaryError) {
          console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        }
      }

      const file = await File.create({
        projectId,
        uploadedBy: req.user!._id,
        fileUrl,
        fileName: req.file.originalname,
        version: parseInt(req.body.version || '1', 10),
        type: req.file.mimetype,
        contentHash,
      });

      sendSuccess(res, file, 'File uploaded', 201);
    } catch (error) {
      next(error);
    }
  }

  async getProjectFiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await assertProjectMembership(req, req.params.projectId);
      const files = await File.find({ projectId: req.params.projectId })
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });
      sendSuccess(res, files);
    } catch (error) {
      next(error);
    }
  }
}

async function sha256(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

export const uploadController = new UploadController();
