// controllers/file.controller.js
import fs from 'fs';
import path from 'path';
import Activity from '../models/activity.model.js';

export const file = async (req, res) => {
  try {
    const { fileServerPath } = req.body;
    const file = req.file;

    if (!file || !fileServerPath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing file or file server path' 
      });
    }

    const fileName = file.originalname;
    
    console.log(`Received file: ${fileName}, Size: ${file.size} bytes`);
    console.log(`Target path: ${fileServerPath}`);

    // 处理 UNC 路径中的反斜杠
    let normalizedPath = fileServerPath;
    
    // 确保 UNC 路径格式正确
    if (!normalizedPath.startsWith('\\\\')) {
      console.warn(`Path does not start with \\\\: ${normalizedPath}`);
      
      // 尝试修复路径格式
      if (normalizedPath.startsWith('\\')) {
        normalizedPath = '\\' + normalizedPath;
      } else if (normalizedPath.includes('192.168.100.1')) {
        normalizedPath = '\\\\' + normalizedPath.replace(/^\\+/, '');
      }
    }
    
    // 构建完整文件路径
    let fullPath;
    try {
      // 对于 UNC 路径，直接拼接
      if (normalizedPath.endsWith('\\')) {
        fullPath = normalizedPath + fileName;
      } else {
        fullPath = normalizedPath + '\\' + fileName;
      }
    } catch (pathError) {
      console.error('Path join error:', pathError);
      
      return res.status(400).json({
        success: false,
        message: `Invalid file path: ${pathError.message}`
      });
    }

    try {
      console.log(`Attempting to save to: ${fullPath}`);
      
      // 对于 UNC 路径，Node.js 可以直接写入（需要服务器有网络权限）
      // 注意：在 Windows 上，Node.js 进程需要有访问网络共享的权限
      
      // 检查父目录是否存在 - 对于 UNC 路径，fs.existsSync 可能无法正常工作
      // 我们直接尝试写入，如果失败再处理错误
      
      // 写入文件
      fs.writeFileSync(fullPath, file.buffer);
      console.log(`✓ File successfully saved to: ${fullPath}`);
      
      // 记录成功上传活动
      try {
        const activity = new Activity({
          date: new Date().toLocaleString(),
          activity: 'File Upload',
          detail: `${req.user.username} saved OEE report to ${path.basename(fullPath)}`
        });
        await activity.save();
      } catch (activityError) {
        console.warn('Failed to save activity log:', activityError);
        // 不因活动记录失败而中断主流程
      }
      
      res.status(200).json({
        success: true,
        message: `File saved successfully to file server`,
        path: fullPath,
        fileName: fileName,
        fileSize: file.size
      });
      
    } catch (writeError) {
      console.error(`✗ File write error: ${writeError.message}`);
      console.error(`Error code: ${writeError.code}`);
      console.error(`Error stack: ${writeError.stack}`);
      
      // 提供更详细的错误信息和解决方案
      let errorMessage = `Error saving file: ${writeError.message}`;
      let suggestion = '';
      
      if (writeError.code === 'ENOENT') {
        errorMessage = `Network path not found: ${fileServerPath}`;
        suggestion = `Please check if the server can access: \\\\192.168.100.1`;
      } else if (writeError.code === 'EPERM' || writeError.code === 'EACCES') {
        errorMessage = `Permission denied. Cannot write to: ${fileServerPath}`;
        suggestion = 'Please check network share permissions for the server account';
      } else if (writeError.code === 'ENOTDIR') {
        errorMessage = `Path is not a directory: ${fileServerPath}`;
        suggestion = 'Please verify the full path exists';
      } else if (writeError.code === 'ENETUNREACH' || writeError.code === 'ETIMEDOUT') {
        errorMessage = `Network unreachable: ${fileServerPath}`;
        suggestion = 'Check network connection to file server (192.168.100.1)';
      } else if (writeError.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused by file server`;
        suggestion = 'Check if file server is running and SMB service is enabled';
      } else if (writeError.code === 'EUNKNOWN' || writeError.code === 'UNKNOWN') {
        errorMessage = `Unknown network error`;
        suggestion = 'Try mapping the network drive on the server first';
      }
      
      // 尝试替代方案：保存到服务器本地
      try {
        const fallbackPath = path.join(process.cwd(), 'temp_saves', fileName);
        const fallbackDir = path.dirname(fallbackPath);
        
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        
        fs.writeFileSync(fallbackPath, file.buffer);
        
        console.log(`✓ File saved locally as fallback: ${fallbackPath}`);
        
        res.status(200).json({
          success: true,
          message: `File saved locally (network unavailable)`,
          warning: `Network error: ${errorMessage}`,
          suggestion: suggestion,
          path: fallbackPath,
          originalTarget: fullPath,
          note: 'Please manually copy this file to the network location'
        });
        
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
        
        res.status(500).json({
          success: false,
          message: errorMessage,
          suggestion: suggestion,
          originalTarget: fullPath,
          fallbackError: fallbackError.message
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error saving file:', error);
    
    res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message
    });
  }
};