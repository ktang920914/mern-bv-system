import Activity from "../models/activity.model.js"
import Maintenance from "../models/maintenance.model.js"

export const maintenance = async (req,res,next) => {
    const {jobtype, code, jobdate, problem, jobdetail, rootcause, cost, completiondate, supplier, status} = req.body
    
    try {
        // 验证日期时间格式
        const validateDateTime = (dateTimeStr) => {
          if (!dateTimeStr) return null;
          
          try {
            // 检查是否是 datetime-local 格式 (YYYY-MM-DDTHH:MM)
            if (dateTimeStr.includes('T')) {
              return new Date(dateTimeStr).toISOString();
            }
            // 如果已经是 ISO 格式
            else if (dateTimeStr.includes(':')) {
              return new Date(dateTimeStr).toISOString();
            }
            // 如果只有日期，添加默认时间
            else {
              return new Date(`${dateTimeStr}T00:00`).toISOString();
            }
          } catch (error) {
            return dateTimeStr; // 如果解析失败，返回原字符串
          }
        };
        
        const newMaintenance = new Maintenance({
            jobtype,
            code,
            jobdate: validateDateTime(jobdate),
            problem,
            jobdetail,
            rootcause,
            cost,
            completiondate: validateDateTime(completiondate),
            supplier,
            status
        })

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create maintenance',
            detail: `${req.user.username}`
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
        
        // 格式化返回的日期时间
        const formatMaintenances = maintenances.map(maintenance => {
          const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            
            try {
              const date = new Date(dateTimeStr);
              if (isNaN(date.getTime())) return dateTimeStr;
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              
              return `${year}-${month}-${day} ${hours}:${minutes}`;
            } catch (error) {
              return dateTimeStr;
            }
          };
          
          return {
            ...maintenance._doc,
            jobdate: formatDateTime(maintenance.jobdate),
            completiondate: formatDateTime(maintenance.completiondate)
          };
        });
        
        res.status(200).json(formatMaintenances)
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
            detail: `${req.user.username}`
        })
        await newActivity.save()
        res.status(200).json('Maintenance is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateMaintenance = async (req,res,next) => {
    try {
        // 验证和格式化日期时间
        const validateDateTime = (dateTimeStr) => {
          if (!dateTimeStr) return null;
          
          try {
            if (dateTimeStr.includes('T')) {
              return new Date(dateTimeStr).toISOString();
            }
            else if (dateTimeStr.includes(':')) {
              return new Date(dateTimeStr).toISOString();
            }
            else {
              return new Date(`${dateTimeStr}T00:00`).toISOString();
            }
          } catch (error) {
            return dateTimeStr;
          }
        };
        
        const updatedMaintenance = await Maintenance.findByIdAndUpdate(req.params.maintenanceId, {
        $set: {
            jobdate: validateDateTime(req.body.jobdate),
            problem: req.body.problem,
            code: req.body.code,
            jobtype: req.body.jobtype,
            completiondate: validateDateTime(req.body.completiondate),
            jobdetail: req.body.jobdetail,
            rootcause: req.body.rootcause,
            supplier: req.body.supplier,
            cost: req.body.cost,
            status: req.body.status
        },
    },{new:true})
    
    // 格式化返回的日期时间
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return '';
      
      try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (error) {
        return dateTimeStr;
      }
    };
    
    const formattedMaintenance = {
      ...updatedMaintenance._doc,
      jobdate: formatDateTime(updatedMaintenance.jobdate),
      completiondate: formatDateTime(updatedMaintenance.completiondate)
    };
    
    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
        date: currentDate,
        activity: 'Update maintenance',
        detail: `${req.user.username}`
    })
    await newActivity.save()
    res.status(200).json(formattedMaintenance)
    } catch (error) {
        next(error)
    }
}