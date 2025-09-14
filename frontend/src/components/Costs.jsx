import { Button, Checkbox, Label, Modal, ModalBody, ModalHeader, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const Costs = () => {

    const {currentUser} = useUserstore()
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [openModalCreateCost, setOpenModalCreateCost] = useState(false)
    const [costs, setCosts] = useState([]) 
    const [formData, setFormData] = useState({year: new Date().getFullYear().toString()})
    const [showTable, setShowTable] = useState(false)
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

    useEffect(() => {
        const fetchInitialCosts = async () => {
            try {
                const res = await fetch('/api/cost/getcosts')
                const data = await res.json()
                if (res.ok) {
                    const currentYear = new Date().getFullYear().toString()
                    const filteredCosts = data.filter(cost => cost.year === currentYear)
                    setCosts(filteredCosts)
                    setDisplayYear(currentYear) 
                    setShowTable(true)
                }
            } catch (error) {
                console.error('Error fetching initial costs:', error)
            }
        }
        fetchInitialCosts()
    }, [currentUser._id]) 

    const handleCreateCost = () => {
        setOpenModalCreateCost(!openModalCreateCost)
        setErrorMessage(null)
        setLoading(false)
        setFormData({year: new Date().getFullYear().toString()})
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/cost/getcosts')
            const data = await res.json()
            if(data.message === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if (res.ok) {
                const filteredCosts = data.filter(cost => cost.year === formData.year)
                setCosts(filteredCosts)
                setShowTable(true)
                setOpenModalCreateCost(false)
                setDisplayYear(formData.year)
            }
        } catch (error) {
            setErrorMessage('Error fetching costs: ' + error.message)
        }
    }

    const costCategories = [
        "Spareparts",
        "Extruder",
        "Electrical & Installation",
        "Injection machine",
        "QC",
        "Mould",
        "Others"
    ]

    const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
    }

    const filteredCosts = costs.filter(cost => 
        cost.type.toLowerCase().includes(searchTerm) 
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentCosts = filteredCosts.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredCosts.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    const generateExcelReport = () => {
    if (costs.length === 0) {
        setErrorMessage('No data to export')
        return
    }

    try {
        const worksheetData = []
        
        const headers = ['Cost Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
        worksheetData.push(headers)
        
        costCategories.forEach(category => {
            const costData = costs.find(cost => cost.type === category)
            const rowData = [category]
            
            monthFields.forEach(month => {
                const value = costData ? costData[month.key] || 0 : 0
                rowData.push(value)
            })
            
            const total = costData ? costData.total || 0 : 0
            rowData.push(total)
            
            worksheetData.push(rowData)
        })
        
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        
        const colWidths = [
            { wch: 25 }, 
            ...Array(12).fill({ wch: 10 }),
            { wch: 12 } 
        ]
        worksheet['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(workbook, worksheet, `Costs ${displayYear}`)
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        
        saveAs(data, `Costs_Report_${displayYear}.xlsx`)
        
        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message)
        }
    }

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

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>Costs {displayYear}</h1>
                <div>
                    <TextInput placeholder='Enter searching' onChange={handleSearch}/>
                </div>
                <div className='flex items-center gap-2'>
                    <Button outline className='cursor-pointer' onClick={generateExcelReport}>Report</Button>
                    <Button className='cursor-pointer' onClick={handleCreateCost}>Create Cost</Button>
                </div>
            </div>

            {showTable && (
                <Table hoverable className='mb-6'>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Cost category</TableHeadCell>
                            {monthFields.map(month => (
                                <TableHeadCell key={month.key}>{month.name}</TableHeadCell>
                            ))}
                            <TableHeadCell>Total</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentCosts.map(cost => ( 
                            <TableRow key={cost.type}> 
                                <TableCell className="font-medium text-gray-900 dark:text-white">
                                    {cost.type} 
                                </TableCell>
                                {monthFields.map(month => (
                                    <TableCell key={month.key}>
                                        {cost[month.key] || 0} 
                                    </TableCell>
                                ))}
                                <TableCell>
                                    {cost.total || 0}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

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
            

            <Modal show={openModalCreateCost} size="sm" onClose={handleCreateCost} popup>
                <ModalHeader className="border-b border-gray-200">
                    <div className="text-xl font-semibold text-gray-800 dark:text-white px-4 py-2">
                        Create Cost
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <Label className=" text-gray-900 dark:text-white">Year</Label>
                                <TextInput 
                                    id="year" 
                                    type="number"
                                    placeholder="Enter year" 
                                    value={formData.year}
                                    required
                                    className="w-full"
                                    onChange={handleChange}
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

export default Costs