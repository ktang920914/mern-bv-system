import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';

const Suppliers = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [formData,setFormData] = useState({})
    const [suppliers,setSuppliers] = useState([])
    const [openModalCreateSupplier,setOpenModalCreateSupplier] = useState(false)
    const [openModalDeleteSupplier,setOpenModalDeleteSupplier] = useState(false)
    const [openModalUpdateSupplier,setOpenModalUpdateSupplier] = useState(false)
    const [supplierIdToDelete,setSupplierIdToDelete] = useState('')
    const [supplierIdToUpdate,setSupplierIdToUpdate] = useState('')
    const [updateFormData,setUpdateFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

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

    const handleCreateSupplier = () => {
        setOpenModalCreateSupplier(!openModalCreateSupplier)
        setErrorMessage(null)
        setLoading(false)
    }   

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }
    
    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/purchase/supplier',{
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
                setOpenModalCreateSupplier(false)
                const fetchUsers = async () => {
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
                fetchUsers()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteSupplier(false)
        try {
            const res = await fetch(`/api/purchase/delete/${supplierIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setSuppliers((prev) => prev.filter((supplier) => supplier._id !== supplierIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (supplier) => {
        setSupplierIdToUpdate(supplier._id)
        setUpdateFormData({supplier: supplier.supplier, contact: supplier.contact, description: supplier.description,
            address: supplier.address, pic: supplier.pic, email: supplier.email, status: supplier.status
        })
        setOpenModalUpdateSupplier(!openModalUpdateSupplier)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'supplier' ||e.target.id === 'address'||e.target.id === 'description'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/purchase/update/${supplierIdToUpdate}`,{
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
                setOpenModalUpdateSupplier(false)
                const fetchSuppliers = async () => {
                    try {
                        const res = await fetch('/api/purchase/getsuppliers')
                        const data = await res.json()
                        if(res.ok){
                            setSuppliers(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchSuppliers()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.supplier.toLowerCase().includes(searchTerm) || 
        supplier.contact.toLowerCase().includes(searchTerm) ||
        supplier.description.toLowerCase().includes(searchTerm) ||
        supplier.address.toLowerCase().includes(searchTerm) ||
        supplier.pic.toLowerCase().includes(searchTerm) ||
        supplier.email.toLowerCase().includes(searchTerm) ||
        supplier.status.toLowerCase().includes(searchTerm) && supplier.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredSuppliers.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Suppliers</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
            <Button className='cursor-pointer' onClick={handleCreateSupplier}>Create Supplier</Button>
        </div>

        <Table hoverable>
            <TableHead>
                <TableRow>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Contact</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>PIC</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Email</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {currentSuppliers.map((supplier) => (
                    <TableRow key={supplier._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        <TableCell className="align-middle">
                            <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm">Description:</p>
                                        <p className="text-xs mb-2">{supplier.description}</p>
                                        <p className="font-semibold text-sm">Address:</p>
                                        <p className="text-xs">{supplier.address}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="right"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {supplier.supplier}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">{supplier.contact}</TableCell>
                        <TableCell className="align-middle">{supplier.pic}</TableCell>
                        <TableCell className="align-middle">{supplier.email}</TableCell>
                        <TableCell className="align-middle">{supplier.status}</TableCell>
                        <TableCell className="align-middle">
                            <Button outline className='cursor-pointer' onClick={() => {handleUpdate(supplier)}}>Edit</Button>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Button color='red' outline className='cursor-pointer' onClick={() => {setSupplierIdToDelete(supplier._id);setOpenModalDeleteSupplier(!openModalDeleteSupplier)}}>
                                Delete
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
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

      <Modal show={openModalCreateSupplier} onClose={handleCreateSupplier} popup>
        <ModalHeader />
        <ModalBody>
            <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Supplier</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label>Supplier</Label>
                            <TextInput id="supplier" placeholder="Enter supplier" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Contact</Label>
                        <TextInput id="contact" placeholder='Enter contact' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Description</Label>
                        <TextInput id="description" className='mb-4' placeholder='Enter description' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>Address</Label>
                        <TextInput id="address" className='mb-4' placeholder='Enter address' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>PIC</Label>
                        <TextInput id="pic" className='mb-4' placeholder='Enter PIC' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label htmlFor='email'>Email</Label>
                        <TextInput id="email" type='email' className='mb-4' placeholder='Enter email' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>Status</Label>
                        <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                            <option></option>
                            <option>Active</option>
                            <option>Inactive</option>
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

      <Modal show={openModalDeleteSupplier} size="md" onClose={() => setOpenModalDeleteSupplier(!openModalDeleteSupplier)} popup>
        <ModalHeader />
        <ModalBody>
        <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this supplier?
            </h3>
            <div className="flex justify-center gap-4">
            <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
            </Button>
            <Button color="alternative" onClick={() => setOpenModalDeleteSupplier(false)}>
                No, cancel
            </Button>
            </div>
        </div>
        </ModalBody>
      </Modal>

      <Modal show={openModalUpdateSupplier} onClose={() => setOpenModalUpdateSupplier(!openModalUpdateSupplier)} popup>
        <ModalHeader />
        <ModalBody>
            <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Update User</h3>
                <form onSubmit={handleUpdateSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label>Supplier</Label>
                            <TextInput value={updateFormData.supplier || ''} id="supplier" placeholder="Enter supplier" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Contact</Label>
                        <TextInput value={updateFormData.contact || ''} id="contact" placeholder='Enter contact' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Description</Label>
                        <TextInput value={updateFormData.description || ''} id="description" className='mb-4' placeholder='Enter description' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>Address</Label>
                        <TextInput value={updateFormData.address} id="address" className='mb-4' placeholder='Enter address' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>PIC</Label>
                        <TextInput value={updateFormData.pic} id="pic" className='mb-4' placeholder='Enter PIC' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label htmlFor='email'>Email</Label>
                        <TextInput value={updateFormData.email} id="email" type='email' className='mb-4' placeholder='Enter email' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                    </div>

                    <div className="mb-4 block">
                        <Label>Status</Label>
                        <Select value={updateFormData.status} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                            <option></option>
                            <option>Active</option>
                            <option>Inactive</option>
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

export default Suppliers