import jwt from 'jsonwebtoken'
import User from "../models/user.model.js"
import { errorHandler } from './error.js'

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.access_token
    if(!token){
        return next(errorHandler(401, 'Unauthorized'))
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if(err){
            return next(errorHandler(401, 'Unauthorized'))
        }
        
        try {
            // 检查用户是否仍然存在
            const currentUser = await User.findById(decoded.id)
            
            // 如果用户不存在（已被删除）
            if (!currentUser) {
                // 对于登出请求，特殊处理 - 允许通过
                if (req.path === '/logout' && req.method === 'POST') {
                    req.user = { 
                        id: decoded.id, 
                        username: 'Deleted User'
                    }
                    return next() // 允许登出请求继续
                }
                
                // 对于其他所有请求，返回错误并清除token
                res.clearCookie('access_token')
                return next(errorHandler(401, 'User account has been deleted'))
            }
            
            // 用户存在，正常继续
            req.user = {
                id: currentUser._id,
                username: currentUser.username
            }
            next()
        } catch (error) {
            next(errorHandler(500, 'Server error'))
        }
    })
}