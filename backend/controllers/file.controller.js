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

    // 构建完整文件路径
    let fullPath;
    try {
      fullPath = path.join(fileServerPath, fileName);
    } catch (pathError) {
      console.error('Path join error:', pathError);
      
      return res.status(400).json({
        success: false,
        message: `Invalid file path: ${pathError.message}`
      });
    }

    try {
      // 检查路径是否存在，如果不存在尝试创建
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        console.log(`Directory does not exist, creating: ${dirPath}`);
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Directory created: ${dirPath}`);
        } catch (mkdirError) {
          console.error(`Failed to create directory: ${mkdirError.message}`);
          
          return res.status(400).json({
            success: false,
            message: `Cannot create directory: ${mkdirError.message}`
          });
        }
      }
      
      // 写入文件
      fs.writeFileSync(fullPath, file.buffer);
      console.log(`File successfully saved to: ${fullPath}`);
      
      // 记录成功上传活动
      const activity = new Activity({
        date: new Date().toLocaleString(),
        activity: 'File Upload',
        detail: `${req.user.username}`
      });
      await activity.save();
      
      res.status(200).json({
        success: true,
        message: `File saved successfully to: ${fullPath}`,
        path: fullPath,
        fileName: fileName,
        fileSize: file.size
      });
      
    } catch (writeError) {
      console.error(`File write error: ${writeError.message}`);
      console.error(`Error code: ${writeError.code}`);
      
      let errorMessage = `Error saving file: ${writeError.message}`;
      
      if (writeError.code === 'ENOENT') {
        errorMessage = `Directory not found: ${fileServerPath}. Please check the path.`;
      } else if (writeError.code === 'EPERM' || writeError.code === 'EACCES') {
        errorMessage = `Permission denied. Cannot write to: ${fileServerPath}. Please check permissions.`;
      } else if (writeError.code === 'ENOTDIR') {
        errorMessage = `Path is not a directory: ${fileServerPath}`;
      }
      
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: writeError.message,
        code: writeError.code
      });
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