import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import useUserstore from '../store'

const Planning = () => {

    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalUpdatePlanning,setOpenModalUpdatePlanning] = useState(false)
    const [plannings,setPlannings] = useState([])
    const [planningIdToUpdate,setPlanningIdToUpdate] = useState('')
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

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
        setFormData({irr:planning.irr,ipqc:planning.ipqc,setup:planning.setup
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

    const filteredPlannings = plannings.filter(planning => 
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
        planning.code.toLowerCase().includes(searchTerm) && planning.code.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentPlannings = filteredPlannings.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredPlannings.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)


  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Plannings</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
        </div>

        <Table hoverable>
            <TableHead>
                <TableRow>
                    <TableHeadCell>Ext</TableHeadCell>
                    <TableHeadCell>Lot no</TableHeadCell>
                    <TableHeadCell>Irr</TableHeadCell>
                    <TableHeadCell>Arr</TableHeadCell>
                    <TableHeadCell>Prod leadtime</TableHeadCell>
                    <TableHeadCell>Plan prodtime</TableHeadCell>
                    <TableHeadCell>Operating time</TableHeadCell>
                    <TableHeadCell>Update</TableHeadCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {currentPlannings.map((planning) => (
                    <TableRow key={planning._id}>
                        <TableCell className="align-middle">{planning.code}</TableCell>
                        <TableCell className="align-middle">
                        <Popover
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
                        <Popover
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
                        <Popover
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
                        <Popover
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
                        <Popover
                            content={
                                <div className="p-3 max-w-xs">
                                    <p className="font-semibold text-sm">{`(Total order / IRR) + IPQC + Setup  = Plan Prodtime`}</p>
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
                        <Popover
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
                            <Button outline className='cursor-pointer' onClick={() => {handleUpdate(planning)}}>Update</Button>
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

        <Modal show={openModalUpdatePlanning} onClose={handleUpdatePlanning} popup>
            <ModalHeader />
            <ModalBody>
                <div className="space-y-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Planning</h3>
                    <form onSubmit={handleSubmit}>
    
                        <div className="mb-4 block">
                            <Label>IRR</Label>
                            <TextInput value={formData.irr} type='number' min='0.5' max='6.0' step='any'id="irr" placeholder='Enter IRR'  onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label>IPQC</Label>
                            <Select value={formData.ipqc} id="ipqc" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>0</option>
                                <option>60</option>
                                <option>200</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label>Setup</Label>
                            <Select value={formData.setup} id="setup" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>0</option>
                                <option>25</option>
                                <option>60</option>
                                <option>120</option>
                                <option>180</option>
                            </Select>
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