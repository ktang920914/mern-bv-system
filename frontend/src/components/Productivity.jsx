import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import useUserstore from '../store'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom';

const Productivity = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalUpdateProductivity,setOpenModalUpdateProductivity] = useState(false)
    const [productivities,setProductivities] = useState([])
    const [productivityIdToUpdate,setProductivityIdToUpdate] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sortBy, setSortBy] = useState('starttime') // 'starttime', 'endtime', 'orderdate', 'updatedAt'
    const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

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
        const fetchProductivities = async () => {
            try {
                const res = await fetch('/api/output/getproductivities')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setProductivities(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchProductivities()
    },[currentUser._id])

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        if(e.target.id === 'reason' || e.target.id === 'washresin' || e.target.id === 'operator' || e.target.id === 'cause' || e.target.id === 'color'|| e.target.id === 'density'){
        setFormData({...formData, [e.target.id]: e.target.value})
        }else{
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateProductivity = () => {
        setOpenModalUpdateProductivity(!openModalUpdateProductivity)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdate = (productivities) => {
        setProductivityIdToUpdate(productivities._id)
        setFormData({totaloutput:productivities.totaloutput, reject:productivities.reject, startup: productivities.startup, actualipqc:productivities.actualipqc,screwout:productivities.screwout,
            processcomplication:productivities.processcomplication, qctime: productivities.qctime, washup: productivities.washup, vent:productivities.vent,
            unevenpallet:productivities.unevenpallet, whiteoil:productivities.whiteoil, stranddrop:productivities.stranddrop, trialrun:productivities.trialrun,
            meterstart:productivities.meterstart,meterend:productivities.meterend, reason:productivities.reason, washresin:productivities.washresin,
            color:productivities.color,density:productivities.density,operator:productivities.operator,qcinspect:productivities.qcinspect,cause:productivities.cause
        })
        setOpenModalUpdateProductivity(!openModalUpdateProductivity)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/output/update/${productivityIdToUpdate}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(res.ok){
                setOpenModalUpdateProductivity(false)
                const fetchProductivities = async () => {
                    try {
                        const res = await fetch('/api/output/getproductivities')
                        const data = await res.json()
                        if(res.ok){
                            setProductivities(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchProductivities()
            }
        } catch (error) {
            console.log(error.message)
        }
    } 

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // 日期解析函数 - 更新以支持 updatedAt
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return new Date(0)
        
        // 如果是 ISO 格式（updatedAt），直接创建 Date 对象
        if (dateTimeStr.includes('T') && dateTimeStr.includes('Z')) {
            return new Date(dateTimeStr)
        }
        
        // 处理 "YYYY-MM-DD HH:mm:ss" 格式
        return new Date(dateTimeStr.replace(' ', 'T'))
    }

    // 排序和过滤 productivities
    const filteredAndSortedProductivities = productivities
        .filter(productivity => 
            productivity.lotno.toLowerCase().includes(searchTerm) ||
            productivity.operator?.toLowerCase().includes(searchTerm) ||
            productivity.reason?.toLowerCase().includes(searchTerm) ||
            productivity.cause?.toLowerCase().includes(searchTerm) ||
            productivity.totaloutput.toString().toLowerCase().includes(searchTerm) || 
            productivity.reject.toString().toLowerCase().includes(searchTerm) || 
            productivity.wastage.toString().toLowerCase().includes(searchTerm) ||
            productivity.downtime.toString().toLowerCase().includes(searchTerm) ||
            productivity.totalmeter.toString().toLowerCase().includes(searchTerm) ||
            productivity.starttime.toLowerCase().includes(searchTerm) ||
            productivity.endtime.toLowerCase().includes(searchTerm) ||
            productivity.orderdate.toLowerCase().includes(searchTerm) ||
            productivity.lotno.toLowerCase().includes(searchTerm) ||
            productivity.colourcode.toLowerCase().includes(searchTerm) ||
            productivity.material.toLowerCase().includes(searchTerm) ||
            productivity.totalorder.toString().toLowerCase().includes(searchTerm) ||
            productivity.code.toLowerCase().includes(searchTerm) && productivity.code.toString().toLowerCase() === searchTerm
        )
        .sort((a, b) => {
            // 针对 updatedAt 使用 ISO 字符串，其他使用自定义解析
            const dateA = sortBy === 'updatedAt' ? 
                new Date(a.updatedAt) : 
                parseDateTime(a[sortBy])
            const dateB = sortBy === 'updatedAt' ? 
                new Date(b.updatedAt) : 
                parseDateTime(b[sortBy])
            
            if (sortOrder === 'asc') {
                return dateA - dateB
            } else {
                return dateB - dateA
            }
        })

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentProductivities = filteredAndSortedProductivities.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredAndSortedProductivities.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // 格式化 updated date 用于显示
    const formatUpdatedDate = (updatedAt) => {
        if (!updatedAt) return '-'
        const date = new Date(updatedAt)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

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

    // 移动端卡片组件 - 添加 updated date 信息
    const ProductivityCard = ({ productivity }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Extruder</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{productivity.code}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Lot No</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Extruder:</p>
                                <p className="text-xs mb-2">{productivity.code}</p>
                                <p className="font-semibold text-sm">Prod start:</p>
                                <p className="text-xs mb-2">{productivity.starttime}</p>
                                <p className="font-semibold text-sm">Prod end:</p>
                                <p className="text-xs mb-2">{productivity.endtime}</p>
                                <p className="font-semibold text-sm">Order date:</p>
                                <p className="text-xs mb-2">{productivity.orderdate}</p>
                                <p className="font-semibold text-sm">Colour code:</p>
                                <p className="text-xs mb-2">{productivity.colourcode}</p>
                                <p className="font-semibold text-sm">Material:</p>
                                <p className="text-xs mb-2">{productivity.material}</p>
                                <p className="font-semibold text-sm">Total order:</p>
                                <p className="text-xs mb-2">{productivity.totalorder}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {productivity.lotno}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Output</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Total order:</p>
                                <p className="text-xs mb-2">{productivity.totalorder}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {productivity.totaloutput}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Downtime</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm mb-2">Startup + Screw out + Process complication + QC time  = Downtime</p>
                                <p className="text-xs mb-2">{`${productivity.startup} + ${productivity.screwout} + ${productivity.processcomplication} + ${productivity.qctime} = ${productivity.downtime}`}</p>
                                <p className="font-semibold text-sm">Reason:</p>
                                <p className="text-xs mb-2">{productivity.reason}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {productivity.downtime}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Wastage</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm mb-2">Total output - Total order = Wastage</p>
                                <p className="text-xs mb-2">{`${productivity.totaloutput} - ${productivity.totalorder} = ${productivity.wastage}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {productivity.wastage}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Meter</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm mb-2">Meter end - Meter start = Total meter</p>
                                <p className="text-xs mb-2">{`${productivity.meterend} - ${productivity.meterstart} = ${productivity.totalmeter}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {productivity.totalmeter}
                        </span>
                    </Popover>
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(productivity)}
                >
                    Update
                </Button>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Productivities</h1>
                <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
                    {/* 排序控件 - 增加 updatedAt 选项 */}
                    <div className='flex gap-2'>
                        <Select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className='w-full sm:w-40'
                        >
                            <option value="starttime">Prod Start</option>
                            <option value="endtime">Prod End</option>
                            <option value="orderdate">Order Date</option>
                            <option value="updatedAt">Updated Date</option>
                        </Select>
                        
                        <Select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className='w-full sm:w-40'
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </Select>
                    </div>
                    
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full sm:w-auto'
                    />
                </div>
            </div>

            {/* 桌面端表格视图 - 增加 Updated 列 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Output</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Downtime</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Wastage</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Meter</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Update</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentProductivities.map((productivity) => (
                            <TableRow key={productivity._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle">{productivity.code}</TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Extruder:</p>
                                                <p className="text-xs mb-2">{productivity.code}</p>
                                                <p className="font-semibold text-sm">Prod start:</p>
                                                <p className="text-xs mb-2">{productivity.starttime}</p>
                                                <p className="font-semibold text-sm">Prod end:</p>
                                                <p className="text-xs mb-2">{productivity.endtime}</p>
                                                <p className="font-semibold text-sm">Order date:</p>
                                                <p className="text-xs mb-2">{productivity.orderdate}</p>
                                                <p className="font-semibold text-sm">Colour code:</p>
                                                <p className="text-xs mb-2">{productivity.colourcode}</p>
                                                <p className="font-semibold text-sm">Material:</p>
                                                <p className="text-xs mb-2">{productivity.material}</p>
                                                <p className="font-semibold text-sm">Total order:</p>
                                                <p className="text-xs mb-2">{productivity.totalorder}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {productivity.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Total order:</p>
                                                <p className="text-xs mb-2">{productivity.totalorder}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {productivity.totaloutput}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm mb-2">Startup + Screw out + Process complication + QC time  = Downtime</p>
                                                <p className="text-xs mb-2">{`${productivity.startup} + ${productivity.screwout} + ${productivity.processcomplication} + ${productivity.qctime} = ${productivity.downtime}`}</p>
                                                <p className="font-semibold text-sm">Reason:</p>
                                                <p className="text-xs mb-2">{productivity.reason}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {productivity.downtime}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm mb-2">Total output - Total order = Wastage</p>
                                                <p className="text-xs mb-2">{`${productivity.totaloutput} - ${productivity.totalorder} = ${productivity.wastage}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {productivity.wastage}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm mb-2">Meter end - Meter start = Total meter</p>
                                                <p className="text-xs mb-2">{`${productivity.meterend} - ${productivity.meterstart} = ${productivity.totalmeter}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {productivity.totalmeter}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell>
                                <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(productivity)}}>Update</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentProductivities.map((productivity) => (
                        <ProductivityCard key={productivity._id} productivity={productivity} />
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

            <Modal show={openModalUpdateProductivity} onClose={handleUpdateProductivity} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`}>
                    <div className="space-y-6">
                        <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Productivity</h3>
                        <form onSubmit={handleSubmit}>
 
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Total output</Label>
                                <TextInput value={formData.totaloutput}  type='number' min='0' step='0.01' id="totaloutput" placeholder='Enter total output'  onChange={handleChange} onFocus={handleFocus} />
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Reject</Label>
                                <TextInput value={formData.reject}  type='number' min='0' step='0.01' id="reject" placeholder='Enter reject'  onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cause</Label>
                                <Textarea value={formData.cause}  id="cause" placeholder='Enter reject cause' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Start up</Label>
                                <TextInput value={formData.startup}  type='number' min='0' id="startup" placeholder='Enter start up' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>IPQC</Label>
                                <TextInput value={formData.actualipqc}  type='number' min='0' id="actualipqc" placeholder='Enter IPQC' onChange={handleChange} onFocus={handleFocus}/>
                            </div>
        
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Screw out</Label>
                                <TextInput value={formData.screwout} type='number' min='0' id="screwout" placeholder='Enter screw out' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Process complication</Label>
                                <TextInput value={formData.processcomplication} type='number' id="processcomplication" min='0' placeholder='Enter process complication' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>QC time</Label>
                                <TextInput value={formData.qctime} type='number' id="qctime" min='0' placeholder='Enter QC time' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Reason</Label>
                                <Textarea value={formData.reason} id="reason" placeholder='Enter downtime reason' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Wash resin</Label>
                                <Textarea value={formData.washresin} id="washresin" placeholder='Enter wash resin' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Wash up</Label>
                                <TextInput value={formData.washup} type='number' id="washup" min='0' step='0.01' placeholder='Enter wash up' onChange={handleChange} onFocus={handleFocus} />
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Strand drop</Label>
                                <TextInput value={formData.stranddrop} type='number' id="stranddrop" min='0' step='0.01' placeholder='Enter strand drop' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>White oil evaporate</Label>
                                <TextInput value={formData.whiteoil} type='number' id="whiteoil" min='0' step='0.01' placeholder='Enter white oil evaporate' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Vent/Port degassing</Label>
                                <TextInput value={formData.vent} type='number' id="vent" min='0' step='0.01' placeholder='Enter vent/port degassing' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Uneven pallet</Label>
                                <TextInput value={formData.unevenpallet} type='number' id="unevenpallet" min='0' step='0.01' placeholder='Enter uneven pallet' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Trial run</Label>
                                <TextInput value={formData.trialrun} type='number' id="trialrun" min='0' step='0.01' placeholder='Enter trial run' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>QC inspection</Label>
                                <TextInput value={formData.qcinspect} type='number' id="qcinspect" min='0' step='0.01' placeholder='Enter QC inspection' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Meter start</Label>
                                <TextInput value={formData.meterstart} type='number' id="meterstart" min='0' placeholder='Enter meter start' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Meter end</Label>
                                <TextInput value={formData.meterend} type='number' id="meterend" min='0' placeholder='Enter meter end' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Color</Label>
                                <TextInput value={formData.color || ''} id="color" placeholder='Enter color' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>MFI density</Label>
                                <TextInput value={formData.density || ''} id="density" placeholder='Enter MFI density' onChange={handleChange} onFocus={handleFocus}/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Operator</Label>
                                <Textarea value={formData.operator || ''} id="operator" placeholder='Enter operator' onChange={handleChange} onFocus={handleFocus}/>
                            </div>
                                
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {
                                        loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'
                                    }
                                    </Button>
                                </div>
                            </form>
                            {
                                errorMessage && (
                                    <Alert color='failure' className='mt-4 font-semibold'>
                                        {errorMessage}
                                    </Alert>
                                )
                            }
                    </div>
                </ModalBody>
            </Modal>
    </div>
    )
}

export default Productivity