import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput, Badge, Checkbox } from 'flowbite-react'
import { useEffect } from 'react'
import { useState } from 'react'
import useUserstore from '../store'
import { HiX, HiCheck } from 'react-icons/hi'

const Outputs = () => {
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [openModal,setOpenModal] = useState(false)
    const [outputs,setOutputs] = useState([])
    const [showTable, setShowTable] = useState(false)
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [yearInput, setYearInput] = useState(new Date().getFullYear().toString())
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)
    const [selectedCodes, setSelectedCodes] = useState([])

    // 可用的 Job Code 选项
    const jobCodeOptions = ['L1', 'L2', 'L3', 'L5', 'L6', 'L9', 'L10', 'L11', 'L12']

    const monthFields = [
        { key: 'jan', name: 'Jan' },
        { key: 'feb', name: 'Feb' },
        { key: 'mar', name: 'Mar' },
        { key: 'apr', name: 'Apr' },
        { key: 'may', name: 'May' },
        { key: 'jun', name: 'Jun' },
        { key: 'jul', name: 'Jul' },
        { key: 'aug', name: 'Aug' },
        { key: 'sep', name: 'Sep' },
        { key: 'oct', name: 'Oct' },
        { key: 'nov', name: 'Nov' },
        { key: 'dec', name: 'Dec' }
    ]

    const dataTypes = [
        { value: 'totalorder', label: 'Total Order' },
        { value: 'totaloutput', label: 'Total Output' },
        { value: 'totalmeter', label: 'Total Meter' },
        { value: 'wastage', label: 'Wastage' },
        { value: 'downtime', label: 'Downtime' },
        { value: 'operatingtime', label: 'Operating Time' },
        { value: 'availability', label: 'Availability' },
        { value: 'performance', label: 'Performance' },
        { value: 'quality', label: 'Quality' },
        { value: 'oee', label: 'OEE' }
    ]

    useEffect(() => {
        // 组件加载时自动获取当前年份的所有数据
        fetchOutputsForYear(new Date().getFullYear().toString())
    }, [currentUser._id])

    const fetchOutputsForYear = async (year) => {
        try {
            setLoading(true)
            setErrorMessage(null)
            
            // 为每种数据类型获取数据
            const allOutputs = []
            
            for (const dataType of dataTypes) {
                // 构建查询参数
                const params = new URLSearchParams({
                    year: year,
                    data: dataType.value
                })
                
                // 如果选择了特定的 Job Code，添加到查询参数
                if (selectedCodes.length > 0) {
                    params.append('codes', selectedCodes.join(','))
                }
                
                const res = await fetch(`/api/output/calculate?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    // 确保数据格式正确
                    if (Array.isArray(data)) {
                        allOutputs.push(...data)
                    } else if (typeof data === 'object') {
                        allOutputs.push(data)
                    }
                } else {
                    console.error(`Failed to fetch data for ${dataType.value}:`, res.status)
                }
            }
            
            setOutputs(allOutputs)
            setDisplayYear(year)
            setShowTable(true)
            
        } catch (error) {
            setErrorMessage('Error fetching data: ' + error.message)
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleYearChange = () => {
        setOpenModal(!openModal)
        setYearInput(displayYear)
        setErrorMessage(null)
    }

    const handleYearInputChange = (e) => {
        setYearInput(e.target.value.trim())
    }

    const handleCodeSelection = (code) => {
        if (selectedCodes.includes(code)) {
            setSelectedCodes(selectedCodes.filter(c => c !== code))
        } else {
            setSelectedCodes([...selectedCodes, code])
        }
    }

    const clearSelectedCodes = () => {
        setSelectedCodes([])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!yearInput) {
            setErrorMessage('Please enter a year')
            return
        }
        
        await fetchOutputsForYear(yearInput)
        setOpenModal(false)
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredOutputs = outputs.filter(output => 
        output.material && output.material.toLowerCase().includes(searchTerm)
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentOutputs = filteredOutputs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredOutputs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 格式化数字显示（保留2位小数）
    const formatNumber = (value) => {
        if (value === undefined || value === null) return '0';
        return typeof value === 'number' ? value.toFixed(2) : value;
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>Outputs {displayYear}</h1>
                <div className='flex gap-2'>
                    <TextInput 
                        placeholder='Search data type...' 
                        onChange={handleSearch}
                        disabled={!showTable}
                    />
                    <Button className='cursor-pointer' onClick={handleYearChange}>
                        Change Year
                    </Button>
                    <Button color='blue' outline className='cursor-pointer'>
                        Report
                    </Button>
                </div>
            </div>

            {/* Job Code 筛选器 - 单行显示 */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Filter by Job Code</Label>
                    {selectedCodes.length > 0 && (
                        <Button size="xs" color="light" onClick={clearSelectedCodes}>
                            Clear All
                        </Button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedCodes.map(code => (
                        <Badge key={code} color="info" className="flex items-center gap-1 py-0.5 px-2 text-xs">
                            {code}
                            <HiX 
                                className="cursor-pointer text-xs" 
                                onClick={() => handleCodeSelection(code)} 
                            />
                        </Badge>
                    ))}
                    {selectedCodes.length === 0 && (
                        <span className="text-gray-500 text-xs">All codes selected</span>
                    )}
                </div>
                
                {/* 单行显示的 Job Code 选项 */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {jobCodeOptions.map(code => (
                        <div 
                            key={code}
                            className={`flex items-center p-1 rounded cursor-pointer text-xs ${
                                selectedCodes.includes(code) 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => handleCodeSelection(code)}
                        >
                            <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                                selectedCodes.includes(code) 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'bg-white border-gray-300 dark:bg-gray-600 dark:border-gray-500'
                            }`}>
                                {selectedCodes.includes(code) && (
                                    <HiCheck className="w-2 h-2 text-white" />
                                )}
                            </div>
                            {code}
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    <Button 
                        size="sm"
                        onClick={() => fetchOutputsForYear(displayYear)}
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" /> : 'Apply Filters'}
                    </Button>
                    
                    {selectedCodes.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Showing: {selectedCodes.join(' + ')}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <Spinner size="xl" />
                    <p className="mt-2">Loading outputs...</p>
                </div>
            ) : showTable && outputs.length > 0 ? (
                <>
                    <Table hoverable className='mb-6'>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Data Type</TableHeadCell>
                                {monthFields.map(month => (
                                    <TableHeadCell key={month.key}>{month.name}</TableHeadCell>
                                ))}
                                <TableHeadCell>Total</TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentOutputs.map((output, index) => ( 
                                <TableRow key={output._id || index}> 
                                    <TableCell className="font-medium text-gray-900 dark:text-white">
                                        {output.material || 'Unknown'} 
                                    </TableCell>
                                    {monthFields.map(month => (
                                        <TableCell key={month.key}>
                                            {formatNumber(output[month.key])}
                                        </TableCell>
                                    ))}
                                    <TableCell className="font-semibold">
                                        {formatNumber(output.total)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
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
                </>
            ) : showTable ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No data available for {displayYear}.</p>
                    {selectedCodes.length > 0 && (
                        <p className="text-gray-400 text-sm mt-2">
                            Try selecting different job codes or year
                        </p>
                    )}
                </div>
            ) : null}

            {errorMessage && (
                <Alert color='failure' className='mt-4 font-semibold'>
                    {errorMessage}
                </Alert>
            )}

            <Modal show={openModal} size="md" onClose={handleYearChange} popup>
                <ModalHeader className="border-b border-gray-200">
                    <div className="text-xl font-semibold text-gray-800 dark:text-white px-4 py-2">
                        Change Year
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <Label className="text-gray-900 dark:text-white">Year</Label>
                                <TextInput 
                                    type="number"
                                    placeholder="Enter year" 
                                    value={yearInput}
                                    onChange={handleYearInputChange}
                                    required
                                    min="2000"
                                    max="2100"
                                    className="w-full" 
                                />
                            </div>
                            
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='sm'/> : 'LOAD DATA'}
                                </Button>
                            </div>
                        </form>
                        
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>
                                {errorMessage}
                            </Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default Outputs