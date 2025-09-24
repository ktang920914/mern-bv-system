import { Button, Pagination, Popover, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import useUserstore from '../store'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const Oee = () => {
    const {currentUser} = useUserstore()
    const [jobs,setJobs] = useState([])
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

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

    // 生成Excel报告的函数
    const generateExcelReport = () => {
        // 准备Excel数据 - 包含所有字段
        const excelData = jobs.map(job => ({
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
            'Downtime': job.downtime,
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
            'Created At': new Date(job.createdAt).toLocaleString(),
            'Updated At': new Date(job.updatedAt).toLocaleString()
        }))

        // 创建工作簿和工作表
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        
        // 设置列宽
        const colWidths = [
            { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
            { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
            { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
            { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
            { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
            { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
            { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 8 }, { wch: 20 }, { wch: 20 }
        ]
        worksheet['!cols'] = colWidths

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, 'OEE Report')
        
        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // 使用当前日期作为文件名
        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `OEE_Report_${date}.xlsx`)
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
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredJobs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>OEEs</h1>
                <div>
                    <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
                </div>
                <Button 
                    outline 
                    color='blue' 
                    className='cursor-pointer'
                    onClick={generateExcelReport}
                >
                    Report
                </Button>
            </div>

            <Table hoverable>
                <TableHead>
                    <TableRow>
                        <TableHeadCell>Ext</TableHeadCell>
                        <TableHeadCell>Lot no</TableHeadCell>
                        <TableHeadCell>Availability</TableHeadCell>
                        <TableHeadCell>Performance</TableHeadCell>
                        <TableHeadCell>Quality</TableHeadCell>
                        <TableHeadCell>OEE</TableHeadCell>
                    </TableRow>
                </TableHead>
                {currentJobs.map((job) => (
                    <TableBody key={job._id}>
                        <TableRow>
                            <TableCell>{job.code}</TableCell>
                            <TableCell className="align-middle">
                                <Popover
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
                                <Popover
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
                                <Popover
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
                                <Popover
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
                                <Popover
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">{`Availability x Performance x Quality = OEE`}</p>
                                            <p className="text-xs mb-2">{`${job.availability} x ${job.performance} x ${job.quality} = ${job.oee}`}</p>
                                        </div>
                                    }
                                    trigger='hover'
                                    placement="top"
                                    arrow={false}
                                >
                                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                        {job.oee}
                                    </span>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ))}
            </Table>

            <div className="flex-col justify-center text-center mt-4">
                <p className='text-gray-500 font-semibold'>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                <Pagination
                    showIcons
                    currentPage={currentPage}
                    totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    )
}

export default Oee