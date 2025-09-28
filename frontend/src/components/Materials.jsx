import { useEffect, useState } from 'react'
import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput} from 'flowbite-react'
import useThemeStore from '../themeStore'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from 'react-icons/hi'
import { useSearchParams } from 'react-router-dom';

const Materials = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [openModalCreateMaterial,setOpenModalCreateMaterial] = useState(false)
  const [openModalDeleteMaterial,setOpenModalDeleteMaterial] = useState(false)
  const [openModalUpdateMaterial,setOpenModalUpdateMaterial] = useState(false)
  const [materialIdToDelete,setMaterialIdToDelete] = useState('')
  const [materialIdToUpdate,setMaterialIdToUpdate] = useState('')
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [materials,setMaterials] = useState([])
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
      const fetchMaterials = async () => {
          try {
              const res = await fetch('/api/raw/getmaterials')
              const data = await res.json()
              if(data.success === false){
                  console.log(data.message)
              }
              if(res.ok){
                  setMaterials(data)
              }
          } catch (error) {
              console.log(error.message)
          }
      }
      fetchMaterials()
  },[currentUser._id])

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleCreateMaterial = () => {
    setOpenModalCreateMaterial(!openModalCreateMaterial)
    setErrorMessage(null)
    setErrorMessage(false)
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/raw/material',{
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
          setOpenModalCreateMaterial(false)
          const fetchMaterials = async () => {
              try {
                  const res = await fetch('/api/raw/getmaterials')
                  const data = await res.json()
                  if(data.success === false){
                      console.log(data.message)
                  }
                  if(res.ok){
                      setMaterials(data)
                  }
              } catch (error) {
                  console.log(error.message)
              }
          }
          fetchMaterials()
        }
    } catch (error) {
        console.log(error.message)
    }
  }

  const handleDelete = async () => {
    setOpenModalDeleteMaterial(false)
    try {
        const res = await fetch(`/api/raw/delete/${materialIdToDelete}`,{
            method:'DELETE',
        })
        const data = await res.json()
        if(data.success === false){
            console.log(data.message)
        }
        if(res.ok){
            setMaterials((prev) => prev.filter((material) => material._id !== materialIdToDelete))
        }
    } catch (error) {
        console.log(error.message)
    }
  }

  const handleUpdate = (m) => {
        setMaterialIdToUpdate(m._id)
        setOpenModalUpdateMaterial(!openModalUpdateMaterial)
        setUpdateFormData({material:m.material, /*quantity:m.quantity,*/ location:m.location,
            palletno:m.palletno, user:m.user, status:m.status
        })
        setErrorMessage(null)
        setLoading(false)
    }

  const handleUpdateChange = (e) => {
    if(e.target.id === 'material'){
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
      }else{
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
      try {
          const res = await fetch(`/api/raw/update/${materialIdToUpdate}`,{
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
              setOpenModalUpdateMaterial(false)
              const fetchMaterials = async () => {
                  try {
                      const res = await fetch('/api/raw/getmaterials')
                      const data = await res.json()
                      if(res.ok){
                          setMaterials(data)
                      }
                  } catch (error) {
                      console.log(error.message)
                  }
              }
              fetchMaterials()
          }
      } catch (error) {
          console.log(error.message)
      }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim())
  }

  const filteredMaterials = materials.filter(material => 
        material.material.toLowerCase().includes(searchTerm) || 
        material.quantity.toString().toLowerCase().includes(searchTerm) ||
        material.location.toLowerCase().includes(searchTerm) || 
        material.user.toLowerCase().includes(searchTerm) || 
        material.palletno.toLowerCase().includes(searchTerm) ||
        material.status.toLowerCase().includes(searchTerm) && material.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentMaterials = filteredMaterials.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredMaterials.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-semibold'>Materials</h1>
          <div>
              <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
          </div>
          <Button className='cursor-pointer' onClick={handleCreateMaterial}>Create Material</Button>
      </div>

      <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
        <TableHead>
            <TableRow>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Material</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Location</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>User</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {currentMaterials.map((m) => (
                <TableRow key={m._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    <TableCell className="align-middle">{m.material}</TableCell>
                    <TableCell className="align-middle">{m.quantity}</TableCell>
                    <TableCell className="align-middle">
                      <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                          content={
                              <div className="p-3 max-w-xs">
                                  <p className="font-semibold text-sm">Pallet no:</p>
                                  <p className="text-xs">{m.palletno}</p>
                              </div>
                          }
                          trigger='hover'
                          placement="right"
                          arrow={false}
                      >
                          <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                              {m.location}
                          </span>
                      </Popover>
                    </TableCell>
                    <TableCell className="align-middle">{m.user}</TableCell>
                    <TableCell className="align-middle">{m.status}</TableCell>
                    <TableCell className="align-middle">
                        <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(m)}}>Edit</Button>
                    </TableCell>
                    <TableCell className="align-middle">
                        <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8'
                        onClick={() => {setMaterialIdToDelete(m._id);setOpenModalDeleteMaterial(!openModalDeleteMaterial)}}
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

      <Modal show={openModalCreateMaterial} onClose={handleCreateMaterial} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
            <div className="space-y-6">
                <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Material</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Material</Label>
                            <TextInput id="material" className='mb-4' placeholder='Enter material' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>
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

    <Modal show={openModalDeleteMaterial} size="md" onClose={() => setOpenModalDeleteMaterial(!openModalDeleteMaterial)} popup>
      <ModalHeader />
      <ModalBody>
      <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
          Are you sure you want to delete this material?
          </h3>
          <div className="flex justify-center gap-4">
          <Button color="red" onClick={handleDelete}>
              Yes, I'm sure
          </Button>
          <Button color="alternative" onClick={() => setOpenModalDeleteMaterial(false)}>
              No, cancel
          </Button>
          </div>
      </div>
      </ModalBody>
  </Modal>

  <Modal show={openModalUpdateMaterial} onClose={() => setOpenModalUpdateMaterial(!openModalUpdateMaterial)} popup>
    <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
    <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
        <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Material</h3>
            <form onSubmit={handleUpdateSubmit}>
                <div>
                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Material</Label>
                        <TextInput defaultValue={updateFormData.material} id="material" className='mb-4' placeholder='Enter material' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                    </div>
                </div>
                    
                {/*<div className="mb-4 block">
                    <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                    <TextInput defaultValue={updateFormData.quantity} id="quantity" type='number' min='0' className='mb-4' placeholder='Enter quantity' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                </div>*/}

                <div className="mb-4 block">
                    <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Pallet no</Label>
                    <TextInput defaultValue={updateFormData.palletno}  id="palletno" className='mb-4' placeholder='Enter pallet no' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                </div>

                <div className="mb-4 block">
                    <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label>
                    <Select defaultValue={updateFormData.location}  id="location" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
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
                    <Select defaultValue={updateFormData.user} id="user" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                        <option></option>
                        <option>{currentUser.username}</option>
                        
                    </Select>
                </div>

                <div className="mb-4 block">
                    <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                    <Select defaultValue={updateFormData.status}  id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
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

export default Materials