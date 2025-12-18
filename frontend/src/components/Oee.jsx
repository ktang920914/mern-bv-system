import { Button, Pagination, Popover, Select, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import useUserstore from '../store'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
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

    // 生成Excel报告的函数 - 修复版（导出所有数据）
    // 生成Excel报告的函数 - 修复版（导出所有数据）
const generateExcelReport = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // 使用当前日期作为报告日期
    const reportDate = new Date();
    const dateStr = reportDate.toISOString().split('T')[0];
    const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
    
    const worksheet = workbook.addWorksheet(`OEE Report ${dateStr}`);
    
    // 设置工作表打印选项 - 像 Statistics 页面一样
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
    
    // 边框样式 - 像 Statistics 页面一样
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
        fgColor: { argb: 'FFE0E0E0' } // 浅灰色背景，和 Statistics 页面一样
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
          index + 1, // No.
          job.code || '', // Extruder
          job.lotno || '', // Lot No
          job.starttime || '', // Start Time
          job.endtime || '', // End Time
          job.orderdate || '', // Order Date
          job.colourcode || '', // Colour Code
          job.material || '', // Material
          job.totalorder || 0, // Total Order
          job.totaloutput || 0, // Total Output
          job.reject || 0, // Reject
          job.cause || '', // Reject Cause
          job.startup || 0, // Startup
          job.screwout || 0, // Screw Out
          job.processcomplication || '', // Process Complication
          job.qctime || 0, // QC Time
          job.reason || '', // Reason
          job.downtime || 0, // Downtime
          job.washresin || 0, // Wash Resin
          job.washup || 0, // Wash Up
          job.stranddrop || 0, // Strand Drop
          job.whiteoil || 0, // White Oil
          job.vent || 0, // Vent
          job.unevenpallet || 0, // Uneven Pallet
          job.trialrun || 0, // Trial Run
          job.wastage || 0, // Wastage
          job.meterstart || 0, // Meter Start
          job.meterend || 0, // Meter End
          job.totalmeter || 0, // Total Meter
          job.operator || '', // Operator
          job.irr || 0, // IRR
          job.arr || 0, // ARR
          job.ipqc || 0, // IPQC
          job.setup || 0, // Setup
          job.prodleadtime || 0, // Prod Lead Time
          job.planprodtime || 0, // Plan Prod Time
          job.operatingtime || 0, // Operating Time
          job.availability ? job.availability.toFixed(4) : 0, // Availability
          job.performance ? job.performance.toFixed(4) : 0, // Performance
          job.quality ? job.quality.toFixed(4) : 0, // Quality
          job.oee ? job.oee.toFixed(4) : 0, // OEE
          job.oee ? (job.oee * 100).toFixed(1) + '%' : '0%', // OEE %
          job.createdAt ? new Date(job.createdAt).toLocaleString() : '', // Created At
          job.updatedAt ? new Date(job.updatedAt).toLocaleString() : ''  // Updated At
        ];

        // 填充数据并设置样式
        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          cell.font = defaultFont;
          
          // 设置对齐方式：数字和日期居中，文本左对齐
          if (colIndex === 0 || colIndex === 1 || colIndex === 2 || 
              colIndex === 3 || colIndex === 4 || colIndex === 5 ||
              colIndex === 6 || colIndex === 7 || colIndex === 29) {
            // 文本列左对齐
            cell.alignment = leftAlignment;
          } else {
            // 数字和百分比列居中
            cell.alignment = centerAlignment;
          }
          
          // 设置边框
          cell.border = borderStyle;
          
          // 为 OEE 百分比列添加条件格式颜色
          if (colIndex === 41) { // OEE % 列
            const oeePercentage = job.oee ? job.oee * 100 : 0;
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { 
                argb: oeePercentage >= 85 ? 'FFC6EFCE' : 'FFFFC7CE' // 绿色或红色背景
              }
            };
          }
          
          // 为关键指标添加浅色背景
          if (colIndex >= 37 && colIndex <= 40) { // Availability, Performance, Quality, OEE
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' } // 浅灰色背景
            };
          }
        });

        rowIndex++;
      });

      // 为表头行添加筛选器 - ⭐ 关键添加部分
      // ExcelJS 自动筛选器设置
      const autoFilterRange = {
        from: { row: 3, column: 1 }, // 从第3行第1列开始（表头行）
        to: { row: rowIndex - 1, column: columnWidths.length } // 到最后一行最后一列
      };
      
      // 设置自动筛选器
      worksheet.autoFilter = autoFilterRange;

      // 添加总计行
      const totalRow = worksheet.getRow(rowIndex);
      totalRow.height = 25;
      
      // 合并单元格用于总计文本
      worksheet.mergeCells(rowIndex, 1, rowIndex, 8);
      totalRow.getCell(1).value = `Total Records: ${exportData.length}`;
      totalRow.getCell(1).font = { ...defaultFont, bold: true };
      totalRow.getCell(1).alignment = centerAlignment;
      
      // 设置总计行背景色
      for (let i = 1; i <= columnWidths.length; i++) {
        const cell = totalRow.getCell(i);
        cell.border = borderStyle;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9EAD3' } // 浅绿色背景
        };
      }
      
      // 计算平均 OEE
      const avgOEE = exportData.length > 0 
        ? exportData.reduce((sum, job) => sum + (job.oee || 0), 0) / exportData.length
        : 0;
      
      const avgOeeCell = worksheet.getCell(rowIndex, 41); // OEE % 列
      avgOeeCell.value = `Avg OEE: ${(avgOEE * 100).toFixed(1)}%`;
      avgOeeCell.font = { ...defaultFont, bold: true };
      avgOeeCell.alignment = centerAlignment;
      worksheet.mergeCells(rowIndex, 40, rowIndex, 42); // 合并 OEE, OEE %, Created At 列
    }

    // 设置冻结窗格 - 冻结表头行
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 8,
        ySplit: 3, // 冻结前3行（标题、副标题、表头）
        topLeftCell: 'I4', // 从第4行开始可滚动
        activeCell: 'I4'
      }
    ];

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 保存文件
    saveAs(blob, `OEE_Report_${dateStr}_${timeStr}.xlsx`);

    console.log('Excel report generated with auto-filter successfully!');

  } catch (error) {
    console.error('Error generating Excel report:', error);
    alert('Failed to generate Excel report. Please try again.');
  }
};

    // 获取OEE百分比显示（去掉小数点）
    const getOeePercentage = (oeeValue) => {
        return Math.round(oeeValue * 100);
    }

    // 根据OEE值获取颜色类名
    const getOeeColorClass = (oeeValue) => {
        const percentage = getOeePercentage(oeeValue);
        return percentage >= 85 ? 'text-green-500 font-semibold' : 'text-red-600 font-semibold';
    }

    // 格式化 updated date 用于显示
    const formatUpdatedDate = (updatedAt) => {
        if (!updatedAt) return '-'
        const date = new Date(updatedAt)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    // 移动端卡片组件 - 添加 updated date 信息
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
                    {/* 排序控件 - 增加 updatedAt 选项 */}
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
                    
                    <Button 
                        color='green' 
                        className='cursor-pointer w-full sm:w-auto'
                        onClick={generateExcelReport}
                    >
                        Report
                    </Button>
                </div>
            </div>

            {/* 桌面端表格视图 - 增加 Updated 列 */}
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
        </div>
    )
}

export default Oee