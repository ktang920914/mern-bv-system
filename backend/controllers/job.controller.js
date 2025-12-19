import Activity from "../models/activity.model.js"
import Job from "../models/job.model.js"
import Planning from "../models/planning.model.js"
import Productivity from "../models/productivity.model.js"
import { errorHandler } from "../utils/error.js"

// Helper function to calculate IPQC based on colourcode, material and previous job
const calculateIPQC = async (code, starttime, colourcode, material) => {
    if (!colourcode || colourcode.trim() === '') {
        return 0;
    }

    const cleanCode = colourcode.trim();
    const cleanMaterial = material ? material.trim().toLowerCase() : '';
    
    // Rule: If material contains special keywords, IPQC = 0
    const specialKeywords = ['natural', 'transparent', 'smoke', 'pearl', 'gold', 'strong', 'stubborn', 'metallic'];
    const hasSpecialKeyword = specialKeywords.some(keyword => cleanMaterial.includes(keyword));
    
    if (hasSpecialKeyword) {
        return 0;
    }
    
    // Special cases like "REP-PC/ABS GREY" - starts with letters
    if (/^[A-Za-z]/.test(cleanCode)) {
        return 0;
    }
    
    // Find previous job with the same extruder code
    try {
        const previousJob = await Job.findOne({
            code: code,
            starttime: { $lt: starttime }
        }).sort({ starttime: -1 }); // Get the most recent previous job
        
        if (previousJob && previousJob.colourcode) {
            // Compare colourcodes (remove spaces and dashes for comparison)
            const currentColourcode = cleanCode.replace(/[\s-]/g, '');
            const previousColourcode = previousJob.colourcode.trim().replace(/[\s-]/g, '');
            
            // If colourcodes are the same, IPQC = 0
            if (currentColourcode === previousColourcode) {
                return 0;
            }
        }
    } catch (error) {
        console.error("Error finding previous job:", error);
        // If there's an error, fall back to digit-based calculation
    }
    
    // If no previous job or colourcode different, calculate based on 5th digit
    const codeWithoutSpaces = cleanCode.replace(/[\s-]/g, '');
    
    if (codeWithoutSpaces.length < 5) {
        return 0;
    }
    
    const fifthChar = codeWithoutSpaces.charAt(4);
    const fifthDigit = parseInt(fifthChar);
    
    if (isNaN(fifthDigit)) {
        return 0;
    }
    
    switch (fifthDigit) {
        case 0:
            return 0;
        case 2:
            return 60;
        case 3:
            return 200;
        default:
            return 0;
    }
};

// Helper function to calculate Setup based on previous job, colourcode and material
const calculateSetup = async (code, starttime, colourcode, material) => {
    if (!colourcode || colourcode.trim() === '') {
        return 0;
    }

    const cleanColourcode = colourcode.trim();
    const cleanMaterial = material ? material.trim().toLowerCase() : '';
    
    try {
        // Find previous job
        const previousJob = await Job.findOne({
            code: code,
            starttime: { $lt: starttime }
        }).sort({ starttime: -1 });
        
        if (previousJob) {
            // Get previous job's colourcode and material
            const previousColourcode = previousJob.colourcode ? previousJob.colourcode.trim() : '';
            const previousMaterial = previousJob.material ? previousJob.material.trim().toLowerCase() : '';
            
            // Compare colourcode (remove spaces and dashes)
            const currentColourcode = cleanColourcode.replace(/[\s-]/g, '');
            const previousColourcodeClean = previousColourcode.replace(/[\s-]/g, '');
            
            // Rule 1: If colourcode is the same, setup = 0
            if (currentColourcode === previousColourcodeClean) {
                return 0;
            }
            
            // If colourcode is different, check material rules
            
            // Check for special keywords (natural, transparent, smoke, pearl, gold, strong, stubborn, metallic)
            const specialKeywords = ['natural', 'transparent', 'smoke', 'pearl', 'gold', 'strong', 'stubborn', 'metallic'];
            const hasSpecialKeyword = specialKeywords.some(keyword => cleanMaterial.includes(keyword));
            
            if (hasSpecialKeyword) {
                return 180; // Rule 2a
            }
            
            // Check for grey or black
            const isCurrentGreyBlack = /(grey|black)/i.test(cleanMaterial);
            const isPreviousGreyBlack = /(grey|black)/i.test(previousMaterial);
            
            if (isCurrentGreyBlack && isPreviousGreyBlack) {
                return 25; // Rule 2b: grey/black to grey/black
            }
            
            // Check light/dark changes
            const isCurrentLight = /light/i.test(cleanMaterial);
            const isCurrentDark = /dark/i.test(cleanMaterial);
            const isPreviousLight = /light/i.test(previousMaterial);
            const isPreviousDark = /dark/i.test(previousMaterial);
            
            // Rule 2c: light to dark, dark to dark, or different material (non grey/black)
            if ((isCurrentDark && (isPreviousLight || isPreviousDark)) || 
                (cleanMaterial !== previousMaterial && !isCurrentGreyBlack)) {
                return 60;
            }
            
            // Rule 2d: other cases (dark to light or other colors)
            return 120;
        }
    } catch (error) {
        console.error("Error calculating setup:", error);
        // If error, return default value
    }
    
    // If no previous job or error, return default value
    return 0;
};

