// controllers/case.controller.js
import Case from "../models/case.model.js";
import Maintenance from "../models/maintenance.model.js";
import Activity from "../models/activity.model.js";

// 获取案例统计数据 - 修改为支持 Job Code 筛选和比较模式
export const getCases = async (req, res, next) => {
    try {
        const { year, codes, code } = req.query;
        console.log('API Query params:', { year, codes, code });
        
        // 如果是比较模式且指定了单个 code（前端为每个 code 单独调用）
        if (code) {
            const filteredCases = await calculateCasesByCode(year, code);
            return res.status(200).json(filteredCases);
        }
        
        // 如果是普通筛选模式
        if (codes) {
            const jobCodes = codes.split(',');
            const filteredCases = await calculateFilteredCases(year, jobCodes);
            return res.status(200).json(filteredCases);
        }
        
        // 如果没有筛选，返回现有的统计数据
        const query = year ? { year } : {};
        const cases = await Case.find(query).sort({ year: 1, month: 1 });
        res.status(200).json(cases);
    } catch (error) {
        next(error);
    }
};

// 辅助函数：根据特定 Job Code 计算统计数据（用于比较模式）
const calculateCasesByCode = async (year, jobCode) => {
    try {
        console.log(`Calculating cases for code: ${jobCode}, year: ${year}`);
        
        // 构建查询条件
        const maintenanceQuery = { 
            jobdate: { $regex: `^${year}` } // 匹配指定年份的记录
        };
        
        // 添加 Job Code 筛选
        if (jobCode) {
            maintenanceQuery.code = jobCode;
        }
        
        console.log('Maintenance query:', maintenanceQuery);
        
        // 获取维护记录
        const maintenances = await Maintenance.find(maintenanceQuery);
        console.log(`Found ${maintenances.length} maintenance records for ${jobCode}`);
        
        // 月份名称映射
        const monthNames = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
        };
        
        // 统计案例数据
        const caseStats = {};
        
        maintenances.forEach(maintenance => {
            if (!maintenance.jobdate || !maintenance.jobtype) {
                return;
            }
            
            // 从 jobdate 中提取月份
            let monthNum;
            if (maintenance.jobdate.includes('-')) {
                // 格式: YYYY-MM-DD
                monthNum = maintenance.jobdate.split('-')[1];
            } else if (maintenance.jobdate.includes('/')) {
                // 格式: DD/MM/YYYY
                monthNum = maintenance.jobdate.split('/')[1];
            }
            
            if (!monthNum) return;
            
            const monthName = monthNames[monthNum];
            if (!monthName) return;
            
            // 确保 jobtype 是有效的类型
            const validTypes = ['Breakdown', 'Kaizen', 'Inspect', 'Maintenance'];
            const caseType = validTypes.includes(maintenance.jobtype) ? maintenance.jobtype : 'Others';
            
            // 初始化统计对象 - 包含 code 字段
            const key = `${caseType}-${monthName}-${year}-${jobCode}`;
            if (!caseStats[key]) {
                caseStats[key] = {
                    type: caseType,
                    month: monthName,
                    year,
                    code: jobCode, // 添加 code 字段用于区分
                    count: 0,
                    totalCost: 0
                };
            }
            
            caseStats[key].count += 1;
            // 累加成本（确保 cost 是数字）
            const cost = typeof maintenance.cost === 'number' ? maintenance.cost : parseFloat(maintenance.cost) || 0;
            caseStats[key].totalCost += cost;
        });
        
        const result = Object.values(caseStats);
        console.log(`Generated ${result.length} case records for ${jobCode}`);
        return result;
        
    } catch (error) {
        console.error('Error calculating cases by code:', error);
        return [];
    }
};

