import Activity from "../models/activity.model.js";
import Cost from "../models/cost.model.js";

export const getCosts = async (req, res, next) => {
    try {
        const currentDate = new Date().toLocaleString();
                const newActivity = new Activity({
                    date: currentDate,
                    activity: 'View cost',
                    detail: `${req.user.username} view cost from the system`
                })
                await newActivity.save()
        const costs = await Cost.find().sort({updatedAt:-1});
        res.status(200).json(costs);
    } catch (error) {
        next(error);
    }
};