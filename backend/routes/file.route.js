import express from 'express';
import multer from 'multer';
import { verifyToken } from '../utils/verifyUser.js';
import { file } from '../controllers/file.controller.js';

const router = express.Router();

// 配置 multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 限制
  }
});

// 保存 Excel 文件到服务器
router.post('/save-excel', verifyToken, upload.single('file'), file);

export default router;