import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx' // 新增导入
import { saveAs } from 'file-saver' // 新增导入

const Maintenance = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [openModalCreateJob,setOpenModalCreateJob] = useState(false)
  const [openModalDeleteMaintenance,setOpenModalDeleteMaintenance] = useState(false)
  const [openModalUpdateMaintenance,setOpenModalUpdateMaintenance] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [items,setItems] = useState([])
  const [suppliers,setSuppliers] = useState([])
  const [maintenances,setMaintenances] = useState([])
  const [maintenanceIdToDelete,setMaintenanceIdToDelete] = useState('')
  const [maintenanceIdToUpdate,setMaintenanceIdToUpdate] = useState('')
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
    const fetchMaintenances = async () => {
        try {
            const res = await fetch('/api/maintenance/getMaintenances')
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setMaintenances(data)
            }
        } catch (error) {
            console.log(error.message)
        }
    }
    fetchMaintenances()
  },[currentUser._id])

  const handleCreateJob = () => {
    setOpenModalCreateJob(!openModalCreateJob)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]:e.target.value.trim()})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/maintenance/job',{
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
          const fetchMaintenances = async () => {
              try {
                  const res = await fetch('/api/maintenance/getmaintenances')
                  const data = await res.json()
                  if(data.success === false){
                      console.log(data.message)
                  }
                  if(res.ok){
                      setMaintenances(data)
                  }
              } catch (error) {
                  console.log(error.message)
              }
          }
          fetchMaintenances()
      }
    } catch (error) {
        console.log(error.message)
    }
  }

  const handleDelete = async () => {
        setOpenModalDeleteMaintenance(false)
        try {
            const res = await fetch(`/api/maintenance/delete/${maintenanceIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setMaintenances((prev) => prev.filter((maintenance) => maintenance._id !== maintenanceIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (maintenance) => {
        setMaintenanceIdToUpdate(maintenance._id)
        setUpdateFormData({jobdate: maintenance.jobdate, code: maintenance.code, problem:maintenance.problem,
            jobdetail:maintenance.jobdetail, rootcause: maintenance.rootcause, supplier:maintenance.supplier, status:maintenance.status,
            cost:maintenance.cost, completiondate:maintenance.completiondate, jobtype:maintenance.jobtype
        })
        setOpenModalUpdateMaintenance(!openModalUpdateMaintenance)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'supplier' ||e.target.id === 'problem'||e.target.id === 'jobdetail' || e.target.id === 'rootcause'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

     const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/maintenance/update/${maintenanceIdToUpdate}`,{
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
                setOpenModalUpdateMaintenance(false)
                const fetchMaintenances = async () => {
                    try {
                        const res = await fetch('/api/maintenance/getmaintenances')
                        const data = await res.json()
                        if(res.ok){
                            setMaintenances(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchMaintenances()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredMaintenances = maintenances.filter(maintenance => 
        maintenance.supplier.toLowerCase().includes(searchTerm) || 
        maintenance.cost.toString().toLowerCase().includes(searchTerm) ||
        maintenance.problem.toLowerCase().includes(searchTerm) ||
        maintenance.jobdetail.toLowerCase().includes(searchTerm) ||
        maintenance.jobtype.toLowerCase().includes(searchTerm) ||
        maintenance.jobdate.toLowerCase().includes(searchTerm) ||
        maintenance.rootcause.toLowerCase().includes(searchTerm) ||
        maintenance.status.toLowerCase().includes(searchTerm) ||
        maintenance.completiondate.toLowerCase().includes(searchTerm) ||
        maintenance.code.toLowerCase().includes(searchTerm) && maintenance.code.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentMaintenances = filteredMaintenances.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredMaintenances.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 生成Excel报告的函数 - 新增
  const generateExcelReport = () => {
    // 准备Excel数据 - 包含所有维护作业字段
    const excelData = maintenances.map(maintenance => ({
      'Job Date': maintenance.jobdate,
      'Job Type': maintenance.jobtype,
      'Item Code': maintenance.code,
      'Problem': maintenance.problem,
      'Job Detail': maintenance.jobdetail,
      'Root Cause': maintenance.rootcause,
      'Supplier': maintenance.supplier,
      'Cost': maintenance.cost,
      'Completion Date': maintenance.completiondate,
      'Status': maintenance.status,
      'Created At': new Date(maintenance.createdAt).toLocaleString(),
      'Updated At': new Date(maintenance.updatedAt).toLocaleString()
    }))

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // Job Date
      { wch: 15 }, // Job Type
      { wch: 15 }, // Item Code
      { wch: 25 }, // Problem
      { wch: 30 }, // Job Detail
      { wch: 25 }, // Root Cause
      { wch: 20 }, // Supplier
      { wch: 10 }, // Cost
      { wch: 15 }, // Completion Date
      { wch: 15 }, // Status
      { wch: 20 }, // Created At
      { wch: 20 }  // Updated At
    ]
    worksheet['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Jobs Report')
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `Maintenance_Jobs_Report_${date}.xlsx`)
  }

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Jobs</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
            <div className='flex gap-2'>
                <Button className='cursor-pointer' onClick={handleCreateJob}>
                  Create job
                </Button>
                <Button className='cursor-pointer' onClick={generateExcelReport} color='green'>
                    Report
                </Button>
            </div>
        </div>

         <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
          <TableHead>
              <TableRow>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job date</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job type</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Completion date</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                  <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {currentMaintenances.map((maintenance,) => (
                <TableRow key={maintenance._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    <TableCell className="align-middle">{maintenance.jobdate}</TableCell>
                    <TableCell className="align-middle">
                      <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          content={
                              <div className="p-3 max-w-xs">
                                  <p className="font-semibold text-sm">Job detail:</p>
                                  <p className="text-xs mb-2">{maintenance.jobdetail}</p>
                              </div>
                          }
                          trigger='hover'
                          placement="top"
                          arrow={false}
                      >
                          <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                              {maintenance.jobtype}
                          </span>
                      </Popover>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          content={
                              <div className="p-3 max-w-xs">
                                  <p className="font-semibold text-sm">Problem:</p>
                                  <p className="text-xs mb-2">{maintenance.problem}</p>
                                  <p className="font-semibold text-sm">Root cause:</p>
                                  <p className="text-xs mb-2">{maintenance.rootcause}</p>
                              </div>
                          }
                          trigger='hover'
                          placement="top"
                          arrow={false}
                      >
                          <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                              {maintenance.code}
                          </span>
                      </Popover>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          content={
                              <div className="p-3 max-w-xs">
                                  <p className="font-semibold text-sm">Cost:</p>
                                  <p className="text-xs mb-2">{maintenance.cost}</p>
                              </div>
                          }
                          trigger='hover'
                          placement="top"
                          arrow={false}
                      >
                          <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                              {maintenance.supplier}
                          </span>
                      </Popover>
                    </TableCell>
                    <TableCell className="align-middle">{maintenance.completiondate}</TableCell>
                    <TableCell className="align-middle">{maintenance.status}</TableCell>
                    <TableCell className="align-middle">
                        <Button outline className='cursor-pointer py-1 px-1 text-sm h-8'  onClick={() => {handleUpdate(maintenance)}}>Edit</Button>
                    </TableCell>
                    <TableCell className="align-middle">
                        <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8'
                        onClick={() => {setMaintenanceIdToDelete(maintenance._id);setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)}}
                        >
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

        <Modal show={openModalCreateJob} onClose={handleCreateJob} popup>
          <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
          <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
              <div className="space-y-6">
                  <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Job</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job type</Label>
                      <Select id="jobtype" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                        <option></option>
                        <option>Breakdown</option>
                        <option>Kaizen</option>
                        <option>Inspect</option>
                        <option>Maintenance</option>
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                        <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                            <option></option>
                        {items.map((item) => (
                        <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                        ))}
                        </Select>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                      <TextInput  type='date' id="jobdate"  onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                        <TextInput id="problem" placeholder='Enter problem' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>
  
                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                        <TextInput id="jobdetail" placeholder='Enter job detail' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                        <TextInput id="rootcause" placeholder='Enter root cause' onChange={handleChange} onFocus={handleFocus} required/>
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
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost</Label>
                        <TextInput id="cost" type='number' min='0' placeholder='Enter cost' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Completion date</Label>
                      <TextInput  type='date' id="completiondate"  onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                      <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                          <option>Minor Complete</option>
                          <option>Minor Incomplete</option>
                          <option>Major Complete</option>
                          <option>Major Incomplete</option>
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

      <Modal show={openModalDeleteMaintenance} size="md" onClose={() => setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)} popup>
        <ModalHeader />
        <ModalBody>
        <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this maintenance job?
            </h3>
            <div className="flex justify-center gap-4">
            <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
            </Button>
            <Button color="alternative" onClick={() => setOpenModalDeleteMaintenance(false)}>
                No, cancel
            </Button>
            </div>
        </div>
        </ModalBody>
      </Modal>

      <Modal show={openModalUpdateMaintenance} onClose={handleUpdate} popup>
          <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}/>
          <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
              <div className="space-y-6">
                  <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Job</h3>
                  <form onSubmit={handleUpdateSubmit}>
                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job type</Label>
                      <Select value={updateFormData.jobtype} id="jobtype" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                        <option></option>
                        <option>Breakdown</option>
                        <option>Kaizen</option>
                        <option>Inspect</option>
                        <option>Maintenance</option>
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                        <Select  value={updateFormData.code} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                            <option></option>
                        {items.map((item) => (
                        <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                        ))}
                        </Select>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                      <TextInput value={updateFormData.jobdate} type='date' id="jobdate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                        <TextInput value={updateFormData.problem} id="problem" placeholder='Enter problem' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>
  
                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                        <TextInput value={updateFormData.jobdetail} id="jobdetail" placeholder='Enter job detail' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                        <TextInput value={updateFormData.rootcause} id="rootcause" placeholder='Enter root cause' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                      <Select value={updateFormData.supplier} id="supplier" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                          <option></option>
                      {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                    ))}
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost</Label>
                        <TextInput value={updateFormData.cost} id="cost" type='number' min='0' placeholder='Enter cost' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Completion date</Label>
                      <TextInput value={updateFormData.completiondate}  type='date' id="completiondate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                      <Select value={updateFormData.status} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                          <option></option>
                          <option>Minor Complete</option>
                          <option>Minor Incomplete</option>
                          <option>Major Complete</option>
                          <option>Major Incomplete</option>
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

export default Maintenance