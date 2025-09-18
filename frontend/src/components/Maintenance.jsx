import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'

const Maintenance = () => {

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
  const [searchTerm,setSearchTerm] = useState('')
  const [currentPage,setCurrentPage] = useState(1)
  const [itemsPage] = useState(7)

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
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentMaintenances = filteredMaintenances.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredMaintenances.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Jobs</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
                <Button className='cursor-pointer' onClick={handleCreateJob}>
                  Create job
                </Button>
        </div>

         <Table hoverable>
          <TableHead>
              <TableRow>
                  <TableHeadCell>Job date</TableHeadCell>
                  <TableHeadCell>Job type</TableHeadCell>
                  <TableHeadCell>Machine</TableHeadCell>
                  <TableHeadCell>Supplier</TableHeadCell>
                  <TableHeadCell>Completion date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Edit</TableHeadCell>
                  <TableHeadCell>Delete</TableHeadCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {currentMaintenances.map((maintenance,) => (
                <TableRow key={maintenance._id}>
                    <TableCell className="align-middle">{maintenance.jobdate}</TableCell>
                    <TableCell className="align-middle">
                      <Popover
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
                      <Popover
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
                      <Popover
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
                        <Button outline className='cursor-pointer'  onClick={() => {handleUpdate(maintenance)}}>Edit</Button>
                    </TableCell>
                    <TableCell className="align-middle">
                        <Button color='red' outline className='cursor-pointer'
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

        <Modal show={openModalCreateJob} onClose={handleCreateJob} popup>
          <ModalHeader />
          <ModalBody>
              <div className="space-y-6">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Job</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4 block">
                      <Label>Job type</Label>
                      <Select id="jobtype" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                        <option></option>
                        <option>Breakdown</option>
                        <option>Kaizen</option>
                        <option>Inspect</option>
                        <option>Maintenance</option>
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label>Machine</Label>
                        <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                            <option></option>
                        {items.map((item) => (
                        <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                        ))}
                        </Select>
                    </div>

                    <div className="mb-4 block">
                      <Label>Job date</Label>
                      <TextInput  type='date' id="jobdate"  onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label>Problem</Label>
                        <TextInput id="problem" placeholder='Enter problem' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>
  
                    <div className="mb-4 block">
                        <Label>Job detail</Label>
                        <TextInput id="jobdetail" placeholder='Enter job detail' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label>Root cause</Label>
                        <TextInput id="rootcause" placeholder='Enter root cause' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Supplier</Label>
                      <Select id="supplier" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                      {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                    ))}
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label>Cost</Label>
                        <TextInput id="cost" type='number' min='0' placeholder='Enter cost' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Completion date</Label>
                      <TextInput  type='date' id="completiondate"  onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Status</Label>
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
            Are you sure you want to delete this maintenance?
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
          <ModalHeader />
          <ModalBody>
              <div className="space-y-6">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Job</h3>
                  <form onSubmit={handleUpdateSubmit}>
                    <div className="mb-4 block">
                      <Label>Job type</Label>
                      <Select value={updateFormData.jobtype} id="jobtype" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                        <option></option>
                        <option>Breakdown</option>
                        <option>Kaizen</option>
                        <option>Inspect</option>
                        <option>Maintenance</option>
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label>Machine</Label>
                        <Select  value={updateFormData.code} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                            <option></option>
                        {items.map((item) => (
                        <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                        ))}
                        </Select>
                    </div>

                    <div className="mb-4 block">
                      <Label>Job date</Label>
                      <TextInput value={updateFormData.jobdate} type='date' id="jobdate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label>Problem</Label>
                        <TextInput value={updateFormData.problem} id="problem" placeholder='Enter problem' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>
  
                    <div className="mb-4 block">
                        <Label>Job detail</Label>
                        <TextInput value={updateFormData.jobdetail} id="jobdetail" placeholder='Enter job detail' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                        <Label>Root cause</Label>
                        <TextInput value={updateFormData.rootcause} id="rootcause" placeholder='Enter root cause' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Supplier</Label>
                      <Select value={updateFormData.supplier} id="supplier" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                          <option></option>
                      {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                    ))}
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label>Cost</Label>
                        <TextInput value={updateFormData.cost} id="cost" type='number' min='0' placeholder='Enter cost' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Completion date</Label>
                      <TextInput value={updateFormData.completiondate}  type='date' id="completiondate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label>Status</Label>
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