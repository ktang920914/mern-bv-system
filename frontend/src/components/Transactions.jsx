import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const Transactions = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [openModalCreateTransaction,setOpenModalCreateTransaction] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [items,setItems] = useState([])
  const [records,setRecords] = useState([])
  const [openModalDeleteRecord,setOpenModalDeleteRecord] = useState(false)
  const [openModalUpdateRecord,setOpenModalUpdateRecord] = useState(false)
  const [recordIdToDelete,setRecordIdToDelete] = useState('')
  const [recordIdToUpdate,setRecordIdToUpdate] = useState('')
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
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/transaction/getrecords')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setRecords(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchRecords()
  },[currentUser._id])

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleCreateTransaction = () => {
    setOpenModalCreateTransaction(!openModalCreateTransaction)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/transaction/record',{
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
        setOpenModalCreateTransaction(false)
        const fetchRecords = async () => {
          try {
            const res = await fetch('/api/transaction/getrecords')
            const data = await res.json()
            if(data.success === false){
              console.log(data.message)
            }
            if(res.ok){
              setRecords(data)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchRecords()
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleDeleteTransaction = () => {
    setOpenModalDeleteRecord(!openModalDeleteRecord)
    setErrorMessage(null)
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/transaction/delete/${recordIdToDelete}`,{
        method:'DELETE',
      })
      const data = await res.json()
      if(data.success === false){
        setErrorMessage(data.message)
        console.log(data.message)
      }
      if(res.ok){
        setOpenModalDeleteRecord(false)
        setRecords((prev) => prev.filter((record) => record._id !== recordIdToDelete))
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleUpdate = (record) => {
    setRecordIdToUpdate(record._id)
    setUpdateFormData({quantity: record.quantity,status:record.status})
    setOpenModalUpdateRecord(!openModalUpdateRecord)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/transaction/update/${recordIdToUpdate}`,{
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
        setOpenModalUpdateRecord(false)
        const fetchRecords = async () => {
          try {
            const res = await fetch('/api/transaction/getrecords')
            const data = await res.json()
            if(res.ok){
              setRecords(data)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchRecords()
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
    setCurrentPage(1)
  }

  const filteredRecords = records.filter(record => 
    record.date.toLowerCase().includes(searchTerm) ||
    record.code.toLowerCase().includes(searchTerm) && record.code.toLowerCase() === searchTerm ||
    record.transaction.toLowerCase().includes(searchTerm) && record.transaction.toLowerCase() === searchTerm ||
    record.quantity.toString().toLowerCase().includes(searchTerm) ||
    record.balance.toString().toLowerCase().includes(searchTerm) ||
    record.user.toLowerCase().includes(searchTerm) && record.user.toString().toLowerCase() === searchTerm ||
    record.status.toLowerCase().includes(searchTerm) && record.status.toString().toLowerCase() === searchTerm
  );

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const indexOfLastItem = currentPage * itemsPage
  const indexOfFirstItem = indexOfLastItem - itemsPage
  const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem)
  const totalEntries = filteredRecords.length
  const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
  const showingTo = Math.min(indexOfLastItem, totalEntries)

  // 移动端卡片组件
  const TransactionCard = ({ record }) => (
    <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
      theme === 'light' 
        ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
    }`}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">Date</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.date}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Transaction</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.transaction}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Quantity</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.quantity}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Balance</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.balance}</p>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Item Code</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.code}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">User</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.user}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Status</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{record.status}</p>
        </div>
      </div>

      {currentUser.role === 'Admin' && (
        <div className="flex gap-2">
          <Button 
            outline 
            className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
            onClick={() => handleUpdate(record)}
          >
            Edit
          </Button>
          <Button 
            color='red' 
            outline 
            className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
            onClick={() => {
              setRecordIdToDelete(record._id)
              handleDeleteTransaction()
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  )

  // 生成Excel报告的函数
  const generateExcelReport = () => {
    // 准备Excel数据 - 包含所有交易字段
    const excelData = records.map(record => ({
      'Date': record.date,
      'Item Code': record.code,
      'Transaction Type': record.transaction,
      'Quantity': record.quantity,
      'Balance': record.balance,
      'User': record.user,
      'Status': record.status,
      'Created At': new Date(record.createdAt).toLocaleString(),
      'Updated At': new Date(record.updatedAt).toLocaleString()
    }))

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 15 }, // Item Code
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions Report')
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `Transactions_Report_${date}.xlsx`)
  }

  return (
    <div className='min-h-screen'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
        <h1 className='text-2xl font-semibold'>Transactions</h1>
        <div className='w-full sm:w-auto'>
          <TextInput 
            placeholder='Enter searching' 
            value={searchTerm} 
            onChange={handleSearch}
            className='w-full'
          />
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateTransaction}>
            Create Transaction
          </Button>
          <Button className='cursor-pointer flex-1 sm:flex-none' onClick={generateExcelReport} color='green'>
            Report
          </Button>
        </div>
      </div>

      {/* 桌面端表格视图 */}
      {!isMobile && (
        <Table hoverable className="[&_td]:py-1 [&_th]:py-2"> 
          <TableHead>
            <TableRow>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Code</TableHeadCell>
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
          <TableBody>
            {currentRecords.map((record) => (
              <TableRow key={record._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.code}</TableCell>
                <TableCell>{record.transaction}</TableCell>
                <TableCell>{record.quantity}</TableCell>
                <TableCell>{record.balance}</TableCell>
                <TableCell>{record.user}</TableCell>
                <TableCell>{record.status}</TableCell>
                {currentUser.role === 'Admin' && (
                  <TableCell>
                    <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(record)}}>Edit</Button>
                  </TableCell>
                )}
                {currentUser.role === 'Admin' && (
                  <TableCell>
                    <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setRecordIdToDelete(record._id);handleDeleteTransaction()}}>Delete</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 移动端卡片视图 */}
      {isMobile && (
        <div className="space-y-4">
          {currentRecords.map((record) => (
            <TransactionCard key={record._id} record={record} />
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
      <Modal show={openModalCreateTransaction} onClose={handleCreateTransaction} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Transaction</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <div className="mb-4 block">
                  <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                  <TextInput  type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                </div>
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

      <Modal show={openModalDeleteRecord} size="md" onClose={() => setOpenModalDeleteRecord(!openModalDeleteRecord)} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this transaction?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
              </Button>
              <Button color="alternative" onClick={() => setOpenModalDeleteRecord(false)}>
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

      <Modal show={openModalUpdateRecord} size='md' onClose={() => setOpenModalUpdateRecord(!openModalUpdateRecord)} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Transaction</h3>
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

export default Transactions