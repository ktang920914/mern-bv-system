import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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
        if(e.target.id === 'supplier'||e.target.id === 'address'||e.target.id === 'description'||e.target.id === 'pic'){
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
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredSuppliers.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

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

    // 移动端卡片组件
    const SupplierCard = ({ supplier }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Supplier</p>
                <Popover 
                    className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                    content={
                        <div className="p-3 max-w-xs">
                            <p className="font-semibold text-sm">Description:</p>
                            <p className="text-xs mb-2">{supplier.description}</p>
                            <p className="font-semibold text-sm">Address:</p>
                            <p className="text-xs mb-2">{supplier.address}</p>
                        </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                >
                    <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                        theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                    }`}>
                        {supplier.supplier}
                    </span>
                </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Contact</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{supplier.contact}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">PIC</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{supplier.pic}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{supplier.status}</p>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Email</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{supplier.email}</p>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(supplier)}
                >
                    Edit
                </Button>
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => {
                        setSupplierIdToDelete(supplier._id)
                        setOpenModalDeleteSupplier(!openModalDeleteSupplier)
                    }}
                >
                    Delete
                </Button>
            </div>
        </div>
    )

    // 生成Excel报告的函数
    const generateExcelReport = () => {
        // 准备Excel数据 - 包含所有供应商字段
        const excelData = suppliers.map(supplier => ({
            'Supplier': supplier.supplier,
            'Contact': supplier.contact,
            'Description': supplier.description,
            'Address': supplier.address,
            'PIC': supplier.pic,
            'Email': supplier.email,
            'Status': supplier.status,
            'Created At': new Date(supplier.createdAt).toLocaleString(),
            'Updated At': new Date(supplier.updatedAt).toLocaleString()
        }))

        // 创建工作簿和工作表
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        
        // 设置列宽
        const colWidths = [
            { wch: 20 }, // Supplier
            { wch: 15 }, // Contact
            { wch: 30 }, // Description
            { wch: 30 }, // Address
            { wch: 15 }, // PIC
            { wch: 25 }, // Email
            { wch: 10 }, // Status
            { wch: 20 }, // Created At
            { wch: 20 }  // Updated At
        ]
        worksheet['!cols'] = colWidths

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers Report')
        
        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // 使用当前日期作为文件名
        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `Suppliers_Report_${date}.xlsx`)
    }

  return (
    <div className='min-h-screen'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
            <h1 className='text-2xl font-semibold'>Suppliers</h1>
            <div className='w-full sm:w-auto'>
                <TextInput 
                    placeholder='Enter searching' 
                    value={searchTerm} 
                    onChange={handleSearch}
                    className='w-full'
                />
            </div>
            <div className='flex gap-2 w-full sm:w-auto'>
                <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateSupplier}>
                    Create Supplier
                </Button>
                <Button className='cursor-pointer flex-1 sm:flex-none' color='green' onClick={generateExcelReport}>
                    Report
                </Button>
            </div>
        </div>

        {/* 桌面端表格视图 */}
        {!isMobile && (
            <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
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
                                <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(supplier)}}>Edit</Button>
                            </TableCell>
                            <TableCell className="align-middle">
                                <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setSupplierIdToDelete(supplier._id);setOpenModalDeleteSupplier(!openModalDeleteSupplier)}}>
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}

        {/* 移动端卡片视图 */}
        {isMobile && (
            <div className="space-y-4">
                {currentSuppliers.map((supplier) => (
                    <SupplierCard key={supplier._id} supplier={supplier} />
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

        {/* 模态框保持不变 */}
        <Modal show={openModalCreateSupplier} onClose={handleCreateSupplier} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Supplier</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                                <TextInput id="supplier" placeholder="Enter supplier" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Contact</Label>
                            <TextInput id="contact" placeholder='Enter contact' onChange={handleChange} onFocus={handleFocus} required/>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Description</Label>
                            <Textarea id="description" className='mb-4' placeholder='Enter description' onChange={handleChange} onFocus={handleFocus} required></Textarea>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Address</Label>
                            <Textarea id="address" className='mb-4' placeholder='Enter address' onChange={handleChange} onFocus={handleFocus} required></Textarea>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>PIC</Label>
                            <TextInput id="pic" className='mb-4' placeholder='Enter PIC' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>

                        <div className="mb-4 block">
                            <Label htmlFor='email' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Email</Label>
                            <TextInput id="email" type='email' className='mb-4' placeholder='Enter email' onChange={handleChange} onFocus={handleFocus} required></TextInput>
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
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`text-xl font-medium`}>Update Supplier</h3>
                    <form onSubmit={handleUpdateSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                                <TextInput value={updateFormData.supplier || ''} id="supplier" placeholder="Enter supplier" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Contact</Label>
                            <TextInput value={updateFormData.contact || ''} id="contact" placeholder='Enter contact' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Description</Label>
                            <Textarea value={updateFormData.description || ''} id="description" className='mb-4' placeholder='Enter description' onChange={handleUpdateChange} onFocus={handleFocus} required></Textarea>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Address</Label>
                            <Textarea value={updateFormData.address} id="address" className='mb-4' placeholder='Enter address' onChange={handleUpdateChange} onFocus={handleFocus} required></Textarea>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>PIC</Label>
                            <TextInput value={updateFormData.pic} id="pic" className='mb-4' placeholder='Enter PIC' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                        </div>

                        <div className="mb-4 block">
                            <Label htmlFor='email' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Email</Label>
                            <TextInput value={updateFormData.email} id="email" type='email' className='mb-4' placeholder='Enter email' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
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

export default Suppliers