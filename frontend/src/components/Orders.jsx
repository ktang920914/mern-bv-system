import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';

const Orders = () => {


    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [openModalCreateOrder,setOpenModalCreateOrder] = useState(false)
    const [openModalDeleteOrder,setOpenModalDeleteOrder] = useState(false)
    const [openModalUpdateOrder,setOpenModalUpdateOrder] = useState(false)
    const [formData,setFormData] = useState({})
    const [updateFormData,setUpdateFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [suppliers,setSuppliers] = useState([])
    const [orders,setOrders] = useState([])
    const [orderIdToDelete,setOrderIdToDelete] = useState('')
    const [orderIdToUpdate,setOrderIdToUpdate] = useState('')
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(10)

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await fetch('/api/purchase/getsuppliers')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setSuppliers(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchSuppliers()
    },[currentUser._id])

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/request/getorders')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setOrders(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchOrders()
    },[currentUser._id])

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleCreateOrder = () => {
        setOpenModalCreateOrder(!openModalCreateOrder)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/request/order',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(data.success !== false){
                setOpenModalCreateOrder(false)
                const fetchOrders = async () => {
                    try {
                        const res = await fetch('/api/request/getorders')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setOrders(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchOrders()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteOrder(false)
        try {
            const res = await fetch(`/api/request/delete/${orderIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setOrders((prev) => prev.filter((order) => order._id !== orderIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (order) => {
        setOrderIdToUpdate(order._id)
        setUpdateFormData({date: order.date, supplier: order.supplier, doc: order.doc, docno: order.docno, item: order.item,
            quantity: order.quantity, amount: order.amount, costcategory: order.costcategory, status: order.status
        })
        setOpenModalUpdateOrder(!openModalUpdateOrder)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/request/update/${orderIdToUpdate}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(updateFormData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(res.ok){
                setOpenModalUpdateOrder(false)
                const fetchOrders = async () => {
                    try {
                        const res = await fetch('/api/request/getorders')
                        const data = await res.json()
                        if(res.ok){
                            setOrders(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchOrders()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
  }

  const filteredOrders = orders.filter(order => 
      order.date.toLowerCase().includes(searchTerm) ||
      order.supplier.toLowerCase().includes(searchTerm) ||
      order.doc.toLowerCase().includes(searchTerm) ||
      order.docno.toLowerCase().includes(searchTerm) ||
      order.costcategory.toLowerCase().includes(searchTerm) ||
      order.item.toLowerCase().includes(searchTerm) ||
      order.quantity.toString().toLowerCase().includes(searchTerm) ||
      order.amount.toString().toLowerCase().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm) && order.status.toString().toLowerCase() === searchTerm
    );

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredOrders.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Orders</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
            <Button className='cursor-pointer' onClick={handleCreateOrder}>Create Order</Button>
        </div>

        <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
            <TableHead>
                <TableRow>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Amount</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                </TableRow>
            </TableHead>
            {currentOrders.map((order) => (
                <TableBody key={order._id}>
                    <TableRow className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className='align-middle'>
                        <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            content={
                                <div className="p-3 max-w-xs">
                                    <p className="font-semibold text-sm">Doc no:</p>
                                    <p className="text-xs mb-2">{order.docno}</p>
                                    <p className="font-semibold text-sm">Doc:</p>
                                    <p className="text-xs mb-2">{order.doc}</p>
                                    <p className="font-semibold text-sm">Cost category:</p>
                                    <p className="text-xs">{order.costcategory}</p>
                                </div>
                            }
                            trigger="hover"
                            placement="top"
                            arrow={false}
                        >
                            <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                {order.supplier}
                            </span>
                        </Popover>
                    </TableCell>
                    <TableCell>{order.item}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>
                        <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(order)}}>Edit</Button>
                    </TableCell>
                    <TableCell><Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setOrderIdToDelete(order._id);setOpenModalDeleteOrder(!openModalDeleteOrder)}}>Delete</Button></TableCell>
                    </TableRow>
                </TableBody>
            ))}
        </Table>

        <div className="flex-col justify-center text-center mt-4">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                <Pagination
                    showIcons
                    currentPage={currentPage}
                    totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                    onPageChange={handlePageChange}
                />
              </div>

        <Modal show={openModalCreateOrder} onClose={handleCreateOrder} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Order</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                                <TextInput type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                            <Select id="supplier" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                            {suppliers.map((supplier) => (
                            <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                            ))}
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc</Label>
                            <Select id="doc" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Invoice</option>
                                <option>Quotation</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc no</Label>
                            <TextInput id="docno" placeholder="Enter doc no" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                            <TextInput id="item" placeholder="Enter item" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Amount</Label>
                            <TextInput id="amount" type='number' min='0' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost category</Label>
                            <Select id="costcategory" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Spareparts</option>
                                <option>Extruder</option>
                                <option>Electrical & Installation</option>
                                <option>Injection machine</option>
                                <option>QC</option>
                                <option>Mould</option>
                                <option>Others</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                            <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Complete</option>
                                <option>Incomplete</option>
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

        <Modal show={openModalDeleteOrder} size="md" onClose={() => setOpenModalDeleteOrder(!openModalDeleteOrder)} popup>
            <ModalHeader />
            <ModalBody>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this order?
                </h3>
                <div className="flex justify-center gap-4">
                <Button color="red" onClick={handleDelete}>
                    Yes, I'm sure
                </Button>
                <Button color="alternative" onClick={() => setOpenModalDeleteOrder(false)}>
                    No, cancel
                </Button>
                </div>
            </div>
            </ModalBody>
        </Modal>

        <Modal show={openModalUpdateOrder} onClose={() => setOpenModalUpdateOrder(!openModalUpdateOrder)} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Order</h3>
                    <form onSubmit={handleUpdateSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                                <TextInput value={updateFormData.date || ''} type='date' id="date" placeholder="Enter date" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                            <Select value={updateFormData.supplier || ''} id="supplier" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                            {suppliers.map((supplier) => (
                            <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                            ))}
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc</Label>
                            <Select value={updateFormData.doc || ''} id="doc" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Invoice</option>
                                <option>Quotation</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc no</Label>
                            <TextInput value={updateFormData.docno || ''} id="docno" placeholder="Enter doc no" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                            <TextInput value={updateFormData.item || ''} id="item" placeholder="Enter item" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput value={updateFormData.quantity || ''} id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Amount</Label>
                            <TextInput value={updateFormData.amount || ''} id="amount" type='number' min='0' placeholder='Enter quantity' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost category</Label>
                            <Select value={updateFormData.costcategory || ''} id="costcategory" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Spareparts</option>
                                <option>Extruder</option>
                                <option>Electrical & Installation</option>
                                <option>Injection machine</option>
                                <option>QC</option>
                                <option>Mould</option>
                                <option>Others</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                            <Select value={updateFormData.status || ''} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Complete</option>
                                <option>Incomplete</option>
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

export default Orders