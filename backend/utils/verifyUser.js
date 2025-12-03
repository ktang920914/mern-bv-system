import jwt from 'jsonwebtoken'
import User from "../models/user.model.js"
import { errorHandler } from './error.js'

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.access_token
    if(!token) return next(errorHandler(401, 'Unauthorized'))

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if(err) return next(errorHandler(401, 'Unauthorized'))

        try {
            const currentUser = await User.findById(decoded.id)
            if(!currentUser){
                // 删除用户逻辑
                if(req.path === '/logout' && req.method === 'POST'){
                    req.user = { id: decoded.id, username: 'Deleted User' }
                    return next()
                }
                res.clearCookie('access_token')
                return next(errorHandler(401, 'User account has been deleted'))
            }

            // 检查 tokenVersion
            if(decoded.tokenversion !== currentUser.tokenversion){
                res.clearCookie('access_token')
                return next(errorHandler(401, 'Please login again'))
            }

            req.user = {
                id: currentUser._id,
                username: currentUser.username,
                role: currentUser.role
            }
            next()
        } catch (error) {
            next(error)
        }
    })
}
