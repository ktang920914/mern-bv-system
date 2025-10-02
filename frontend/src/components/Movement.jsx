import { TextInput, Button, Table, TableHead, TableHeadCell, TableRow, Modal, ModalHeader, ModalBody, Label, Select, Spinner, Alert, TableBody, TableCell, Pagination} from "flowbite-react";
import { useEffect, useState } from "react";
import useThemeStore from "../themeStore";
import useUserstore from "../store";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx' // 新增导入
import { saveAs } from 'file-saver' // 新增导入

const Movement = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [openModalCreateMovement,setOpenModalCreateMovement] = useState(false)
  const [openModalDeleteMovement,setOpenModalDeleteMovement] = useState(false)
  const [openModalUpdateMovement,setOpenModalUpdateMovement] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [products,setProducts] = useState([])
  const [materials,setMaterials] = useState([])
  const [movements,setMovements] = useState([])
  const [movementIdToDelete,setMovementIdToDelete] = useState('')
  const [movementIdToUpdate,setMovementIdToUpdate] = useState('')
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

    useEffect(() => {
      const fetchMovements = async () => {
          try {
              const res = await fetch('/api/stock/getmovements')
              const data = await res.json()
              if(data.success === false){
                  console.log(data.message)
              }
              if(res.ok){
                  setMovements(data)
              }
          } catch (error) {
              console.log(error.message)
          }
      }
      fetchMovements()
    },[currentUser._id])

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleCreateMovement = () => {
    setOpenModalCreateMovement(!openModalCreateMovement)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const selectedValue = formData.item
    if (selectedValue.startsWith('product_')) {
        const product = selectedValue.replace('product_', '')
        // 处理产品逻辑
    } else if (selectedValue.startsWith('material_')) {
        const material = selectedValue.replace('material_', '')
        // 处理材料逻辑
    }
      try {
          const res = await fetch('/api/stock/movement',{
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
              setOpenModalCreateMovement(false)
              const fetchMovements = async () => {
                  try {
                      const res = await fetch('/api/stock/getmovements')
                      const data = await res.json()
                      if(data.success === false){
                          console.log(data.message)
                      }
                      if(res.ok){
                          setMovements(data)
                      }
                  } catch (error) {
                      console.log(error.message)
                  }
              }
              fetchMovements()
          }
      } catch (error) {
          console.log(error.message)
      }
  }

  const handleDeleteMovement = () => {
    setOpenModalDeleteMovement(!openModalDeleteMovement)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/stock/delete/${movementIdToDelete}`,{
          method:'DELETE',
      })
      const data = await res.json()
      if(data.success === false){
        setErrorMessage(data.message)
        console.log(data.message)
      }
      if(res.ok){
        setOpenModalDeleteMovement(false)
        setMovements((prev) => prev.filter((movement) => movement._id !== movementIdToDelete))
      }
  } catch (error) {
      console.log(error.message)
  }
  }

  const handleUpdate = (m) => {
    setMovementIdToUpdate(m._id)
    setUpdateFormData({quantity: m.quantity,status:m.status})
    setOpenModalUpdateMovement(!openModalUpdateMovement)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
      try {
          const res = await fetch(`/api/stock/update/${movementIdToUpdate}`,{
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
              setOpenModalUpdateMovement(false)
              const fetchMovements = async () => {
                  try {
                      const res = await fetch('/api/stock/getmovements')
                      const data = await res.json()
                      if(res.ok){
                          setMovements(data)
                      }
                  } catch (error) {
                      console.log(error.message)
                  }
              }
              fetchMovements()
          }
      } catch (error) {
          console.log(error.message)
      }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim())
  }

  const filteredMovements = movements.filter(movement => 
        movement.date.toLowerCase().includes(searchTerm) || 
        movement.item.toLowerCase().includes(searchTerm) || 
        movement.quantity.toString().toLowerCase().includes(searchTerm) || 
        movement.transaction.toLowerCase().includes(searchTerm) || 
        movement.user.toLowerCase().includes(searchTerm) || 
        movement.balance.toString().toLowerCase().includes(searchTerm) ||
        movement.status.toLowerCase().includes(searchTerm) && movement.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentMovements = filteredMovements.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredMovements.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 生成Excel报告的函数 - 新增
  const generateExcelReport = () => {
    // 准备Excel数据 - 包含所有库存移动字段
    const excelData = movements.map(movement => ({
      'Date': movement.date,
      'Stock Item': movement.item,
      'Transaction Type': movement.transaction,
      'Quantity': movement.quantity,
      'Balance': movement.balance,
      'User': movement.user,
      'Status': movement.status,
      'Created At': new Date(movement.createdAt).toLocaleString(),
      'Updated At': new Date(movement.updatedAt).toLocaleString()
    }))

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Stock Item
      { wch: 15 }, // Transaction Type
      { wch: 10 }, // Quantity
      { wch: 10 }, // Balance
      { wch: 15 }, // User
      { wch: 10 }, // Status
      { wch: 20 }, // Created At
      { wch: 20 }  // Updated At
    ]
    worksheet['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements Report')
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `Stock_Movements_Report_${date}.xlsx`)
  }

  return (
    <div className="min-h-screen">
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-semibold'>Movements</h1>
          <div>
              <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
          </div>
          <div className="flex gap-2">
          <Button className='cursor-pointer' onClick={handleCreateMovement}>Create movement</Button>
          <Button className='cursor-pointer' color='green' onClick={generateExcelReport}>Report</Button>
          </div>
        </div>

        <Table hoverable className="[&_td]:py-1 [&_th]:py-2"> 
        <TableHead>
          <TableRow>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Stock</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Transaction</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Balance</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>User</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
            {currentUser.role === 'Admin' && (
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
            )}
            {currentUser.role === 'Admin' && (
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
            )}
          </TableRow>
        </TableHead>
        {currentMovements.map((m) => (
          <TableBody key={m._id}>
            <TableRow className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              <TableCell>{m.date}</TableCell>
              <TableCell>{m.item}</TableCell>
              <TableCell>{m.transaction}</TableCell>
              <TableCell>{m.quantity}</TableCell>
              <TableCell>{m.balance}</TableCell>
              <TableCell>{m.user}</TableCell>
              <TableCell>{m.status}</TableCell>
              {currentUser.role === 'Admin' && (
                <TableCell  >
                  <Button outline className='cursor-pointer py-1 px-1 text-sm h-8'
                  onClick={() => {handleUpdate(m)}}
                  >Edit</Button>
                </TableCell>
              )}
              {currentUser.role === 'Admin' && (
                <TableCell>
                  <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setMovementIdToDelete(m._id);handleDeleteMovement()}}>Delete</Button>
                </TableCell>
              )}
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

        <Modal show={openModalCreateMovement} onClose={handleCreateMovement} popup>
          <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
          <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
              <div className="space-y-6">
                  <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Movement</h3>
                  <form onSubmit={handleSubmit}>
                      <div>
                          <div className="mb-4 block">
                              <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                              <TextInput  type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                          </div>
                      </div>
                          
                      <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Stock</Label>
                        <Select id="item" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                          
                          {/* Products */}
                          {products.map((p) => (
                              <option key={p._id} value={`product_${p.colourcode}`}>
                                  {`[Product] ${p.colourcode}`}
                              </option>
                          ))}
                          
                          {/* Materials */}
                          {materials.map((m) => (
                              <option key={m._id} value={`material_${m.material}`}>
                                  {`[Material] ${m.material}`}
                              </option>
                          ))}
                        </Select>
                      </div>
  
                      <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Transaction</Label>
                        <Select id="transaction" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                            <option></option>
                            <option>In</option>
                            <option>Out</option>
                        </Select>
                      </div>
  
                      <div className="mb-4 block">
                          <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                          <TextInput id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
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

        <Modal show={openModalDeleteMovement} size="md" onClose={() => setOpenModalDeleteMovement(!openModalDeleteMovement)} popup>
          <ModalHeader />
          <ModalBody>
          <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this movement?
              </h3>
              <div className="flex justify-center gap-4">
              <Button color="red" onClick={handleDelete}>
                  Yes, I'm sure
              </Button>
              <Button color="alternative" onClick={() => setOpenModalDeleteMovement(false)}>
                  No, cancel
              </Button>
              </div>
          </div>
          {
            errorMessage && (
                <Alert color='failure' className='mt-4 font-semibold'>
                    {errorMessage}
                </Alert>
            )
          }
          </ModalBody>
        </Modal>

        <Modal show={openModalUpdateMovement} size='md' onClose={() => setOpenModalUpdateMovement(!openModalUpdateMovement)} popup>
          <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
          <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
              <div className="space-y-6">
                  <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Movement</h3>
                  <form onSubmit={handleUpdateSubmit}>
                      <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                        <TextInput value={updateFormData.quantity || ''} id="quantity" type='number' placeholder='Enter balance' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                      </div>
  
                      <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                        <Select value={updateFormData.status || ''} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
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

export default Movement