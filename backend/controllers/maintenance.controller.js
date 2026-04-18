import Activity from "../models/activity.model.js";
import Maintenance from "../models/maintenance.model.js";

// 计算作业时间（completiondate - jobdate）
const calculateJobTime = (jobdate, completiondate) => {
  if (!jobdate || !completiondate) {
    return 0;
  }

  try {
    const startDate = new Date(jobdate);
    const endDate = new Date(completiondate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log("Invalid date format:", { jobdate, completiondate });
      return 0;
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    return Math.round(minutesDiff);
  } catch (error) {
    console.error("Error calculating job time:", error);
    return 0;
  }
};

// 验证和格式化日期时间
const validateDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";

  try {
    if (dateTimeStr.includes("T")) {
      return new Date(dateTimeStr).toISOString();
    } else if (dateTimeStr.includes(":")) {
      return new Date(dateTimeStr).toISOString();
    } else {
      return new Date(`${dateTimeStr}T00:00`).toISOString();
    }
  } catch (error) {
    return dateTimeStr;
  }
};

// 格式化日期时间显示
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";

  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    return dateTimeStr;
  }
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const sanitizeMaintenancePayload = (body) => {
  const requestby = normalizeText(body.requestby);

  return {
    jobtype: normalizeText(body.jobtype),
    code: normalizeText(body.code),
    jobdate: validateDateTime(body.jobdate),
    problem: normalizeText(body.problem),
    jobdetail: normalizeText(body.jobdetail),
    rootcause: normalizeText(body.rootcause),
    cost:
      body.cost === "" || body.cost === undefined || body.cost === null
        ? 0
        : Number(body.cost),
    completiondate: validateDateTime(body.completiondate),
    supplier: normalizeText(body.supplier),
    status: normalizeText(body.status),

    requestby,
    checkedrequestorby: requestby, // auto = requestby
    verifiedbyhod: normalizeText(body.verifiedbyhod),
    commentPreventive: normalizeText(body.commentPreventive),
    comment: normalizeText(body.comment),
  };
};

const formatMaintenanceResponse = (maintenance) => {
  let jobtime = maintenance.jobtime;
  if (jobtime === undefined || jobtime === null) {
    jobtime = calculateJobTime(maintenance.jobdate, maintenance.completiondate);
  }

  return {
    ...maintenance._doc,
    jobdate: formatDateTime(maintenance.jobdate),
    completiondate: formatDateTime(maintenance.completiondate),
    jobtime,
    checkedrequestorby:
      maintenance.checkedrequestorby || maintenance.requestby || "",
    requestby: maintenance.requestby || "",
    verifiedbyhod: maintenance.verifiedbyhod || "",
    commentPreventive: maintenance.commentPreventive || "",
    comment: maintenance.comment || "",
  };
};

// 创建维护记录
export const maintenance = async (req, res, next) => {
  try {
    const payload = sanitizeMaintenancePayload(req.body);

    if (
      !payload.jobtype ||
      !payload.code ||
      !payload.jobdate ||
      !payload.problem ||
      !payload.jobdetail ||
      !payload.rootcause ||
      !payload.status ||
      !payload.requestby
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill in all required fields including Request By.",
      });
    }

    const jobtime = payload.completiondate
      ? calculateJobTime(payload.jobdate, payload.completiondate)
      : 0;

    const newMaintenance = new Maintenance({
      ...payload,
      jobtime,
    });

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: "Create maintenance",
      detail: `${req.user.username}`,
    });

    await newActivity.save();
    await newMaintenance.save();

    res.status(201).json({
      success: true,
      message: "Maintenance job created successfully",
      data: formatMaintenanceResponse(newMaintenance),
    });
  } catch (error) {
    next(error);
  }
};

// 获取所有维护记录
export const getMaintenances = async (req, res, next) => {
  try {
    const { year } = req.query;
    const query = {};

    if (year) {
      query.jobdate = { $regex: `^${year}` };
    }

    const maintenances = await Maintenance.find(query).sort({ updatedAt: -1 });

    const formattedMaintenances = maintenances.map((item) =>
      formatMaintenanceResponse(item)
    );

    res.status(200).json(formattedMaintenances);
  } catch (error) {
    next(error);
  }
};

// 删除维护记录
export const deleteMaintenance = async (req, res, next) => {
  try {
    const deletedMaintenance = await Maintenance.findByIdAndDelete(
      req.params.maintenanceId
    );

    if (!deletedMaintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance job not found",
      });
    }

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: "Delete maintenance",
      detail: `${req.user.username}`,
    });

    await newActivity.save();

    res.status(200).json({
      success: true,
      message: "Maintenance job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// 更新维护记录
export const updateMaintenance = async (req, res, next) => {
  try {
    const payload = sanitizeMaintenancePayload(req.body);

    if (
      !payload.jobtype ||
      !payload.code ||
      !payload.jobdate ||
      !payload.problem ||
      !payload.jobdetail ||
      !payload.rootcause ||
      !payload.status ||
      !payload.requestby
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill in all required fields including Request By.",
      });
    }

    const jobtime = payload.completiondate
      ? calculateJobTime(payload.jobdate, payload.completiondate)
      : 0;

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      req.params.maintenanceId,
      {
        $set: {
          ...payload,
          jobtime,
        },
      },
      { new: true }
    );

    if (!updatedMaintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance job not found",
      });
    }

    const currentDate = new Date().toLocaleString();
    const newActivity = new Activity({
      date: currentDate,
      activity: "Update maintenance",
      detail: `${req.user.username}`,
    });

    await newActivity.save();

    res.status(200).json({
      success: true,
      message: "Maintenance job updated successfully",
      data: formatMaintenanceResponse(updatedMaintenance),
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个维护记录
export const getMaintenanceById = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findById(req.params.maintenanceId);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance job not found",
      });
    }

    res.status(200).json(formatMaintenanceResponse(maintenance));
  } catch (error) {
    next(error);
  }
};