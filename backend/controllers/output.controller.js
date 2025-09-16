import Activity from "../models/activity.model.js";
import Output from "../models/output.model.js";
import { errorHandler } from "../utils/error.js";

export const getOutputs = async (req, res, next) => {
    try {
        const currentDate = new Date().toLocaleString();
                const newActivity = new Activity({
                    date: currentDate,
                    activity: 'View cost',
                    detail: `${req.user.username} view cost from the system`
                })
                await newActivity.save()
        const outputs = await Output.find().sort({updatedAt:-1});
        res.status(200).json(outputs);
    } catch (error) {
        next(error);
    }
};