export const job = async (req, res, next) => {
    const { code, starttime, endtime, orderdate, lotno, colourcode, material, totalorder, downtime } = req.body;
    try {
        const existingLotno = await Job.findOne({ lotno });
        if (existingLotno) {
            return next(errorHandler(404, 'Lot no is exists'));
        }

        const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            return dateTimeStr.replace('T', ' ');
        };

        const wastage = 0 - (Number(totalorder) || 0);
        
        // Calculate IPQC based on previous job, colourcode and material
        const ipqc = await calculateIPQC(code, starttime, colourcode, material);
        
        // Calculate Setup based on previous job, colourcode and material
        const setup = await calculateSetup(code, starttime, colourcode, material);
        
        // Calculate operatingtime algorithm (no longer add downtime)
        const calculateOperatingTime = (start, end, downtime) => {
            // Convert string time to Date object
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // Calculate time difference (milliseconds)
            const timeDiff = endDate.getTime() - startDate.getTime();
            
            // Convert to minutes
            const minutesDiff = timeDiff / (1000 * 60);
            
            return minutesDiff - (Number(downtime) || 0);
        };
        
        // Calculate prodleadtime algorithm (days from orderdate to endtime)
        const calculatePlanProdTime = (orderDateStr, endTimeStr) => {
            // Use UTC time to avoid timezone impact
            const orderDateUTC = new Date(orderDateStr + 'T00:00:00Z');
            const endDateUTC = new Date(endTimeStr.replace(' ', 'T') + 'Z');
            
            // Calculate time difference (milliseconds)
            const timeDiff = endDateUTC.getTime() - orderDateUTC.getTime();
            
            // Convert to days and keep 1 decimal place
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            const roundedDaysDiff = Math.round(daysDiff * 10) / 10; // Round to 1 decimal place
            
            return roundedDaysDiff;
        };
        
        // Calculate operatingtime (not adding downtime)
        const operatingtime = calculateOperatingTime(starttime, endtime);
        
        // Calculate prodleadtime
        const prodleadtime = calculatePlanProdTime(orderdate, endtime);

        // Calculate initial planprodtime
        let planprodtime = Math.round(ipqc + setup); // Use auto-calculated setup

        // Calculate availability
        let availability = 0;
        if (planprodtime > 0) {
            availability = Number((operatingtime / planprodtime).toFixed(2));
        }

        // Calculate performance (initial value is 0, as there is no totaloutput and irr data)
        let performance = 0;
        
        // Calculate quality (initial value is 0, as there is no totaloutput and reject data)
        let quality = 0;
        
        // Calculate OEE
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        const newJob = new Job({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage,
            downtime: downtime || 0,
            operatingtime,
            prodleadtime, // Add to Job model
            planprodtime,
            ipqc, // Add IPQC
            setup: setup, // Add auto-calculated Setup
            availability, // Add to Job model
            performance, // Add to Job model
            quality, // Add to Job model
            oee // Add to Job model
        });

        const newProductivity = new Productivity({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage: wastage,
            downtime: downtime || 0,
            operatingtime,
            prodleadtime,
            planprodtime,
            ipqc, // Add IPQC
            setup: setup, // Add auto-calculated Setup
            availability, // Add to Productivity model
            performance, // Add to Productivity model
            quality, // Add to Productivity model
            oee // Add to Productivity model
        });

        const newPlanning = new Planning({
            code,
            starttime: formatDateTime(starttime),
            endtime: formatDateTime(endtime),
            orderdate,
            lotno,
            colourcode,
            material,
            totalorder,
            wastage: wastage,
            downtime: downtime || 0,
            operatingtime, // Add to Planning model
            prodleadtime, // Add to Planning model
            planprodtime,
            ipqc, // Add IPQC
            setup: setup, // Add auto-calculated Setup
            availability, // Add to Planning model
            performance, // Add to Planning model
            quality, // Add to Planning model
            oee // Add to Planning model
        });

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Create Job',
            detail: `${req.user.username} created job ${lotno} with IPQC=${ipqc}, Setup=${setup}`
        });
        
        await newActivity.save();
        await newProductivity.save();
        await newPlanning.save();
        await newJob.save();
        res.status(201).json({ 
            message: 'Register successfully', 
            operatingtime, 
            prodleadtime, 
            ipqc, // Return IPQC in response
            setup, // Return Setup in response
            planprodtime,
            availability,
            performance,
            quality,
            oee
        });
    } catch (error) {
        next(error);
    }
};

