import Activity from "../models/activity.model.js"
import Maintenance from "../models/maintenance.model.js"

export const maintenance = async (req,res,next) => {
    const {jobtype, code, jobdate, problem, jobdetail, rootcause, cost, completiondate, supplier, status} = req.body
    try {
        const newMaintenance = new Maintenance({
            jobtype,
            code,
            jobdate,
            problem,
            jobdetail,
            rootcause,
            cost,
            completiondate,
            supplier,
            status
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create maintenance',
            detail: `${req.user.username} create maintenance`
        })
        await newActivity.save()

        await newMaintenance.save()
        res.status(201).json({message:'Register successfully'})
    } catch (error) {
        next(error)
    }
}

export const getMaintenances = async (req,res,next) => {
    try {
        const maintenances = await Maintenance.find().sort({updatedAt:-1})
        res.status(200).json(maintenances)
    } catch (error) {
        next(error)
    }
}

export const deleteMaintenance = async (req,res,next) => {
    try {
        await Maintenance.findByIdAndDelete(req.params.maintenanceId)
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete maintenance',
            detail: `${req.user.username} delete maintenance`
        })
        await newActivity.save()
        res.status(200).json('Maintenance is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateMaintenance = async (req,res,next) => {
    try {
        const updatedMaintenance = await Maintenance.findByIdAndUpdate(req.params.maintenanceId, {
        $set: {
            jobdate:req.body.jobdate,
            problem:req.body.problem,
            code:req.body.code,
            jobtype:req.body.jobtype,
            completiondate:req.body.completiondate,
            jobdetail:req.body.jobdetail,
            rootcause:req.body.rootcause,
            supplier: req.body.supplier,
            cost:req.body.cost,
            status:req.body.status
        },
    },{new:true})
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Update maintenance',
        detail: `${req.user.username} update maintenance`
    })
    await newActivity.save()
    res.status(200).json(updatedMaintenance)
    } catch (error) {
        next(error)
    }
}