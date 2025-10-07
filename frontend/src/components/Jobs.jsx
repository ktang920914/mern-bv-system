import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';

const Jobs = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [searchParams, setSearchParams] = useSearchParams()
    const [openModalCreateJob,setOpenModalCreateJob] = useState(false)
    const [openModalDeleteJob,setOpenModalDeleteJob] = useState(false)
    const [openModalUpdateJob,setOpenModalUpdateJob] = useState(false)
    const [formData,setFormData] = useState({})
    const [updateFormData,setUpdateFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [items,setItems] = useState([])
    const [jobs,setJobs] = useState([])
    const [jobIdToDelete,setJobIdToDelete] = useState('')
    const [jobIdToUpdate,setJobIdToUpdate] = useState('')
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
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/inventory/getitems')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setItems(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchItems()
    },[currentUser._id])

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/analysis/getjobs')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setJobs(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchJobs()
    },[currentUser._id])

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleCreateJob = () => {
        setOpenModalCreateJob(!openModalCreateJob)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/analysis/job',{
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
                setOpenModalCreateJob(false)
                const fetchJobs = async () => {
                    try {
                        const res = await fetch('/api/analysis/getjobs')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setJobs(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchJobs()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteJob(false)
        try {
            const res = await fetch(`/api/analysis/delete/${jobIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setJobs((prev) => prev.filter((job) => job._id !== jobIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (job) => {
        setJobIdToUpdate(job._id)
        setOpenModalUpdateJob(!openModalUpdateJob)
        setErrorMessage(null)
        setLoading(false)
        setUpdateFormData({code: job.code, starttime: job.starttime, endtime: job.endtime, orderdate: job.orderdate,
            lotno: job.lotno, colourcode: job.colourcode, material: job.material, totalorder: job.totalorder
        })
    }

    const handleUpdateChange = (e) => {
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/analysis/update/${jobIdToUpdate}`,{
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
                setOpenModalUpdateJob(false)
                const fetchJobs = async () => {
                    try {
                        const res = await fetch('/api/analysis/getjobs')
                        const data = await res.json()
                        if(res.ok){
                            setJobs(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchJobs()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredJobs = jobs.filter(job => 
        job.starttime.toLowerCase().includes(searchTerm) ||
        job.endtime.toLowerCase().includes(searchTerm) ||
        job.orderdate.toLowerCase().includes(searchTerm) ||
        job.lotno.toLowerCase().includes(searchTerm) ||
        job.colourcode.toLowerCase().includes(searchTerm) ||
        job.material.toLowerCase().includes(searchTerm) ||
        job.totalorder.toString().toLowerCase().includes(searchTerm) ||
        job.code.toLowerCase().includes(searchTerm) && job.code.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredJobs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 移动端卡片组件
    const JobCard = ({ job }) => (
        <div className={`p-4 mb-4 rounded-lg shadow ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Ext</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.code}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Prod Start</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.starttime}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Order Date</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.orderdate}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Prod End</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.endtime}</p>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Lot No</p>
                <Popover 
                    className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                    content={
                        <div className="p-3 max-w-xs">
                            <p className="font-semibold text-sm">Colour code:</p>
                            <p className="text-xs mb-2">{job.colourcode}</p>
                            <p className="font-semibold text-sm">Material:</p>
                            <p className="text-xs mb-2">{job.material}</p>
                            <p className="font-semibold text-sm">Total order:</p>
                            <p className="text-xs mb-2">{job.totalorder}</p>
                        </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                >
                    <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                        theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                    }`}>
                        {job.lotno}
                    </span>
                </Popover>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm' 
                    onClick={() => handleUpdate(job)}
                >
                    Edit
                </Button>
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm' 
                    onClick={() => {
                        setJobIdToDelete(job._id)
                        setOpenModalDeleteJob(!openModalDeleteJob)
                    }}
                >
                    Delete
                </Button>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Jobs</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <Button className='cursor-pointer w-full sm:w-auto' onClick={handleCreateJob}>
                    Create job
                </Button>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Prod start</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Prod end</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Order date</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentJobs.map((job) => (
                            <TableRow key={job._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle">{job.code}</TableCell>
                                <TableCell className="align-middle">{job.starttime}</TableCell>
                                <TableCell className="align-middle">{job.endtime}</TableCell>
                                <TableCell className="align-middle">{job.orderdate}</TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Colour code:</p>
                                                <p className="text-xs mb-2">{job.colourcode}</p>
                                                <p className="font-semibold text-sm">Material:</p>
                                                <p className="text-xs mb-2">{job.material}</p>
                                                <p className="font-semibold text-sm">Total order:</p>
                                                <p className="text-xs mb-2">{job.totalorder}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Button outline className='cursor-pointer py-1 px-2 text-sm h-8' onClick={() => {handleUpdate(job)}}>Edit</Button>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Button color='red' outline className='cursor-pointer py-1 px-2 text-sm h-8' onClick={() => {setJobIdToDelete(job._id);setOpenModalDeleteJob(!openModalDeleteJob)}}>
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
                    {currentJobs.map((job) => (
                        <JobCard key={job._id} job={job} />
                    ))}
                </div>
            )}

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

            {/* 模态框保持不变 */}
            <Modal show={openModalCreateJob} onClose={handleCreateJob} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Create Job</h3>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Extruder</Label>
                                    <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                        <option></option>
                                    {items.map((item) => (
                                    <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                                    ))}
                                    </Select>
                                </div>
                            </div>
                                
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod start</Label>
                                <TextInput  type='datetime-local' id="starttime"  onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod end</Label>
                                <TextInput  type='datetime-local' id="endtime"  onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order date</Label>
                                <TextInput  type='date' id="orderdate"  onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
        
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot no</Label>
                                <TextInput id="lotno" placeholder='Enter lot no' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour code</Label>
                                <TextInput id="colourcode" placeholder='Enter colour code' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                <TextInput id="material" placeholder='Enter material' onChange={handleChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Total order</Label>
                                <TextInput type='number' min='0' id="totalorder" step='0.01' placeholder='Enter total order' onChange={handleChange} onFocus={handleFocus} required/>
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

            <Modal show={openModalDeleteJob} size="md" onClose={() => setOpenModalDeleteJob(!openModalDeleteJob)} popup>
                <ModalHeader/>
                <ModalBody>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this job?
                    </h3>
                    <div className="flex justify-center gap-4">
                    <Button color="red" onClick={handleDelete}>
                        Yes, I'm sure
                    </Button>
                    <Button color="alternative" onClick={() => setOpenModalDeleteJob(false)}>
                        No, cancel
                    </Button>
                    </div>
                </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalUpdateJob} onClose={() => setOpenModalUpdateJob(!openModalUpdateJob)} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'text-gray-50 bg-gray-900'}`}>
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Update Job</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div>
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Extruder</Label>
                                    <Select  value={updateFormData.code} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                        <option></option>
                                    {items.map((item) => (
                                    <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                                    ))}
                                    </Select>
                                </div>
                            </div>
                                
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod start</Label>
                                <TextInput value={updateFormData.starttime}  type='datetime-local' id="starttime"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Prod end</Label>
                                <TextInput value={updateFormData.endtime} type='datetime-local' id="endtime"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Order date</Label>
                                <TextInput value={updateFormData.orderdate}  type='date' id="orderdate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
        
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Lot no</Label>
                                <TextInput value={updateFormData.lotno} id="lotno" placeholder='Enter lot no' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Colour code</Label>
                                <TextInput value={updateFormData.colourcode} id="colourcode" placeholder='Enter colour code' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Material</Label>
                                <TextInput value={updateFormData.material} id="material" placeholder='Enter material' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>

                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Total order</Label>
                                <TextInput value={updateFormData.totalorder} type='number' min='0' step='0.01' id="totalorder" placeholder='Enter total order' onChange={handleUpdateChange} onFocus={handleFocus} required/>
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

export default Jobs