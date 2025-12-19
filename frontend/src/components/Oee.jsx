import { Button, Pagination, Popover, Select, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react'
import useUserstore from '../store'
import { useEffect, useState } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom';

const Oee = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [jobs,setJobs] = useState([])
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sortBy, setSortBy] = useState('starttime') // 'starttime', 'endtime', 'orderdate', 'updatedAt'
    const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
    
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
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/analysis/getjobs')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setJobs(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchJobs()
    },[currentUser._id])

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // 日期解析函数 - 更新以支持 updatedAt
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return new Date(0)
        
        // 如果是 ISO 格式（updatedAt），直接创建 Date 对象
        if (dateTimeStr.includes('T') && dateTimeStr.includes('Z')) {
            return new Date(dateTimeStr)
        }
        
        // 处理 "YYYY-MM-DD HH:mm:ss" 格式
        return new Date(dateTimeStr.replace(' ', 'T'))
    }

    // 排序和过滤 jobs
    const filteredAndSortedJobs = jobs
        .filter(job => 
            job.lotno.toLowerCase().includes(searchTerm) ||
            job.totaloutput.toString().toLowerCase().includes(searchTerm) || 
            job.wastage.toString().toLowerCase().includes(searchTerm) ||
            job.downtime.toString().toLowerCase().includes(searchTerm) ||
            job.totalmeter.toString().toLowerCase().includes(searchTerm) ||
            job.starttime.toLowerCase().includes(searchTerm) ||
            job.endtime.toLowerCase().includes(searchTerm) ||
            job.orderdate.toLowerCase().includes(searchTerm) ||
            job.lotno.toLowerCase().includes(searchTerm) ||
            job.colourcode.toLowerCase().includes(searchTerm) ||
            job.material.toLowerCase().includes(searchTerm) ||
            job.totalorder.toString().toLowerCase().includes(searchTerm) ||
            job.irr.toString().toLowerCase().includes(searchTerm) ||
            job.arr.toString().toLowerCase().includes(searchTerm) ||
            job.prodleadtime.toString().toLowerCase().includes(searchTerm) ||
            job.planprodtime.toString().toLowerCase().includes(searchTerm) ||
            job.operatingtime.toString().toLowerCase().includes(searchTerm) ||
            job.availability.toString().toLowerCase().includes(searchTerm) ||
            job.performance.toString().toLowerCase().includes(searchTerm) ||
            job.quality.toString().toLowerCase().includes(searchTerm) ||
            job.code.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => {
            // 针对 updatedAt 使用 ISO 字符串，其他使用自定义解析
            const dateA = sortBy === 'updatedAt' ? 
                new Date(a.updatedAt) : 
                parseDateTime(a[sortBy])
            const dateB = sortBy === 'updatedAt' ? 
                new Date(b.updatedAt) : 
                parseDateTime(b[sortBy])
            
            if (sortOrder === 'asc') {
                return dateA - dateB
            } else {
                return dateB - dateA
            }
        })

    // 生成Excel报告的函数
    const generateExcelReport = async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        
        // 使用当前日期作为报告日期
        const reportDate = new Date();
        const dateStr = reportDate.toISOString().split('T')[0];
        const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
        
        const worksheet = workbook.addWorksheet(`OEE Report ${dateStr}`);
        
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
          } = options;

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
          };
        };

        // 应用打印设置
        setupWorksheetPrint(worksheet, {
          fitToHeight: 1,
          fitToWidth: 1,
          horizontalCentered: true,
          verticalCentered: false
        });

        // 定义列宽
        const columnWidths = [
          5,    // No.
          10,   // Code
          15,   // Lot No
          20,   // Start Time
          20,   // End Time
          15,   // Order Date
          15,   // Colour Code
          40,   // Material
          12,   // Total Order
          12,   // Total Output
          10,   // Reject
          12,   // Reject Cause
          10,   // Startup
          10,   // Screw Out
          18,   // Process Complication
          10,   // QC Time
          15,   // Reason
          12,   // Downtime
          12,   // Wash Resin
          10,   // Wash Up
          12,   // Strand Drop
          12,   // White Oil
          10,   // Vent
          10,   // Uneven Pallet
          15,   // Trial Run
          10,   // Wastage
          12,   // Meter Start
          12,   // Meter End
          12,   // Total Meter
          20,   // Operator
          10,   // IRR
          10,   // ARR
          10,   // IPQC
          10,   // Setup
          15,   // Prod Lead Time
          15,   // Plan Prod Time
          15,   // Operating Time
          15,   // Availability
          15,   // Performance
          15,   // Quality
          15,   // OEE
          10,   // OEE %
          25,   // Created At
          25    // Updated At
        ];

        worksheet.columns = columnWidths.map(width => ({ width }));

        // 定义样式
        const titleFont = { name: 'Arial Black', size: 16, bold: true };
        const headerFont = { name: 'Calibri', size: 11, bold: true };
        const defaultFont = { name: 'Calibri', size: 11 };
        
        // 边框样式
        const borderStyle = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // 对齐方式
        const centerAlignment = { horizontal: 'center', vertical: 'middle' };
        const leftAlignment = { horizontal: 'left', vertical: 'middle' };

        // 标题行
        const titleRow = worksheet.getRow(1);
        titleRow.height = 30;
        titleRow.getCell(1).value = `OEE REPORT - OVERALL EQUIPMENT EFFECTIVENESS`;
        titleRow.getCell(1).font = titleFont;
        titleRow.getCell(1).alignment = centerAlignment;
        worksheet.mergeCells(1, 1, 1, columnWidths.length);

        // 副标题行
        const subtitleRow = worksheet.getRow(2);
        subtitleRow.height = 20;
        subtitleRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`;
        subtitleRow.getCell(1).font = { ...defaultFont, italic: true };
        subtitleRow.getCell(1).alignment = centerAlignment;
        worksheet.mergeCells(2, 1, 2, columnWidths.length);

        // 表头行
        const headerRow = worksheet.getRow(3);
        headerRow.height = 25;
        
        const headers = [
          'No.', 'Extruder', 'Lot No', 'Start Time', 'End Time', 'Order Date',
          'Colour Code', 'Material', 'Total Order', 'Total Output', 'Reject',
          'Reject Cause', 'Startup', 'Screw Out', 'Process Complication', 'QC Time',
          'Reason', 'Downtime', 'Wash Resin', 'Wash Up', 'Strand Drop', 'White Oil',
          'Vent', 'Uneven Pallet', 'Trial Run', 'Wastage', 'Meter Start', 'Meter End',
          'Total Meter', 'Operator', 'IRR', 'ARR', 'IPQC', 'Setup', 'Prod Lead Time',
          'Plan Prod Time', 'Operating Time', 'Availability', 'Performance', 'Quality',
          'OEE', 'OEE %', 'Created At', 'Updated At'
        ];

        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;
          cell.font = headerFont;
          cell.alignment = centerAlignment;
          cell.border = borderStyle;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        });

        // 获取所有过滤后的数据
        const exportData = filteredAndSortedJobs;
        
        // 如果没有数据，添加提示行
        if (exportData.length === 0) {
          const emptyRow = worksheet.getRow(4);
          emptyRow.getCell(1).value = 'No OEE data available for export';
          worksheet.mergeCells(4, 1, 4, columnWidths.length);
          emptyRow.getCell(1).alignment = centerAlignment;
          emptyRow.getCell(1).font = { ...defaultFont, italic: true };
        } else {
          // 数据行
          let rowIndex = 4;
          exportData.forEach((job, index) => {
            const row = worksheet.getRow(rowIndex);
            row.height = 20;

            // 准备行数据
            const rowData = [
              index + 1,
              job.code || '',
              job.lotno || '',
              job.starttime || '',
              job.endtime || '',
              job.orderdate || '',
              job.colourcode || '',
              job.material || '',
              job.totalorder || 0,
              job.totaloutput || 0,
              job.reject || 0,
              job.cause || '',
              job.startup || 0,
              job.screwout || 0,
              job.processcomplication || '',
              job.qctime || 0,
              job.reason || '',
              job.downtime || 0,
              job.washresin || 0,
              job.washup || 0,
              job.stranddrop || 0,
              job.whiteoil || 0,
              job.vent || 0,
              job.unevenpallet || 0,
              job.trialrun || 0,
              job.wastage || 0,
              job.meterstart || 0,
              job.meterend || 0,
              job.totalmeter || 0,
              job.operator || '',
              job.irr || 0,
              job.arr || 0,
              job.ipqc || 0,
              job.setup || 0,
              job.prodleadtime || 0,
              job.planprodtime || 0,
              job.operatingtime || 0,
              job.availability ? job.availability.toFixed(4) : 0,
              job.performance ? job.performance.toFixed(4) : 0,
              job.quality ? job.quality.toFixed(4) : 0,
              job.oee ? job.oee.toFixed(4) : 0,
              job.oee ? (job.oee * 100).toFixed(1) + '%' : '0%',
              job.createdAt ? new Date(job.createdAt).toLocaleString() : '',
              job.updatedAt ? new Date(job.updatedAt).toLocaleString() : ''
            ];

            // 填充数据并设置样式
            rowData.forEach((value, colIndex) => {
              const cell = row.getCell(colIndex + 1);
              cell.value = value;
              cell.font = defaultFont;
              
              if (colIndex === 0 || colIndex === 1 || colIndex === 2 || 
                  colIndex === 3 || colIndex === 4 || colIndex === 5 ||
                  colIndex === 6 || colIndex === 7 || colIndex === 29) {
                cell.alignment = leftAlignment;
              } else {
                cell.alignment = centerAlignment;
              }
              
              cell.border = borderStyle;
              
              if (colIndex === 41) {
                const oeePercentage = job.oee ? job.oee * 100 : 0;
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { 
                    argb: oeePercentage >= 85 ? 'FFC6EFCE' : 'FFFFC7CE'
                  }
                };
              }
              
              if (colIndex >= 37 && colIndex <= 40) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2F2F2' }
                };
              }
            });

            rowIndex++;
          });

          // 添加自动筛选器
          const autoFilterRange = {
            from: { row: 3, column: 1 },
            to: { row: rowIndex - 1, column: columnWidths.length }
          };
          
          worksheet.autoFilter = autoFilterRange;

          // 添加总计行
          const totalRow = worksheet.getRow(rowIndex);
          totalRow.height = 25;
          
          worksheet.mergeCells(rowIndex, 1, rowIndex, 8);
          totalRow.getCell(1).value = `Total Records: ${exportData.length}`;
          totalRow.getCell(1).font = { ...defaultFont, bold: true };
          totalRow.getCell(1).alignment = centerAlignment;
          
          for (let i = 1; i <= columnWidths.length; i++) {
            const cell = totalRow.getCell(i);
            cell.border = borderStyle;
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9EAD3' }
            };
          }
          
          const avgOEE = exportData.length > 0 
            ? exportData.reduce((sum, job) => sum + (job.oee || 0), 0) / exportData.length
            : 0;
          
          const avgOeeCell = worksheet.getCell(rowIndex, 41);
          avgOeeCell.value = `Avg OEE: ${(avgOEE * 100).toFixed(1)}%`;
          avgOeeCell.font = { ...defaultFont, bold: true };
          avgOeeCell.alignment = centerAlignment;
          worksheet.mergeCells(rowIndex, 40, rowIndex, 42);
        }

        // 设置冻结窗格
        worksheet.views = [
          {
            state: 'frozen',
            xSplit: 8,
            ySplit: 3,
            topLeftCell: 'I4',
            activeCell: 'I4'
          }
        ];

        // 生成 Excel 文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        return { blob, fileName: `OEE_Report_${dateStr}_${timeStr}.xlsx` };

      } catch (error) {
        console.error('Error generating Excel report:', error);
        throw error;
      }
    };

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

    // 获取OEE百分比显示
    const getOeePercentage = (oeeValue) => {
        return Math.round(oeeValue * 100);
    }

    // 根据OEE值获取颜色类名
    const getOeeColorClass = (oeeValue) => {
        const percentage = getOeePercentage(oeeValue);
        return percentage >= 85 ? 'text-green-500 font-semibold' : 'text-red-600 font-semibold';
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentJobs = filteredAndSortedJobs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredAndSortedJobs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // 移动端简洁分页组件
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
    const OeeCard = ({ job }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Extruder</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{job.code}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Lot No</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">Extruder:</p>
                                <p className="text-xs mb-2">{job.code}</p>
                                <p className="font-semibold text-sm">Prod start:</p>
                                <p className="text-xs mb-2">{job.starttime}</p>
                                <p className="font-semibold text-sm">Prod end:</p>
                                <p className="text-xs mb-2">{job.endtime}</p>
                                <p className="font-semibold text-sm">Order date:</p>
                                <p className="text-xs mb-2">{job.orderdate}</p>
                                <p className="font-semibold text-sm">Colour code:</p>
                                <p className="text-xs mb-2">{job.colourcode}</p>
                                <p className="font-semibold text-sm">Material:</p>
                                <p className="text-xs mb-2">{job.material}</p>
                                <p className="font-semibold text-sm">Total order:</p>
                                <p className="text-xs mb-2">{job.totalorder}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.lotno}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Availability</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Operatingtime / Plan Prodtime) = Availability`}</p>
                                <p className="text-xs mb-2">{`(${job.operatingtime} / ${job.planprodtime}) = ${job.availability}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.availability}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Performance</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) / IRR = Performance`}</p>
                                <p className="text-xs mb-2">{`(${job.totaloutput} / ${job.operatingtime}) / ${job.irr} = ${job.performance}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.performance}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Quality</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`(Totaloutput - Reject) / Total output = Quality`}</p>
                                <p className="text-xs mb-2">{`(${job.totaloutput} - ${job.reject}) / ${job.totaloutput} = ${job.quality}`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {job.quality}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">OEE</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-3 max-w-xs">
                                <p className="font-semibold text-sm">{`Availability x Performance x Quality = OEE`}</p>
                                <p className="text-xs mb-2">{`${job.availability} x ${job.performance} x ${job.quality} = ${job.oee}`}</p>
                                <p className="font-semibold text-sm mt-2">OEE Percentage:</p>
                                <p className="text-xs">{`${getOeePercentage(job.oee)}%`}</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            getOeeColorClass(job.oee)
                        }`}>
                            {getOeePercentage(job.oee)}%
                        </span>
                    </Popover>
                </div>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>OEEs</h1>
                <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
                    {/* 排序控件 */}
                    <div className='flex gap-2'>
                        <Select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className='w-full sm:w-40'
                        >
                            <option value="starttime">Prod Start</option>
                            <option value="endtime">Prod End</option>
                            <option value="orderdate">Order Date</option>
                            <option value="updatedAt">Updated Date</option>
                        </Select>
                        
                        <Select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className='w-full sm:w-40'
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </Select>
                    </div>
                    
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full sm:w-auto'
                    />
                    
                    <div className='flex gap-2'>
                        <Button 
                            color='green' 
                            className='cursor-pointer w-full sm:w-auto'
                            onClick={handleDownloadReport}
                        >
                            Report
                        </Button>
                        
                        <Button 
                            color='blue' 
                            className='cursor-pointer w-full sm:w-auto'
                            onClick={confirmSaveToServer}
                        >
                            Save to Server
                        </Button>
                    </div>
                </div>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-3 [&_th]:py-3">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Ext</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Lot no</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Availability</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Performance</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quality</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>OEE</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentJobs.map((job) => (
                            <TableRow key={job._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell>{job.code}</TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">Extruder:</p>
                                                <p className="text-xs mb-2">{job.code}</p>
                                                <p className="font-semibold text-sm">Prod start:</p>
                                                <p className="text-xs mb-2">{job.starttime}</p>
                                                <p className="font-semibold text-sm">Prod end:</p>
                                                <p className="text-xs mb-2">{job.endtime}</p>
                                                <p className="font-semibold text-sm">Order date:</p>
                                                <p className="text-xs mb-2">{job.orderdate}</p>
                                                <p className="font-semibold text-sm">Colour code:</p>
                                                <p className="text-xs mb-2">{job.colourcode}</p>
                                                <p className="font-semibold text-sm">Material:</p>
                                                <p className="text-xs mb-2">{job.material}</p>
                                                <p className="font-semibold text-sm">Total order:</p>
                                                <p className="text-xs mb-2">{job.totalorder}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.lotno}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Operatingtime / Plan Prodtime) = Availability`}</p>
                                                <p className="text-xs mb-2">{`(${job.operatingtime} / ${job.planprodtime}) = ${job.availability}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.availability}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Totaloutput / Operatingtime) / IRR = Performance`}</p>
                                                <p className="text-xs mb-2">{`(${job.totaloutput} / ${job.operatingtime}) / ${job.irr} = ${job.performance}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.performance}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`(Totaloutput - Reject) / Total output = Quality`}</p>
                                                <p className="text-xs mb-2">{`(${job.totaloutput} - ${job.reject}) / ${job.totaloutput} = ${job.quality}`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                                            {job.quality}
                                        </span>
                                    </Popover>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-3 max-w-xs">
                                                <p className="font-semibold text-sm">{`Availability x Performance x Quality = OEE`}</p>
                                                <p className="text-xs mb-2">{`${job.availability} x ${job.performance} x ${job.quality} = ${job.oee}`}</p>
                                                <p className="font-semibold text-sm mt-2">OEE Percentage:</p>
                                                <p className="text-xs">{`${getOeePercentage(job.oee)}%`}</p>
                                            </div>
                                        }
                                        trigger='hover'
                                        placement="top"
                                        arrow={false}
                                    >
                                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full ${getOeeColorClass(job.oee)}`}>
                                            {getOeePercentage(job.oee)}%
                                        </span>
                                    </Popover>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentJobs.map((job) => (
                        <OeeCard key={job._id} job={job} />
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

export default Oee