import Activity from "../models/activity.model.js"
import Job from "../models/job.model.js"
import Planning from "../models/planning.model.js"
import Productivity from "../models/productivity.model.js"
import { errorHandler } from "../utils/error.js"

// Helper function to calculate IPQC based on colourcode, material and previous job
const calculateIPQC = async (code, starttime, colourcode, material, currentJobId = null) => {
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
    
    try {
        // Build query to find previous job
        const query = {
            code: code,
            starttime: { $lt: starttime }
        };
        
        // Exclude current job if jobId is provided
        if (currentJobId) {
            query._id = { $ne: currentJobId };
        }
        
        const previousJob = await Job.findOne(query).sort({ starttime: -1 });
        
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
const calculateSetup = async (code, starttime, colourcode, material, currentJobId = null) => {
    if (!colourcode || colourcode.trim() === '') {
        return 0;
    }

    const cleanColourcode = colourcode.trim();
    const cleanMaterial = material ? material.trim().toLowerCase() : '';
    
    try {
        // Find previous job
        const query = {
            code: code,
            starttime: { $lt: starttime }
        };
        
        if (currentJobId) {
            query._id = { $ne: currentJobId };
        }
        
        const previousJob = await Job.findOne(query).sort({ starttime: -1 });
        
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

export const getPlannings = async (req, res, next) => {
    try {
        // Sort by production start time in descending order (newest first)
        const plannings = await Planning.find().sort({starttime: -1});
        res.status(200).json(plannings);
    } catch (error) {
        next(error);
    }
};

export const updatePlanning = async (req, res, next) => {
    try {
        // First get the Planning data to update
        const existingPlanning = await Planning.findById(req.params.planningId);
        if (!existingPlanning) {
            return res.status(404).json({ message: "Planning not found" });
        }

        // Auto-calculate IPQC based on previous job, colourcode and material
        const ipqc = await calculateIPQC(
            existingPlanning.code,
            existingPlanning.starttime,
            existingPlanning.colourcode,
            existingPlanning.material,
            existingPlanning._id
        );
        
        // Auto-calculate Setup based on previous job, colourcode and material
        const autoSetup = await calculateSetup(
            existingPlanning.code,
            existingPlanning.starttime,
            existingPlanning.colourcode,
            existingPlanning.material,
            existingPlanning._id
        );
        
        // Get update data (if user manually entered setup, use user input, otherwise use auto-calculated value)
        const irr = Number(req.body.irr) || existingPlanning.irr || 0;
        const setup = Number(req.body.setup) || autoSetup || 0;
        const lotno = req.body.lotno || existingPlanning.lotno;
        const totalorder = Number(existingPlanning.totalorder) || 0;
        const operatingtime = Number(existingPlanning.operatingtime) || 0;
        const totaloutput = Number(existingPlanning.totaloutput) || 0;
        const reject = Number(existingPlanning.reject) || 0;

        // Calculate planprodtime
        let planprodtime = 0;
        if (irr > 0) {
            planprodtime = Math.round((totalorder / irr) + ipqc + setup);
        } else {
            planprodtime = Math.round(ipqc + setup);
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
        if (totaloutput > 0) {
            quality = Number(((totaloutput - reject) / totaloutput).toFixed(2));
        }
        
        // Calculate OEE = availability * performance * quality
        let oee = 0;
        if (availability > 0 && performance > 0 && quality > 0) {
            oee = Number((availability * performance * quality).toFixed(2));
        }

        // Update Planning data
        const updatedPlanning = await Planning.findByIdAndUpdate(
            req.params.planningId,
            {
                $set: {
                    irr: irr,
                    ipqc: ipqc, // Auto-calculated IPQC
                    setup: setup, // Auto-calculated Setup
                    lotno: lotno,
                    planprodtime: planprodtime,
                    availability: availability,
                    performance: performance,
                    quality: quality,
                    oee: oee,
                    updatedAt: new Date() // Add updated timestamp
                }
            },
            { new: true }
        );

        // Also update corresponding Productivity and Job data
        if (existingPlanning.lotno) {
            // Update Productivity data
            await Productivity.findOneAndUpdate(
                { lotno: existingPlanning.lotno },
                {
                    $set: {
                        irr: irr,
                        ipqc: ipqc,
                        setup: setup,
                        planprodtime: planprodtime,
                        availability: availability,
                        performance: performance,
                        quality: quality,
                        oee: oee
                    }
                },
                { new: true }
            );

            // Update corresponding Job data
            await Job.findOneAndUpdate(
                { lotno: existingPlanning.lotno },
                {
                    $set: {
                        irr: irr,
                        ipqc: ipqc,
                        setup: setup,
                        planprodtime: planprodtime,
                        availability: availability,
                        performance: performance,
                        quality: quality,
                        oee: oee
                    }
                },
                { new: true }
            );
        }

        // Record activity log
        const currentDate = new Date().toLocaleString();
        const newActivity = new Activity({
            date: currentDate,
            activity: 'Update planning',
            detail: `${req.user.username}`
        });
        await newActivity.save();

        res.status(200).json(updatedPlanning);
    } catch (error) {
        next(error);
    }
};