import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import useUserstore from '../store'

const Productivity = () => {

    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalUpdateProductivity,setOpenModalUpdateProductivity] = useState(false)
    const [productivities,setProductivities] = useState([])
    const [productivityIdToUpdate,setProductivityIdToUpdate] = useState('')
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

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
        if(e.target.id === 'reason' || e.target.id === 'washresin'){
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
        setFormData({totaloutput:productivities.totaloutput, reject:productivities.reject, startup: productivities.startup, screwout:productivities.screwout,
            processcomplication:productivities.processcomplication, qctime: productivities.qctime, washup: productivities.washup, vent:productivities.vent,
            unevenpallet:productivities.unevenpallet, whiteoil:productivities.whiteoil, stranddrop:productivities.stranddrop, trialrun:productivities.trialrun,
            meterstart:productivities.meterstart,meterend:productivities.meterend, reason:productivities.reason, washresin:productivities.washresin,
            color:productivities.color,density:productivities.density,operator:productivities.operator
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

    const filteredProductivities = productivities.filter(productivity => 
        productivity.lotno.toLowerCase().includes(searchTerm) ||
        productivity.totaloutput.toString().toLowerCase().includes(searchTerm) || 
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

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentProductivities = filteredProductivities.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredProductivities.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Productivities</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
                
        </div>

        <Table hoverable>
            <TableHead>
                <TableRow>
                    <TableHeadCell>Lot no</TableHeadCell>
                    <TableHeadCell>Output</TableHeadCell>
                    <TableHeadCell>Downtime</TableHeadCell>
                    <TableHeadCell>Wastage</TableHeadCell>
                    <TableHeadCell>Meter</TableHeadCell>
                    <TableHeadCell>Update</TableHeadCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {currentProductivities.map((productivities) => (
                    <TableRow key={productivities._id}>
                        <TableCell className="align-middle">
                            <Popover
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm">Extruder:</p>
                                        <p className="text-xs mb-2">{productivities.code}</p>
                                        <p className="font-semibold text-sm">Prod start:</p>
                                        <p className="text-xs mb-2">{productivities.starttime}</p>
                                        <p className="font-semibold text-sm">Prod end:</p>
                                        <p className="text-xs mb-2">{productivities.endtime}</p>
                                        <p className="font-semibold text-sm">Order date:</p>
                                        <p className="text-xs mb-2">{productivities.orderdate}</p>
                                        <p className="font-semibold text-sm">Colour code:</p>
                                        <p className="text-xs mb-2">{productivities.colourcode}</p>
                                        <p className="font-semibold text-sm">Material:</p>
                                        <p className="text-xs mb-2">{productivities.material}</p>
                                        <p className="font-semibold text-sm">Total order:</p>
                                        <p className="text-xs mb-2">{productivities.totalorder}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {productivities.lotno}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Popover
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm">Total order:</p>
                                        <p className="text-xs mb-2">{productivities.totalorder}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {productivities.totaloutput}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Popover
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm mb-2">Startup + Screw out + process complication + QC time  = Downtime</p>
                                        <p className="text-xs mb-2">{`${productivities.startup} + ${productivities.screwout} + ${productivities.processcomplication} + ${productivities.qctime} = ${productivities.downtime}`}</p>
                                        <p className="font-semibold text-sm">Reason:</p>
                                        <p className="text-xs mb-2">{productivities.reason}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {productivities.downtime}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Popover
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm mb-2">Total output - Total order = Wastage</p>
                                        <p className="text-xs mb-2">{`${productivities.totaloutput} - ${productivities.totalorder} = ${productivities.wastage}`}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {productivities.wastage}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Popover
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm mb-2">Meter end - Meter start = Total meter</p>
                                        <p className="text-xs mb-2">{`${productivities.meterend} - ${productivities.meterstart} = ${productivities.totalmeter}`}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {productivities.totalmeter}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell>
                        <Button outline className='cursor-pointer' onClick={() => {handleUpdate(productivities)}}>Update</Button>
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

        <Modal show={openModalUpdateProductivity} onClose={handleUpdateProductivity} popup>
            <ModalHeader />
            <ModalBody>
                <div className="space-y-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Update Productivity</h3>
                    <form onSubmit={handleSubmit}>
 
                        <div className="mb-4 block">
                            <Label>Total output</Label>
                            <TextInput value={formData.totaloutput}  type='number' min='0' id="totaloutput" placeholder='Enter total output'  onChange={handleChange} onFocus={handleFocus} />
                        </div>

                        <div className="mb-4 block">
                            <Label>Reject</Label>
                            <TextInput value={formData.reject}  type='number' min='0' id="reject" placeholder='Enter reject'  onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Start up</Label>
                            <TextInput value={formData.startup}  type='number' min='0' id="startup" placeholder='Enter start up' onChange={handleChange} onFocus={handleFocus}/>
                        </div>
    
                        <div className="mb-4 block">
                            <Label>Screw out</Label>
                            <TextInput value={formData.screwout} type='number' min='0' id="screwout" placeholder='Enter screw out' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Process complication</Label>
                            <TextInput value={formData.processcomplication} type='number' id="processcomplication" min='0' placeholder='Enter process complication' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>QC time</Label>
                            <TextInput value={formData.qctime} type='number' id="qctime" min='0' placeholder='Enter QC time' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Reason</Label>
                            <TextInput value={formData.reason} id="reason" placeholder='Enter reason' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Wash resin</Label>
                            <TextInput value={formData.washresin} id="washresin" placeholder='Enter wash resin' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Wash up</Label>
                            <TextInput value={formData.washup} type='number' id="washup" min='0' placeholder='Enter wash up' onChange={handleChange} onFocus={handleFocus} />
                        </div>

                        <div className="mb-4 block">
                            <Label>Strand drop</Label>
                            <TextInput value={formData.stranddrop} type='number' id="stranddrop" min='0' placeholder='Enter strand drop' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>White oil evaporate</Label>
                            <TextInput value={formData.whiteoil} type='number' id="whiteoil" min='0' placeholder='Enter white oil evaporate' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Vent/Port degassing</Label>
                            <TextInput value={formData.vent} type='number' id="vent" min='0' placeholder='Enter vent/port degassing' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Uneven pallet</Label>
                            <TextInput value={formData.unevenpallet} type='number' id="unevenpallet" min='0' placeholder='Enter uneven pallet' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Trial run</Label>
                            <TextInput value={formData.trialrun} type='number' id="trialrun" min='0' placeholder='Enter trial run' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Meter start</Label>
                            <TextInput value={formData.meterstart} type='number' id="meterstart" min='0' placeholder='Enter meter start' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Meter end</Label>
                            <TextInput value={formData.meterend} type='number' id="meterend" min='0' placeholder='Enter meter end' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Color</Label>
                            <TextInput value={formData.color} id="color" placeholder='Enter color' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>MFI density</Label>
                            <TextInput value={formData.density} id="density" type='number' min='1' placeholder='Enter MFI density' onChange={handleChange} onFocus={handleFocus}/>
                        </div>

                        <div className="mb-4 block">
                            <Label>Operator</Label>
                            <TextInput value={formData.operator} id="operator" placeholder='Enter operator' onChange={handleChange} onFocus={handleFocus}/>
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