export const getJobs = async (req,res,next) => {
    try {
        // Sort by production start time in descending order (newest first)
        const jobs = await Job.find().sort({starttime: -1})
        res.status(200).json(jobs)
    } catch (error) {
        next(error)
    }
}

export const deleteJob = async (req,res,next) => {
    try {
        const jobToDelete = await Job.findById(req.params.jobId);
        if (!jobToDelete) {
            return next(errorHandler(404, 'Job not found'));
        }
        await Job.findByIdAndDelete(req.params.jobId)
        await Productivity.findOneAndDelete({ lotno: jobToDelete.lotno });
        await Planning.findOneAndDelete({ lotno: jobToDelete.lotno });
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Delete job',
            detail: `${req.user.username} deleted job ${jobToDelete.lotno}`
        })
        await newActivity.save()
        res.status(200).json('Job is deleted')
    } catch (error) {
        next(error)
    }
}

export const updateJob = async (req,res,next) => {
    try {
        const existingJob = await Job.findOne({ 
            lotno: req.body.lotno,
            _id: { $ne: req.params.jobId } 
        });

        const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            return dateTimeStr.replace('T', ' ');
        };
        
        if (existingJob) {
            return next(errorHandler(404, 'Update Failed'))
        }

        const oldJob = await Job.findById(req.params.jobId);
        if (!oldJob) {
            return next(errorHandler(404, 'Job not found'));
        }

        // Calculate IPQC for updated job (with material)
        const ipqc = await calculateIPQC(
            req.body.code || oldJob.code,
            req.body.starttime || oldJob.starttime,
            req.body.colourcode || oldJob.colourcode,
            req.body.material || oldJob.material
        );

        // Calculate Setup for updated job
        const setup = await calculateSetup(
            req.body.code || oldJob.code,
            req.body.starttime || oldJob.starttime,
            req.body.colourcode || oldJob.colourcode,
            req.body.material || oldJob.material
        );

        // Get corresponding Productivity and Planning documents
        const productivity = await Productivity.findOne({ lotno: oldJob.lotno });
        const planning = await Planning.findOne({ lotno: oldJob.lotno });
        
        // Calculate operatingtime algorithm (no longer add downtime)
        const calculateOperatingTime = (start, end) => {
            // Convert string time to Date object
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // Calculate time difference (milliseconds)
            const timeDiff = endDate.getTime() - startDate.getTime();
            
            // Convert to minutes
            const minutesDiff = timeDiff / (1000 * 60);
            
            return minutesDiff; // Directly return time difference, not adding downtime
        };
        
        // Calculate prodleadtime algorithm (days from orderdate to endtime)
        const calculatePlanProdTime = (orderDateStr, endTimeStr) => {
            // Use UTC time to avoid timezone impact
            const orderDateUTC = new Date(orderDateStr + 'T00:00:00Z');
            const endDateUTC = new Date(endTimeStr.replace(' ', 'T') + 'Z');
            
            // Calculate time difference (milliseconds)
            const timeDiff = endDateUTC.getTime() - orderDateUTC.getTime();
            
            // Convert to days and keep 1 decimal place
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            const roundedDaysDiff = Math.round(daysDiff * 10) / 10; // Round to 1 decimal place
            
            return roundedDaysDiff;
        };
        
        // Calculate new operatingtime (not adding downtime)
        const operatingtime = calculateOperatingTime(
            req.body.starttime || oldJob.starttime, 
            req.body.endtime || oldJob.endtime
        );
        
        // Calculate new prodleadtime (if endtime or orderdate changed)
        const newOrderdate = req.body.orderdate || oldJob.orderdate;
        const newEndtime = req.body.endtime ? formatDateTime(req.body.endtime) : oldJob.endtime;
        const prodleadtime = calculatePlanProdTime(newOrderdate, newEndtime);

        // Recalculate wastage
        const totalorder = Number(req.body.totalorder) || Number(oldJob.totalorder) || 0;
        const totaloutput = productivity ? Number(productivity.totaloutput) || 0 : 0;
        const wastage = Number((totaloutput - totalorder).toFixed(2));

        // Recalculate planprodtime (if totalorder, irr, ipqc or setup changed)
        const irr = productivity ? Number(productivity.irr) || 0 : 
                   planning ? Number(planning.irr) || 0 : 0;

        let planprodtime = 0;
        if (irr > 0) {
            planprodtime = Math.round((totalorder / irr) + ipqc + setup);
        } else {
            planprodtime = Math.round(ipqc + setup);
        }

        // Recalculate arr (Average Run Rate)
        let arr = 0;
        if (operatingtime > 0) {
            arr = Number((totaloutput / operatingtime).toFixed(1));
        }

        // Calculate availability
        let availability = 0;
        if (planprodtime > 0) {
            availability = Number((operatingtime / planprodtime).toFixed(2));
        }

        // Calculate performance = (totaloutput / operatingtime) / irr
        let performance = 0;
        if (operatingtime > 0 && irr > 0) {
            performance = Number(((totaloutput / operatingtime) / irr).toFixed(2));
        }
        
        // Calculate quality = (totaloutput - reject) / totaloutput
        let quality = 0;
        const reject = productivity ? Number(productivity.reject) || 0 : 
                      planning ? Number(planning.reject) || 0 : 0;
        
        if (totaloutput > 0) {
            quality = Number(((totaloutput - reject) / totaloutput).toFixed(2));
        }
        
        // Calculate OEE = availability * performance * quality
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        const updatedJob = await Job.findByIdAndUpdate(req.params.jobId, {
            $set: {
                code: req.body.code || oldJob.code,
                starttime: req.body.starttime ? formatDateTime(req.body.starttime) : oldJob.starttime,
                endtime: req.body.endtime ? formatDateTime(req.body.endtime) : oldJob.endtime,
                orderdate: req.body.orderdate || oldJob.orderdate,
                lotno: req.body.lotno || oldJob.lotno,
                material: req.body.material || oldJob.material,
                colourcode: req.body.colourcode || oldJob.colourcode,
                totalorder: totalorder,
                operatingtime: operatingtime, // Update operatingtime
                prodleadtime: prodleadtime, // Update prodleadtime
                planprodtime: planprodtime, // Update planprodtime
                ipqc: ipqc, // Update IPQC
                setup: setup, // Update Setup
                arr: arr, // Update arr
                availability: availability, // Update availability
                performance: performance, // Update performance
                quality: quality, // Update quality
                oee: oee // Update oee
            },
        }, {new: true})

        // Update Productivity
        if (productivity) {
            await Productivity.findOneAndUpdate(
                { lotno: oldJob.lotno },
                {
                    $set: {
                        code: req.body.code || oldJob.code,
                        starttime: req.body.starttime ? formatDateTime(req.body.starttime) : oldJob.starttime,
                        endtime: req.body.endtime ? formatDateTime(req.body.endtime) : oldJob.endtime,
                        orderdate: req.body.orderdate || oldJob.orderdate,
                        lotno: req.body.lotno || oldJob.lotno,
                        material: req.body.material || oldJob.material,
                        colourcode: req.body.colourcode || oldJob.colourcode,
                        totalorder: totalorder,
                        wastage: wastage,
                        operatingtime: operatingtime, // Update operatingtime
                        prodleadtime: prodleadtime, // Update prodleadtime
                        planprodtime: planprodtime, // Update planprodtime
                        ipqc: ipqc, // Update IPQC
                        setup: setup, // Update Setup
                        arr: arr, // Update arr
                        availability: availability, // Update availability
                        performance: performance, // Update performance
                        quality: quality, // Update quality
                        oee: oee // Update oee
                    }
                },
                { new: true }
            );
        }

        // Update Planning
        if (planning) {
            await Planning.findOneAndUpdate(
                { lotno: oldJob.lotno },
                {
                    $set: {
                        code: req.body.code || oldJob.code,
                        starttime: req.body.starttime ? formatDateTime(req.body.starttime) : oldJob.starttime,
                        endtime: req.body.endtime ? formatDateTime(req.body.endtime) : oldJob.endtime,
                        orderdate: req.body.orderdate || oldJob.orderdate,
                        lotno: req.body.lotno || oldJob.lotno,
                        material: req.body.material || oldJob.material,
                        colourcode: req.body.colourcode || oldJob.colourcode,
                        totalorder: totalorder,
                        wastage: wastage,
                        operatingtime: operatingtime, // Update operatingtime
                        prodleadtime: prodleadtime, // Update prodleadtime
                        planprodtime: planprodtime, // Update planprodtime
                        ipqc: ipqc, // Update IPQC
                        setup: setup, // Update Setup
                        arr: arr, // Update arr
                        availability: availability, // Update availability
                        performance: performance, // Update performance
                        quality: quality, // Update quality
                        oee: oee // Update oee
                    }
                },
                { new: true }
            );
        }

        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update job',
            detail: `${req.user.username}`
        });
        await newActivity.save();
        
        res.status(200).json(updatedJob);
    } catch (error) {
        next(error);
    }    
};