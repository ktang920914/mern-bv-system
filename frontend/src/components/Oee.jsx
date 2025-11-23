import { Button, Pagination, Popover, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import useUserstore from '../store'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom';

const Oee = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [jobs,setJobs] = useState([])
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 当页码或搜索词变化时更新 URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        
        // 处理页码参数
        if (currentPage === 1) {
            params.delete('page')
        } else {
            params.set('page', currentPage.toString())
        }
        
        // 处理搜索参数
        if (searchTerm === '') {
            params.delete('search')
        } else {
            params.set('search', searchTerm)
        }
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/analysis/getjobs')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setJobs(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchJobs()
    },[currentUser._id])

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // 生成Excel报告的函数 - 修复版（导出所有数据）
    const generateExcelReport = () => {
        try {
            // 使用所有过滤后的数据，而不是当前页面的数据
            const exportData = filteredJobs;

            // 准备Excel数据 - 包含所有字段
            const excelData = exportData.map(job => ({
                'Extruder': job.code,
                'Lot No': job.lotno,
                'Start Time': job.starttime,
                'End Time': job.endtime,
                'Order Date': job.orderdate,
                'Colour Code': job.colourcode,
                'Material': job.material,
                'Total Order': job.totalorder,
                'Total Output': job.totaloutput,
                'Reject': job.reject,
                'Startup': job.startup,
                'Screw Out': job.screwout,
                'Process Complication': job.processcomplication,
                'QC Time': job.qctime,
                'Reason': job.reason,
                'Downtime': job.downtime,
                'Wash Resin': job.washresin,
                'Wash Up': job.washup,
                'Strand Drop': job.stranddrop,
                'White Oil': job.whiteoil,
                'Vent': job.vent,
                'Uneven Pallet': job.unevenpallet,
                'Trial Run': job.trialrun,
                'Wastage': job.wastage,
                'Meter Start': job.meterstart,
                'Meter End': job.meterend,
                'Total Meter': job.totalmeter,
                'Operator': job.operator,
                'IRR': job.irr,
                'ARR': job.arr,
                'IPQC': job.ipqc,
                'Setup': job.setup,
                'Prod Lead Time': job.prodleadtime,
                'Plan Prod Time': job.planprodtime,
                'Operating Time': job.operatingtime,
                'Availability': job.availability,
                'Performance': job.performance,
                'Quality': job.quality,
                'OEE': job.oee,
                'OEE %': Math.round(job.oee * 100) + '%',
                'Created At': new Date(job.createdAt).toLocaleString(),
                'Updated At': new Date(job.updatedAt).toLocaleString()
            }))

            // 如果没有数据，显示提示
            if (excelData.length === 0) {
                alert('No data available to export.')
                return;
            }

            // 创建工作簿和工作表
            const workbook = XLSX.utils.book_new()
            
            // 先创建带标题的数据
            const dataWithHeaders = [
                ['OEE Report - Overall Equipment Effectiveness'], // 标题行
                [`Generated on: ${new Date().toLocaleString()}`], // 日期行
                [`Total Records: ${excelData.length}`], // 记录数量行
                [''], // 空行
                Object.keys(excelData[0]), // 表头
                ...excelData.map(row => Object.values(row)) // 数据行
            ]

            const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders)

            // 获取数据范围
            const range = XLSX.utils.decode_range(worksheet['!ref'])
            
            // 设置列宽
            const colWidths = [
                { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
                { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
                { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
                { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, 
                { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, 
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, 
                { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
                { wch: 20 }, { wch: 20 }
            ]
            worksheet['!cols'] = colWidths

            // 设置合并单元格
            if (!worksheet['!merges']) worksheet['!merges'] = []
            
            // 合并标题单元格
            worksheet['!merges'].push({
                s: { r: 0, c: 0 },
                e: { r: 0, c: Object.keys(excelData[0]).length - 1 }
            })
            
            // 合并日期单元格
            worksheet['!merges'].push({
                s: { r: 1, c: 0 },
                e: { r: 1, c: Object.keys(excelData[0]).length - 1 }
            })

            // 合并记录数量单元格
            worksheet['!merges'].push({
                s: { r: 2, c: 0 },
                e: { r: 2, c: Object.keys(excelData[0]).length - 1 }
            })

            // 添加自动筛选器（从第5行开始，即表头行）
            worksheet['!autofilter'] = { 
                ref: XLSX.utils.encode_range({
                    s: { r: 4, c: 0 },
                    e: { r: range.e.r, c: range.e.c }
                })
            }

            // 冻结窗格 - 冻结表头行（第5行）
            worksheet['!freeze'] = { x: 0, y: 5 }

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, 'OEE Report')
            
            // 生成Excel文件并下载
            const excelBuffer = XLSX.write(workbook, { 
                bookType: 'xlsx', 
                type: 'array'
            })
            const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            })
            
            // 使用当前日期作为文件名
            const date = new Date().toISOString().split('T')[0]
            saveAs(blob, `OEE_Report_${date}.xlsx`)
            
            console.log('Excel report generated successfully with', excelData.length, 'records')
        } catch (error) {
            console.error('Error generating Excel report:', error)
            alert('Error generating report. Please check console for details.')
        }
    }

    // 获取OEE百分比显示（去掉小数点）
    const getOeePercentage = (oeeValue) => {
        return Math.round(oeeValue * 100);
    }

    // 根据OEE值获取颜色类名
    const getOeeColorClass = (oeeValue) => {
        const percentage = getOeePercentage(oeeValue);
        return percentage >= 85 ? 'text-green-500 font-semibold' : 'text-red-600 font-semibold';
    }

    const filteredJobs = jobs.filter(job => 
        job.lotno.toLowerCase().includes(searchTerm) ||
        job.totaloutput.toString().toLowerCase().includes(searchTerm) || 
        job.wastage.toString().toLowerCase().includes(searchTerm) ||
        job.downtime.toString().toLowerCase().includes(searchTerm) ||
        job.totalmeter.toString().toLowerCase().includes(searchTerm) ||
        job.starttime.toLowerCase().includes(searchTerm) ||
        job.endtime.toLowerCase().includes(searchTerm) ||
        job.orderdate.toLowerCase().includes(searchTerm) ||
        job.lotno.toLowerCase().includes(searchTerm) ||
        job.colourcode.toLowerCase().includes(searchTerm) ||
        job.material.toLowerCase().includes(searchTerm) ||
        job.totalorder.toString().toLowerCase().includes(searchTerm) ||
        job.irr.toString().toLowerCase().includes(searchTerm) ||
        job.arr.toString().toLowerCase().includes(searchTerm) ||
        job.prodleadtime.toString().toLowerCase().includes(searchTerm) ||
        job.planprodtime.toString().toLowerCase().includes(searchTerm) ||
        job.operatingtime.toString().toLowerCase().includes(searchTerm) ||
        job.availability.toString().toLowerCase().includes(searchTerm) ||
        job.performance.toString().toLowerCase().includes(searchTerm) ||
        job.quality.toString().toLowerCase().includes(searchTerm) ||
        job.code.toLowerCase().includes(searchTerm)
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredJobs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // 移动端简洁分页组件 - 只显示 Previous/Next
    const MobileSimplePagination = () => (
        <div className="flex items-center justify-center space-x-4">
            <Button
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center"
            >
                <span>‹</span>
                <span className="ml-1">Previous</span>
            </Button>

            <Button
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center"
            >
                <span className="mr-1">Next</span>
                <span>›</span>
            </Button>
        </div>
    )

    // 移动端卡片组件
    const OeeCard = ({ job }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Extruder</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.code}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Lot No</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Extruder:</p>
                                <p className="text-xs mb-2">{job.code}</p>
                                <p className="font-semibold text-sm">Prod start:</p>
                                <p className="text-xs mb-2">{job.starttime}</p>
                                <p className="font-semibold text-sm">Prod end:</p>
                                <p className="text-xs mb-2">{job.endtime}</p>
                                <p className="font-semibold text-sm">Order date:</p>
                                <p className="text-xs mb-2">{job.orderdate}</p>
                                <p className="font-semibold text-sm">Colour code:</p>
                                <p className="text-xs mb-2">{job.colourcode}</p>
                                <p className="font-semibold text-sm">Material:</p>
                                <p className="text-xs mb-2">{job.material}</p>
                                <p className="font-semibold text-sm">Total order:</p>
                                <p className="text-xs mb-2">{job.totalorder}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.lotno}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Availability</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Operatingtime / Plan Prodtime) = Availability`}</p>
                                <p className="text-xs mb-2">{`(${job.operatingtime} / ${job.planprodtime}) = ${job.availability}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.availability}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Performance</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) / IRR = Performance`}</p>
                                <p className="text-xs mb-2">{`(${job.totaloutput} / ${job.operatingtime}) / ${job.irr} = ${job.performance}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.performance}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Quality</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Totaloutput - Reject) / Total output = Quality`}</p>
                                <p className="text-xs mb-2">{`(${job.totaloutput} - ${job.reject}) / ${job.totaloutput} = ${job.quality}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.quality}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">OEE</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`Availability x Performance x Quality = OEE`}</p>
                                <p className="text-xs mb-2">{`${job.availability} x ${job.performance} x ${job.quality} = ${job.oee}`}</p>
                                <p className="font-semibold text-sm mt-2">OEE Percentage:</p>
                                <p className="text-xs">{`${getOeePercentage(job.oee)}%`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            getOeeColorClass(job.oee)
                        }`}>
                            {getOeePercentage(job.oee)}%
                        </span>
                    </Popover>
                </div>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>OEEs</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <Button 
                    color='green' 
                    className='cursor-pointer w-full sm:w-auto'
                    onClick={generateExcelReport}
                >
                    Report
                </Button>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-3 [&_th]:py-3">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Availability</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Performance</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quality</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>OEE</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentJobs.map((job) => (
                            <TableRow key={job._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell>{job.code}</TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Extruder:</p>
                                                <p className="text-xs mb-2">{job.code}</p>
                                                <p className="font-semibold text-sm">Prod start:</p>
                                                <p className="text-xs mb-2">{job.starttime}</p>
                                                <p className="font-semibold text-sm">Prod end:</p>
                                                <p className="text-xs mb-2">{job.endtime}</p>
                                                <p className="font-semibold text-sm">Order date:</p>
                                                <p className="text-xs mb-2">{job.orderdate}</p>
                                                <p className="font-semibold text-sm">Colour code:</p>
                                                <p className="text-xs mb-2">{job.colourcode}</p>
                                                <p className="font-semibold text-sm">Material:</p>
                                                <p className="text-xs mb-2">{job.material}</p>
                                                <p className="font-semibold text-sm">Total order:</p>
                                                <p className="text-xs mb-2">{job.totalorder}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Operatingtime / Plan Prodtime) = Availability`}</p>
                                                <p className="text-xs mb-2">{`(${job.operatingtime} / ${job.planprodtime}) = ${job.availability}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.availability}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) / IRR = Performance`}</p>
                                                <p className="text-xs mb-2">{`(${job.totaloutput} / ${job.operatingtime}) / ${job.irr} = ${job.performance}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.performance}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Totaloutput - Reject) / Total output = Quality`}</p>
                                                <p className="text-xs mb-2">{`(${job.totaloutput} - ${job.reject}) / ${job.totaloutput} = ${job.quality}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.quality}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`Availability x Performance x Quality = OEE`}</p>
                                                <p className="text-xs mb-2">{`${job.availability} x ${job.performance} x ${job.quality} = ${job.oee}`}</p>
                                                <p className="font-semibold text-sm mt-2">OEE Percentage:</p>
                                                <p className="text-xs">{`${getOeePercentage(job.oee)}%`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full ${getOeeColorClass(job.oee)}`}>
                                            {getOeePercentage(job.oee)}%
                                        </span>
                                    </Popover>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentJobs.map((job) => (
                        <OeeCard key={job._id} job={job} />
                    ))}
                </div>
            )}

            <div className="flex-col justify-center text-center mt-4">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                
                {/* 分页：手机模式用简洁版，桌面模式用完整版 */}
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
        </div>
    )
}

export default Oee