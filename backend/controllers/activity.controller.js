import Activity from "../models/activity.model.js"

export const getLogs = async (req,res,next) => {
    try {
        const logs = await Activity.find().sort({createdAt:-1})
        res.status(200).json(logs)
    } catch (error) {
        next(error)
    }
}

export const deleteLog = async (req,res,next) => {
    try {
        await Activity.findByIdAndDelete(req.params.logId)
        res.status(200).json('Log is deleted')
    } catch (error) {
        next(error)
    }
}

