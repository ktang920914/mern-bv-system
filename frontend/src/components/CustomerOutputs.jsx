import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, TextInput, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Select, Popover } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { HiOutlineExclamationCircle } from "react-icons/hi";

const CustomerOutputs = () => {
    const { theme } = useThemeStore()
    const { currentUser } = useUserstore()
    const [searchParams, setSearchParams] = useSearchParams()
    
    const [schedules, setSchedules] = useState([])
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    
    // Pagination, Search & Filter
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All')
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // Modals
    const [openModalUpdate, setOpenModalUpdate] = useState(false)
    const [openModalReport, setOpenModalReport] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [reportError, setReportError] = useState(null)
    const [reportRange, setReportRange] = useState({ start: '', end: '' })
    
    // Update Form State
    const [scheduleIdToUpdate, setScheduleIdToUpdate] = useState('')
    const [updateFormData, setUpdateFormData] = useState({})

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

        if (statusFilter === 'All') params.delete('status')
        else params.set('status', statusFilter)
        
        setSearchParams(params)
    }, [currentPage, searchTerm, statusFilter, searchParams, setSearchParams])

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

    const handleOpenReportModal = () => {
        const now = new Date();
        const endTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        const startTarget = new Date(endTarget);
        startTarget.setDate(startTarget.getDate() - 1);

        const formatForInput = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        setReportRange({
            start: formatForInput(startTarget),
            end: formatForInput(endTarget)
        });
        
        setReportError(null);
        setOpenModalReport(true);
    }

    const handleUpdate = (schedule) => {
        setScheduleIdToUpdate(schedule._id)
        setOpenModalUpdate(true)
        setErrorMessage(null)

        const initialProdDate = schedule.productionDate 
            ? new Date(schedule.productionDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        setUpdateFormData({
            qty: schedule.qty || 0, 
            actualoutput: schedule.actualoutput || '',
            wastage: schedule.wastage || '',
            planprodtime: schedule.planprodtime || '',
            operatingtime: schedule.operatingtime || '',
            proddelay: schedule.proddelay || '',
            irr: schedule.irr || '',
            arr: schedule.arr || '',
            status: schedule.status || 'In Progress', 
            productionDate: initialProdDate,
            remark: schedule.remark || '',
            // 初始化新增的分钟字段
            qctime: schedule.qctime || 0,
            so: schedule.so || 0,
            startup: schedule.startup || 0
        })
    }

    // --- 前端自动计算的核心逻辑 ---
    const handleUpdateChange = (e) => {
        const { id, value } = e.target;
        let newFormData = { ...updateFormData, [id]: value };

        // 1. 处理 Wastage 和 Status
        if (id === 'actualoutput') {
            const actual = parseFloat(value) || 0;
            const planned = parseFloat(newFormData.qty) || 0;
            const previousActual = parseFloat(updateFormData.actualoutput) || 0; 

            newFormData.wastage = (actual - planned).toFixed(2);

            if (actual >= planned) {
                newFormData.status = 'Completed';
            } else if (previousActual >= planned && actual < planned) {
                newFormData.status = 'In Progress';
            }
        }

        // 2. 自动计算 Plan Prod Time (Hours)
        if (['arr', 'qty', 'qctime', 'so', 'startup'].includes(id)) {
            const arrVal = parseFloat(id === 'arr' ? value : newFormData.arr) || 0;
            const qtyVal = parseFloat(id === 'qty' ? value : newFormData.qty) || 0;
            const qcVal = parseFloat(id === 'qctime' ? value : newFormData.qctime) || 0;
            const soVal = parseFloat(id === 'so' ? value : newFormData.so) || 0;
            const startupVal = parseFloat(id === 'startup' ? value : newFormData.startup) || 0;

            let planTimeMins = qcVal + soVal + startupVal; 
            
            if (arrVal > 0) {
                planTimeMins += (qtyVal / arrVal); 
            }

            // 分钟转小时
            const planTimeHrs = (planTimeMins / 60).toFixed(2);
            newFormData.planprodtime = planTimeHrs;

            // 更新 Delay
            const opTime = parseFloat(newFormData.operatingtime) || 0;
            newFormData.proddelay = (opTime - parseFloat(planTimeHrs)).toFixed(2);
        }

        // 3. 处理 Operating Time 影响 Delay
        if (id === 'operatingtime') {
            const opTime = parseFloat(value) || 0;
            const planTime = parseFloat(newFormData.planprodtime) || 0;
            newFormData.proddelay = (opTime - planTime).toFixed(2);
        }

        setUpdateFormData(newFormData);
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch(`/api/customerschedule/update/${scheduleIdToUpdate}`, {
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
                const refreshRes = await fetch('/api/customerschedule/getcustomerjobs')
                const refreshData = await refreshRes.json()
                if (refreshRes.ok) setSchedules(refreshData)
            }
        } catch (error) {
            console.log(error.message)
            setLoading(false)
        }
    }

    const executeDownloadReport = async () => {
        setReportError(null); 
        if (!reportRange.start || !reportRange.end) {
            setReportError('Please select both Start and End date/time.');
            return;
        }

        const startTarget = new Date(reportRange.start).getTime();
        const endTarget = new Date(reportRange.end).getTime();

        if (startTarget > endTarget) {
            setReportError('Start time cannot be later than End time.');
            return;
        }

        const reportData = schedules.filter(job => {
            const bizDate = job.productionDate ? new Date(job.productionDate) : new Date(job.updatedAt);
            if (!bizDate) return false;
            
            const jobBizTime = bizDate.getTime();
            const hasOutput = job.status === 'Completed' || (Number(job.actualoutput) > 0);
            if (!hasOutput) return false;

            return jobBizTime >= startTarget && jobBizTime <= endTarget;
        });

        if (reportData.length === 0) {
            setReportError('No production outputs found in this time range!');
            return;
        }

        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Output Report');

            // Setup Print Layout
            worksheet.pageSetup = {
                paperSize: 9, 
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 1, 
                horizontalCentered: true, 
                verticalCentered: false, 
                margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.5, header: 0.3, footer: 0.3 }
            };

            worksheet.properties.defaultRowHeight = 20;

            // 1. TITLE
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'PRODUCTION OUTPUT REPORT';
            titleCell.font = { name: 'Arial Black', size: 14, bold: true };
            worksheet.mergeCells('A1:D1');
            
            for (let i = 1; i <= 5; i++) {
                worksheet.getCell(1, i).border = { bottom: { style: 'medium' } };
            }

            const targetDateObj = new Date(reportRange.end);
            const dayStr = targetDateObj.getDate().toString();
            const monthStr = targetDateObj.toLocaleString('default', { month: 'short' });
            const yearStr = targetDateObj.getFullYear().toString();
            const timeStr = targetDateObj.toLocaleTimeString('en-US', {hour: 'numeric', hour12: true}).replace(/\s/g, ''); 

            worksheet.getCell('G1').value = 'DATE';
            worksheet.getCell('G1').font = { bold: true, name: 'Arial Black', size: 10 };
            worksheet.getCell('G1').alignment = { horizontal: 'right', vertical: 'bottom' };
            worksheet.getCell('H1').value = dayStr;
            worksheet.getCell('H1').font = { bold: true, color: { argb: 'FF0000FF' }, name: 'Arial', size: 11 }; 
            worksheet.getCell('H1').alignment = { horizontal: 'center', vertical: 'bottom' };
            worksheet.getCell('I1').value = monthStr;
            worksheet.getCell('I1').font = { bold: true, color: { argb: 'FF0000FF' }, name: 'Arial', size: 11 }; 
            worksheet.getCell('I1').alignment = { horizontal: 'center', vertical: 'bottom' };
            worksheet.getCell('J1').value = yearStr;
            worksheet.getCell('J1').font = { bold: true, color: { argb: 'FF0000FF' }, name: 'Arial', size: 11 }; 
            worksheet.getCell('J1').alignment = { horizontal: 'center', vertical: 'bottom' };
            worksheet.getCell('K1').value = 'TIME';
            worksheet.getCell('K1').font = { bold: true, name: 'Arial Black', size: 10 };
            worksheet.getCell('K1').alignment = { horizontal: 'right', vertical: 'bottom' };
            worksheet.getCell('L1').value = timeStr;
            worksheet.getCell('L1').font = { bold: true, color: { argb: 'FF0000FF' }, name: 'Arial', size: 11 }; 
            worksheet.getCell('L1').alignment = { horizontal: 'center', vertical: 'bottom' };

            // 2. HEADERS
            const headerRow = worksheet.getRow(3);
            const headers = [
                'No.', 'MC ID', 'LOT NO.', 'COLOR CODE', 'MATERIAL', 
                'PLANNED\nOUTPUT (KG)', 'ACTUAL\nOUTPUT (KG)', 'WASTAGE\n(KG)', 
                'PLANNED\nPROD TIME\n(HRS)', 'OPERATING\nTIME (HRS)', 'PROD\nDELAY\n(HRS)', 
                'Ideal Run\nRate , IRR\n(KG/MIN)', 'Actual Run\nRate , ARR\n(KG/MIN)', 'REMARKS (REJECT,\nREASON OF DELAY)'
            ];
            
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.font = { bold: true, size: 8, name: 'Arial Black' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                cell.border = { top: {style:'medium'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
            headerRow.height = 45; 

            // 3. DATA
            let currentRowIdx = 4;
            let totals = { qty: 0, actual: 0, wastage: 0, planTime: 0, opTime: 0, delay: 0 };
            const decimalFormat = '#,##0.00;[Red](#,##0.00)';
            const rowCount = Math.max(reportData.length, 42);

            for(let i = 0; i < rowCount; i++) {
                const job = reportData[i];
                const row = worksheet.getRow(currentRowIdx);
                row.getCell(1).value = i + 1; 

                if (job) {
                    row.getCell(2).value = job.code || '';
                    row.getCell(3).value = job.lotno || '';
                    row.getCell(4).value = job.colourcode || '';
                    row.getCell(5).value = job.material || '';
                    row.getCell(6).value = Number(job.qty) || 0;
                    row.getCell(7).value = Number(job.actualoutput) || 0;
                    
                    const wastage = Number(job.wastage) || 0;
                    row.getCell(8).value = wastage;
                    row.getCell(9).value = Number(job.planprodtime) || 0;
                    row.getCell(10).value = Number(job.operatingtime) || 0;
                    
                    const delay = Number(job.proddelay) || 0;
                    row.getCell(11).value = delay;
                    row.getCell(12).value = Number(job.irr) || 0;
                    row.getCell(13).value = Number(job.arr) || 0;
                    row.getCell(14).value = job.remark || ''; 

                    totals.qty += Number(job.qty) || 0;
                    totals.actual += Number(job.actualoutput) || 0;
                    totals.wastage += wastage;
                    totals.planTime += Number(job.planprodtime) || 0;
                    totals.opTime += Number(job.operatingtime) || 0;
                    totals.delay += delay;
                }

                for(let c = 1; c <= 14; c++) {
                    const cell = row.getCell(c);
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    cell.font = { name: 'Arial', size: 9, bold: true }; 
                    if (c === 1 || c === 2) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (c >= 6 && c <= 13) {
                        cell.alignment = { vertical: 'middle', horizontal: 'right' };
                        cell.numFmt = decimalFormat; 
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                }
                currentRowIdx++;
            }

            // 4. TOTAL
            const totalRow = worksheet.getRow(currentRowIdx);
            worksheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
            
            const totalTitleCell = totalRow.getCell(1);
            totalTitleCell.value = 'TOTAL';
            totalTitleCell.font = { bold: true, name: 'Arial Black', size: 10 };
            totalTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };

            totalRow.getCell(6).value = totals.qty;
            totalRow.getCell(7).value = totals.actual;
            totalRow.getCell(8).value = totals.wastage;
            totalRow.getCell(9).value = totals.planTime;
            totalRow.getCell(10).value = totals.opTime;
            totalRow.getCell(11).value = totals.delay;

            const totalNumFormat = '#,##0;[Red](#,##0)';

            for(let c = 6; c <= 11; c++) {
                const cell = totalRow.getCell(c);
                cell.font = { bold: true, color: { argb: 'FF0000FF' }, name: 'Arial', size: 10 };
                cell.numFmt = totalNumFormat;
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

            for(let c = 12; c <= 14; c++) {
                const cell = totalRow.getCell(c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
            }

            for(let c = 1; c <= 14; c++) {
                totalRow.getCell(c).border = { top: {style:'medium'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} };
            }

            // 5. COLUMN WIDTHS
            worksheet.columns = [
                { width: 4.5 }, { width: 8.5 }, { width: 18 },  { width: 22 },  { width: 35 },
                { width: 11 },  { width: 11 },  { width: 9.5 }, { width: 10 },  { width: 10 }, 
                { width: 9.5 }, { width: 10 },  { width: 10 },  { width: 25 }   
            ];

            // 6. NOTE ROW
            const noteRowIdx = currentRowIdx + 1;
            const noteRow = worksheet.getRow(noteRowIdx);
            noteRow.getCell(1).value = 'NOTE';
            noteRow.getCell(1).font = { bold: true, name: 'Arial Black', size: 9 };
            noteRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

            noteRow.getCell(2).value = {
                richText: [
                    { text: 'Production Time calculated is based on ', font: { name: 'Arial', size: 9, bold: true } },
                    { text: 'Actual Run Rate (ARR)', font: { name: 'Arial', size: 9, bold: true, italic: true } },
                    { text: ', NOT ', font: { name: 'Arial', size: 9, bold: true } },
                    { text: 'Ideal Run Rate (IRR)', font: { name: 'Arial', size: 9, bold: true, italic: true } }
                ]
            };
            worksheet.mergeCells(`B${noteRowIdx}:H${noteRowIdx}`);
            noteRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

            // Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const reportDateStr = new Date(reportRange.end).toISOString().slice(0,10).replace(/-/g, '.');
            saveAs(blob, `Weekly Production Planning dtd ${reportDateStr} (Output).xlsx`);
            setOpenModalReport(false);

        } catch (error) {
            console.error('Error generating Excel:', error);
            setReportError('Failed to generate report.');
        } finally {
            setIsExporting(false);
        }
    }

    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch = (schedule.code && schedule.code.toLowerCase().includes(searchTerm)) ||
                              (schedule.lotno && schedule.lotno.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'All' ? true : schedule.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSchedules = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredSchedules.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const MobileSimplePagination = () => (
        <div className="flex items-center justify-center space-x-4">
            <Button size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="flex items-center cursor-pointer">
                <span>‹</span><span className="ml-1">Previous</span>
            </Button>
            <Button size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="flex items-center cursor-pointer">
                <span className="mr-1">Next</span><span>›</span>
            </Button>
        </div>
    )

    const OutputCard = ({ schedule }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
        }`}>
            {/* Header */}
            <div className="mb-3 border-b pb-2 border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <p className="text-sm font-semibold text-gray-500">MC ID</p>
                    <p className={`text-lg font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{schedule.code}</p>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${schedule.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {schedule.status || 'In Progress'}
                    </span>
                </div>
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                    <p className="font-semibold text-gray-500 text-xs">Lot No:</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-300'} font-semibold break-all`}>{schedule.lotno}</p>
                </div>
                <div>
                    <p className="font-semibold text-gray-500 text-xs">Color:</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-300'} break-all`}>{schedule.colourcode}</p>
                </div>
                <div className="col-span-2">
                    <p className="font-semibold text-gray-500 text-xs">Material:</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-300'} break-words`}>{schedule.material}</p>
                </div>
            </div>
            
            {/* Plan vs Actual Panel */}
            <div className={`flex justify-between items-center mb-4 p-2 rounded-md ${theme === 'light' ? 'bg-gray-50 border border-gray-100' : 'bg-gray-700'}`}>
                <div className="text-center w-1/2 border-r border-gray-200 dark:border-gray-600">
                    <p className={`${theme === 'light' ? ' text-gray-900' : ' text-gray-300'}`}>Plan Qty</p>
                    <p className={`font-bold ${theme === 'light' ? 'font-semibold mb-1 text-gray-900' : 'font-semibold mb-1 text-gray-100'}`}>{schedule.qty} KG</p>
                </div>
                <div className="text-center w-1/2">
                    <p className={`${theme === 'light' ? ' text-gray-900' : ' text-gray-300'}`}>Actual Output</p>
                    <p className={`font-bold ${schedule.actualoutput > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                        {schedule.actualoutput || '0'} KG
                    </p>
                </div>
            </div>
            
            <Button outline className='w-full cursor-pointer py-1 text-sm' onClick={() => handleUpdate(schedule)}>
                Update
            </Button>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Production Outputs</h1>
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className='w-full sm:w-40'>
                        <option value="All">All Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </Select>
                    <TextInput placeholder='Enter searching' value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value.toLowerCase()); setCurrentPage(1); }} className='w-full sm:w-auto flex-1'/>
                    <Button color="green" onClick={handleOpenReportModal} className="w-full sm:w-auto cursor-pointer">Report</Button>
                </div>
            </div>

            {isMobile ? (
                <div className="space-y-4 mt-4">
                    {currentSchedules.map((schedule) => (
                        <OutputCard key={schedule._id} schedule={schedule} />
                    ))}
                </div>
            ) : (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>MC ID</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot No.</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Planned Qty (KG)</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Actual Output (KG)</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Status</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Actions</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentSchedules.map((schedule) => (
                            <TableRow key={schedule._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle font-bold">{schedule.code}</TableCell>
                                <TableCell className="align-middle">
                                    <Popover
                                        trigger="hover" placement="top"
                                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Colour code:</p>
                                                <p className="text-xs mb-2">{schedule.colourcode}</p>
                                                <p className="font-semibold text-sm">Material:</p>
                                                <p className="text-xs mb-2">{schedule.material}</p>
                                            </div>
                                        }
                                    >
                                        <span className={`cursor-pointer font-semibold transition-colors border-b border-dashed inline-flex items-center ${theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'}`}>
                                            {schedule.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle text-center font-semibold">{schedule.qty}</TableCell>
                                <TableCell className={`align-middle text-center font-bold ${schedule.actualoutput > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                    {schedule.actualoutput || '0'}
                                </TableCell>
                                <TableCell className="align-middle text-center">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${schedule.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {schedule.status || 'In Progress'}
                                    </span>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Button className='cursor-pointer px-3 py-1' outline size="sm" onClick={() => handleUpdate(schedule)}>Update</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="flex-col justify-center text-center mt-4 mb-8">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                {isMobile ? (
                    <MobileSimplePagination />
                ) : (
                    <Pagination showIcons currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))} onPageChange={handlePageChange} />
                )}
            </div>

            {/* UPDATE MODAL */}
            <Modal show={openModalUpdate} onClose={() => setOpenModalUpdate(false)} popup size="xl">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'text-gray-50 bg-gray-900'}`}>
                    <div className="space-y-4">
                        <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Record Production Data</h3>
                        
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-500">Planned Output (KG)</p>
                                <p className="text-lg font-bold">{updateFormData.qty}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-2 block col-span-2">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Production Date (If forgot to key in yesterday, change this)</Label>
                                    <TextInput type='date' id="productionDate" value={updateFormData.productionDate} onChange={handleUpdateChange} required />
                                </div>

                                <div className="mb-2 block col-span-2">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Job Status (Will Auto-Complete if Actual ≥ Planned)</Label>
                                    <Select id="status" value={updateFormData.status} onChange={handleUpdateChange} required className="font-bold text-blue-600">
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </Select>
                                </div>

                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Actual Output (KG)</Label>
                                    <TextInput type='number' step='0.01' id="actualoutput" value={updateFormData.actualoutput} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Wastage (KG)</Label>
                                    <TextInput type='number' step='0.01' id="wastage" value={updateFormData.wastage} readOnly className="bg-gray-100 dark:bg-gray-800" helperText="Auto calculated: Actual - Planned"/>
                                </div>

                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Ideal Run Rate (IRR)</Label>
                                    <TextInput type='number' step='0.01' id="irr" value={updateFormData.irr} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Actual Run Rate (ARR)</Label>
                                    <TextInput type='number' step='0.01' id="arr" value={updateFormData.arr} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required helperText="Affects Plan Prod Time"/>
                                </div>

                                {/* 新增的三个时间输入框 (分钟) */}
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>QC Time (Mins)</Label>
                                    <TextInput type='number' step='1' id="qctime" value={updateFormData.qctime} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>SO (Mins)</Label>
                                    <TextInput type='number' step='1' id="so" value={updateFormData.so} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Startup (Mins)</Label>
                                    <TextInput type='number' step='1' id="startup" value={updateFormData.startup} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                
                                {/* 变成自动计算的只读框 (小时) */}
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Plan Prod Time (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="planprodtime" value={updateFormData.planprodtime} readOnly className="bg-gray-100 dark:bg-gray-800" helperText="Auto: (Qty/ARR + QC + SO + Startup) / 60"/>
                                </div>

                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Operating Time (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="operatingtime" value={updateFormData.operatingtime} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>

                                <div className="mb-2 block col-span-2 sm:col-span-1">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod Delay (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="proddelay" value={updateFormData.proddelay} readOnly className="bg-gray-100 dark:bg-gray-800" helperText="Auto calculated: Op Time - Plan Time"/>
                                </div>

                                <div className="mb-2 block col-span-2">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Remarks</Label>
                                    <TextInput type='text' id="remark" value={updateFormData.remark} onChange={handleUpdateChange} placeholder="Enter remarks..." />
                                </div>
                            </div>

                            <div className='mt-6 block'>
                                <Button color="blue" className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </ModalBody>
            </Modal>

            {/* REPORT MODAL */}
            <Modal show={openModalReport} onClose={() => setOpenModalReport(false)} popup size="md">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium">Export Production Report</h3>
                        <p className="text-sm text-gray-500">Select the time range when outputs were recorded. Defaults to the last 24 hours.</p>
                        
                        {reportError && (
                            <Alert color="failure" icon={HiOutlineExclamationCircle}>
                                <span className="font-medium">{reportError}</span>
                            </Alert>
                        )}
                        
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Start Date & Time</Label>
                            <TextInput type='datetime-local' value={reportRange.start} onChange={(e) => setReportRange({...reportRange, start: e.target.value})} required/>
                        </div>
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>End Date & Time</Label>
                            <TextInput type='datetime-local' value={reportRange.end} onChange={(e) => setReportRange({...reportRange, end: e.target.value})} required/>
                        </div>

                        <div className='flex gap-2 mt-6'>
                            <Button color='gray' className='w-full cursor-pointer' onClick={() => setOpenModalReport(false)}>Cancel</Button>
                            <Button color='green' className='w-full cursor-pointer' onClick={executeDownloadReport} disabled={isExporting}>
                                {isExporting ? <Spinner size="sm" className="mr-2" /> : null}
                                Download Excel
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default CustomerOutputs