// 辅助函数：根据 Job Code 筛选计算案例统计数据（用于普通模式）
const calculateFilteredCases = async (year, jobCodes) => {
    try {
        console.log(`Calculating filtered cases for codes: ${jobCodes}, year: ${year}`);
        
        // 构建查询条件
        const maintenanceQuery = { 
            jobdate: { $regex: `^${year}` } // 匹配指定年份的记录
        };
        
        // 添加 Job Code 筛选
        if (jobCodes && jobCodes.length > 0) {
            maintenanceQuery.code = { $in: jobCodes };
        }
        
        console.log('Maintenance query:', maintenanceQuery);
        
        // 获取维护记录
        const maintenances = await Maintenance.find(maintenanceQuery);
        console.log(`Found ${maintenances.length} maintenance records`);
        
        // 月份名称映射
        const monthNames = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
        };
        
        // 统计案例数据
        const caseStats = {};
        
        maintenances.forEach(maintenance => {
            if (!maintenance.jobdate || !maintenance.jobtype) {
                return;
            }
            
            // 从 jobdate 中提取月份
            let monthNum;
            if (maintenance.jobdate.includes('-')) {
                // 格式: YYYY-MM-DD
                monthNum = maintenance.jobdate.split('-')[1];
            } else if (maintenance.jobdate.includes('/')) {
                // 格式: DD/MM/YYYY
                monthNum = maintenance.jobdate.split('/')[1];
            }
            
            if (!monthNum) return;
            
            const monthName = monthNames[monthNum];
            if (!monthName) return;
            
            // 确保 jobtype 是有效的类型
            const validTypes = ['Breakdown', 'Kaizen', 'Inspect', 'Maintenance'];
            const caseType = validTypes.includes(maintenance.jobtype) ? maintenance.jobtype : 'Others';
            
            // 初始化统计对象
            const key = `${caseType}-${monthName}-${year}`;
            if (!caseStats[key]) {
                caseStats[key] = {
                    type: caseType,
                    month: monthName,
                    year,
                    count: 0,
                    totalCost: 0
                };
            }
            
            caseStats[key].count += 1;
            // 累加成本（确保 cost 是数字）
            const cost = typeof maintenance.cost === 'number' ? maintenance.cost : parseFloat(maintenance.cost) || 0;
            caseStats[key].totalCost += cost;
        });
        
        const result = Object.values(caseStats);
        console.log(`Generated ${result.length} filtered case records`);
        return result;
        
    } catch (error) {
        console.error('Error calculating filtered cases:', error);
        return [];
    }
};

// 更新案例统计数据（从维护记录生成）
export const updateCaseStats = async (req, res, next) => {
    try {
        const { year } = req.body;
        
        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }
        
        // 删除该年的所有现有案例数据
        await Case.deleteMany({ year });
        
        // 获取所有维护记录
        const maintenances = await Maintenance.find();
        
        // 月份名称映射
        const monthNames = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
        };
        
        // 统计案例数据
        const caseStats = {};
        let processedCount = 0;
        let yearMatchCount = 0;
        
        maintenances.forEach(maintenance => {
            if (!maintenance.jobdate || !maintenance.jobtype) {
                return;
            }
            
            // 从 jobdate 中提取年份和月份
            let yearFromDate, monthNum;
            if (maintenance.jobdate.includes('-')) {
                // 格式: YYYY-MM-DD
                const parts = maintenance.jobdate.split('-');
                if (parts.length >= 3) {
                    yearFromDate = parts[0];
                    monthNum = parts[1];
                }
            } else if (maintenance.jobdate.includes('/')) {
                // 格式: DD/MM/YYYY
                const parts = maintenance.jobdate.split('/');
                if (parts.length >= 3) {
                    yearFromDate = parts[2];
                    monthNum = parts[1];
                }
            }
            
            // 只处理指定年份的数据
            if (yearFromDate !== year) {
                return;
            }
            
            yearMatchCount++;
            
            const monthName = monthNames[monthNum];
            if (!monthName) {
                return;
            }
            
            // 确保jobtype是有效的类型
            const validTypes = ['Breakdown', 'Kaizen', 'Inspect', 'Maintenance'];
            const caseType = validTypes.includes(maintenance.jobtype) ? maintenance.jobtype : 'Others';
            
            // 初始化统计对象
            const key = `${caseType}-${monthName}-${year}`;
            if (!caseStats[key]) {
                caseStats[key] = {
                    type: caseType,
                    month: monthName,
                    year,
                    count: 0,
                    totalCost: 0
                };
            }
            
            caseStats[key].count += 1;
            // 累加成本（确保cost是数字）
            const cost = typeof maintenance.cost === 'number' ? maintenance.cost : parseFloat(maintenance.cost) || 0;
            caseStats[key].totalCost += cost;
            
            processedCount++;
        });
        
        // 保存到数据库
        const caseData = Object.values(caseStats);
        if (caseData.length > 0) {
            await Case.insertMany(caseData);
        }
        
        res.status(200).json({ 
            message: 'Case statistics updated successfully', 
            recordsProcessed: processedCount,
            statisticsGenerated: caseData.length,
            data: caseData 
        });
        
    } catch (error) {
        console.error('Error in updateCaseStats:', error);
        next(error);
    }
};