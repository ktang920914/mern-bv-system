import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import useUserstore from '../store'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom';

const Planning = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalUpdatePlanning,setOpenModalUpdatePlanning] = useState(false)
    const [plannings,setPlannings] = useState([])
    const [planningIdToUpdate,setPlanningIdToUpdate] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sortBy, setSortBy] = useState('starttime') // 'starttime', 'endtime', 'orderdate', 'updatedAt'
    const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

    // Listen for window size changes
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Update URL when page number or search term changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        
        // Handle page number parameter
        if (currentPage === 1) {
            params.delete('page')
        } else {
            params.set('page', currentPage.toString())
        }
        
        // Handle search parameter
        if (searchTerm === '') {
            params.delete('search')
        } else {
            params.set('search', searchTerm)
        }
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    useEffect(() => {
        const fetchPlannings = async () => {
            try {
                const res = await fetch('/api/view/getplannings')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setPlannings(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchPlannings()
    },[currentUser._id])

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleUpdatePlanning = () => {
        setOpenModalUpdatePlanning(!openModalUpdatePlanning)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdate = (planning) => {
        setPlanningIdToUpdate(planning._id)
        // Only IRR is manually entered, IPQC and Setup are automatically calculated
        setFormData({
            irr: planning.irr,
            setup: planning.setup
        })
        setOpenModalUpdatePlanning(!openModalUpdatePlanning)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/view/update/${planningIdToUpdate}`,{
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
                setOpenModalUpdatePlanning(false)
                const fetchPlannings = async () => {
                    try {
                        const res = await fetch('/api/view/getplannings')
                        const data = await res.json()
                        if(res.ok){
                            setPlannings(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchPlannings()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // Date parsing function - updated to support updatedAt
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return new Date(0)
        
        // If it's ISO format (updatedAt), create Date object directly
        if (dateTimeStr.includes('T') && dateTimeStr.includes('Z')) {
            return new Date(dateTimeStr)
        }
        
        // Handle "YYYY-MM-DD HH:mm:ss" format
        return new Date(dateTimeStr.replace(' ', 'T'))
    }

    // Sort and filter plannings
    const filteredAndSortedPlannings = plannings
        .filter(planning => 
            planning.lotno.toLowerCase().includes(searchTerm) ||
            planning.totaloutput.toString().toLowerCase().includes(searchTerm) || 
            planning.wastage.toString().toLowerCase().includes(searchTerm) ||
            planning.downtime.toString().toLowerCase().includes(searchTerm) ||
            planning.totalmeter.toString().toLowerCase().includes(searchTerm) ||
            planning.starttime.toLowerCase().includes(searchTerm) ||
            planning.endtime.toLowerCase().includes(searchTerm) ||
            planning.orderdate.toLowerCase().includes(searchTerm) ||
            planning.lotno.toLowerCase().includes(searchTerm) ||
            planning.colourcode.toLowerCase().includes(searchTerm) ||
            planning.material.toLowerCase().includes(searchTerm) ||
            planning.totalorder.toString().toLowerCase().includes(searchTerm) ||
            planning.irr.toString().toLowerCase().includes(searchTerm) ||
            planning.arr.toString().toLowerCase().includes(searchTerm) ||
            planning.prodleadtime.toString().toLowerCase().includes(searchTerm) ||
            planning.planprodtime.toString().toLowerCase().includes(searchTerm) ||
            planning.operatingtime.toString().toLowerCase().includes(searchTerm) ||
            planning.setup.toString().toLowerCase().includes(searchTerm) || // Add setup to search
            planning.code.toLowerCase().includes(searchTerm) && planning.code.toString().toLowerCase() === searchTerm
        )
        .sort((a, b) => {
            // Use ISO string for updatedAt, custom parsing for others
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
    const currentPlannings = filteredAndSortedPlannings.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredAndSortedPlannings.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // Format updated date for display
    const formatUpdatedDate = (updatedAt) => {
        if (!updatedAt) return '-'
        const date = new Date(updatedAt)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Mobile simple pagination component - only shows Previous/Next
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

    // Mobile card component - add IPQC and Setup information
    const PlanningCard = ({ planning }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Extruder</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{planning.code}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Lot No</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Extruder:</p>
                                <p className="text-xs mb-2">{planning.code}</p>
                                <p className="font-semibold text-sm">Prod start:</p>
                                <p className="text-xs mb-2">{planning.starttime}</p>
                                <p className="font-semibold text-sm">Prod end:</p>
                                <p className="text-xs mb-2">{planning.endtime}</p>
                                <p className="font-semibold text-sm">Order date:</p>
                                <p className="text-xs mb-2">{planning.orderdate}</p>
                                <p className="font-semibold text-sm">Colour code:</p>
                                <p className="text-xs mb-2">{planning.colourcode}</p>
                                <p className="font-semibold text-sm">Material:</p>
                                <p className="text-xs mb-2">{planning.material}</p>
                                <p className="font-semibold text-sm">Total order:</p>
                                <p className="text-xs mb-2">{planning.totalorder}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.lotno}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">IRR</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Extruder:</p>
                                <p className="text-xs mb-2">{planning.code}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.irr}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">IPQC</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">IPQC Calculation:</p>
                                <p className="text-xs mb-1">Based on colourcode: {planning.colourcode}</p>
                                <p className="text-xs mb-1">Based on material: {planning.material}</p>
                                <p className="text-xs mb-1">• Material check: {planning.ipqc === 0 && /natural|transparent|smoke|pearl|gold|strong|stubborn|metallic/i.test(planning.material) ? 'Contains natural/transparent/smoke/pearl/gold/strong/stubborn/metallic' : 'No special keyword'}</p>
                                <p className="text-xs mb-1">• Previous job check: {planning.ipqc === 0 && 'Same colour code' || 'Different colour code'}</p>
                                <p className="text-xs mb-1">• 5th digit check: {planning.ipqc === 0 && '0' || planning.ipqc === 60 && '2' || planning.ipqc === 200 && '3' || 'N/A'}</p>
                                <p className="text-xs">IPQC = {planning.ipqc} (Auto)</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.ipqc} (Auto)
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Setup</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Setup Calculation:</p>
                                <p className="text-xs mb-1">Based on previous job comparison</p>
                                <p className="text-xs mb-1">• If same colour code: 0</p>
                                <p className="text-xs mb-1">• If material has natural/transparent/smoke/pearl/gold/strong/stubborn/metallic: 180</p>
                                <p className="text-xs mb-1">• If grey/black to grey/black: 25</p>
                                <p className="text-xs mb-1">• If light to dark, dark to dark, or different material (non grey/black): 60</p>
                                <p className="text-xs">• Other cases (dark to light or other colors): 120</p>
                                <p className="text-xs mt-2 font-semibold">Setup = {planning.setup} (Auto)</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.setup} (Auto)
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">ARR</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) = ARR`}</p>
                                <p className="text-xs mb-2">{`(${planning.totaloutput} / ${planning.operatingtime}) = ${planning.arr}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.arr}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Prod Leadtime</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`Prod end - Order date = Prod leadtime`}</p>
                                <p className="text-xs mb-2">{`${planning.endtime} - ${planning.orderdate} = ${planning.prodleadtime}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.prodleadtime}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Plan Prodtime</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Total order / IRR) + IPQC + Setup = Plan Prodtime`}</p>
                                <p className="text-xs mb-2">{`(${planning.totalorder} / ${planning.irr}) + ${planning.ipqc} + ${planning.setup} = ${planning.planprodtime}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.planprodtime}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Operating Time</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Prod end - Prod Start) - Downtime = Operatingtime`}</p>
                                <p className="text-xs mb-2">{`(${planning.endtime} - ${planning.starttime}) - ${planning.downtime} = ${planning.operatingtime}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {planning.operatingtime}
                        </span>
                    </Popover>
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(planning)}
                >
                    Update
                </Button>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Plannings</h1>
                <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
                    {/* Sort controls - add updatedAt option */}
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

            {/* Desktop table view - add IPQC and Setup columns */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>IRR</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>IPQC</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Setup</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Arr</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Prod leadtime</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Plan prodtime</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Operating time</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Update</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPlannings.map((planning) => (
                            <TableRow key={planning._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle">{planning.code}</TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">Extruder:</p>
                                            <p className="text-xs mb-2">{planning.code}</p>
                                            <p className="font-semibold text-sm">Prod start:</p>
                                            <p className="text-xs mb-2">{planning.starttime}</p>
                                            <p className="font-semibold text-sm">Prod end:</p>
                                            <p className="text-xs mb-2">{planning.endtime}</p>
                                            <p className="font-semibold text-sm">Order date:</p>
                                            <p className="text-xs mb-2">{planning.orderdate}</p>
                                            <p className="font-semibold text-sm">Colour code:</p>
                                            <p className="text-xs mb-2">{planning.colourcode}</p>
                                            <p className="font-semibold text-sm">Material:</p>
                                            <p className="text-xs mb-2">{planning.material}</p>
                                            <p className="font-semibold text-sm">Total order:</p>
                                            <p className="text-xs mb-2">{planning.totalorder}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">Extruder:</p>
                                            <p className="text-xs mb-2">{planning.code}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.irr}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">IPQC Calculation:</p>
                                            <p className="text-xs mb-1">Based on colourcode: {planning.colourcode}</p>
                                            <p className="text-xs mb-1">Based on material: {planning.material}</p>
                                            <p className="text-xs mb-1">• Material check: {planning.ipqc === 0 && /natural|transparent|smoke|pearl|gold|strong|stubborn|metallic/i.test(planning.material) ? 'Contains natural/transparent/smoke/pearl/gold/strong/stubborn/metallic' : 'No special keyword'}</p>
                                            <p className="text-xs mb-1">• Previous job check: {planning.ipqc === 0 && 'Same colour code' || 'Different colour code'}</p>
                                            <p className="text-xs mb-1">• 5th digit check: {planning.ipqc === 0 && '0' || planning.ipqc === 60 && '2' || planning.ipqc === 200 && '3' || 'N/A'}</p>
                                            <p className="text-xs">IPQC = {planning.ipqc} (Auto)</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.ipqc} (Auto)
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">Setup Calculation:</p>
                                            <p className="text-xs mb-1">Based on previous job comparison</p>
                                            <p className="text-xs mb-1">• If same colour code: 0</p>
                                            <p className="text-xs mb-1">• If material has natural/transparent/smoke/pearl/gold/strong/stubborn/metallic: 180</p>
                                            <p className="text-xs mb-1">• If grey/black to grey/black: 25</p>
                                            <p className="text-xs mb-1">• If light to dark, dark to dark, or different material (non grey/black): 60</p>
                                            <p className="text-xs">• Other cases (dark to light or other colors): 120</p>
                                            <p className="text-xs mt-2 font-semibold">Setup = {planning.setup} (Auto)</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.setup} (Auto)
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) = ARR`}</p>
                                            <p className="text-xs mb-2">{`(${planning.totaloutput} / ${planning.operatingtime}) = ${planning.arr}`}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.arr}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">{`Prod end - Order date = Prod leadtime`}</p>
                                            <p className="text-xs mb-2">{`${planning.endtime} - ${planning.orderdate} = ${planning.prodleadtime}`}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.prodleadtime}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">{`(Total order / IRR) + IPQC + Setup = Plan Prodtime`}</p>
                                            <p className="text-xs mb-2">{`(${planning.totalorder} / ${planning.irr}) + ${planning.ipqc} + ${planning.setup} = ${planning.planprodtime}`}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.planprodtime}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">{`(Prod end - Prod Start) - Downtime = Operatingtime`}</p>
                                            <p className="text-xs mb-2">{`(${planning.endtime} - ${planning.starttime}) - ${planning.downtime} = ${planning.operatingtime}`}</p>
                                        </div>
                                    }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {planning.operatingtime}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(planning)}}>Update</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>    
                </Table>
            )}

            {/* Mobile card view */}
            {isMobile && (
                <div className="space-y-4">
                    {currentPlannings.map((planning) => (
                        <PlanningCard key={planning._id} planning={planning} />
                    ))}
                </div>
            )}

            <div className="flex-col justify-center text-center mt-4">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                
                {/* Pagination: simple version for mobile, full version for desktop */}
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

            <Modal show={openModalUpdatePlanning} size='sm'onClose={handleUpdatePlanning} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Planning</h3>
                        <form onSubmit={handleSubmit}>
        
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>IRR</Label>
                                <TextInput value={formData.irr} type='number' min='0.1' max='6.0' step='any'id="irr" placeholder='Enter IRR'  onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>IPQC (Auto-calculated)</Label>
                                <div className={`p-2 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
                                    <span className="text-sm">
                                        IPQC is auto-calculated based on:
                                        <br/>
                                        • If material contains natural/transparent/smoke/pearl/gold/strong/stubborn/metallic: 0
                                        <br/>
                                        • If same colour code as previous job: 0
                                        <br/>
                                        • If starts with letters: 0
                                        <br/>
                                        • If 5th digit = 0: 0
                                        <br/>
                                        • If 5th digit = 2: 60
                                        <br/>
                                        • If 5th digit = 3: 200
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Setup (Auto-calculated)</Label>
                                <div className={`p-2 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}>
                                    <span className="text-sm">
                                        Setup is auto-calculated based on:
                                        <br/>
                                        • If same colour code as previous job: 0
                                        <br/>
                                        • If material contains natural/transparent/smoke/pearl/gold/strong/stubborn/metallic: 180
                                        <br/>
                                        • If grey/black to grey/black: 25
                                        <br/>
                                        • If light to dark, dark to dark, or different material (non grey/black): 60
                                        <br/>
                                        • Other cases (dark to light or other colors): 120
                                    </span>
                                </div>
                                <div className={`mt-2 p-2 rounded ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-900'}`}>
                                    <span className="text-sm font-semibold">Auto-calculated Setup: {formData.setup}</span>
                                </div>
                                <TextInput 
                                    value={formData.setup} 
                                    type='number' 
                                    min='0' 
                                    max='180' 
                                    step='1'
                                    id="setup" 
                                    placeholder='Enter Setup to override auto-calculation (Optional)'
                                    onChange={handleChange} 
                                    onFocus={handleFocus}
                                />
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

export default Planning