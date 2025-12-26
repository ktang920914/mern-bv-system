import { Alert, Button, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const Products = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({})
    const [openModalCreateProduct,setOpenModalCreateProduct] = useState(false)
    const [products,setProducts] = useState([])
    const [openModalDeleteProduct,setOpenModalDeleteProduct] = useState(false)
    const [openModalUpdateProduct,setOpenModalUpdateProduct] = useState(false)
    const [productIdToDelete,setProductIdToDelete] = useState('')
    const [productIdToUpdate,setProductIdToUpdate] = useState('')
    const [updateFormData,setUpdateFormData] = useState({})
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // 新增：保存到服务器的状态
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

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleCreateProduct = () => {
        setOpenModalCreateProduct(!openModalCreateProduct)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/new/product',{
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
                setOpenModalCreateProduct(false)
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
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteProduct(false)
        try {
            const res = await fetch(`/api/new/delete/${productIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setProducts((prev) => prev.filter((product) => product._id !== productIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (p) => {
        setProductIdToUpdate(p._id)
        setOpenModalUpdateProduct(!openModalUpdateProduct)
        setUpdateFormData({
            lotno:p.lotno, 
            colourcode:p.colourcode, 
            quantity:p.quantity, 
            location:p.location,
            palletno:p.palletno, 
            user:p.user, 
            status:p.status
        })
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'colourcode' ||e.target.id === 'lotno'||e.target.id === 'palletno'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/new/update/${productIdToUpdate}`,{
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
                setOpenModalUpdateProduct(false)
                const fetchProducts = async () => {
                    try {
                        const res = await fetch('/api/new/getproducts')
                        const data = await res.json()
                        if(res.ok){
                            setProducts(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchProducts()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
    }

    const filteredProducts = products.filter(product => 
        product.colourcode.toLowerCase().includes(searchTerm) || 
        product.quantity.toString().toLowerCase().includes(searchTerm) || 
        product.lotno.toLowerCase().includes(searchTerm) || 
        product.location.toLowerCase().includes(searchTerm) || 
        product.user.toLowerCase().includes(searchTerm) || 
        product.palletno.toLowerCase().includes(searchTerm) ||
        product.status.toLowerCase().includes(searchTerm) && product.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredProducts.length
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
    const generateQRContent = (product) => {
        // 优先使用后端存储的 QR 码内容
        if (product && product.qrCode) {
            return product.qrCode;
        }
        
        // 备用方案：前端生成（包含所有必要字段）
        return JSON.stringify({
            colourcode: product?.colourcode || '',
            lotno: product?.lotno || '',
            quantity: product?.quantity !== undefined ? product.quantity : 0,
            palletno: product?.palletno || '',
            location: product?.location || '',
            user: product?.user || '',
            status: product?.status || '',
            createdAt: product?.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }, null, 2);
    };

    // 移动端卡片组件
    const ProductCard = ({ product }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Colour Code</p>
                <Popover 
                    className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                    content={
                        <div className="p-4 text-center">
                            <h3 className="font-semibold mb-2">QR Code - {product.colourcode}</h3>
                            <QRCodeCanvas value={generateQRContent(product)} size={150} level="M" includeMargin={true}/>
                            <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view product details</p>
                        </div>
                    }
                    trigger="hover"
                    placement="top"
                    arrow={false}
                >
                    <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                        theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                    }`}>
                        {product.colourcode}
                    </span>
                </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Quantity</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{product.quantity}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{product.status}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">User</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{product.user}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Lot No</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{product.lotno}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Location</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{product.location}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(product)}
                >
                    Edit
                </Button>
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => {
                        setProductIdToDelete(product._id)
                        setOpenModalDeleteProduct(!openModalDeleteProduct)
                    }}
                >
                    Delete
                </Button>
            </div>
        </div>
    )

    // 修改后的 generateExcelReport 函数 - 类似 Extruder.jsx 版本
    const generateExcelReport = async () => {
        try {
          // 使用 ExcelJS 替代 XLSX
          const workbook = new ExcelJS.Workbook()
          
          // 生成带时间戳的文件名
          const reportDate = new Date();
          const dateStr = reportDate.toISOString().split('T')[0];
          const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
          
          const worksheet = workbook.addWorksheet(`Products Report ${dateStr}`)
          
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
            { width: 15 },   // Colour Code
            { width: 15 },   // Lot No
            { width: 12 },   // Quantity
            { width: 12 },   // Pallet No
            { width: 15 },   // Location
            { width: 15 },   // User
            { width: 12 },   // Status
            { width: 50 },   // QR Code Content
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
          titleRow.getCell(1).value = 'PRODUCTS REPORT'
          titleRow.getCell(1).font = titleFont
          titleRow.getCell(1).alignment = centerAlignment
          worksheet.mergeCells('A1:K1')
  
          // 生成时间行
          const generatedRow = worksheet.getRow(2)
          generatedRow.height = 20
          generatedRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`
          generatedRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true }
          generatedRow.getCell(1).alignment = leftAlignment
          worksheet.mergeCells('A2:K2')
  
          // 添加过滤信息行
          const filterRow = worksheet.getRow(3)
          filterRow.height = 20
          
          // 如果有搜索词，显示过滤条件
          if (searchTerm) {
            filterRow.getCell(1).value = `Filter: "${searchTerm}"`
            worksheet.mergeCells('A3:K3')
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
          const headerRowNum = searchTerm ? 4 : 3
          
          // 表头行
          const headerRow = worksheet.getRow(headerRowNum)
          headerRow.height = 25
          const headers = [
            'No.', 'Colour Code', 'Lot No', 'Quantity', 'Pallet No', 
            'Location', 'User', 'Status', 'QR Code Content', 'Created At', 'Updated At'
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
          const excelData = products.map(product => ({
            'Colour Code': product.colourcode,
            'Lot No': product.lotno,
            'Quantity': Number(product.quantity) || 0,
            'Pallet No': product.palletno,
            'Location': product.location,
            'User': product.user,
            'Status': product.status,
            'QR Code Content': product.qrCode || generateQRContent(product),
            'Created At': new Date(product.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            'Updated At': new Date(product.updatedAt).toLocaleString('en-US', {
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
          
          excelData.forEach((product, index) => {
            const row = worksheet.getRow(rowIndex)
            row.height = 20
            
            const rowData = [
              index + 1,
              product['Colour Code'],
              product['Lot No'],
              product['Quantity'],
              product['Pallet No'],
              product['Location'],
              product['User'],
              product['Status'],
              product['QR Code Content'],
              product['Created At'],
              product['Updated At']
            ]
  
            rowData.forEach((value, colIndex) => {
              const cell = row.getCell(colIndex + 1)
              cell.value = value
              cell.font = defaultFont
              cell.border = borderStyle
              
              // 不同的列对齐方式
              if (colIndex === 0 || colIndex === 3) { // No. 和 Quantity 列居右
                cell.alignment = rightAlignment
              } else if (colIndex === 7) { // Status 列居中
                cell.alignment = centerAlignment
              } else if (colIndex === 1 || colIndex === 2 || colIndex === 4 || colIndex === 5 || colIndex === 6) { // 文本列左对齐
                cell.alignment = leftAlignment
              } else if (colIndex === 8) { // QR Code Content 列左对齐
                cell.alignment = leftAlignment
              } else {
                cell.alignment = centerAlignment
              }
              
              // 为数值列添加千位分隔符
              if (colIndex === 3) { // Quantity 列
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
              
              // 为数量列添加颜色（根据值大小）
              if (colIndex === 3) { // Quantity 列
                const quantity = Number(value) || 0
                if (quantity > 1000) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
                } else if (quantity > 500) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } } // 橙色
                } else if (quantity === 0) {
                  cell.font = { ...defaultFont, italic: true, color: { argb: 'FF808080' } } // 灰色
                }
              }
              
              // 为代码列添加特殊样式
              if (colIndex === 1) { // Colour Code 列
                cell.font = { ...defaultFont, bold: true }
              }
              
              // 隔行着色
              if (rowIndex % 2 === 0) {
                if (colIndex !== 7 && colIndex !== 3) { // 保持状态列和数量列的颜色
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
            row.getCell(1).value = 'No product data available'
            worksheet.mergeCells(`A${rowIndex}:K${rowIndex}`)
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
            const filterRange = `A${headerRowNum}:K${rowIndex - 1}`
            worksheet.autoFilter = filterRange
          }
  
          const buffer = await workbook.xlsx.writeBuffer()
          const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          
          // 生成带时间戳的文件名
          const fileName = `Products_Report_${dateStr}_${timeStr}.xlsx`
          
          return { blob, fileName }
  
        } catch (error) {
          console.error('Error generating Excel report:', error)
          throw error
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
      } catch (error) {
        console.error('Error downloading report:', error)
        setErrorMessage('Failed to download report. Please try again.')
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
            <h1 className='text-2xl font-semibold'>Products</h1>
            <div className='w-full sm:w-auto'>
                <TextInput 
                    placeholder='Enter searching' 
                    value={searchTerm} 
                    onChange={handleSearch}
                    className='w-full'
                />
            </div>
            <div className='flex gap-2 w-full sm:w-auto'>
                <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateProduct}>
                    Create Product
                </Button>
                <Button 
                  className='cursor-pointer flex-1 sm:flex-none' 
                  onClick={handleDownloadReport} 
                  color='green'
                >
                    Report
                </Button>
                <Button 
                  className='cursor-pointer flex-1 sm:flex-none' 
                  onClick={confirmSaveToServer}
                  color='blue'
                >
                    Save
                </Button>
            </div>
        </div>

        {/* 桌面端表格视图 */}
        {!isMobile && (
            <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                <TableHead>
                    <TableRow>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Colour code</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Location</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>User</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentProducts.map((p) => (
                        <TableRow key={p._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                            <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-4 text-center">
                                            <h3 className="font-semibold mb-2">QR Code - {p.colourcode}</h3>
                                            <QRCodeCanvas value={generateQRContent(p)} size={150} level="M" includeMargin={true}/>
                                            <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view product details</p>
                                        </div>
                                    }
                                    trigger="hover"
                                    placement="right"
                                    arrow={false}
                                >
                                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-blue-300">
                                        {p.colourcode}
                                    </span>
                                </Popover>
                            </TableCell>
                            <TableCell className="align-middle">{p.lotno}</TableCell>
                            <TableCell className="align-middle">{p.quantity}</TableCell>
                            <TableCell className="align-middle">
                                <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    content={
                                        <div className="p-3 max-w-xs">
                                            <p className="font-semibold text-sm">Pallet no:</p>
                                            <p className="text-xs">{p.palletno}</p>
                                        </div>
                                    }
                                    trigger='hover'
                                    placement="right"
                                    arrow={false}
                                >
                                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                        {p.location}
                                    </span>
                                </Popover>
                            </TableCell>
                            <TableCell className="align-middle">{p.user}</TableCell>
                            <TableCell className="align-middle">{p.status}</TableCell>
                            <TableCell className="align-middle">
                                <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(p)}}>Edit</Button>
                            </TableCell>
                            <TableCell className="align-middle">
                                <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setProductIdToDelete(p._id);setOpenModalDeleteProduct(!openModalDeleteProduct)}}>
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
                {currentProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
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
        <Modal show={openModalCreateProduct} onClose={handleCreateProduct} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Product</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Colour code</Label>
                                <TextInput id="colourcode" className='mb-4' placeholder='Enter colour code' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Lot no</Label>
                            <TextInput id="lotno" className='mb-4' placeholder='Enter lot no' onChange={handleChange} onFocus={handleFocus} required></TextInput>
                        </div>           

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

        <Modal show={openModalDeleteProduct} size="md" onClose={() => setOpenModalDeleteProduct(!openModalDeleteProduct)} popup>
            <ModalHeader />
            <ModalBody>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this product?
                </h3>
                <div className="flex justify-center gap-4">
                <Button color="red" onClick={handleDelete}>
                    Yes, I'm sure
                </Button>
                <Button color="alternative" onClick={() => setOpenModalDeleteProduct(false)}>
                    No, cancel
                </Button>
                </div>
            </div>
            </ModalBody>
        </Modal>

        <Modal show={openModalUpdateProduct} onClose={() => setOpenModalUpdateProduct(!openModalUpdateProduct)} popup>
            <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
            <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                <div className="space-y-6">
                    <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Product</h3>
                    
                    {/* 添加 QR 码显示区域 */}
                    <div className="flex justify-center mb-4">
                        <div className="text-center">
                            <QRCodeCanvas className='text-center'
                                value={generateQRContent(products.find(product => product._id === productIdToUpdate) || {})} 
                                size={120} 
                                level="M" 
                                includeMargin={true}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleUpdateSubmit}>
                        <div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Colour code</Label>
                                <TextInput value={updateFormData.colourcode} id="colourcode" className='mb-4' placeholder='Enter colour code' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                            </div>
                        </div>
                            
                        <div className="mb-4 block">
                            <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Lot no</Label>
                            <TextInput value={updateFormData.lotno} id="lotno" className='mb-4' placeholder='Enter lotno' onChange={handleUpdateChange} onFocus={handleFocus} required></TextInput>
                        </div>

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

export default Products