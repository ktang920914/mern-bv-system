// controllers/case.controller.js
import Maintenance from "../models/maintenance.model.js";

// 获取案例统计数据 - 完全改为实时计算
export const getCases = async (req, res, next) => {
    try {
        const { year, codes, code } = req.query;
        
        if (!year) {
            return res.status(400).json({ error: 'Year parameter is required' });
        }
        
        let result = [];
        
        // 如果是比较模式且指定了单个 code
        if (code) {
            result = await calculateCasesByCode(year, code);
        } 
        // 如果是普通筛选模式
        else if (codes) {
            const jobCodes = codes.split(',');
            result = await calculateFilteredCases(year, jobCodes);
        } 
        // 如果没有筛选，实时计算所有数据
        else {
            result = await calculateAllCases(year);
        }
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getCases:', error);
        next(error);
    }
};

// 辅助函数：计算所有案例数据
const calculateAllCases = async (year) => {
    try {
        const maintenanceQuery = { 
            jobdate: { $regex: `^${year}` }
        };
        
        const maintenances = await Maintenance.find(maintenanceQuery);
        return processMaintenances(maintenances, year);
    } catch (error) {
        console.error('Error in calculateAllCases:', error);
        return [];
    }
};

// 辅助函数：根据特定 Job Code 计算统计数据
const calculateCasesByCode = async (year, jobCode) => {
    try {
        const maintenanceQuery = { 
            jobdate: { $regex: `^${year}` },
            code: jobCode
        };
        
        const maintenances = await Maintenance.find(maintenanceQuery);
        return processMaintenances(maintenances, year, jobCode);
    } catch (error) {
        console.error('Error in calculateCasesByCode:', error);
        return [];
    }
};

// 辅助函数：根据 Job Code 筛选计算案例统计数据
const calculateFilteredCases = async (year, jobCodes) => {
    try {
        const maintenanceQuery = { 
            jobdate: { $regex: `^${year}` },
            code: { $in: jobCodes }
        };
        
        const maintenances = await Maintenance.find(maintenanceQuery);
        return processMaintenances(maintenances, year);
    } catch (error) {
        console.error('Error in calculateFilteredCases:', error);
        return [];
    }
};

// 通用处理函数
const processMaintenances = (maintenances, year, specificCode = null) => {
    const monthNames = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };
    
    const caseStats = {};
    
    maintenances.forEach(maintenance => {
        if (!maintenance.jobdate || !maintenance.jobtype) {
            return;
        }
        
        // 从 jobdate 中提取月份
        let monthNum;
        if (maintenance.jobdate.includes('-')) {
            monthNum = maintenance.jobdate.split('-')[1];
        } else if (maintenance.jobdate.includes('/')) {
            monthNum = maintenance.jobdate.split('/')[1];
        }
        
        if (!monthNum) return;
        
        const monthName = monthNames[monthNum];
        if (!monthName) return;
        
        // 确保 jobtype 是有效的类型
        const validTypes = ['Breakdown', 'Kaizen', 'Inspect', 'Maintenance'];
        const caseType = validTypes.includes(maintenance.jobtype) ? maintenance.jobtype : 'Others';
        
        // 创建唯一键
        const key = specificCode 
            ? `${caseType}-${monthName}-${year}-${specificCode}`
            : `${caseType}-${monthName}-${year}`;
            
        if (!caseStats[key]) {
            caseStats[key] = {
                type: caseType,
                month: monthName,
                year: parseInt(year),
                count: 0,
                totalCost: 0
            };
            
            // 只有在特定code模式下才添加code字段
            if (specificCode) {
                caseStats[key].code = specificCode;
            }
        }
        
        caseStats[key].count += 1;
        const cost = typeof maintenance.cost === 'number' ? maintenance.cost : parseFloat(maintenance.cost) || 0;
        caseStats[key].totalCost += cost;
    });
    
    return Object.values(caseStats);
};

// 可以移除 updateCaseStats 函数，或者保留作为手动更新用
export const updateCaseStats = async (req, res, next) => {
    try {
        res.status(200).json({ 
            message: 'Case statistics are now calculated in real-time',
            note: 'No pre-generated data is stored anymore'
        });
    } catch (error) {
        next(error);
    }
};