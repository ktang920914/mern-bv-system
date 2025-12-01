import { useEffect, useState } from 'react'
import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput} from 'flowbite-react'
import useThemeStore from '../themeStore'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from 'react-icons/hi'
import { useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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
    setUpdateFormData({
      material: m.material, 
      quantity: m.quantity, 
      location: m.location,
      palletno: m.palletno, 
      user: m.user, 
      status: m.status
    })
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    if(e.target.id === 'material'|| e.target.id === 'palletno'){
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
    setSearchTerm(e.target.value.toLowerCase())
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

  // 修改 QR 码生成函数，确保使用最新的数据
  const generateQRContent = (material) => {
    // 优先使用后端存储的 QR 码内容
    if (material && material.qrCode) {
      return material.qrCode;
    }
    
    // 备用方案：前端生成（包含所有必要字段）
    return JSON.stringify({
      material: material?.material || '',
      quantity: material?.quantity !== undefined ? material.quantity : 0,
      palletno: material?.palletno || '',
      location: material?.location || '',
      user: material?.user || '',
      status: material?.status || '',
      createdAt: material?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }, null, 2);
  };

  // 移动端卡片组件
  const MaterialCard = ({ material }) => (
    <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
      theme === 'light' 
        ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
    }`}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
            <p className="text-sm font-semibold text-gray-500">Material</p>
        <Popover 
          className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
          content={
            <div className="p-4 text-center">
              <h3 className="font-semibold mb-2">QR Code - {material.material}</h3>
              <QRCodeCanvas value={generateQRContent(material)} size={150} level="M" includeMargin={true}/>
              <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view material details</p>
            </div>
          }
          trigger="hover"
          placement="top"
          arrow={false}
        >
          <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
          }`}>
            {material.material}
          </span>
        </Popover>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Quantity</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{material.quantity}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Status</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{material.status}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">User</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{material.user}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Pallet No</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{material.palletno}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Location</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{material.location}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          outline 
          className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
          onClick={() => handleUpdate(material)}
        >
          Edit
        </Button>
        <Button 
          color='red' 
          outline 
          className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
          onClick={() => {
            setMaterialIdToDelete(material._id)
            setOpenModalDeleteMaterial(!openModalDeleteMaterial)
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  )

  // 生成Excel报告的函数
  const generateExcelReport = () => {
    // 准备Excel数据 - 包含所有物料字段
    const excelData = materials.map(material => ({
      'Material': material.material,
      'Quantity': material.quantity,
      'Pallet No': material.palletno,
      'Location': material.location,
      'User': material.user,
      'Status': material.status,
      'QR Code Content': material.qrCode || generateQRContent(material),
      'Created At': new Date(material.createdAt).toLocaleString(),
      'Updated At': new Date(material.updatedAt).toLocaleString()
    }))

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 20 }, // Material
      { wch: 10 }, // Quantity
      { wch: 12 }, // Pallet No
      { wch: 15 }, // Location
      { wch: 15 }, // User
      { wch: 10 }, // Status
      { wch: 50 }, // QR Code Content
      { wch: 20 }, // Created At
      { wch: 20 }  // Updated At
    ]
    worksheet['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials Report')
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `Materials_Report_${date}.xlsx`)
  }

  return (
    <div className='min-h-screen'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
        <h1 className='text-2xl font-semibold'>Materials</h1>
        <div className='w-full sm:w-auto'>
          <TextInput 
            placeholder='Enter searching' 
            value={searchTerm} 
            onChange={handleSearch}
            className='w-full'
          />
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateMaterial}>
            Create Material
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
                <TableCell className="align-middle">
                  <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    content={
                      <div className="p-4 text-center">
                        <h3 className="font-semibold mb-2">QR Code - {m.material}</h3>
                        <QRCodeCanvas value={generateQRContent(m)} size={150} level="M" includeMargin={true}/>
                        <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view material details</p>
                      </div>
                    }
                    trigger="hover"
                    placement="right"
                    arrow={false}
                  >
                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-blue-300">
                      {m.material}
                    </span>
                  </Popover>
                </TableCell>
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
      )}

      {/* 移动端卡片视图 */}
      {isMobile && (
        <div className="space-y-4">
          {currentMaterials.map((material) => (
            <MaterialCard key={material._id} material={material} />
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
            
            {/* 添加 QR 码显示区域 */}
            <div className="flex justify-center mb-4">
              <div className="text-center">
                <QRCodeCanvas className='text-center'
                  value={generateQRContent(materials.find(material => material._id === materialIdToUpdate) || {})} 
                  size={120} 
                  level="M" 
                  includeMargin={true}
                />
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit}>
              <div>
                <div className="mb-4 block">
                  <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Material</Label>
                  <TextInput value={updateFormData.material} id="material" className='mb-4' placeholder='Enter material' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                </div>
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

export default Materials