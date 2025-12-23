import { Alert, Button, Label, Modal, ModalBody, ModalHeader, ModalFooter, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
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
    
    // Modal 状态
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [saveStatus, setSaveStatus] = useState('') // 'saving', 'success', 'error'
    const [saveMessage, setSaveMessage] = useState('')
    const [saveDetails, setSaveDetails] = useState({ fileName: '', path: '' })
    const [showConfirmModal, setShowConfirmModal] = useState(false)

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
    // 修改 Suppliers.jsx 中的 generateExcelReport 函数
const generateExcelReport = async () => {
  try {
    // 使用 ExcelJS 替代 XLSX
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Suppliers Report')
    
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
      { width: 20 },   // Supplier
      { width: 15 },   // Contact
      { width: 35 },   // Description
      { width: 30 },   // Address
      { width: 15 },   // PIC
      { width: 25 },   // Email
      { width: 10 },   // Status
      { width: 20 },   // Created At
      { width: 20 }    // Updated At
    ]

    // 定义样式
    const headerFont = { name: 'Calibri', size: 11, bold: true }
    const titleFont = { name: 'Arial Black', size: 16, bold: true }
    const defaultFont = { name: 'Calibri', size: 11 }
    
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    const centerAlignment = { horizontal: 'center', vertical: 'middle' }
    const leftAlignment = { horizontal: 'left', vertical: 'middle' }

    // 使用当前日期作为报告日期
    const reportDate = new Date();
    const dateStr = reportDate.toISOString().split('T')[0];
    const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');

    // 标题行
    const titleRow = worksheet.getRow(1)
    titleRow.height = 30
    titleRow.getCell(1).value = 'SUPPLIERS REPORT'
    titleRow.getCell(1).font = titleFont
    titleRow.getCell(1).alignment = centerAlignment
    worksheet.mergeCells('A1:J1')

    // 副标题行 - 添加生成时间
    const subtitleRow = worksheet.getRow(2)
    subtitleRow.height = 20
    subtitleRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`
    subtitleRow.getCell(1).font = { ...defaultFont, italic: true }
    subtitleRow.getCell(1).alignment = centerAlignment
    worksheet.mergeCells('A2:J2')

    // 表头行
    const headerRow = worksheet.getRow(3)
    headerRow.height = 25
    const headers = [
      'No.', 'Supplier', 'Contact', 'Description', 'Address', 
      'PIC', 'Email', 'Status', 'Created At', 'Updated At'
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
        fgColor: { argb: 'FFE0E0E0' }
      }
    })

    // 准备数据
    const excelData = suppliers.map(supplier => ({
      'Supplier': supplier.supplier,
      'Contact': supplier.contact,
      'Description': supplier.description,
      'Address': supplier.address,
      'PIC': supplier.pic,
      'Email': supplier.email,
      'Status': supplier.status,
      'Created At': new Date(supplier.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      'Updated At': new Date(supplier.updatedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }))

    // 数据行
    let rowIndex = 4  // 从第4行开始
    excelData.forEach((supplier, index) => {
      const row = worksheet.getRow(rowIndex)
      row.height = 20
      
      const rowData = [
        index + 1,
        supplier.Supplier,
        supplier.Contact,
        supplier.Description,
        supplier.Address,
        supplier.PIC,
        supplier.Email,
        supplier.Status,
        supplier['Created At'],
        supplier['Updated At']
      ]

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.font = defaultFont
        cell.border = borderStyle
        
        // 不同的列对齐方式
        if (colIndex === 0 || colIndex === 7) {
          cell.alignment = centerAlignment
        } else if (colIndex === 3 || colIndex === 4) {
          cell.alignment = leftAlignment
        } else {
          cell.alignment = centerAlignment
        }
        
        // 为状态列添加颜色
        if (colIndex === 7) {
          if (value === 'Active') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' }
            }
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF006100' } }
          } else if (value === 'Inactive') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' }
            }
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }
          }
        }
        
        // 隔行着色
        if (rowIndex % 2 === 0) {
          if (colIndex !== 7) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F8F8' }
            }
          }
        }
      })

      rowIndex++
    })

    // 如果没有数据，添加提示行
    if (excelData.length === 0) {
      const row = worksheet.getRow(rowIndex)
      row.getCell(1).value = 'No supplier data available'
      worksheet.mergeCells(`A${rowIndex}:J${rowIndex}`)
      row.getCell(1).alignment = centerAlignment
      row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } }
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' }
      }
      row.getCell(1).border = borderStyle
      rowIndex++
    }

    // 添加自动筛选器
    if (excelData.length > 0) {
      const autoFilterRange = {
        from: { row: 3, column: 1 },  // 从第3行（表头）开始
        to: { row: rowIndex - 1, column: 10 }  // 到最后一行
      };
      
      worksheet.autoFilter = autoFilterRange;
    }

    // 添加总计行
    const totalRow = worksheet.getRow(rowIndex)
    totalRow.height = 25
    totalRow.getCell(1).value = 'TOTAL SUPPLIERS'
    worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
    totalRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
    totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
    totalRow.getCell(1).border = borderStyle
    totalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDEBF7' }
    }
    
    totalRow.getCell(8).value = excelData.length
    totalRow.getCell(8).font = { name: 'Calibri', size: 11, bold: true }
    totalRow.getCell(8).alignment = centerAlignment
    totalRow.getCell(8).border = borderStyle
    totalRow.getCell(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDEBF7' }
    }



    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用日期和时间作为文件名
    return { blob, fileName: `Suppliers_Report_${dateStr}_${timeStr}.xlsx` }

  } catch (error) {
    console.error('Error generating Excel report:', error)
    throw error
  }
}

// 添加打印设置函数（与 Statistics.jsx 相同）
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

    // 保存到文件服务器的函数 - 使用 FormData
    const saveToFileServer = async () => {
      try {
        // 显示 Modal 并设置状态为保存中
        setShowSaveModal(true)
        setSaveStatus('saving')
        setSaveMessage('Generating...')
        setSaveDetails({ fileName: '', path: '' })

        // 首先生成 Excel 文件
        const result = await generateExcelReport()
        const { blob, fileName } = result

        // 更新状态
        setSaveMessage('Saving...')
        setSaveDetails(prev => ({ ...prev, fileName }))

        // 创建 FormData 对象
        const formData = new FormData()
        formData.append('file', blob, fileName)
        formData.append('fileServerPath', 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)')

        // 发送到后端 API 保存到文件服务器
        const response = await fetch('/api/file/save-excel', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          setSaveStatus('success')
          setSaveMessage('Success！')
          setSaveDetails({
            fileName,
            path: data.path || 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)'
          })
          
          console.log('File saved to server:', data)
        } else {
          setSaveStatus('error')
          setSaveMessage(`Failed: ${data.message || 'Error'}`)
          setSaveDetails({
            fileName,
            path: 'Failed'
          })
        }

      } catch (error) {
        console.error('Error saving to file server:', error)
        setSaveStatus('error')
        setSaveMessage('error')
        setSaveDetails({
          fileName: 'unknown',
          path: 'error'
        })
      }
    }

    // 处理下载到本地
    const handleDownloadReport = async () => {
      try {
        const result = await generateExcelReport()
        const { blob, fileName } = result
        saveAs(blob, fileName)
        console.log('Excel report downloaded successfully!')
      } catch (error) {
        console.error('Error downloading report:', error)
        alert('Failed to download report. Please try again.')
      }
    }

    // 处理手动下载（当服务器保存失败时）
    const handleManualDownload = () => {
      handleDownloadReport()
      setShowSaveModal(false)
    }

    // 关闭保存 Modal
    const closeSaveModal = () => {
      setShowSaveModal(false)
      // 重置状态，但保留一小段时间以便用户看到结果
      setTimeout(() => {
        setSaveStatus('')
        setSaveMessage('')
        setSaveDetails({ fileName: '', path: '' })
      }, 300)
    }

    // 确认保存到服务器
    const confirmSaveToServer = () => {
      setShowConfirmModal(true)
    }

    // 实际执行保存
    const executeSaveToServer = () => {
      setShowConfirmModal(false)
      saveToFileServer()
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
                <Button className='cursor-pointer flex-1 sm:flex-none' color='green' onClick={handleDownloadReport}>
                    Report
                </Button>
                <Button 
                    className='cursor-pointer flex-1 sm:flex-none' 
                    color='blue' 
                    onClick={confirmSaveToServer}
                >
                    Save to Server
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

        {/* 确认保存 Modal */}
        <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} size="md">
            <ModalHeader>Server</ModalHeader>
            <ModalBody>
                <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">
                        Are you sure want to save into server?
                    </p>
                    <div className={`p-3 rounded-lg ${
                        theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'border border-gray-600'
                    }`}>
                        <p className={`text-sm font-semibold`}>File path:</p>
                        <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                            Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)
                        </p>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button className='cursor-pointer' color="gray" onClick={() => setShowConfirmModal(false)}>
                    Cancel
                </Button>
                <Button className='cursor-pointer' color="blue" onClick={executeSaveToServer}>
                    Save
                </Button>
            </ModalFooter>
        </Modal>

        {/* 保存状态 Modal */}
        <Modal show={showSaveModal} onClose={closeSaveModal} size="md">
            <ModalHeader>
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'success' ? 'Success' : 
                 saveStatus === 'error' ? 'Failed' : 'Saving'}
            </ModalHeader>
            <ModalBody>
                <div className="space-y-4">
                    {/* 状态图标 */}
                    <div className="flex justify-center">
                        {saveStatus === 'saving' && (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        )}
                        {saveStatus === 'success' && (
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {/* 消息 */}
                    <p className="text-center text-gray-700 dark:text-gray-300">
                        {saveMessage}
                    </p>
                    
                    {/* 详细信息 */}
                    {saveDetails.fileName && (
                        <div className={`p-3 rounded-lg ${
                            theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'
                        }`}>
                            <p className="text-sm font-semibold">Document information:</p>
                            <p className="text-sm mt-1">
                                <span className="font-medium">File name:</span> {saveDetails.fileName}
                            </p>
                            {saveDetails.path && (
                                <p className="text-sm mt-1">
                                    <span className="font-medium">File path:</span> {saveDetails.path}
                                </p>
                            )}
                        </div>
                    )}
                    
                    {/* 错误时的额外选项 */}
                    {saveStatus === 'error' && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Failed to save into server, Please save as manual into server
                            </p>
                            <div className="space-y-2">
                                <Button 
                                    className='cursor-pointer'
                                    fullSized 
                                    color="blue" 
                                    onClick={handleManualDownload}
                                >
                                    Download manual
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    File path: Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>
            <ModalFooter>
                {saveStatus === 'saving' ? (
                    <Button color="gray" disabled>
                        Please wait...
                    </Button>
                ) : (
                    <Button 
                        className='cursor-pointer'
                        color='gray' 
                        onClick={closeSaveModal}
                    >
                        Cancel
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    </div>
  )
}

export default Suppliers