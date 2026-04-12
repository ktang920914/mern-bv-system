import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CustomerColorant = () => {
    const { theme } = useThemeStore()
    const { currentUser } = useUserstore()
    const [searchParams, setSearchParams] = useSearchParams()
    
    // --- Modals State ---
    const [openModalCreate, setOpenModalCreate] = useState(false)
    const [openModalDelete, setOpenModalDelete] = useState(false)
    const [openModalUpdate, setOpenModalUpdate] = useState(false)
    const [openModalReport, setOpenModalReport] = useState(false) 
    
    // --- Form & Data State ---
    const [formData, setFormData] = useState({})
    const [updateFormData, setUpdateFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    
    // --- Report State ---
    const [isExporting, setIsExporting] = useState(false)
    const [reportError, setReportError] = useState(null)
    const [reportStartDate, setReportStartDate] = useState('')
    const [reportEndDate, setReportEndDate] = useState('')
    
    // --- Data States ---
    const [extruders, setExtruders] = useState([]) 
    const [customers, setCustomers] = useState([]) 
    const [schedules, setSchedules] = useState([])
    const [scheduleIdToDelete, setScheduleIdToDelete] = useState('')
    const [scheduleIdToUpdate, setScheduleIdToUpdate] = useState('')
    
    // --- Pagination, Search & Filter ---
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All') // NEW: Status State
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(15) 
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // UPDATED: Sync Status Filter with URL Search Params
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (currentPage === 1) params.delete('page')
        else params.set('page', currentPage.toString())
        
        if (searchTerm === '') params.delete('search')
        else params.set('search', searchTerm)

        if (statusFilter === 'All') params.delete('status')
        else params.set('status', statusFilter)
        
        setSearchParams(params)
    }, [currentPage, searchTerm, statusFilter, searchParams, setSearchParams])

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
                const res = await fetch('/api/colorant/getcolorantjobs') 
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

    // --- Create ---
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/colorant/colorantjob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success === false) {
                setErrorMessage(data.message)
                setLoading(false)
            } else {
                setOpenModalCreate(false)
                setLoading(false)
                setFormData({})
                const refreshRes = await fetch('/api/colorant/getcolorantjobs')
                const refreshData = await refreshRes.json()
                if (refreshRes.ok) setSchedules(refreshData)
            }
        } catch (error) {
            console.log(error.message)
            setLoading(false)
        }
    }

    // --- Delete ---
    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/colorant/delete/${scheduleIdToDelete}`, { method: 'DELETE' })
            if (res.ok) {
                setSchedules((prev) => prev.filter((schedule) => schedule._id !== scheduleIdToDelete))
                setOpenModalDelete(false)
            } else {
                const data = await res.json()
                console.log(data.message)
            }
        } catch (error) { 
            console.log(error.message) 
        }
    }

    // --- Format Helpers ---
    const isDateTimeFormat = (val) => {
        if (!val) return false;
        return /^\d{4}-\d{2}-\d{2}/.test(val);
    }

    const formatDisplayDate = (dateStr) => {
        if (!dateStr || !isDateTimeFormat(dateStr)) return dateStr || '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dd = String(d.getDate()).padStart(2, '0');
        return `${dd}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`;
    }

    const getDayOfWeek = (dateStr) => {
        if (!dateStr || !isDateTimeFormat(dateStr)) return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return '-';
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[d.getDay()];
    }

    // --- Update ---
    const handleUpdate = (schedule) => {
        setScheduleIdToUpdate(schedule._id)
        setOpenModalUpdate(true)
        setErrorMessage(null)
        setUpdateFormData({
            category: schedule.category || (schedule.type === 'P' ? 'PIGMENT' : 'OTHER'),
            mixerID: schedule.mixerID,
            type: schedule.type,
            customerID: schedule.customerID, 
            customerName: schedule.customerName, 
            productiondate: schedule.productiondate ? schedule.productiondate.substring(0, 10) : '',
            orderdate: schedule.orderdate ? schedule.orderdate.substring(0, 10) : '', 
            targetcompletion: schedule.targetcompletion || '', 
            deliverydate: schedule.deliverydate || '', 
            lotno: schedule.lotno, 
            colourcode: schedule.colourcode, 
            material: schedule.material, 
            pigmentKg: schedule.pigmentKg,
            additiveKg: schedule.additiveKg,
            status: schedule.status
        })
    }

    const handleUpdateChange = (e) => {
        setUpdateFormData({ ...updateFormData, [e.target.id]: e.target.value })
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch(`/api/colorant/update/${scheduleIdToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateFormData)
            })
            const data = await res.json()
            if (data.success === false) {
                setErrorMessage(data.message)
                setLoading(false)
            } else if (res.ok) {
                setOpenModalUpdate(false)
                setLoading(false)
                const refreshRes = await fetch('/api/colorant/getcolorantjobs')
                const refreshData = await refreshRes.json()
                if (refreshRes.ok) setSchedules(refreshData)
            }
        } catch (error) {
            console.log(error.message)
            setLoading(false)
        }
    }

    // --- EXCEL REPORT GENERATION ---
    const executeDownloadReport = async () => {
        if (!reportStartDate || !reportEndDate) {
            setReportError("Please select both Start Date and End Date.");
            return;
        }

        setReportError(null); 
        setIsExporting(true);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Colorant Schedule');

            // Page setup
            worksheet.pageSetup.orientation = 'landscape';
            worksheet.pageSetup.fitToPage = true;
            worksheet.pageSetup.fitToWidth = 1;
            worksheet.pageSetup.fitToHeight = 0;

            worksheet.mergeCells('A1:F2');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'COLORANT SCHEDULE PLANNING';
            titleCell.font = { name: 'Arial Black', size: 20, bold: true };
            titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

            worksheet.mergeCells('G1:H2');
            const todayTextCell = worksheet.getCell('G1');
            todayTextCell.value = 'TODAY DATE';
            todayTextCell.font = { bold: true, color: { argb: 'FF0000FF' }, size: 11 }; 
            todayTextCell.alignment = { horizontal: 'right', vertical: 'middle' };

            worksheet.mergeCells('I1:K2');
            const now = new Date();
            const timeStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear().toString().slice(-2)} ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

            const dateBlockCell = worksheet.getCell('I1');
            dateBlockCell.value = timeStr;
            dateBlockCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            dateBlockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; 
            dateBlockCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            for(let r=1; r<=2; r++) {
                for(let c=9; c<=11; c++) {
                    worksheet.getCell(r, c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                }
            }

            const headerRow = worksheet.getRow(3);
            headerRow.height = 30;
            const headers = ['Mixer\nID', 'Type', 'Customer', 'Lot No', 'Colour Code', 'Material', 'Pigment\n(kg)', 'Additive\n(kg)', 'Target\nCompletion', 'Delivery\nDate', 'Order\nDate', 'Pigment\nLead Time', 'Late\nDelivery'];
            
            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                
                if (i >= 11) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; 
                } else {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF262626' } }; 
                }
                
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { top: {style:'medium'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} };
            });

            const startLimit = new Date(reportStartDate);
            startLimit.setHours(0, 0, 0, 0);
            const endLimit = new Date(reportEndDate);
            endLimit.setHours(23, 59, 59, 999);

            const activeJobs = schedules.filter(job => {
                if (job.status === 'Completed') return false;
                if (!job.productiondate) return false; 
                const prodDate = new Date(job.productiondate);
                if (prodDate < startLimit || prodDate > endLimit) {
                    return false;
                }
                return true;
            });

            const kivJobs = [];
            const normalJobs = [];

            activeJobs.forEach(job => {
                const tc = (job.targetcompletion || '').toUpperCase();
                if (tc.includes('KIV') || tc.includes('TBA') || tc.includes('HOLD')) {
                    kivJobs.push(job);
                } else {
                    normalJobs.push(job);
                }
            });

            const getProdDateInfo = (dateStr) => {
                if (!dateStr) return { raw: 9999999999999, fmtDate: 'UNSCHEDULED', fmtDay: '' };
                const d = new Date(dateStr);
                if (isNaN(d)) return { raw: 9999999999999, fmtDate: dateStr, fmtDay: '' };
                
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                const dd = String(d.getDate()).padStart(2, '0');
                
                return { 
                    raw: d.getTime(), 
                    fmtDate: `${dd}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`, 
                    fmtDay: days[d.getDay()] 
                };
            };

            const processedNormalJobs = normalJobs.map(job => ({ ...job, _dateInfo: getProdDateInfo(job.productiondate) }));
            processedNormalJobs.sort((a, b) => a._dateInfo.raw - b._dateInfo.raw);

            const groupedByDate = {};
            processedNormalJobs.forEach(job => {
                const dKey = job._dateInfo.fmtDate;
                if (!groupedByDate[dKey]) groupedByDate[dKey] = { day: job._dateInfo.fmtDay, items: [] };
                groupedByDate[dKey].items.push(job);
            });

            let currentRowIdx = 4;

            Object.keys(groupedByDate).forEach(dateKey => {
                const group = groupedByDate[dateKey];
                
                const otherCategory = group.items.filter(j => j.category === 'OTHER' || (!j.category && (j.type || '').toUpperCase() !== 'P'));
                const pigmentCategory = group.items.filter(j => j.category === 'PIGMENT' || (!j.category && (j.type || '').toUpperCase() === 'P'));

                const renderCategoryHeader = (catName, bgColorHex, dateStr, dayStr) => {
                    const r = worksheet.getRow(currentRowIdx);
                    r.height = 20;
                    
                    worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 2);
                    const cellA = r.getCell(1);
                    cellA.value = catName;
                    cellA.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
                    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColorHex } };
                    cellA.alignment = { vertical: 'middle', horizontal: 'left' };
                    r.getCell(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    r.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    
                    const cellDate = r.getCell(3);
                    cellDate.value = dateStr;
                    cellDate.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                    cellDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; 
                    cellDate.alignment = { horizontal: 'center', vertical: 'middle' };
                    cellDate.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    
                    worksheet.mergeCells(currentRowIdx, 4, currentRowIdx, 13);
                    const cellDay = r.getCell(4);
                    cellDay.value = dayStr;
                    cellDay.font = { bold: true, size: 10, color: { argb: 'FF000000' } }; 
                    
                    for(let c=4; c<=13; c++) {
                        const cell = r.getCell(c);
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColorHex } };
                        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    }
                    currentRowIdx++;
                };

                const renderJobRow = (job) => {
                    const r = worksheet.getRow(currentRowIdx);
                    r.height = 20;
                    
                    r.getCell(1).value = job.mixerID || '';
                    r.getCell(1).font = { bold: true };
                    r.getCell(2).value = job.type || '';
                    r.getCell(3).value = job.customerName || '';
                    r.getCell(4).value = job.lotno || '';
                    r.getCell(5).value = job.colourcode || '';
                    r.getCell(6).value = job.material || '';
                    
                    r.getCell(7).value = Number(job.pigmentKg) || '';
                    r.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
                    
                    r.getCell(8).value = Number(job.additiveKg) || '';
                    r.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
                    
                    const targetStr = formatDisplayDate(job.targetcompletion) || job.targetcompletion;
                    r.getCell(9).value = targetStr;
                    if ((targetStr || '').toUpperCase().includes('KIV')) {
                        r.getCell(9).font = { bold: true, color: { argb: 'FFFF0000' } }; 
                    } else {
                        r.getCell(9).font = { bold: true, color: { argb: 'FF0000FF' } }; 
                    }

                    r.getCell(10).value = isDateTimeFormat(job.deliverydate) ? formatDisplayDate(job.deliverydate) : (job.deliverydate || '');
                    r.getCell(11).value = isDateTimeFormat(job.orderdate) ? formatDisplayDate(job.orderdate) : (job.orderdate || '');

                    r.getCell(12).value = ''; 
                    r.getCell(13).value = '';

                    for(let c=1; c<=13; c++) {
                        r.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        if (c === 7 || c === 8) {
                            r.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
                        } else {
                            r.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    }
                    currentRowIdx++;
                };

                if (otherCategory.length > 0) {
                    renderCategoryHeader('OTHER', 'FFFFC000', dateKey, group.day); 
                    otherCategory.forEach(renderJobRow);
                }

                if (pigmentCategory.length > 0) {
                    renderCategoryHeader('PIGMENT', 'FF54FF9F', dateKey, group.day); 
                    pigmentCategory.forEach(renderJobRow);
                }
            });

            if (kivJobs.length > 0) {
                worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 13);
                const kivCell = worksheet.getCell(currentRowIdx, 1);
                kivCell.value = 'JOB ON-HOLD (KIV)';
                kivCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
                kivCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
                kivCell.alignment = { horizontal: 'center', vertical: 'middle' };
                
                for(let c=1; c<=13; c++) {
                    worksheet.getCell(currentRowIdx, c).border = { top: {style:'medium'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} };
                }
                worksheet.getRow(currentRowIdx).height = 25;
                currentRowIdx++;

                const kivSubHeader = worksheet.getRow(currentRowIdx);
                headers.forEach((h, i) => {
                    const c = kivSubHeader.getCell(i + 1);
                    c.value = h;
                    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                    if (i >= 11) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
                    else c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF262626' } };
                    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                });
                kivSubHeader.height = 30;
                currentRowIdx++;

                kivJobs.forEach(job => {
                    const r = worksheet.getRow(currentRowIdx);
                    r.height = 20;
                    
                    r.getCell(1).value = job.mixerID || '';
                    r.getCell(1).font = { bold: true };
                    r.getCell(2).value = job.type || '';
                    r.getCell(3).value = job.customerName || '';
                    r.getCell(4).value = job.lotno || '';
                    r.getCell(5).value = job.colourcode || '';
                    r.getCell(6).value = job.material || '';
                    
                    r.getCell(7).value = Number(job.pigmentKg) || '';
                    r.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
                    r.getCell(8).value = Number(job.additiveKg) || '';
                    r.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
                    
                    r.getCell(9).value = job.targetcompletion || '';
                    r.getCell(9).font = { bold: true, color: { argb: 'FFFF0000' } }; 

                    r.getCell(10).value = isDateTimeFormat(job.deliverydate) ? formatDisplayDate(job.deliverydate) : (job.deliverydate || '');
                    r.getCell(11).value = isDateTimeFormat(job.orderdate) ? formatDisplayDate(job.orderdate) : (job.orderdate || '');
                    
                    r.getCell(12).value = ''; 
                    r.getCell(13).value = '';

                    for(let c=1; c<=13; c++) {
                        r.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        if (c === 7 || c === 8) {
                            r.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
                        } else {
                            r.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    }
                    currentRowIdx++;
                });
            }

            worksheet.columns = [
                { width: 8 },   
                { width: 8 },   
                { width: 15 },  
                { width: 16 },  
                { width: 22 },  
                { width: 35 },  
                { width: 10 },  
                { width: 10 },  
                { width: 16 },  
                { width: 12 },  
                { width: 12 },  
                { width: 14 },  
                { width: 14 },  
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const currentDateStr = `${yyyy}.${mm}.${dd}`;

            saveAs(blob, `Colorant Schedule ${currentDateStr}.xlsx`);
            setOpenModalReport(false);
        } catch (error) {
            console.error('Error generating Excel:', error);
            setReportError('Failed to generate report.');
        } finally {
            setIsExporting(false);
        }
    };

    // --- UPDATED Search & Filter ---
    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredSchedules = schedules.filter(schedule => {
        // 1. Check Search Match
        const matchesSearch = (schedule.customerName && schedule.customerName.toLowerCase().includes(searchTerm)) || 
                              (schedule.lotno && schedule.lotno.toLowerCase().includes(searchTerm)) ||
                              (schedule.category && schedule.category.toLowerCase().includes(searchTerm)) ||
                              (schedule.mixerID && schedule.mixerID.toLowerCase().includes(searchTerm));
        
        // 2. Check Status Match (NEW)
        const matchesStatus = statusFilter === 'All' ? true : schedule.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSchedules = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredSchedules.length
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const ColorantCard = ({ schedule }) => {
        const isHold = (schedule.targetcompletion || '').toUpperCase().includes('KIV');
        const categoryName = schedule.category || (schedule.type === 'P' ? 'PIGMENT' : 'OTHER');
        
        return (
            <div className={`p-4 rounded-lg shadow transition-all duration-200 ${
                theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
            }`}>
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <span className="text-gray-500 text-xs font-semibold">Mixer ID:</span> 
                        <span className="font-bold ml-1">{schedule.mixerID}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs font-semibold">Type:</span> 
                        <span className="font-bold ml-1 text-indigo-500">{categoryName}</span>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <span className="text-gray-500 text-xs font-semibold">Customer:</span> 
                        <span className={`font-bold ml-1 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{schedule.customerName}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs font-semibold">Prod Date:</span> 
                        <span className="font-bold ml-1 text-green-500">{formatDisplayDate(schedule.productiondate)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <span className="text-gray-500 text-xs font-semibold mr-1">Lot No:</span> 
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
                                    <div className="mt-3 border-t border-gray-400 pt-2">
                                        <p className="font-semibold text-sm">Pigment (kg):</p>
                                        <p className="text-xs mb-2 font-bold text-orange-500">{schedule.pigmentKg}</p>
                                        <p className="font-semibold text-sm">Additive (kg):</p>
                                        <p className="text-xs font-bold text-blue-500">{schedule.additiveKg}</p>
                                    </div>
                                </div>
                            }
                            trigger='hover' placement="top" arrow={false}
                        >
                            <span className={`cursor-pointer hover:text-blue-600 font-bold border-b border-dashed inline-flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                {schedule.lotno}
                            </span>
                        </Popover>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs font-semibold">Day:</span> 
                        <span className="font-bold ml-1 text-orange-500">{getDayOfWeek(schedule.productiondate)}</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs mb-4">
                    <div className="flex items-center">
                        <span className="text-gray-500 font-semibold mr-2">Status:</span> 
                        {/* UPDATED: Status CSS formatting */}
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${schedule.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {schedule.status || 'In Progress'}
                        </span>
                    </div>
                    <div></div>
                    
                    <div>
                        <span className="text-gray-500 font-semibold">Target:</span> 
                        <span className={`ml-1 font-bold ${isHold ? 'text-red-500' : 'text-blue-500'}`}>
                            {formatDisplayDate(schedule.targetcompletion) || schedule.targetcompletion || '-'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 font-semibold">Delivery:</span> 
                        <span className="ml-1 font-bold text-rose-500">
                            {formatDisplayDate(schedule.deliverydate) || schedule.deliverydate || '-'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button outline className='cursor-pointer flex-1 py-1 text-sm' onClick={() => handleUpdate(schedule)}>Edit</Button>
                    <Button color='red' outline className='cursor-pointer flex-1 py-1 text-sm' onClick={() => {
                        setScheduleIdToDelete(schedule._id)
                        setOpenModalDelete(true)
                    }}>Delete</Button>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen'>
            {/* Header Area */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Colorant Schedule</h1>
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    {/* NEW: Status Filter Dropdown */}
                    <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className='w-full sm:w-40'>
                        <option value="All">All Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </Select>

                    <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch} className='w-full sm:w-64'/>
                    <Button color="green" onClick={() => setOpenModalReport(true)} className='w-full sm:w-auto cursor-pointer'>Report</Button>
                    <Button color="blue" className='cursor-pointer w-full sm:w-auto' onClick={() => {setFormData({}); setOpenModalCreate(true)}}>Create Colorant Job</Button>
                </div>
            </div>

            {/* Desktop Table View */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Mixer ID</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Category</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Type</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Customer</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Prod Date</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot No</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Status</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Target / Delivery</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Actions</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentSchedules.map((schedule) => {
                            const isHold = (schedule.targetcompletion || '').toUpperCase().includes('KIV');
                            return (
                                <TableRow key={schedule._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                    <TableCell className="font-bold">{schedule.mixerID}</TableCell>
                                    <TableCell className="font-semibold text-xs text-gray-500">{schedule.category || (schedule.type === 'P' ? 'PIGMENT' : 'OTHER')}</TableCell>
                                    <TableCell>{schedule.type}</TableCell>
                                    <TableCell className={`font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{schedule.customerName}</TableCell>
                                    <TableCell className="font-semibold text-green-500">{formatDisplayDate(schedule.productiondate)}</TableCell>
                                    <TableCell>
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
                                                    <div className="mt-3 border-t border-gray-400 pt-2">
                                                        <p className="font-semibold text-sm">Pigment (kg):</p>
                                                        <p className="text-xs mb-2 font-bold text-orange-500">{schedule.pigmentKg}</p>
                                                        <p className="font-semibold text-sm">Additive (kg):</p>
                                                        <p className="text-xs font-bold text-blue-500">{schedule.additiveKg}</p>
                                                    </div>
                                                </div>
                                            }
                                            trigger='hover' placement="top" arrow={false}
                                        >
                                            <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                                {schedule.lotno}
                                            </span>
                                        </Popover>
                                    </TableCell>
                                    
                                    {/* UPDATED: Status CSS formatting */}
                                    <TableCell className="align-middle text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${schedule.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {schedule.status || 'In Progress'}
                                        </span>
                                    </TableCell>
                                    
                                    <TableCell className="text-xs">
                                        <div className={`font-bold ${isHold ? 'text-red-500' : 'text-blue-500'}`}>{formatDisplayDate(schedule.targetcompletion) || schedule.targetcompletion || '-'}</div>
                                        <div className="text-rose-500">{formatDisplayDate(schedule.deliverydate) || schedule.deliverydate || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button className='cursor-pointer' outline size="xs" onClick={() => handleUpdate(schedule)}>Edit</Button>
                                            <Button className='cursor-pointer' color='red' outline size="xs" onClick={() => {
                                                setScheduleIdToDelete(schedule._id)
                                                setOpenModalDelete(true)
                                            }}>Delete</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}

            {/* Mobile List View */}
            {isMobile && (
                <div className="space-y-4">
                    {currentSchedules.map((schedule) => (
                        <ColorantCard key={schedule._id} schedule={schedule} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex-col justify-center text-center mt-6 mb-8">
                <Pagination showIcons currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>

            {/* EXCEL REPORT MODAL */}
            <Modal show={openModalReport} onClose={() => setOpenModalReport(false)} popup size="md">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <div className='text-center'>
                            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
                            <h3 className="text-xl font-medium">Export Colorant Schedule</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                                Select a date range. Only jobs with a <b>Production Date</b> within this range will be exported.
                            </p>
                        </div>

                        {/* Date Filter Inputs */}
                        <div className="flex gap-4 mb-4">
                            <div className="w-1/2">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Start Date</Label>
                                <TextInput 
                                    type="date" 
                                    value={reportStartDate} 
                                    onChange={(e) => setReportStartDate(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="w-1/2">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>End Date</Label>
                                <TextInput 
                                    type="date" 
                                    value={reportEndDate} 
                                    onChange={(e) => setReportEndDate(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        
                        {reportError && (
                            <Alert color="failure">
                                <span className="font-medium">{reportError}</span>
                            </Alert>
                        )}
                        
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
            <Modal show={openModalCreate} onClose={() => setOpenModalCreate(false)} popup size="lg">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`}>
                    <div className="space-y-4">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Create Colorant Schedule</h3>
                        <form onSubmit={handleSubmit}>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Category</Label>
                                    <Select id="category" onChange={(e) => {
                                        handleChange(e);
                                        if(e.target.value === 'PIGMENT') setFormData(prev => ({...prev, category: 'PIGMENT', type: 'P'}));
                                        else setFormData(prev => ({...prev, category: 'OTHER', type: ''}));
                                    }} onFocus={handleFocus} required>
                                        <option value="">Select Category...</option>
                                        <option value="OTHER">OTHER</option>
                                        <option value="PIGMENT">PIGMENT</option>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Mixer ID</Label>
                                    <Select id="mixerID" value={formData.mixerID || ''} onChange={handleChange} onFocus={handleFocus} required>
                                        <option value="">Select a Mixer...</option>
                                        {extruders.map((extruder) => (
                                            <option key={extruder._id} value={extruder.code}>
                                                {`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Type</Label>
                                    {formData.category === 'PIGMENT' ? (
                                         <TextInput id="type" value="P" readOnly disabled/>
                                    ) : (
                                        <Select id="type" onChange={handleChange} onFocus={handleFocus} required disabled={!formData.category}>
                                            <option value="">Select an Extruder...</option>
                                            {extruders.map((extruder) => (
                                                <option key={extruder._id} value={extruder.code}>
                                                    {`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Customer Name</Label>
                                <Select 
                                    id="customerSelect" className='mb-4' required onFocus={handleFocus}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Production Date</Label>
                                    <TextInput type='date' id="productiondate" onChange={handleChange} onFocus={handleFocus} required/>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order Date</Label>
                                    <TextInput type='date' id="orderdate" onChange={handleChange} onFocus={handleFocus}/>
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Target Completion</Label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                    <TextInput 
                                        className="flex-1" type='date' id="targetcompletion" 
                                        value={isDateTimeFormat(formData.targetcompletion) ? formData.targetcompletion.substring(0, 10) : ''}
                                        onChange={(e) => setFormData({ ...formData, targetcompletion: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                    <span className="text-gray-500 font-medium text-center">OR</span>
                                    <TextInput 
                                        className="flex-1" type='text' id="targetcompletion_text" placeholder='e.g., KIV RED-EG' 
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
                                        className="flex-1" type='date' id="deliverydate" 
                                        value={isDateTimeFormat(formData.deliverydate) ? formData.deliverydate.substring(0, 10) : ''}
                                        onChange={(e) => setFormData({ ...formData, deliverydate: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                    <span className="text-gray-500 font-medium text-center">OR</span>
                                    <TextInput 
                                        className="flex-1" type='text' id="deliverydate_text" placeholder='e.g., URGENT' 
                                        value={!isDateTimeFormat(formData.deliverydate) ? (formData.deliverydate || '') : ''}
                                        onChange={(e) => setFormData({ ...formData, deliverydate: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot No</Label>
                                <TextInput id="lotno" placeholder='Enter lot no' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour Code</Label>
                                <TextInput id="colourcode" placeholder='Enter colour code' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                <TextInput id="material" placeholder='Enter material' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Pigment (kg)</Label>
                                    <TextInput type='number' min='0' step='0.01' id="pigmentKg" onChange={handleChange} onFocus={handleFocus} required/>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Additive (kg)</Label>
                                    <TextInput type='number' min='0' step='0.01' id="additiveKg" onChange={handleChange} onFocus={handleFocus} required/>
                                </div>
                            </div>

                            <div className='mt-6 block'>
                                <Button color="blue" className='w-full cursor-pointer' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            {/* UPDATE MODAL */}
            <Modal show={openModalUpdate} onClose={() => setOpenModalUpdate(false)} popup size="lg">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`}>
                    <div className="space-y-4">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Update Colorant Schedule</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Category</Label>
                                    <Select id="category" value={updateFormData.category || ''} onChange={(e) => {
                                        handleUpdateChange(e);
                                        if(e.target.value === 'PIGMENT') setUpdateFormData(prev => ({...prev, category: 'PIGMENT', type: 'P'}));
                                        else setUpdateFormData(prev => ({...prev, category: 'OTHER', type: ''}));
                                    }} onFocus={handleFocus} required>
                                        <option value="">Select Category...</option>
                                        <option value="OTHER">OTHER</option>
                                        <option value="PIGMENT">PIGMENT</option>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Mixer ID</Label>
                                    <Select id="mixerID" value={updateFormData.mixerID || ''} onChange={handleUpdateChange} onFocus={handleFocus} required>
                                        <option value="">Select a Mixer...</option>
                                        {extruders.map((extruder) => (
                                            <option key={extruder._id} value={extruder.code}>
                                                {`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Type</Label>
                                    {updateFormData.category === 'PIGMENT' ? (
                                         <TextInput id="type" value="P" readOnly disabled/>
                                    ) : (
                                        <Select id="type" value={updateFormData.type || ''} onChange={handleUpdateChange} onFocus={handleFocus} required>
                                            <option value="">Select an Extruder...</option>
                                            {extruders.map((extruder) => (
                                                <option key={extruder._id} value={extruder.code}>
                                                    {`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Customer Name</Label>
                                <Select 
                                    id="customerUpdateSelect" className='mb-4' required
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Production Date</Label>
                                    <TextInput type='date' id="productiondate" value={updateFormData.productiondate || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order Date</Label>
                                    <TextInput type='date' id="orderdate" value={updateFormData.orderdate || ''} onChange={handleUpdateChange} onFocus={handleFocus}/>
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Target Completion</Label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                    <TextInput 
                                        className="flex-1" type='date' id="targetcompletion" 
                                        value={isDateTimeFormat(updateFormData.targetcompletion) ? updateFormData.targetcompletion.substring(0, 10) : ''}
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, targetcompletion: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                    <span className="text-gray-500 font-medium text-center">OR</span>
                                    <TextInput 
                                        className="flex-1" type='text' id="targetcompletion_text" placeholder='e.g., KIV RED-EG-TBA' 
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
                                        className="flex-1" type='date' id="deliverydate" 
                                        value={isDateTimeFormat(updateFormData.deliverydate) ? updateFormData.deliverydate.substring(0, 10) : ''}
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, deliverydate: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                    <span className="text-gray-500 font-medium text-center">OR</span>
                                    <TextInput 
                                        className="flex-1" type='text' id="deliverydate_text" placeholder='e.g., URGENT' 
                                        value={!isDateTimeFormat(updateFormData.deliverydate) ? (updateFormData.deliverydate || '') : ''}
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, deliverydate: e.target.value })} 
                                        onFocus={handleFocus} 
                                    />
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot No</Label>
                                <TextInput id="lotno" value={updateFormData.lotno || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour Code</Label>
                                <TextInput id="colourcode" value={updateFormData.colourcode || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                <TextInput id="material" value={updateFormData.material || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Pigment (kg)</Label>
                                    <TextInput type='number' min='0' step='0.01' id="pigmentKg" value={updateFormData.pigmentKg || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                </div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Additive (kg)</Label>
                                    <TextInput type='number' min='0' step='0.01' id="additiveKg" value={updateFormData.additiveKg || ''} onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Status</Label>
                                <Select id="status" value={updateFormData.status || ''} onChange={handleUpdateChange}>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </Select>
                            </div>

                            <div className='mt-6 block'>
                                <Button color="blue" className='w-full cursor-pointer' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && <Alert color='failure'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            {/* DELETE MODAL */}
            <Modal show={openModalDelete} size="md" onClose={() => setOpenModalDelete(false)} popup>
                <ModalHeader/>
                <ModalBody>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">Are you sure you want to delete this schedule?</h3>
                        <div className="flex justify-center gap-4">
                            <Button color="red" className="cursor-pointer" onClick={handleDelete}>Yes, I'm sure</Button>
                            <Button color="gray" className="cursor-pointer" onClick={() => setOpenModalDelete(false)}>No, cancel</Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default CustomerColorant