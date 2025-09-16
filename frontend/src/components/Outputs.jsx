import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect } from 'react'
import { useState } from 'react'
import useUserstore from '../store'

const Outputs = () => {
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [openModalCreateOutput,setOpenModalCreateOutput] = useState(false)
    const [outputs,setOutputs] = useState([])
    const [showTable, setShowTable] = useState(false)
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [formData, setFormData] = useState({year: new Date().getFullYear().toString()})
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

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
        { value: 'wastage', label: 'Wastage' },
        { value: 'downtime', label: 'Downtime' },
        { value: 'operatingtime', label: 'Operating Time' },
        { value: 'availability', label: 'Availability' },
        { value: 'performance', label: 'Performance' },
        { value: 'quality', label: 'Quality' },
        { value: 'oee', label: 'OEE' }
    ]

    useEffect(() => {
        const fetchOutputs = async () => {
            try {
                const res = await fetch('/api/review/getoutputs')
                const data = await res.json()
                if (res.ok) {
                    const currentYear = new Date().getFullYear().toString()
                    const filteredOutputs = data.filter(output => output.year === currentYear)
                    setOutputs(filteredOutputs)
                    setDisplayYear(currentYear) 
                    setShowTable(true)
                }
            } catch (error) {
                console.error('Error fetching initial costs:', error)
            }
        }
        fetchOutputs()
    }, [currentUser._id]) 

    const handleCreateOutput = () => {
        setOpenModalCreateOutput(!openModalCreateOutput)
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
            const res = await fetch('/api/review/getoutputs')
            const data = await res.json()
            if(data.message === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if (res.ok) {
                const filteredOutputs = data.filter(output => output.year === formData.year)
                setOutputs(filteredOutputs)
                setShowTable(true)
                setOpenModalCreateOutput(false)
                setDisplayYear(formData.year)
            }
        } catch (error) {
            setErrorMessage('Error fetching costs: ' + error.message)
        }
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

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>Outputs {displayYear}</h1>
                <div className='flex gap-2'>
                  <TextInput placeholder='Enter searching' onChange={handleSearch}/>
                </div>
                <Button className='cursor-pointer' onClick={handleCreateOutput}>Create Output</Button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <Spinner size="xl" />
                    <p className="mt-2">Loading outputs...</p>
                </div>
            ) : showTable && (
                <>
                    <Table hoverable className='mb-6'>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Material</TableHeadCell>
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
                                            {output[month.key] || 0} 
                                        </TableCell>
                                    ))}
                                    <TableCell className="font-semibold">
                                        {output.total || 0}
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
            )}

            {errorMessage && (
                <Alert color='failure' className='mt-4 font-semibold'>
                    {errorMessage}
                </Alert>
            )}

            <Modal show={openModalCreateOutput} size="md" onClose={handleCreateOutput} popup>
                <ModalHeader className="border-b border-gray-200">
                    <div className="text-xl font-semibold text-gray-800 dark:text-white px-4 py-2">
                        Create Outputs
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <Label className="text-gray-900 dark:text-white">Year</Label>
                                <TextInput 
                                    id="year" 
                                    type="number"
                                    placeholder="Enter year" 
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                    className="w-full" 
                                />
                            </div>

                            <div className="mb-6">
                                <Label className="text-gray-900 dark:text-white">Data</Label>
                                <Select
                                    id="data"
                                    onChange={handleChange}
                                    required
                                >
                                    <option></option>
                                    {dataTypes.map(dataType => (
                                        <option key={dataType.value} value={dataType.value}>
                                            {dataType.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}
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