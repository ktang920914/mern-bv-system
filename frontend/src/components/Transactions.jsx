import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const Transactions = () => {
  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [openModalCreateTransaction,setOpenModalCreateTransaction] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [items,setItems] = useState([])
  const [extruders,setExtruders] = useState([])
  const [spareparts,setSpareparts] = useState([])
  const [others,setOthers] = useState([])
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
  // 新增状态：选择的物料类型
  const [selectedItemType, setSelectedItemType] = useState('')

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
    const fetchExtruders = async () => {
      try {
        const res = await fetch('/api/machine/getExtruders')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setExtruders(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchExtruders()
  },[currentUser._id])

  useEffect(() => {
    const fetchSpareparts = async () => {
      try {
        const res = await fetch('/api/other/getSpareparts')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setSpareparts(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchSpareparts()
  },[currentUser._id])

  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const res = await fetch('/api/rest/getOthers')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setOthers(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchOthers()
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
    // 重置选择的物料类型
    setSelectedItemType('')
    // 重置表单中的code
    setFormData({...formData, code: ''})
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

  const handleItemTypeChange = (e) => {
    const type = e.target.value
    setSelectedItemType(type)
    // 重置code选择
    setFormData({...formData, code: ''})
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
  const generateExcelReport = async () => {
    try {
      // 使用 ExcelJS 替代 XLSX
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Transactions Report')
      
      // 设置工作表打印选项
      const setupWorksheetPrint = (worksheet, options = {}) => {
        const {
          paperSize = 9,
          orientation = 'landscape',
          margins = {
            left: 0.25,
            right: 0.25,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3
          },
          horizontalCentered = true,
          verticalCentered = false,
          fitToPage = true,
          fitToHeight = 1,
          fitToWidth = 1,
          scale = 100
        } = options

        worksheet.pageSetup = {
          paperSize,
          orientation,
          margins,
          horizontalCentered,
          verticalCentered,
          fitToPage,
          fitToHeight,
          fitToWidth,
          scale,
          showGridLines: false,
          blackAndWhite: false
        }
      }
      
      // 设置工作表打印选项
      setupWorksheetPrint(worksheet, {
        fitToHeight: 1,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: false
      })
      
      // 设置列宽
      worksheet.columns = [
        { width: 5 },    // No.
        { width: 12 },   // Date
        { width: 15 },   // Item Code
        { width: 15 },   // Transaction Type
        { width: 10 },   // Quantity
        { width: 10 },   // Balance
        { width: 15 },   // User
        { width: 10 },   // Status
        { width: 20 },   // Created At
        { width: 20 }    // Updated At
      ]

      // 定义样式
      const headerFont = { name: 'Calibri', size: 11, bold: true }
      const titleFont = { name: 'Arial Black', size: 16, bold: true }
      const defaultFont = { name: 'Calibri', size: 11 }
      const boldFont = { name: 'Calibri', size: 11, bold: true }
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      const centerAlignment = { horizontal: 'center', vertical: 'middle' }
      const leftAlignment = { horizontal: 'left', vertical: 'middle' }
      const rightAlignment = { horizontal: 'right', vertical: 'middle' }

      // 标题行
      const titleRow = worksheet.getRow(1)
      titleRow.height = 30
      titleRow.getCell(1).value = 'TRANSACTIONS REPORT'
      titleRow.getCell(1).font = titleFont
      titleRow.getCell(1).alignment = centerAlignment
      worksheet.mergeCells('A1:J1')

      // 添加过滤信息行
      const filterRow = worksheet.getRow(2)
      filterRow.height = 20
      
      // 如果有搜索词，显示过滤条件
      if (searchTerm) {
        filterRow.getCell(1).value = `Filter: "${searchTerm}"`
        worksheet.mergeCells('A2:J2')
        filterRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true }
        filterRow.getCell(1).alignment = leftAlignment
        filterRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCC' } // 浅黄色背景
        }
        filterRow.getCell(1).border = {
          bottom: { style: 'thin' }
        }
      }

      // 计算表头行号（考虑是否有过滤行）
      const headerRowNum = searchTerm ? 3 : 2
      
      // 表头行
      const headerRow = worksheet.getRow(headerRowNum)
      headerRow.height = 25
      const headers = [
        'No.', 'Date', 'Item Code', 'Transaction Type', 'Quantity', 
        'Balance', 'User', 'Status', 'Created At', 'Updated At'
      ]
      
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = headerFont
        cell.alignment = centerAlignment
        cell.border = borderStyle
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' } // 浅灰色背景
        }
      })

      // 准备数据
      const excelData = records.map(record => ({
        'Date': record.date,
        'Item Code': record.code,
        'Transaction Type': record.transaction,
        'Quantity': Number(record.quantity) || 0,
        'Balance': Number(record.balance) || 0,
        'User': record.user,
        'Status': record.status,
        'Created At': new Date(record.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        'Updated At': new Date(record.updatedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }))

      // 数据行
      let rowIndex = headerRowNum + 1
      
      excelData.forEach((record, index) => {
        const row = worksheet.getRow(rowIndex)
        row.height = 20
        
        const rowData = [
          index + 1,
          record.Date,
          record['Item Code'],
          record['Transaction Type'],
          record.Quantity,
          record.Balance,
          record.User,
          record.Status,
          record['Created At'],
          record['Updated At']
        ]

        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1)
          cell.value = value
          cell.font = defaultFont
          cell.border = borderStyle
          
          // 不同的列对齐方式
          if (colIndex === 0 || colIndex === 4 || colIndex === 5) { // No., Quantity, Balance 列居右
            cell.alignment = rightAlignment
          } else if (colIndex === 7) { // Status 列居中
            cell.alignment = centerAlignment
          } else if (colIndex === 1 || colIndex === 2 || colIndex === 3 || colIndex === 6) { // 文本列左对齐
            cell.alignment = leftAlignment
          } else {
            cell.alignment = centerAlignment
          }
          
          // 为数值列添加千位分隔符
          if (colIndex === 4 || colIndex === 5) { // Quantity 和 Balance 列
            cell.numFmt = '#,##0'
          }
          
          // 为状态列添加颜色
          if (colIndex === 7) { // Status 列
            if (value === 'Active') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC6EFCE' } // 浅绿色
              }
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF006100' } }
            } else if (value === 'Inactive') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC7CE' } // 浅红色
              }
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }
            }
          }
          
          // 为交易类型列添加颜色
          if (colIndex === 3) { // Transaction Type 列
            if (value === 'In') {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF006100' } } // 绿色
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC6EFCE' } // 浅绿色
              }
            } else if (value === 'Out') {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC7CE' } // 浅红色
              }
            }
          }
          
          // 为数量列添加颜色（根据值大小）
          if (colIndex === 4) { // Quantity 列
            const quantity = Number(value) || 0
            if (quantity > 100) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
            } else if (quantity > 50) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } } // 橙色
            } else if (quantity === 0) {
              cell.font = { ...defaultFont, italic: true, color: { argb: 'FF808080' } } // 灰色
            }
          }
          
          // 为余额列添加颜色（根据值大小）
          if (colIndex === 5) { // Balance 列
            const balance = Number(value) || 0
            if (balance > 1000) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
            } else if (balance > 500) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } } // 橙色
            } else if (balance === 0) {
              cell.font = { ...defaultFont, italic: true, color: { argb: 'FF808080' } } // 灰色
            }
          }
          
          // 为代码列添加特殊样式
          if (colIndex === 2) { // Item Code 列
            cell.font = { ...defaultFont, bold: true }
          }
          
          // 隔行着色
          if (rowIndex % 2 === 0) {
            if (colIndex !== 3 && colIndex !== 4 && colIndex !== 5 && colIndex !== 7) { // 保持特殊列的颜色
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F8F8' } // 更浅的灰色
              }
            }
          }
        })

        rowIndex++
      })

      // 如果没有数据，添加提示行
      if (excelData.length === 0) {
        const row = worksheet.getRow(rowIndex)
        row.getCell(1).value = 'No transaction data available'
        worksheet.mergeCells(`A${rowIndex}:J${rowIndex}`)
        row.getCell(1).alignment = centerAlignment
        row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } }
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' } // 浅黄色
        }
        row.getCell(1).border = borderStyle
        rowIndex++
      }

      // 在表格上方添加过滤（Excel的自动筛选功能）
      if (excelData.length > 0) {
        // 设置自动筛选范围（从表头到最后一行）
        const filterRange = `A${headerRowNum}:J${rowIndex - 1}`
        worksheet.autoFilter = filterRange
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // 使用当前日期作为文件名
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '_')
      saveAs(blob, `Transactions_Report_${date}.xlsx`)

    } catch (error) {
      console.error('Error generating Excel report:', error)
      alert('Failed to generate Excel report. Please try again.')
    }
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

      {/* 模态框 - 修改了创建交易的表单 */}
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

              {/* 新增：选择物料类型 */}
              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item Type</Label>
                <Select 
                  value={selectedItemType} 
                  onChange={handleItemTypeChange}
                  onFocus={handleFocus} 
                  required
                >
                  <option value="">Select Item Type</option>
                  <option value="extruder">Extruders</option>
                  <option value="inventory">Items</option>
                  <option value="sparepart">Spareparts</option>
                  <option value="other">Others</option>
                </Select>
              </div>
                
              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item Code</Label>
                <Select 
                  id="code" 
                  className='mb-4' 
                  onChange={handleChange} 
                  onFocus={handleFocus} 
                  value={formData.code || ''}
                  disabled={!selectedItemType}
                  required
                >
                  <option value="">Select Item Code</option>
                  {selectedItemType === 'extruder' && extruders.map((extruder) => (
                    <option key={extruder._id} value={extruder.code}>
                      {`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}
                    </option>
                  ))}
                  {selectedItemType === 'inventory' && items.map((item) => (
                    <option key={item._id} value={item.code}>
                      {`${item.code} --- ${item.type} --- ${item.status}`}
                    </option>
                  ))}
                  {selectedItemType === 'sparepart' && spareparts.map((sparepart) => (
                    <option key={sparepart._id} value={sparepart.code}>
                      {`${sparepart.code} --- ${sparepart.type} --- ${sparepart.status}`}
                    </option>
                  ))}
                  {selectedItemType === 'other' && others.map((other) => (
                    <option key={other._id} value={other.code}>
                      {`${other.code} --- ${other.type} --- ${other.status}`}
                    </option>
                  ))}
                </Select>
                {selectedItemType && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {selectedItemType} items only
                  </p>
                )}
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Transaction</Label>
                <Select id="transaction" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option value="">Select Transaction Type</option>
                  <option value="In">In</option>
                  <option value="Out">Out</option>
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                <TextInput id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>User</Label>
                <Select id="user" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option value="">Select User</option>
                  <option value={currentUser.username}>{currentUser.username}</option>
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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

      {/* 其他模态框保持不变 */}
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
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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