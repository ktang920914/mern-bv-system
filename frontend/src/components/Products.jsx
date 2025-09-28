import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';

const Products = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalCreateProduct,setOpenModalCreateProduct] = useState(false)
    const [products,setProducts] = useState([])
    const [openModalDeleteProduct,setOpenModalDeleteProduct] = useState(false)
    const [openModalUpdateProduct,setOpenModalUpdateProduct] = useState(false)
    const [productIdToDelete,setProductIdToDelete] = useState('')
    const [productIdToUpdate,setProductIdToUpdate] = useState('')
    const [updateFormData,setUpdateFormData] = useState({})
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)

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
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/new/getproducts')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setProducts(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchProducts()
    },[currentUser._id])

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleCreateProduct = () => {
        setOpenModalCreateProduct(!openModalCreateProduct)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/new/product',{
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
                setOpenModalCreateProduct(false)
                const fetchProducts = async () => {
                    try {
                        const res = await fetch('/api/new/getproducts')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setProducts(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchProducts()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteProduct(false)
        try {
            const res = await fetch(`/api/new/delete/${productIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setProducts((prev) => prev.filter((product) => product._id !== productIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (p) => {
        setProductIdToUpdate(p._id)
        setOpenModalUpdateProduct(!openModalUpdateProduct)
        setUpdateFormData({lotno:p.lotno, colourcode:p.colourcode, /*quantity:p.quantity,*/ location:p.location,
            palletno:p.palletno, user:p.user, status:p.status
        })
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'colourcode' ||e.target.id === 'lotno'||e.target.id === 'palletno'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/new/update/${productIdToUpdate}`,{
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
                setOpenModalUpdateProduct(false)
                const fetchProducts = async () => {
                    try {
                        const res = await fetch('/api/new/getproducts')
                        const data = await res.json()
                        if(res.ok){
                            setProducts(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchProducts()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.trim())
    }

    const filteredProducts = products.filter(product => 
        product.colourcode.toLowerCase().includes(searchTerm) || 
        product.quantity.toString().toLowerCase().includes(searchTerm) || 
        product.lotno.toLowerCase().includes(searchTerm) || 
        product.location.toLowerCase().includes(searchTerm) || 
        product.user.toLowerCase().includes(searchTerm) || 
        product.palletno.toLowerCase().includes(searchTerm) ||
        product.status.toLowerCase().includes(searchTerm) && product.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredProducts.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Products</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
            <Button className='cursor-pointer' onClick={handleCreateProduct}>Create Product</Button>
        </div>

        <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
            <TableHead>
                <TableRow>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Colour code</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Location</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>User</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {currentProducts.map((p) => (
                    <TableRow key={p._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        <TableCell className="align-middle">{p.colourcode}</TableCell>
                        <TableCell className="align-middle">{p.lotno}</TableCell>
                        <TableCell className="align-middle">{p.quantity}</TableCell>
                        <TableCell className="align-middle">
                            <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm">Pallet no:</p>
                                        <p className="text-xs">{p.palletno}</p>
                                    </div>
                                }
                                trigger='hover'
                                placement="right"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {p.location}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell className="align-middle">{p.user}</TableCell>
                        <TableCell className="align-middle">{p.status}</TableCell>
                        <TableCell className="align-middle">
                            <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(p)}}>Edit</Button>
                        </TableCell>
                        <TableCell className="align-middle">
                            <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setProductIdToDelete(p._id);setOpenModalDeleteProduct(!openModalDeleteProduct)}}>
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

        <Modal show={openModalCreateProduct} onClose={handleCreateProduct} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Product</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Colour code</Label>
                                <TextInput id="colourcode" className='mb-4' placeholder='Enter colour code' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Lot no</Label>
                            <TextInput id="lotno" className='mb-4' placeholder='Enter lot no' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>
                            
                        {/*<div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput id="quantity" type='number' min='0' className='mb-4' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>*/}

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Pallet no</Label>
                            <TextInput id="palletno" className='mb-4' placeholder='Enter pallet no' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>
    
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label>
                            <Select id="location" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>QA/QC</option>
                                <option>Production</option>
                                <option>Dryblent</option>
                                <option>Maintenance</option>
                                <option>Stock</option>
                                <option>Quarantine</option>
                            </Select>
                        </div>
    
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>User</Label>
                            <Select id="user" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>{currentUser.username}</option>
                                
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
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

        <Modal show={openModalDeleteProduct} size="md" onClose={() => setOpenModalDeleteProduct(!openModalDeleteProduct)} popup>
            <ModalHeader />
            <ModalBody>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this product?
                </h3>
                <div className="flex justify-center gap-4">
                <Button color="red" onClick={handleDelete}>
                    Yes, I'm sure
                </Button>
                <Button color="alternative" onClick={() => setOpenModalDeleteProduct(false)}>
                    No, cancel
                </Button>
                </div>
            </div>
            </ModalBody>
        </Modal>

        <Modal show={openModalUpdateProduct} onClose={() => setOpenModalUpdateProduct(!openModalUpdateProduct)} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Product</h3>
                    <form onSubmit={handleUpdateSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Colour code</Label>
                                <TextInput value={updateFormData.colourcode} id="colourcode" className='mb-4' placeholder='Enter colour code' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Lot no</Label>
                            <TextInput value={updateFormData.lotno} id="lotno" className='mb-4' placeholder='Enter lotno' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                        </div>
                            
                        {/*<div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput value={updateFormData.quantity} id="quantity" type='number' min='0' className='mb-4' placeholder='Enter quantity' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                        </div>*/}

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Pallet no</Label>
                            <TextInput value={updateFormData.palletno} id="palletno" className='mb-4' placeholder='Enter pallet no' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                        </div>
    
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label>
                            <Select value={updateFormData.location} id="location" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>QA/QC</option>
                                <option>Production</option>
                                <option>Dryblent</option>
                                <option>Maintenance</option>
                                <option>Stock</option>
                                <option>Quarantine</option>
                            </Select>
                        </div>
    
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>User</Label>
                            <Select value={updateFormData.user} id="user" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>{currentUser.username}</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
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

export default Products