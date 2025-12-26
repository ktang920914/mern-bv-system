import { Alert, Button, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useState, useEffect } from 'react';
import useUserstore from '../store';
import { QRCodeCanvas } from 'qrcode.react';
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const Others = () => {

    const {theme} = useThemeStore()
    const { currentUser } = useUserstore();
    const [formData, setFormData] = useState({});
    const [updateFormData, setUpdateFormData] = useState({});
    const [openModalCreateOther, setOpenModalCreateOther] = useState(false);
    const [openModalDeleteOther, setOpenModalDeleteOther] = useState(false);
    const [openModalUpdateOther, setOpenModalUpdateOther] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [others, setOthers] = useState([]);
    const [otherIdToDelete, setOtherIdToDelete] = useState('');
    const [otherIdToUpdate, setOtherIdToUpdate] = useState('');
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10);
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

    // Fetch suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await fetch('/api/purchase/getsuppliers');
                const data = await res.json();
                if(res.ok) setSuppliers(data);
            } catch (error) {
                console.log(error.message);
            }
        };
        fetchSuppliers();
    }, [currentUser._id]);

    // Fetch items
    useEffect(() => {
        const fetchOthers = async () => {
            try {
                const res = await fetch('/api/rest/getOthers');
                const data = await res.json();
                if(res.ok) setOthers(data);
            } catch (error) {
                console.log(error.message);
            }
        };
        fetchOthers();
    }, [currentUser._id]);

    // Handle input change
    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    const handleUpdateChange = (e) => {
        if(e.target.id === 'code'||e.target.id === 'type'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }
    const handleFocus = () => { setErrorMessage(null); setLoading(false); };

    // Open/close modals
    const handleCreateOther = () => { setOpenModalCreateOther(!openModalCreateOther); setErrorMessage(null); setLoading(false); };
    const handleUpdate = (other) => {
        setErrorMessage(null); setLoading(false);
        setOpenModalUpdateOther(true);
        setOtherIdToUpdate(other._id);
        setUpdateFormData({
            code: other.code,
            type: other.type,
            location: other.location,
            supplier: other.supplier,
            status: other.status,
            balance: other.balance
        });
    };

    // Submit create
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/rest/other', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if(data.success === false) setErrorMessage(data.message);
            else {
                setOpenModalCreateOther(false);
                const othersRes = await fetch('/api/rest/getOthers');
                const othersData = await othersRes.json();
                if(othersRes.ok) setOthers(othersData);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Submit update
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/rest/update/${otherIdToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateFormData)
            });
            const data = await res.json();
            if(data.success === false) setErrorMessage(data.message);
            else {
                setOpenModalUpdateOther(false);
                const othersRes = await fetch('/api/rest/getOthers');
                const othersData = await othersRes.json();
                if(othersRes.ok) setOthers(othersData);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete item
    const handleDelete = async () => {
        setOpenModalDeleteOther(false);
        try {
            const res = await fetch(`/api/rest/delete/${otherIdToDelete}`, { method: 'DELETE' });
            const data = await res.json();
            if(res.ok) setOthers(prev => prev.filter(other => other._id !== otherIdToDelete));
        } catch (error) {
            console.log(error.message);
        }
    };

    // Search & pagination
    const handleSearch = (e) => { setSearchTerm(e.target.value.toLowerCase()); setCurrentPage(1); };
    const filteredOthers = others.filter(other =>
        other.code.toLowerCase().includes(searchTerm) && other.code.toLowerCase() === searchTerm ||
        other.type.toLowerCase().includes(searchTerm) ||
        other.location.toLowerCase().includes(searchTerm) ||
        other.supplier.toLowerCase().includes(searchTerm) ||
        other.status.toLowerCase().includes(searchTerm) ||
        other.balance.toString().toLowerCase().includes(searchTerm)
    );
    const indexOfLastItem = currentPage * itemsPage;
    const indexOfFirstItem = indexOfLastItem - itemsPage;
    const currentOthers = filteredOthers.slice(indexOfFirstItem, indexOfLastItem);
    const totalEntries = filteredOthers.length;
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1;
    const showingTo = Math.min(indexOfLastItem, totalEntries);
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage));
    
    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

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
    const generateQRContent = (other) => {
        // 优先使用后端存储的 QR 码内容
        if (other && other.qrCode) {
            return other.qrCode;
        }
        
        // 备用方案：前端生成（包含所有必要字段）
        return JSON.stringify({
            code: other?.code || '',
            type: other?.type || '',
            location: other?.location || '',
            supplier: other?.supplier || '',
            status: other?.status || '',
            balance: other?.balance !== undefined ? other.balance : 0,
            createdAt: other?.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }, null, 2);
    };

    // 移动端卡片组件
    const OtherCard = ({ other }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Code</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-4 text-center">
                                <h3 className="font-semibold mb-2">QR Code - {other.code}</h3>
                                <QRCodeCanvas value={generateQRContent(other)} size={150} level="M" includeMargin={true}/>
                                <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view other details</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {other.code}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Type</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{other.type}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Location</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{other.location}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{other.status}</p>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Supplier</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{other.supplier}</p>
            </div>

            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Balance</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{other.balance}</p>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(other)}
                >
                    Edit
                </Button>
                {currentUser.role === 'Admin' && (
                    <Button 
                        color='red' 
                        outline 
                        className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                        onClick={() => {
                            setOtherIdToDelete(other._id)
                            setOpenModalDeleteOther(true)
                        }}
                    >
                        Delete
                    </Button>
                )}
            </div>
        </div>
    )

    // 修改后的 generateExcelReport 函数 - 添加时间戳文件名
    const generateExcelReport = async () => {
      try {
        // 使用 ExcelJS 替代 XLSX
        const workbook = new ExcelJS.Workbook()
        
        // 生成带时间戳的文件名
        const reportDate = new Date();
        const dateStr = reportDate.toISOString().split('T')[0];
        const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
        
        const worksheet = workbook.addWorksheet(`Others Report ${dateStr}`)
        
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
          { width: 15 },   // Code
          { width: 20 },   // Type
          { width: 15 },   // Location
          { width: 20 },   // Supplier
          { width: 12 },   // Status
          { width: 12 },   // Balance
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
        titleRow.getCell(1).value = 'OTHERS REPORT'
        titleRow.getCell(1).font = titleFont
        titleRow.getCell(1).alignment = centerAlignment
        worksheet.mergeCells('A1:J1')

        // 生成时间行
        const generatedRow = worksheet.getRow(2)
        generatedRow.height = 20
        generatedRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`
        generatedRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true }
        generatedRow.getCell(1).alignment = leftAlignment
        worksheet.mergeCells('A2:J2')

        // 添加过滤信息行
        const filterRow = worksheet.getRow(3)
        filterRow.height = 20
        
        // 如果有搜索词，显示过滤条件
        if (searchTerm) {
          filterRow.getCell(1).value = `Filter: "${searchTerm}"`
          worksheet.mergeCells('A3:J3')
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
          'No.', 'Code', 'Type', 'Location', 'Supplier', 
          'Status', 'Balance', 'QR Code Content', 'Created At', 'Updated At'
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
        const excelData = others.map(other => ({
          'Code': other.code,
          'Type': other.type,
          'Location': other.location,
          'Supplier': other.supplier,
          'Status': other.status,
          'Balance': Number(other.balance) || 0,
          'QR Code Content': other.qrCode || generateQRContent(other),
          'Created At': new Date(other.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          'Updated At': new Date(other.updatedAt).toLocaleString('en-US', {
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
        
        excelData.forEach((other, index) => {
          const row = worksheet.getRow(rowIndex)
          row.height = 20
          
          const rowData = [
            index + 1,
            other.Code,
            other.Type,
            other.Location,
            other.Supplier,
            other.Status,
            other.Balance,
            other['QR Code Content'],
            other['Created At'],
            other['Updated At']
          ]

          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            cell.value = value
            cell.font = defaultFont
            cell.border = borderStyle
            
            // 不同的列对齐方式
            if (colIndex === 0 || colIndex === 6) { // No. 和 Balance 列居右
              cell.alignment = rightAlignment
            } else if (colIndex === 5) { // Status 列居中
              cell.alignment = centerAlignment
            } else if (colIndex === 1 || colIndex === 2 || colIndex === 3 || colIndex === 4) { // 文本列左对齐
              cell.alignment = leftAlignment
            } else if (colIndex === 7) { // QR Code Content 列左对齐
              cell.alignment = leftAlignment
            } else {
              cell.alignment = centerAlignment
            }
            
            // 为数值列添加千位分隔符
            if (colIndex === 6) { // Balance 列
              cell.numFmt = '#,##0'
            }
            
            // 为状态列添加颜色
            if (colIndex === 5) { // Status 列
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
            
            // 为余额列添加颜色（根据值大小）
            if (colIndex === 6) { // Balance 列
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
            if (colIndex === 1) { // Code 列
              cell.font = { ...defaultFont, bold: true }
            }
            
            // 隔行着色
            if (rowIndex % 2 === 0) {
              if (colIndex !== 5 && colIndex !== 6) { // 保持状态列和余额列的颜色
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
        
        // 生成带时间戳的文件名
        const fileName = `Others_Report_${dateStr}_${timeStr}.xlsx`
        
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
                <h1 className='text-2xl font-semibold'>Others</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateOther}>
                        Create Other
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
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Code</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Type</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Location</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Balance</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                            {currentUser.role === 'Admin' && (
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentOthers.map(other => (
                            <TableRow key={other._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell>
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-4 text-center">
                                                <h3 className="font-semibold mb-2">QR Code - {other.code}</h3>
                                                <QRCodeCanvas value={generateQRContent(other)} size={150} level="M" includeMargin={true}/>
                                                <p className="text-xs dark:text-gray-300  text-gray-500 mt-2">Scan to view other details</p>
                                            </div>
                                        }
                                        trigger="hover"
                                        placement="right"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-blue-300">{other.code}</span>
                                    </Popover>
                                </TableCell>
                                <TableCell>{other.type}</TableCell>
                                <TableCell>{other.location}</TableCell>
                                <TableCell>{other.supplier}</TableCell>
                                <TableCell>{other.status}</TableCell>
                                <TableCell>{other.balance}</TableCell>
                                <TableCell><Button className='cursor-pointer py-1 px-1 text-sm h-8' outline onClick={() => handleUpdate(other)}>Edit</Button></TableCell>
                                {currentUser.role === 'Admin' && (
                                <TableCell><Button className='cursor-pointer py-1 px-1 text-sm h-8' color='red' outline onClick={() => { setOtherIdToDelete(other._id); setOpenModalDeleteOther(true); }}>Delete</Button></TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentOthers.map((other) => (
                        <OtherCard key={other._id} other={other} />
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
            <Modal show={openModalCreateOther} onClose={handleCreateOther} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Other</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Code</Label>
                                <TextInput id="code" placeholder="Enter code" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Type</Label>
                                <TextInput id="type" placeholder="Enter type" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label>
                                <Select id="location" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    <option>QA/QC</option>
                                    <option>Production</option>
                                    <option>Dryblent</option>
                                    <option>Maintenance</option>
                                    <option>Stock</option>
                                </Select>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                                <Select id="supplier" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                                </Select>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                                <Select id="status" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </Select>
                            </div>
                            <Button className="w-full cursor-pointer" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalUpdateOther} onClose={() => setOpenModalUpdateOther(false)} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Other</h3>
                        
                        {/* 添加 QR 码显示区域 */}
                        <div className="flex justify-center mb-4">
                            <div className="text-center">
                                <QRCodeCanvas className='text-center'
                                    value={generateQRContent(others.find(other => other._id === otherIdToUpdate) || {})} 
                                    size={120} 
                                    level="M" 
                                    includeMargin={true}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleUpdateSubmit}>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Code</Label><TextInput value={updateFormData.code || ''} id="code" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Type</Label><TextInput value={updateFormData.type || ''} id="type" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label><Select value={updateFormData.location || ''} id="location" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>QA/QC</option>
                                <option>Production</option>
                                <option>Dryblent</option>
                                <option>Maintenance</option>
                                <option>Stock</option>
                            </Select></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label><Select value={updateFormData.supplier || ''} id="supplier" onChange={handleUpdateChange} required>
                                <option></option>
                                {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                            </Select></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label><Select value={updateFormData.status || ''} id="status" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </Select></div>
                            <Button className="w-full cursor-pointer" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalDeleteOther} size="md" onClose={() => setOpenModalDeleteOther(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">Are you sure you want to delete this other?</h3>
                        <div className="flex justify-center gap-4">
                            <Button color="red" onClick={handleDelete}>Yes, I'm sure</Button>
                            <Button color="alternative" onClick={() => setOpenModalDeleteOther(false)}>No, cancel</Button>
                        </div>
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
    );
};

export default Others;