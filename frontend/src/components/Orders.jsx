import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'


const Orders = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [openModalCreateOrder,setOpenModalCreateOrder] = useState(false)
    const [openModalDeleteOrder,setOpenModalDeleteOrder] = useState(false)
    const [openModalUpdateOrder,setOpenModalUpdateOrder] = useState(false)
    const [formData,setFormData] = useState({})
    const [updateFormData,setUpdateFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [suppliers,setSuppliers] = useState([])
    const [orders,setOrders] = useState([])
    const [orderIdToDelete,setOrderIdToDelete] = useState('')
    const [orderIdToUpdate,setOrderIdToUpdate] = useState('')
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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/request/getorders')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setOrders(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchOrders()
    },[currentUser._id])

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleCreateOrder = () => {
        setOpenModalCreateOrder(!openModalCreateOrder)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/request/order',{
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
                setOpenModalCreateOrder(false)
                const fetchOrders = async () => {
                    try {
                        const res = await fetch('/api/request/getorders')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setOrders(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchOrders()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteOrder(false)
        try {
            const res = await fetch(`/api/request/delete/${orderIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setOrders((prev) => prev.filter((order) => order._id !== orderIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (order) => {
        setOrderIdToUpdate(order._id)
        setUpdateFormData({date: order.date, supplier: order.supplier, doc: order.doc, docno: order.docno, item: order.item,
            quantity: order.quantity, amount: order.amount, costcategory: order.costcategory, status: order.status
        })
        setOpenModalUpdateOrder(!openModalUpdateOrder)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'item'||e.target.id === 'docno'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/request/update/${orderIdToUpdate}`,{
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
                setOpenModalUpdateOrder(false)
                const fetchOrders = async () => {
                    try {
                        const res = await fetch('/api/request/getorders')
                        const data = await res.json()
                        if(res.ok){
                            setOrders(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchOrders()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
  }

  const filteredOrders = orders.filter(order => 
      order.date.toLowerCase().includes(searchTerm) ||
      order.supplier.toLowerCase().includes(searchTerm) ||
      order.doc.toLowerCase().includes(searchTerm) ||
      order.docno.toLowerCase().includes(searchTerm) ||
      order.costcategory.toLowerCase().includes(searchTerm) ||
      order.item.toLowerCase().includes(searchTerm) ||
      order.quantity.toString().toLowerCase().includes(searchTerm) ||
      order.amount.toString().toLowerCase().includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm) && order.status.toString().toLowerCase() === searchTerm
    );

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredOrders.length
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
    const OrderCard = ({ order }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Date</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{order.date}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{order.status}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Quantity</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{order.quantity}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Amount</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{order.amount}</p>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Supplier</p>
                <Popover 
                    className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                    content={
                        <div className="p-3 max-w-xs">
                            <p className="font-semibold text-sm">Doc no:</p>
                            <p className="text-xs mb-2">{order.docno}</p>
                            <p className="font-semibold text-sm">Doc:</p>
                            <p className="text-xs mb-2">{order.doc}</p>
                            <p className="font-semibold text-sm">Cost category:</p>
                            <p className="text-xs mb-2">{order.costcategory}</p>
                        </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                >
                    <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                        theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                    }`}>
                        {order.supplier}
                    </span>
                </Popover>
            </div>

            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Item</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{order.item}</p>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(order)}
                >
                    Edit
                </Button>
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => {
                        setOrderIdToDelete(order._id)
                        setOpenModalDeleteOrder(!openModalDeleteOrder)
                    }}
                >
                    Delete
                </Button>
            </div>
        </div>
    )

     // 生成Excel报告的函数
    // 替换原有的 XLSX 导入


// 在组件内部添加打印设置函数
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

// 修改 generateExcelReport 函数
const generateExcelReport = async () => {
  try {
    // 使用 ExcelJS 替代 XLSX
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Orders Report')
    
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
      { width: 20 },   // Supplier
      { width: 15 },   // Document Type
      { width: 15 },   // Document No
      { width: 25 },   // Item
      { width: 10 },   // Quantity
      { width: 12 },   // Amount
      { width: 20 },   // Cost Category
      { width: 12 },   // Status
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
    titleRow.getCell(1).value = 'ORDERS REPORT'
    titleRow.getCell(1).font = titleFont
    titleRow.getCell(1).alignment = centerAlignment
    worksheet.mergeCells('A1:L1')

    // 表头行
    const headerRow = worksheet.getRow(2)
    headerRow.height = 25
    const headers = [
      'No.', 'Date', 'Supplier', 'Document Type', 'Document No', 
      'Item', 'Quantity', 'Amount', 'Cost Category', 'Status',
      'Created At', 'Updated At'
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
    const excelData = orders.map(order => ({
      'Date': order.date,
      'Supplier': order.supplier,
      'Document Type': order.doc,
      'Document No': order.docno,
      'Item': order.item,
      'Quantity': Number(order.quantity) || 0,
      'Amount': Number(order.amount) || 0,
      'Cost Category': order.costcategory,
      'Status': order.status,
      'Created At': new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      'Updated At': new Date(order.updatedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }))

    // 数据行
    let rowIndex = 3
    let totalQuantity = 0
    let totalAmount = 0
    
    excelData.forEach((order, index) => {
      const row = worksheet.getRow(rowIndex)
      row.height = 20
      
      totalQuantity += order.Quantity
      totalAmount += order.Amount
      
      const rowData = [
        index + 1,
        order.Date,
        order.Supplier,
        order['Document Type'],
        order['Document No'],
        order.Item,
        order.Quantity,
        order.Amount,
        order['Cost Category'],
        order.Status,
        order['Created At'],
        order['Updated At']
      ]

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.font = defaultFont
        cell.border = borderStyle
        
        // 不同的列对齐方式
        if (colIndex === 0 || colIndex === 6 || colIndex === 7) { // No., Quantity, Amount 列居右
          cell.alignment = rightAlignment
        } else if (colIndex === 9) { // Status 列居中
          cell.alignment = centerAlignment
        } else if (colIndex === 5) { // Item 列左对齐
          cell.alignment = leftAlignment
        } else {
          cell.alignment = centerAlignment
        }
        
        // 为数值列添加千位分隔符
        if (colIndex === 6 || colIndex === 7) { // Quantity 和 Amount 列
          cell.numFmt = colIndex === 7 ? '#,##0.00' : '#,##0'
        }
        
        // 为状态列添加颜色
        if (colIndex === 9) { // Status 列
          if (value === 'Complete') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' } // 浅绿色
            }
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF006100' } }
          } else if (value === 'Incomplete') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' } // 浅红色
            }
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }
          }
        }
        
        // 为金额列添加颜色（根据值大小）
        if (colIndex === 7) { // Amount 列
          const amount = Number(value) || 0
          if (amount > 10000) {
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
          } else if (amount > 5000) {
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } } // 橙色
          }
        }
        
        // 隔行着色
        if (rowIndex % 2 === 0) {
          if (colIndex !== 9 && colIndex !== 7) { // 保持状态列和金额列的颜色
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
      row.getCell(1).value = 'No order data available'
      worksheet.mergeCells(`A${rowIndex}:L${rowIndex}`)
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

    // 添加总计行
    const totalRow = worksheet.getRow(rowIndex)
    totalRow.height = 25
    
    

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '_')
    saveAs(blob, `Orders_Report_${date}.xlsx`)

  } catch (error) {
    console.error('Error generating Excel report:', error)
    alert('Failed to generate Excel report. Please try again.')
  }
}

  return (
    <div className='min-h-screen'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
            <h1 className='text-2xl font-semibold'>Orders</h1>
            <div className='w-full sm:w-auto'>
                <TextInput 
                    placeholder='Enter searching' 
                    value={searchTerm} 
                    onChange={handleSearch}
                    className='w-full'
                />
            </div>
            <div className='flex gap-2 w-full sm:w-auto'>
                <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateOrder}>
                    Create Order
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
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Amount</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentOrders.map((order) => (
                        <TableRow key={order._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className='align-middle'>
                            <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                content={
                                    <div className="p-3 max-w-xs">
                                        <p className="font-semibold text-sm">Doc no:</p>
                                        <p className="text-xs mb-2">{order.docno}</p>
                                        <p className="font-semibold text-sm">Doc:</p>
                                        <p className="text-xs mb-2">{order.doc}</p>
                                        <p className="font-semibold text-sm">Cost category:</p>
                                        <p className="text-xs">{order.costcategory}</p>
                                    </div>
                                }
                                trigger="hover"
                                placement="top"
                                arrow={false}
                            >
                                <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                    {order.supplier}
                                </span>
                            </Popover>
                        </TableCell>
                        <TableCell>{order.item}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>
                            <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(order)}}>Edit</Button>
                        </TableCell>
                        <TableCell><Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setOrderIdToDelete(order._id);setOpenModalDeleteOrder(!openModalDeleteOrder)}}>Delete</Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}

        {/* 移动端卡片视图 */}
        {isMobile && (
            <div className="space-y-4">
                {currentOrders.map((order) => (
                    <OrderCard key={order._id} order={order} />
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
        <Modal show={openModalCreateOrder} onClose={handleCreateOrder} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Order</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                                <TextInput type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
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
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc</Label>
                            <Select id="doc" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Invoice</option>
                                <option>Quotation</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc no</Label>
                            <TextInput id="docno" placeholder="Enter doc no" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                            <Textarea id="item" placeholder="Enter item" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Amount</Label>
                            <TextInput id="amount" type='number' min='0' step='0.01' placeholder='Enter amount' onChange={handleChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost category</Label>
                            <Select id="costcategory" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Spareparts</option>
                                <option>Extruder</option>
                                <option>Electrical & Installation</option>
                                <option>Injection machine</option>
                                <option>QC</option>
                                <option>Mould</option>
                                <option>Others</option>
                                <option>TNB</option>
                                <option>Air Selangor</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                            <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Complete</option>
                                <option>Incomplete</option>
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

        <Modal show={openModalDeleteOrder} size="md" onClose={() => setOpenModalDeleteOrder(!openModalDeleteOrder)} popup>
            <ModalHeader />
            <ModalBody>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this order?
                </h3>
                <div className="flex justify-center gap-4">
                <Button color="red" onClick={handleDelete}>
                    Yes, I'm sure
                </Button>
                <Button color="alternative" onClick={() => setOpenModalDeleteOrder(false)}>
                    No, cancel
                </Button>
                </div>
            </div>
            </ModalBody>
        </Modal>

        <Modal show={openModalUpdateOrder} onClose={() => setOpenModalUpdateOrder(!openModalUpdateOrder)} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Order</h3>
                    <form onSubmit={handleUpdateSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                                <TextInput value={updateFormData.date || ''} type='date' id="date" placeholder="Enter date" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                            <Select value={updateFormData.supplier || ''} id="supplier" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                            {suppliers.map((supplier) => (
                            <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                            ))}
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc</Label>
                            <Select value={updateFormData.doc || ''} id="doc" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Invoice</option>
                                <option>Quotation</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Doc no</Label>
                            <TextInput value={updateFormData.docno || ''} id="docno" placeholder="Enter doc no" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                            <Textarea value={updateFormData.item || ''} id="item" placeholder="Enter item" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                            <TextInput value={updateFormData.quantity || ''} id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Amount</Label>
                            <TextInput value={updateFormData.amount || ''} id="amount" type='number' min='0' step='0.01' placeholder='Enter amount' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost category</Label>
                            <Select value={updateFormData.costcategory || ''} id="costcategory" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Spareparts</option>
                                <option>Extruder</option>
                                <option>Electrical & Installation</option>
                                <option>Injection machine</option>
                                <option>QC</option>
                                <option>Mould</option>
                                <option>Others</option>
                                <option>TNB</option>
                                <option>Air Selangor</option>
                            </Select>
                        </div>

                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                            <Select value={updateFormData.status || ''} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                <option></option>
                                <option>Complete</option>
                                <option>Incomplete</option>
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

export default Orders