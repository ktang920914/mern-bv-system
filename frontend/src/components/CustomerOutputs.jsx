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
    
    // Pagination, Search & Filter (新增 statusFilter)
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

        // URL 状态保存
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

    // --- 点击 Export Report 时，自动计算昨天 8AM 到 今天 8AM ---
    const handleOpenReportModal = () => {
        const now = new Date();
        // 设置今天早上 8:00
        const endTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        // 设置昨天早上 8:00
        const startTarget = new Date(endTarget);
        startTarget.setDate(startTarget.getDate() - 1);

        // 格式化为 datetime-local 接受的格式 (YYYY-MM-DDTHH:mm) 本地时间
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

    // 打开 Update 窗口并加载当前数据
    const handleUpdate = (schedule) => {
        setScheduleIdToUpdate(schedule._id)
        setOpenModalUpdate(true)
        setErrorMessage(null)
        setUpdateFormData({
            qty: schedule.qty || 0, // Planned Output, readonly
            actualoutput: schedule.actualoutput || '',
            wastage: schedule.wastage || '',
            planprodtime: schedule.planprodtime || '',
            operatingtime: schedule.operatingtime || '',
            proddelay: schedule.proddelay || '',
            irr: schedule.irr || '',
            arr: schedule.arr || '',
            status: schedule.status || 'In Progress' // 状态读取
        })
    }

    // 处理输入并自动计算 Wastage 和 Prod Delay，以及自动结案判断 (2.0 防呆版)
    const handleUpdateChange = (e) => {
        const { id, value } = e.target;
        let newFormData = { ...updateFormData, [id]: value };

        // Formula: Wastage = Actual Output - Planned Output (Qty)
        if (id === 'actualoutput') {
            const actual = parseFloat(value) || 0;
            const planned = parseFloat(newFormData.qty) || 0;
            // 抓取修改前的值
            const previousActual = parseFloat(updateFormData.actualoutput) || 0; 

            newFormData.wastage = (actual - planned).toFixed(2);

            // 智能化逻辑 2.0：
            if (actual >= planned) {
                // 1. 只要输入达到或超过计划，自动 Completed
                newFormData.status = 'Completed';
            } else if (previousActual >= planned && actual < planned) {
                // 2. 防错：只有从 "原本达标" 改成了 "不达标"（比如打错字删除了），才退回 In Progress
                newFormData.status = 'In Progress';
            }
        }

        // Formula: Prod Delay = Operating Time - Plan Prod Time
        if (id === 'operatingtime' || id === 'planprodtime') {
            const opTime = parseFloat(id === 'operatingtime' ? value : newFormData.operatingtime) || 0;
            const planTime = parseFloat(id === 'planprodtime' ? value : newFormData.planprodtime) || 0;
            newFormData.proddelay = (opTime - planTime).toFixed(2);
        }

        setUpdateFormData(newFormData);
    }

    // 提交数据
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

    // --- 生成与 PDF 完全一致的 Excel (基于 updatedAt) ---
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
            if (!job.updatedAt) return false; // 必须有更新时间记录
            
            // 只要 Completed 或者有填入实际产量(>0)的才算作有效的 Output 记录
            const hasOutput = job.status === 'Completed' || (Number(job.actualoutput) > 0);
            if (!hasOutput) return false;

            const jobUpdatedTime = new Date(job.updatedAt).getTime();
            
            // 筛选条件：基于真实输入产量的 updatedAt 时间点
            return jobUpdatedTime >= startTarget && jobUpdatedTime <= endTarget;
        });

        if (reportData.length === 0) {
            setReportError('No production outputs found in this time range!');
            return;
        }

        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Output Report');

            worksheet.pageSetup.orientation = 'landscape';
            worksheet.pageSetup.fitToPage = true;

            // Header Title
            worksheet.mergeCells('A1:N1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'PRODUCTION OUTPUT REPORT';
            titleCell.font = { name: 'Arial Black', size: 18, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // Date & Time Info (采用报表结束时间作为主时间显示 [cite: 2, 3, 4])
            const targetDateObj = new Date(reportRange.end);
            worksheet.getCell('M2').value = 'DATE:';
            worksheet.getCell('N2').value = `${targetDateObj.getDate()} ${targetDateObj.toLocaleString('default', { month: 'short' })} ${targetDateObj.getFullYear()}`;
            worksheet.getCell('M3').value = 'TIME:';
            worksheet.getCell('N3').value = targetDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Table Headers
            const headerRow = worksheet.getRow(5);
            const headers = [
                'No.', 'MC ID', 'LOT NO.', 'COLOR CODE', 'MATERIAL', 
                'PLANNED OUTPUT (KG)', 'ACTUAL OUTPUT (KG)', 'WASTAGE (KG)', 
                'PLANNED PROD TIME (HRS)', 'OPERATING TIME (HRS)', 'PROD DELAY (HRS)', 
                'Ideal Run Rate, IRR (KG/MIN)', 'Actual Run Rate, ARR (KG/MIN)', 'REMARKS (REJECT, REASON OF DELAY)'
            ];
            
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.font = { bold: true, size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
            headerRow.height = 40;

            let currentRowIdx = 6;
            let totals = { qty: 0, actual: 0, wastage: 0, planTime: 0, opTime: 0, delay: 0 };

            reportData.forEach((job, idx) => {
                const row = worksheet.getRow(currentRowIdx);
                
                row.getCell(1).value = idx + 1;
                row.getCell(2).value = job.code || '';
                row.getCell(3).value = job.lotno || '';
                row.getCell(4).value = job.colourcode || '';
                row.getCell(5).value = job.material || '';
                row.getCell(6).value = Number(job.qty) || 0;
                row.getCell(7).value = Number(job.actualoutput) || 0;
                
                const wastage = Number(job.wastage) || 0;
                row.getCell(8).value = wastage;
                row.getCell(8).numFmt = '#,##0.00;[Red](#,##0.00)';
                
                row.getCell(9).value = Number(job.planprodtime) || 0;
                row.getCell(10).value = Number(job.operatingtime) || 0;
                
                const delay = Number(job.proddelay) || 0;
                row.getCell(11).value = delay;
                row.getCell(11).numFmt = '#,##0.00;[Red](#,##0.00)';

                row.getCell(12).value = Number(job.irr) || 0;
                row.getCell(13).value = Number(job.arr) || 0;
                
                row.getCell(14).value = job.status === 'Completed' && (Number(job.actualoutput) < Number(job.qty)) ? 'Force Closed' : ''; 

                for(let c=1; c<=14; c++) {
                    row.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
                }

                totals.qty += Number(job.qty) || 0;
                totals.actual += Number(job.actualoutput) || 0;
                totals.wastage += wastage;
                totals.planTime += Number(job.planprodtime) || 0;
                totals.opTime += Number(job.operatingtime) || 0;
                totals.delay += delay;

                currentRowIdx++;
            });

            // TOTAL Row
            const totalRow = worksheet.getRow(currentRowIdx);
            worksheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
            totalRow.getCell(1).value = 'TOTAL';
            totalRow.getCell(1).font = { bold: true };
            totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

            totalRow.getCell(6).value = totals.qty;
            totalRow.getCell(7).value = totals.actual;
            totalRow.getCell(8).value = totals.wastage;
            totalRow.getCell(8).numFmt = '#,##0.00;[Red](#,##0.00)';
            totalRow.getCell(9).value = totals.planTime;
            totalRow.getCell(10).value = totals.opTime;
            totalRow.getCell(11).value = totals.delay;
            totalRow.getCell(11).numFmt = '#,##0.00;[Red](#,##0.00)';

            for(let c=1; c<=14; c++) {
                totalRow.getCell(c).font = { bold: true };
                totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; 
                totalRow.getCell(c).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            }

            // Column Widths
            worksheet.columns = [
                { width: 5 }, { width: 10 }, { width: 18 }, { width: 20 }, { width: 35 },
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 25 }
            ];

            // 加入 NOTE [cite: 9, 10]
            worksheet.getCell(`A${currentRowIdx + 2}`).value = 'NOTE';
            worksheet.getCell(`A${currentRowIdx + 2}`).font = { bold: true };
            worksheet.getCell(`B${currentRowIdx + 2}`).value = 'Production Time calculated is based on Actual Run Rate (ARR), NOT Ideal Run Rate (IRR)';
            worksheet.getCell(`B${currentRowIdx + 2}`).font = { italic: true, color: { argb: 'FFFF0000' } }; 

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // 使用结束时间做报表命名 [cite: 2, 3, 4]
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

    // List Rendering Logic (支持 Search 和 Status Filter)
    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch = (schedule.code && schedule.code.toLowerCase().includes(searchTerm)) ||
                              (schedule.lotno && schedule.lotno.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'All' ? true : schedule.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSchedules = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem)

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Production Outputs</h1>
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    
                    {/* --- 新增：状态筛选下拉菜单 --- */}
                    <Select 
                        value={statusFilter} 
                        onChange={(e) => {
                            setStatusFilter(e.target.value); 
                            setCurrentPage(1);
                        }} 
                        className='w-full sm:w-40'
                    >
                        <option value="All">All Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </Select>
                    
                    <TextInput 
                        placeholder='Search MC ID / Lot No...' 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value.toLowerCase()); 
                            setCurrentPage(1);
                        }} 
                        className='w-full sm:w-auto flex-1'
                    />
                    {/* 改成调用 handleOpenReportModal 来自动生成时间 */}
                    <Button color="green" onClick={handleOpenReportModal} className="w-full sm:w-auto">
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Desktop Table View */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-2 [&_th]:py-2 shadow-md">
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
                                <TableCell className="align-middle font-bold text-lg">{schedule.code}</TableCell>
                                
                                {/* 悬浮显示物料信息 */}
                                <TableCell className="align-middle">
                                    <Popover
                                        trigger="hover"
                                        placement="top"
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

            {/* Pagination Component */}
            <div className="flex-col justify-center text-center mt-4 mb-8">
                <Pagination
                    showIcons
                    currentPage={currentPage}
                    totalPages={Math.max(1, Math.ceil(filteredSchedules.length / itemsPage))}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* UPDATE MODAL (KEY IN OUTPUTS) */}
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
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Plan Prod Time (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="planprodtime" value={updateFormData.planprodtime} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Operating Time (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="operatingtime" value={updateFormData.operatingtime} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>

                                <div className="mb-2 block col-span-2 sm:col-span-1">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod Delay (Hrs)</Label>
                                    <TextInput type='number' step='0.01' id="proddelay" value={updateFormData.proddelay} readOnly className="bg-gray-100 dark:bg-gray-800" helperText="Auto calculated: Op Time - Plan Time"/>
                                </div>

                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Ideal Run Rate (IRR)</Label>
                                    <TextInput type='number' step='0.01' id="irr" value={updateFormData.irr} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
                                </div>
                                <div className="mb-2 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Actual Run Rate (ARR)</Label>
                                    <TextInput type='number' step='0.01' id="arr" value={updateFormData.arr} onChange={handleUpdateChange} onWheel={(e) => e.target.blur()} required/>
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

            {/* REPORT EXPORT MODAL */}
            <Modal show={openModalReport} onClose={() => setOpenModalReport(false)} popup size="md">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium">Export Production Report</h3>
                        <p className="text-sm text-gray-500">
                            Select the time range when outputs were recorded. Defaults to the last 24 hours.
                        </p>
                        
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