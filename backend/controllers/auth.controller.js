import Activity from "../models/activity.model.js"
import User from "../models/user.model.js"
import { errorHandler } from "../utils/error.js"
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'


export const login = async (req,res,next) => {
    const {username, password} = req.body
    try {
        if(username === '' || password === ''){
            return next(errorHandler(404, 'Login Failed'))
        }

        const validUser = await User.findOne({username})

        if(!validUser){
            return next(errorHandler(404, 'Login Failed'))
        }

        const validPassword = bcryptjs.compareSync(password, validUser.password)

        if(!validPassword){
            return next(errorHandler(404, 'Login Failed'))
        }

        const token = jwt.sign({id:validUser._id,username:validUser.username},process.env.JWT_SECRET,{expiresIn:'90d'})
        const {password:pass,...rest} = validUser._doc

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Login',
            detail: `${username} login to the system`
        })
        await newActivity.save()

        res.cookie('access_token',token,{
            httpOnly:true,
            maxAge:90*24*60*60*1000
        })
        res.status(200).json(rest)

    } catch (error) {
        next(error)
    }
}

export const register = async (req,res,next) => {
    const {username,password,role} = req.body
    try {
        const existingName = await User.findOne({username})
        if(existingName){
            return next(errorHandler(404, 'Username is exists'))
        }

        if (!username || username.length < 3 || username.length > 8) {
            return next(errorHandler(400, 'Failed'));
        }

        const hashedPassword = await bcryptjs.hash(password,10)

        const newUser = new User({
            username,
            password:hashedPassword,
            role
        })

        await newUser.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const logout = async (req,res,next) => {
    try {
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Logout',
            detail: `${req.user.username} logout from the system`
        })
        await newActivity.save()
        res.clearCookie('access_token')
        res.status(200).json({message:'Signout Successfully'})
    } catch (error) {
        next(error)
    }
}

export const getUsers = async (req,res,next) => {
    try {
        const users = await User.find().sort({updatedAt:-1})
        res.status(200).json(users)
    } catch (error) {
        next(error)
    }
}

export const deleteUser = async (req,res,next) => {
    try {
        await User.findByIdAndDelete(req.params.userId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete user',
            detail: `${req.user.username} delete user`
        })
        await newActivity.save()
        res.status(200).json('User is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req,res,next) => {
    try {
        const existingUser = await User.findOne({ 
            username: req.body.username,
            _id: { $ne: req.params.userId } 
        });
        
        if (existingUser) {
            return next(errorHandler(404, 'Update Failed'))
        }
        if(req.body.password){
        req.body.password = bcryptjs.hashSync(req.body.password, 10)
        }
        const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
        $set: {
            username: req.body.username,
            password: req.body.password,
            role: req.body.role
        },
    },{new:true})

    const {password, ...rest} = updatedUser._doc
    const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update user',
            detail: `${req.user.username} update user`
        })
        await newActivity.save()
    res.status(200).json(rest)
    } catch (error) {
        next(error)
    }
}
