import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput, ToggleSwitch } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CustomerSchedule = () => {
    const { theme } = useThemeStore()
    const { currentUser } = useUserstore()
    const [searchParams, setSearchParams] = useSearchParams()
    
    // --- Modals State ---
    const [openModalCreateSchedule, setOpenModalCreateSchedule] = useState(false)
    const [openModalDeleteSchedule, setOpenModalDeleteSchedule] = useState(false)
    const [openModalUpdateSchedule, setOpenModalUpdateSchedule] = useState(false)
    const [openModalReport, setOpenModalReport] = useState(false) 
    
    // --- Form & Data State ---
    const [formData, setFormData] = useState({})
    const [updateFormData, setUpdateFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    
    // --- Report State ---
    const [reportRange, setReportRange] = useState({ start: '', end: '' })
    const [reportError, setReportError] = useState(null)

    // --- Data States ---
    const [extruders, setExtruders] = useState([])
    const [customers, setCustomers] = useState([])
    const [schedules, setSchedules] = useState([])
    
    const [scheduleIdToDelete, setScheduleIdToDelete] = useState('')
    const [scheduleIdToUpdate, setScheduleIdToUpdate] = useState('')
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sortBy, setSortBy] = useState('prodstart') 
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (currentPage === 1) params.delete('page')
        else params.set('page', currentPage.toString())
        
        if (searchTerm === '') params.delete('search')
        else params.set('search', searchTerm)
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    useEffect(() => {
        const fetchExtruders = async () => {
            try {
                const res = await fetch('/api/machine/getExtruders')
                const data = await res.json()
                if (res.ok) setExtruders(data)
            } catch (error) { console.log(error.message) }
        }
        fetchExtruders()
    }, [currentUser._id])

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/client/getcustomers')
                const data = await res.json()
                if (res.ok) setCustomers(data)
            } catch (error) { console.log(error.message) }
        }
        fetchCustomers()
    }, [currentUser._id])

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await fetch('/api/customerschedule/getcustomerjobs') 
                const data = await res.json()
                if (res.ok) setSchedules(data)
            } catch (error) { console.log(error.message) }
        }
        fetchSchedules()
    }, [currentUser._id])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() })
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleCreateSchedule = () => {
        const now = new Date();
        const startTarget = new Date(now);
        startTarget.setHours(8, 0, 0, 0);
        const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
        const endTarget = new Date(now);
        endTarget.setDate(endTarget.getDate() + daysUntilSunday);
        endTarget.setHours(8, 30, 0, 0);

        const formatForInput = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormData({
            prodstart: formatForInput(startTarget),
            prodend: formatForInput(endTarget),
            isShutdown: false,
            shutdownReason: ''
        });

        setErrorMessage(null);
        setOpenModalCreateSchedule(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        let payload = { ...formData };
        if (payload.isShutdown) {
            payload.customerID = 'SHUTDOWN';
            payload.customerName = 'PLAN SHUT DOWN';
            payload.lotno = '-';
            payload.colourcode = '-';
            payload.material = '-';
            payload.qty = 0;
            payload.pax = 0;
            payload.orderdate = '';
            payload.deliverydate = '';
            payload.targetcompletion = payload.shutdownReason || 'NO ORDER';
        }

        try {
            const res = await fetch('/api/customerschedule/customerjob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success === false) {
                setErrorMessage(data.message)
                setLoading(false)
            } else {
                setOpenModalCreateSchedule(false)
                setLoading(false)
                setFormData({})
                const refreshRes = await fetch('/api/customerschedule/getcustomerjobs')
                const refreshData = await refreshRes.json()
                if (refreshRes.ok) setSchedules(refreshData)
            }
        } catch (error) {
            console.log(error.message)
            setLoading(false)
        }
    }

    // 修复后的 Delete 逻辑：先确保删除成功，再关闭 Modal，避免请求被中止
    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/customerschedule/delete/${scheduleIdToDelete}`, { 
                method: 'DELETE' 
            })
            if (res.ok) {
                setSchedules((prev) => prev.filter((schedule) => schedule._id !== scheduleIdToDelete))
                setOpenModalDeleteSchedule(false)
            } else {
                const data = await res.json()
                console.log(data.message)
            }
        } catch (error) { 
            console.log(error.message) 
        }
    }

    const formatForUpdateInput = (timeStr) => {
        if (!timeStr) return '';
        const d = parseDateTime(timeStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    const handleUpdate = (schedule) => {
        const isShutDownJob = schedule.customerName === 'PLAN SHUT DOWN';
        
        setScheduleIdToUpdate(schedule._id)
        setOpenModalUpdateSchedule(true)
        setErrorMessage(null)
        setLoading(false)
        
        setUpdateFormData({
            customerID: schedule.customerID,
            customerName: schedule.customerName, 
            code: schedule.code, 
            orderdate: schedule.orderdate || '', 
            prodstart: formatForUpdateInput(schedule.prodstart),
            prodend: formatForUpdateInput(schedule.prodend),    
            targetcompletion: schedule.targetcompletion, 
            deliverydate: schedule.deliverydate, 
            lotno: schedule.lotno, 
            colourcode: schedule.colourcode, 
            material: schedule.material, 
            qty: schedule.qty,
            pax: schedule.pax,
            isShutdown: isShutDownJob,
            shutdownReason: isShutDownJob ? schedule.targetcompletion : ''
        })
    }

    const handleUpdateChange = (e) => {
        if (e.target.id === 'lotno' || e.target.id === 'colourcode' || e.target.id === 'material') {
            setUpdateFormData({ ...updateFormData, [e.target.id]: e.target.value })
        } else {
            setUpdateFormData({ ...updateFormData, [e.target.id]: e.target.value.trim() })
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        let payload = { ...updateFormData };
        if (payload.isShutdown) {
            payload.customerID = 'SHUTDOWN';
            payload.customerName = 'PLAN SHUT DOWN';
            payload.lotno = '-';
            payload.colourcode = '-';
            payload.material = '-';
            payload.qty = 0;
            payload.pax = 0;
            payload.orderdate = '';
            payload.deliverydate = '';
            payload.targetcompletion = payload.shutdownReason || 'NO ORDER';
        }

        try {
            const res = await fetch(`/api/customerschedule/update/${scheduleIdToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success === false) {
                setErrorMessage(data.message)
                setLoading(false)
            } else if (res.ok) {
                setOpenModalUpdateSchedule(false)
                setLoading(false)
                const refreshRes = await fetch('/api/customerschedule/getcustomerjobs')
                const refreshData = await refreshRes.json()
                if (refreshRes.ok) setSchedules(refreshData)
            }
        } catch (error) {
            console.log(error.message)
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return new Date(0)
        if (dateTimeStr.includes('T') && dateTimeStr.includes('Z')) return new Date(dateTimeStr)
        return new Date(dateTimeStr.replace(' ', 'T'))
    }

    const isDateTimeFormat = (val) => {
        if (!val) return false;
        return /^\d{4}-\d{2}-\d{2}/.test(val);
    }

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return '';
        if (isDateTimeFormat(timeStr)) return timeStr.replace('T', ' ');
        return timeStr; 
    }

    const formatReportTime = (dateObj) => {
        if (!dateObj || isNaN(dateObj)) return '';
        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        const yy = dateObj.getFullYear().toString().slice(-2);
        let h = dateObj.getHours();
        const min = dateObj.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; 
        return `${m}/${d}/${yy} ${h}:${min} ${ampm}`;
    }

    const handleOpenReportModal = () => {
        const now = new Date();
        const startTarget = new Date(now);
        startTarget.setHours(8, 0, 0, 0);
        const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
        const endTarget = new Date(now);
        endTarget.setDate(endTarget.getDate() + daysUntilSunday);
        endTarget.setHours(8, 30, 0, 0);

        const formatForInput = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setReportRange({
            start: formatForInput(startTarget),
            end: formatForInput(endTarget)
        });

        setReportError(null);
        setOpenModalReport(true);
    };

    const activeSchedules = schedules.filter(job => job.status !== 'Completed');

    const filteredAndSortedSchedules = activeSchedules
        .filter(schedule => 
            (schedule.customerName && schedule.customerName.toLowerCase().includes(searchTerm)) || 
            (schedule.targetcompletion && schedule.targetcompletion.toLowerCase().includes(searchTerm)) ||
            (schedule.deliverydate && schedule.deliverydate.toLowerCase().includes(searchTerm)) ||
            (schedule.lotno && schedule.lotno.toLowerCase().includes(searchTerm)) ||
            (schedule.code && schedule.code.toLowerCase().includes(searchTerm))
        )
        .sort((a, b) => {
            const dateA = sortBy === 'updatedAt' ? new Date(a.updatedAt) : parseDateTime(a[sortBy])
            const dateB = sortBy === 'updatedAt' ? new Date(b.updatedAt) : parseDateTime(b[sortBy])
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const executeDownloadReport = async () => {
        setReportError(null); 

        if (!reportRange.start || !reportRange.end) {
            setReportError('Please select both Prod Start and Prod End time.');
            return;
        }

        const startTarget = parseDateTime(reportRange.start).getTime();
        const endTarget = parseDateTime(reportRange.end).getTime();

        if (startTarget > endTarget) {
            setReportError('Start time cannot be later than End time.');
            return;
        }

        const reportData = activeSchedules.filter(job => {
            if (!job.prodstart || !job.prodend) return false;
            const jobStart = parseDateTime(job.prodstart).getTime();
            const jobEnd = parseDateTime(job.prodend).getTime();
            return jobStart <= endTarget && jobEnd >= startTarget;
        });

        if (reportData.length === 0) {
            setReportError('No records found in this time range!');
            return;
        }
        
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Weekly Production');

            worksheet.pageSetup.orientation = 'landscape';
            worksheet.pageSetup.fitToPage = true;
            worksheet.pageSetup.fitToWidth = 1;
            worksheet.pageSetup.fitToHeight = 0;

            const startDateObj = new Date(reportRange.start);
            const yyyy = startDateObj.getFullYear();
            const mm = String(startDateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(startDateObj.getDate()).padStart(2, '0');
            const dateTitle = `${yyyy}.${mm}.${dd}`;

            worksheet.mergeCells('A1:G3');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'WEEKLY PRODUCTION PLANNING';
            titleCell.font = { name: 'Arial Black', size: 22, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

            const wipTime = new Date();
            const mbTime = parseDateTime(reportRange.start);
            const psdTime = parseDateTime(reportRange.end);

            worksheet.getCell('H1').value = 'WIP';
            worksheet.getCell('H1').font = { bold: true };
            worksheet.getCell('H1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
            worksheet.getCell('H1').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            worksheet.getCell('H1').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.mergeCells('I1:J1');
            worksheet.getCell('I1').value = formatReportTime(wipTime);
            worksheet.getCell('I1').font = { color: { argb: 'FFFFFFFF' }, bold: true }; 
            worksheet.getCell('I1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }; 
            worksheet.getCell('I1').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            worksheet.getCell('I1').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell('H2').value = 'MB';
            worksheet.getCell('H2').font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getCell('H2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; 
            worksheet.getCell('H2').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            worksheet.getCell('H2').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell('I2').value = 'Prod Start';
            worksheet.getCell('I2').font = { bold: true };
            worksheet.getCell('I2').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            worksheet.getCell('J2').value = formatReportTime(mbTime);
            worksheet.getCell('J2').font = { color: { argb: 'FF0000FF' }, bold: true }; 
            worksheet.getCell('J2').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            worksheet.getCell('H3').value = 'PSD';
            worksheet.getCell('H3').font = { bold: true };
            worksheet.getCell('H3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB6C1' } }; 
            worksheet.getCell('H3').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            worksheet.getCell('H3').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell('I3').value = 'Prod End';
            worksheet.getCell('I3').font = { bold: true };
            worksheet.getCell('I3').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            worksheet.getCell('J3').value = formatReportTime(psdTime);
            worksheet.getCell('J3').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            const headerRow = worksheet.getRow(4);
            const headers = ['PAX', 'EXT ID', 'Cust ID', 'Customer Name', 'Lot No', 'Colour Code', 'Material', 'Qty', 'Target Completion', 'Delivery Date'];
            
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            });

            let grandTotalPax = 0;
            let grandTotalQty = 0;
            let currentRowIdx = 5;

            const sortedReportData = [...reportData].sort((a, b) => parseDateTime(a.prodstart) - parseDateTime(b.prodstart));

            const groupedJobs = {};
            sortedReportData.forEach(job => {
                const code = job.code || 'UNKNOWN';
                if (!groupedJobs[code]) groupedJobs[code] = [];
                groupedJobs[code].push(job);
            });

            const sortedCodes = Object.keys(groupedJobs).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            sortedCodes.forEach(code => {
                const jobs = groupedJobs[code];
                
                let maxPax = Math.max(...jobs.map(j => Number(j.pax) || 0));
                let groupTotalQty = 0;
                let hasDate = false;
                let fallbackText = ''; 

                jobs.forEach(job => {
                    const row = worksheet.getRow(currentRowIdx);
                    
                    const tc = job.targetcompletion || '';
                    if (tc && !/KIV|TBA|URGENT/i.test(tc) && !isNaN(parseDateTime(tc).getTime())) {
                        hasDate = true;
                    } else if (!fallbackText && tc) {
                        fallbackText = tc; 
                    }

                    row.getCell(1).value = ''; 
                    row.getCell(2).value = job.code || '';
                    row.getCell(3).value = job.customerID || '';
                    row.getCell(4).value = job.customerName || ''; 
                    
                    row.getCell(5).value = job.lotno || '';
                    row.getCell(5).font = { color: { argb: 'FF0000FF' }, bold: true }; 
                    
                    row.getCell(6).value = job.colourcode || '';
                    row.getCell(6).font = { color: { argb: 'FF0000FF' }, bold: true }; 
                    
                    row.getCell(7).value = job.material || '';
                    row.getCell(7).font = { bold: true }; 

                    const plannedQty = Number(job.qty) || 0;
                    const actualQty = Number(job.actualoutput) || 0;
                    let remainingQty = plannedQty - actualQty;
                    if (remainingQty < 0) remainingQty = 0;

                    row.getCell(8).value = remainingQty;
                    row.getCell(8).font = { bold: true }; 
                    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

                    const targetStr = formatDisplayTime(job.targetcompletion);
                    row.getCell(9).value = targetStr;
                    if (targetStr.toUpperCase().includes('URGENT') || targetStr.toUpperCase().includes('KIV')) {
                        row.getCell(9).font = { color: { argb: 'FFFF0000' }, bold: true };
                    } else {
                        row.getCell(9).font = { color: { argb: 'FF0000FF' }, bold: true };
                    }

                    const deliveryStr = formatDisplayTime(job.deliverydate);
                    row.getCell(10).value = deliveryStr;
                    if (deliveryStr.toUpperCase().includes('URGENT') || deliveryStr.toUpperCase().includes('KIV')) {
                        row.getCell(10).font = { color: { argb: 'FFFF0000' }, bold: true };
                    }

                    for(let c=1; c<=10; c++) {
                        row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    }
                    
                    groupTotalQty += remainingQty;
                    currentRowIdx++;
                });

                if (!hasDate) {
                    maxPax = 0;
                }

                const summaryRow = worksheet.getRow(currentRowIdx);
                summaryRow.getCell(1).value = maxPax; 
                summaryRow.getCell(2).value = code;
                
                let summaryText = '';
                let bgColor = '';

                if (hasDate) {
                    summaryText = 'PRODUCTION';
                    bgColor = 'FF008000'; // Green
                } else {
                    summaryText = fallbackText ? `PLAN SHUT DOWN - ${fallbackText.toUpperCase()}` : 'PLAN SHUT DOWN - NO ORDER';
                    bgColor = 'FFCC0000'; // Red
                }
                
                summaryRow.getCell(3).value = summaryText;
                summaryRow.getCell(8).value = groupTotalQty;

                worksheet.mergeCells(`C${currentRowIdx}:G${currentRowIdx}`); 
                worksheet.mergeCells(`I${currentRowIdx}:J${currentRowIdx}`); 

                summaryRow.eachCell((cell, colNum) => {
                    if (colNum <= 10) {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }; 
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        if (colNum === 3) {
                            cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        }
                        if (colNum === 1 || colNum === 8) {
                            cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        }
                    }
                });

                grandTotalPax += maxPax;
                grandTotalQty += groupTotalQty;
                currentRowIdx++;
            });

            const totalRow = worksheet.getRow(currentRowIdx);
            
            totalRow.getCell(1).value = grandTotalPax; 
            totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            
            totalRow.getCell(2).value = 'MANPOWER NEEDED';
            worksheet.mergeCells(`B${currentRowIdx}:G${currentRowIdx}`);
            
            totalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            totalRow.getCell(8).value = 'TOTAL QTY';
            totalRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
            
            worksheet.mergeCells(`I${currentRowIdx}:J${currentRowIdx}`);
            totalRow.getCell(9).value = grandTotalQty.toLocaleString(); 
            totalRow.getCell(9).alignment = { horizontal: 'left', vertical: 'middle' };

            for(let c=1; c<=10; c++) {
                const cell = totalRow.getCell(c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000FF' } }; 
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; 
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }

            worksheet.columns = [
                { width: 6 },  
                { width: 10 }, 
                { width: 12 }, 
                { width: 25 }, 
                { width: 18 }, 
                { width: 20 }, 
                { width: 40 }, 
                { width: 12 }, 
                { width: 22 }, 
                { width: 18 }  
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            saveAs(blob, `Weekly Production Planning dtd ${dateTitle} (MGT).xlsx`);
            
            setOpenModalReport(false);

        } catch (error) {
            console.error('Error generating Excel:', error);
            setReportError('Failed to generate report.');
        } finally {
            setIsExporting(false);
        }
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSchedules = filteredAndSortedSchedules.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredAndSortedSchedules.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    const MobileSimplePagination = () => (
        <div className="flex items-center justify-center space-x-4">
            <Button size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="flex items-center">
                <span>‹</span><span className="ml-1">Previous</span>
            </Button>
            <Button size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="flex items-center">
                <span className="mr-1">Next</span><span>›</span>
            </Button>
        </div>
    )

    const ScheduleCard = ({ schedule }) => {
        const isShutDownJob = schedule.customerName === 'PLAN SHUT DOWN';

        return (
            <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
                theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
            }`}>
                <div className="mb-3 border-b pb-2 border-gray-200 dark:border-gray-700 flex justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Customer</p>
                        {isShutDownJob ? (
                            <p className="text-lg font-bold text-red-500 uppercase">PLAN SHUT DOWN</p>
                        ) : (
                            <p className={`text-lg font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{schedule.customerName}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-500">Ext</p>
                        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'} font-bold`}>{schedule.code}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                        <p className="font-semibold text-gray-500">Prod Start:</p>
                        <p className='text-green-500 font-semibold'>{formatDisplayTime(schedule.prodstart)}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-500">Prod End:</p>
                        <p className='text-red-500 font-semibold'>{formatDisplayTime(schedule.prodend)}</p>
                    </div>
                    
                    {isShutDownJob ? (
                        <div className="col-span-2">
                            <p className="font-semibold text-gray-500">Reason:</p>
                            <p className="font-bold text-red-500 uppercase">{schedule.targetcompletion}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="font-semibold text-gray-500">Target:</p>
                                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>{formatDisplayTime(schedule.targetcompletion)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-500">Delivery:</p>
                                <p className='text-rose-500 font-semibold'>{formatDisplayTime(schedule.deliverydate)}</p>
                            </div>
                        </>
                    )}
                </div>
                
                {/* 隐藏掉不需要的数据展示 */}
                {!isShutDownJob && (
                    <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-500">Lot No / Details</p>
                        <Popover 
                            className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                            content={
                                <div className="p-3 max-w-xs">
                                    <p className="font-semibold text-sm">Order Date:</p>
                                    <p className="text-xs mb-2 text-indigo-500 font-semibold">{schedule.orderdate ? schedule.orderdate.substring(0, 10) : ''}</p>
                                    
                                    <p className="font-semibold text-sm">Colour code:</p>
                                    <p className="text-xs mb-2">{schedule.colourcode}</p>
                                    <p className="font-semibold text-sm">Material:</p>
                                    <p className="text-xs mb-2">{schedule.material}</p>
                                    
                                    <p className="font-semibold text-sm">Qty (Remaining):</p>
                                    <p className="text-xs mb-2 font-semibold">
                                        {schedule.actualoutput > 0 ? (
                                            <span className="text-orange-500">
                                                {schedule.qty - schedule.actualoutput} <span className="text-gray-500 font-normal">(Total: {schedule.qty})</span>
                                            </span>
                                        ) : (
                                            <span className="text-blue-500">{schedule.qty}</span>
                                        )}
                                    </p>
                                    
                                    <p className="font-semibold text-sm">Pax:</p>
                                    <p className="text-xs mb-2 font-bold text-orange-500">{schedule.pax}</p>
                                </div>
                            }
                            trigger='hover' placement="top" arrow={false}
                        >
                            <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                                theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                            }`}>
                                {schedule.lotno}
                            </span>
                        </Popover>
                    </div>
                )}

                {/* 恢复正常的按钮样式 */}
                <div className="flex gap-2">
                    <Button outline className='cursor-pointer flex-1 py-2 text-sm' onClick={() => handleUpdate(schedule)}>Edit</Button>
                    <Button color='red' outline className='cursor-pointer flex-1 py-2 text-sm' onClick={() => {
                        setScheduleIdToDelete(schedule._id)
                        setOpenModalDeleteSchedule(true)
                    }}>Delete</Button>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Customer Schedule</h1>
                <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
                    <div className='flex gap-2'>
                        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className='w-full sm:w-36'>
                            <option value="prodstart">Prod Start</option>
                            <option value="targetcompletion">Target Comp.</option>
                            <option value="updatedAt">Updated Date</option>
                        </Select>
                        <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className='w-full sm:w-32'>
                            <option value="desc">Newest</option>
                            <option value="asc">Oldest</option>
                        </Select>
                    </div>
                    
                    <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch} className='w-full sm:w-auto'/>
                    
                    <Button color="green" className='cursor-pointer w-full sm:w-auto' onClick={handleOpenReportModal}>
                        Report
                    </Button>
                    
                    <Button color="blue" className='cursor-pointer w-full sm:w-auto' onClick={handleCreateSchedule}>Create</Button>
                </div>
            </div>

            {/* Desktop Table View */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Customer</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Prod Start/End</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Target/Delivery</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Actions</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentSchedules.map((schedule) => {
                            const isShutDownJob = schedule.customerName === 'PLAN SHUT DOWN';

                            return (
                                <TableRow key={schedule._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                    <TableCell className={`align-middle font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                        {isShutDownJob ? (
                                            <span className="text-red-500 uppercase">PLAN SHUT DOWN</span>
                                        ) : (
                                            schedule.customerName
                                        )}
                                    </TableCell>
                                    <TableCell className="align-middle font-semibold">{schedule.code}</TableCell>
                                    
                                    <TableCell className="align-middle text-xs">
                                        <div className="text-green-500 font-semibold">{formatDisplayTime(schedule.prodstart)}</div>
                                        <div className="text-red-500 font-semibold">{formatDisplayTime(schedule.prodend)}</div>
                                    </TableCell>
                                    
                                    <TableCell className="align-middle text-xs">
                                        {isShutDownJob ? (
                                            <div className="font-bold text-red-500 uppercase">{schedule.targetcompletion}</div>
                                        ) : (
                                            <>
                                                <div className="font-bold">{formatDisplayTime(schedule.targetcompletion)}</div>
                                                <div className="text-rose-500 font-semibold">{formatDisplayTime(schedule.deliverydate)}</div>
                                            </>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell className="align-middle">
                                        {isShutDownJob ? (
                                            <span className="text-gray-400 font-semibold">-</span>
                                        ) : (
                                            <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                                                content={
                                                    <div className="p-3 max-w-xs">
                                                        <p className="font-semibold text-sm">Order Date:</p>
                                                        <p className="text-xs mb-2 text-indigo-500 font-semibold">{schedule.orderdate ? schedule.orderdate.substring(0, 10) : ''}</p>
                                                        
                                                        <p className="font-semibold text-sm">Colour code:</p>
                                                        <p className="text-xs mb-2">{schedule.colourcode}</p>
                                                        <p className="font-semibold text-sm">Material:</p>
                                                        <p className="text-xs mb-2">{schedule.material}</p>
                                                        
                                                        <p className="font-semibold text-sm">Qty (Remaining):</p>
                                                        <p className="text-xs mb-2 font-semibold">
                                                            {schedule.actualoutput > 0 ? (
                                                                <span className="text-orange-500">
                                                                    {schedule.qty - schedule.actualoutput} <span className="text-gray-500 font-normal">(Total: {schedule.qty})</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-blue-500">{schedule.qty}</span>
                                                            )}
                                                        </p>

                                                        <p className="font-semibold text-sm">Pax:</p>
                                                        <p className="text-xs mb-2 font-bold text-orange-500">{schedule.pax}</p>
                                                    </div>
                                                }
                                                trigger='hover' placement="top" arrow={false}
                                            >
                                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                                    {schedule.lotno}
                                                </span>
                                            </Popover>
                                        )}
                                    </TableCell>

                                    {/* 恢复正常的按钮 */}
                                    <TableCell className="align-middle">
                                        <div className="flex gap-2">
                                            <Button outline size="xs" className='cursor-pointer' onClick={() => handleUpdate(schedule)}>Edit</Button>
                                            <Button color='red' outline size="xs" className='cursor-pointer' onClick={() => {
                                                setScheduleIdToDelete(schedule._id)
                                                setOpenModalDeleteSchedule(true)
                                            }}>Delete</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}

            {isMobile && (
                <div className="space-y-4">
                    {currentSchedules.map((schedule) => (
                        <ScheduleCard key={schedule._id} schedule={schedule} />
                    ))}
                </div>
            )}

            <div className="flex-col justify-center text-center mt-4 mb-8">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                {isMobile ? (
                    <div className="mt-4">
                        <MobileSimplePagination />
                    </div>
                ) : (
                    <Pagination
                        showIcons
                        currentPage={currentPage}
                        totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* REPORT MODAL */}
            <Modal show={openModalReport} onClose={() => setOpenModalReport(false)} popup size="md">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium">Export Weekly Planning</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select the production time range. Only schedules active within this period will be exported.
                        </p>
                        
                        {reportError && (
                            <Alert color="failure" icon={HiOutlineExclamationCircle}>
                                <span className="font-medium">{reportError}</span>
                            </Alert>
                        )}
                        
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod Start (From)</Label>
                            <TextInput 
                                type='datetime-local' 
                                value={reportRange.start} 
                                onChange={(e) => setReportRange({...reportRange, start: e.target.value})} 
                                required
                            />
                        </div>
                        
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod End (To)</Label>
                            <TextInput 
                                type='datetime-local' 
                                value={reportRange.end} 
                                onChange={(e) => setReportRange({...reportRange, end: e.target.value})} 
                                required
                            />
                        </div>

                        <div className='flex gap-2 mt-6'>
                            <Button color='gray' className='w-full cursor-pointer' onClick={() => setOpenModalReport(false)}>
                                Cancel
                            </Button>
                            <Button color='green' className='w-full cursor-pointer' onClick={executeDownloadReport} disabled={isExporting}>
                                {isExporting ? <Spinner size="sm" className="mr-2" /> : null}
                                Download Excel
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* CREATE MODAL */}
            <Modal show={openModalCreateSchedule} onClose={() => setOpenModalCreateSchedule(false)} popup size="lg">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Create Schedule</h3>
                        <form onSubmit={handleSubmit}>
                            
                            {/* Shutdown Toggle */}
                            <div className="mb-6 flex items-center justify-between border-b pb-4 border-gray-600">
                                <h4 className="text-md font-semibold text-red-500">Is this a Plan Shut Down?</h4>
                                <ToggleSwitch
                                    checked={formData.isShutdown || false}
                                    onChange={(checked) => setFormData({ ...formData, isShutdown: checked, shutdownReason: checked ? 'NO ORDER' : '' })}
                                />
                            </div>

                            {/* Always visible fields */}
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Extruder</Label>
                                <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                    <option value="">Select an extruder...</option>
                                    {extruders.map((extruder) => (
                                        <option key={extruder._id} value={extruder.code}>{`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod Start</Label>
                                <TextInput value={formData.prodstart || ''} type='datetime-local' id="prodstart" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod End</Label>
                                <TextInput value={formData.prodend || ''} type='datetime-local' id="prodend" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            {/* Conditional Rendering based on Shutdown toggle */}
                            {formData.isShutdown ? (
                                <div className="mb-4 block">
                                    <Label className="text-red-500 mb-2 block">Shut Down Reason</Label>
                                    <Select 
                                        id="shutdownReason" 
                                        value={formData.shutdownReason || 'NO ORDER'}
                                        onChange={(e) => setFormData({...formData, shutdownReason: e.target.value})} 
                                        required
                                    >
                                        <option value="NO ORDER">NO ORDER</option>
                                        <option value="KIV RESIN">KIV RESIN</option>
                                        <option value="KIV FORMULA/ADDITIVE">KIV FORMULA/ADDITIVE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Customer</Label>
                                        <Select 
                                            id="customerSelect" 
                                            className='mb-4' 
                                            required
                                            onFocus={handleFocus}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const selectedCustomer = customers.find(c => c._id === selectedId);
                                                if (selectedCustomer) {
                                                    setFormData({ 
                                                        ...formData, 
                                                        customerID: selectedCustomer.clientID || selectedCustomer._id,
                                                        customerName: selectedCustomer.clientName 
                                                    });
                                                } else {
                                                    setFormData({ ...formData, customerID: '', customerName: '' });
                                                }
                                            }}
                                        >
                                            <option value="">Select a customer...</option>
                                            {customers.map((customer) => (
                                                <option key={customer._id} value={customer._id}>
                                                    {customer.clientID} - {customer.clientName}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order Date</Label>
                                        <TextInput type='date' id="orderdate" value={formData.orderdate || ''} onChange={handleChange} onFocus={handleFocus} required/>
                                    </div>
                                        
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Target Completion</Label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                            <TextInput 
                                                className="flex-1"
                                                type='datetime-local' 
                                                id="targetcompletion" 
                                                value={isDateTimeFormat(formData.targetcompletion) ? formData.targetcompletion : ''}
                                                onChange={(e) => setFormData({ ...formData, targetcompletion: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                            <span className="text-gray-500 font-medium text-center">OR</span>
                                            <TextInput 
                                                className="flex-1"
                                                type='text' 
                                                id="targetcompletion_text" 
                                                placeholder='e.g., KIV RESIN-TBA' 
                                                value={!isDateTimeFormat(formData.targetcompletion) ? (formData.targetcompletion || '') : ''}
                                                onChange={(e) => setFormData({ ...formData, targetcompletion: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Delivery Date</Label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                            <TextInput 
                                                className="flex-1"
                                                type='date' 
                                                id="deliverydate" 
                                                value={isDateTimeFormat(formData.deliverydate) ? formData.deliverydate.substring(0, 10) : ''}
                                                onChange={(e) => setFormData({ ...formData, deliverydate: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                            <span className="text-gray-500 font-medium text-center">OR</span>
                                            <TextInput 
                                                className="flex-1"
                                                type='text' 
                                                id="deliverydate_text" 
                                                placeholder='e.g., URGENT' 
                                                value={!isDateTimeFormat(formData.deliverydate) ? (formData.deliverydate || '') : ''}
                                                onChange={(e) => setFormData({ ...formData, deliverydate: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                        </div>
                                    </div>
                
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot no</Label>
                                        <TextInput id="lotno" placeholder='Enter lot no' onChange={handleChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour code</Label>
                                        <TextInput id="colourcode" placeholder='Enter colour code' onChange={handleChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                        <TextInput id="material" placeholder='Enter material' onChange={handleChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Qty</Label>
                                        <TextInput type='number' min='0' id="qty" step='0.01' placeholder='Enter Qty' onChange={handleChange} onFocus={handleFocus} onWheel={(e) => e.target.blur()} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Pax</Label>
                                        <TextInput type='number' min='0' id="pax" placeholder='Enter Manpower Pax' onChange={handleChange} onFocus={handleFocus} onWheel={(e) => e.target.blur()} required/>
                                    </div>
                                </>
                            )}
                                
                            <div className='mb-4 block mt-6'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            {/* DELETE MODAL */}
            <Modal show={openModalDeleteSchedule} size="md" onClose={() => setOpenModalDeleteSchedule(false)} popup>
                <ModalHeader/>
                <ModalBody>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this schedule?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color="red" onClick={handleDelete}>Yes, I'm sure</Button>
                            <Button color="alternative" onClick={() => setOpenModalDeleteSchedule(false)}>No, cancel</Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* UPDATE MODAL */}
            <Modal show={openModalUpdateSchedule} onClose={() => setOpenModalUpdateSchedule(false)} popup size="lg">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'text-gray-50 bg-gray-900'}`}>
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Update Schedule</h3>
                        <form onSubmit={handleUpdateSubmit}>

                            {/* Shutdown Toggle for Update */}
                            <div className="mb-6 flex items-center justify-between border-b pb-4 border-gray-600">
                                <h4 className="text-md font-semibold text-red-500">Is this a Plan Shut Down?</h4>
                                <ToggleSwitch
                                    checked={updateFormData.isShutdown || false}
                                    onChange={(checked) => setUpdateFormData({ ...updateFormData, isShutdown: checked, shutdownReason: checked ? (updateFormData.shutdownReason || 'NO ORDER') : '' })}
                                />
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Extruder</Label>
                                <Select value={updateFormData.code || ''} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                    <option value="">Select an extruder...</option>
                                    {extruders.map((extruder) => (
                                        <option key={extruder._id} value={extruder.code}>{`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod Start</Label>
                                <TextInput value={updateFormData.prodstart || ''} type='datetime-local' id="prodstart" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod End</Label>
                                <TextInput value={updateFormData.prodend || ''} type='datetime-local' id="prodend" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            {/* Conditional Rendering based on Shutdown toggle */}
                            {updateFormData.isShutdown ? (
                                <div className="mb-4 block">
                                    <Label className="text-red-500 mb-2 block">Shut Down Reason</Label>
                                    <Select 
                                        id="shutdownReason" 
                                        value={updateFormData.shutdownReason || 'NO ORDER'}
                                        onChange={(e) => setUpdateFormData({...updateFormData, shutdownReason: e.target.value})} 
                                        required
                                    >
                                        <option value="NO ORDER">NO ORDER</option>
                                        <option value="KIV RESIN">KIV RESIN</option>
                                        <option value="KIV FORMULA/ADDITIVE">KIV FORMULA/ADDITIVE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Customer</Label>
                                        <Select 
                                            id="customerUpdateSelect" 
                                            className='mb-4' 
                                            required
                                            value={customers.find(c => c.clientName === updateFormData.customerName)?._id || ''} 
                                            onFocus={handleFocus}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const selectedCustomer = customers.find(c => c._id === selectedId);
                                                if (selectedCustomer) {
                                                    setUpdateFormData({ 
                                                        ...updateFormData, 
                                                        customerID: selectedCustomer.clientID || selectedCustomer._id,
                                                        customerName: selectedCustomer.clientName 
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="">Select a customer...</option>
                                            {customers.map((customer) => (
                                                <option key={customer._id} value={customer._id}>
                                                    {customer.clientID} - {customer.clientName}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order Date</Label>
                                        <TextInput type='date' id="orderdate" value={updateFormData.orderdate ? updateFormData.orderdate.substring(0, 10) : ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                    </div>
                                        
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Target Completion</Label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                            <TextInput 
                                                className="flex-1"
                                                type='datetime-local' 
                                                id="targetcompletion" 
                                                value={isDateTimeFormat(updateFormData.targetcompletion) ? updateFormData.targetcompletion : ''}
                                                onChange={(e) => setUpdateFormData({ ...updateFormData, targetcompletion: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                            <span className="text-gray-500 font-medium text-center">OR</span>
                                            <TextInput 
                                                className="flex-1"
                                                type='text' 
                                                id="targetcompletion_text"
                                                placeholder='e.g., KIV RESIN-TBA' 
                                                value={!isDateTimeFormat(updateFormData.targetcompletion) ? (updateFormData.targetcompletion || '') : ''}
                                                onChange={(e) => setUpdateFormData({ ...updateFormData, targetcompletion: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Delivery Date</Label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                            <TextInput 
                                                className="flex-1"
                                                type='date' 
                                                id="deliverydate" 
                                                value={isDateTimeFormat(updateFormData.deliverydate) ? updateFormData.deliverydate.substring(0, 10) : ''}
                                                onChange={(e) => setUpdateFormData({ ...updateFormData, deliverydate: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                            <span className="text-gray-500 font-medium text-center">OR</span>
                                            <TextInput 
                                                className="flex-1"
                                                type='text' 
                                                id="deliverydate_text"
                                                placeholder='e.g., URGENT' 
                                                value={!isDateTimeFormat(updateFormData.deliverydate) ? (updateFormData.deliverydate || '') : ''}
                                                onChange={(e) => setUpdateFormData({ ...updateFormData, deliverydate: e.target.value })} 
                                                onFocus={handleFocus} 
                                            />
                                        </div>
                                    </div>
                
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot no</Label>
                                        <TextInput value={updateFormData.lotno || ''} id="lotno" placeholder='Enter lot no' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour code</Label>
                                        <TextInput value={updateFormData.colourcode || ''} id="colourcode" placeholder='Enter colour code' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                        <TextInput value={updateFormData.material || ''} id="material" placeholder='Enter material' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Qty</Label>
                                        <TextInput value={updateFormData.qty || ''} type='number' min='0' step='0.01' id="qty" placeholder='Enter Qty' onChange={handleUpdateChange} onFocus={handleFocus} onWheel={(e) => e.target.blur()} required/>
                                    </div>

                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Pax</Label>
                                        <TextInput value={updateFormData.pax || ''} type='number' min='0' id="pax" placeholder='Enter Manpower Pax' onChange={handleUpdateChange} onFocus={handleFocus} onWheel={(e) => e.target.blur()} required/>
                                    </div>
                                </>
                            )}
                                
                            <div className='mb-4 block mt-6'>
                                <Button color="blue" className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default CustomerSchedule