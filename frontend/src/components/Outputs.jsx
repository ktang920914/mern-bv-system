import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput, Badge, Card } from 'flowbite-react'
import { useEffect } from 'react'
import { useState } from 'react'
import useUserstore from '../store'
import { HiX, HiCheck } from 'react-icons/hi'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// 导入 Chart.js 相关
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Outputs = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [openModal,setOpenModal] = useState(false)
    const [outputs,setOutputs] = useState([])
    const [showTable, setShowTable] = useState(false)
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [yearInput, setYearInput] = useState(new Date().getFullYear().toString())
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(7)
    const [selectedCodes, setSelectedCodes] = useState([])
    const [selectedChartType, setSelectedChartType] = useState('bar') // 默认显示柱状图
    const [selectedDataType, setSelectedDataType] = useState('totaloutput') // 默认显示总产出数据
    const [availableCodes, setAvailableCodes] = useState([]) // 新增
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768) // 新增移动端检测

    // 辅助函数：处理浮点数精度
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return parseFloat(num.toFixed(2));
    }

    // 检测屏幕大小变化
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

    // 获取可用的 Job Code 列表
    useEffect(() => {
        const fetchAvailableCodes = async () => {
            try {
                const res = await fetch('/api/analysis/getjobs');
                const data = await res.json();
                if (res.ok) {
                    // 从 Job 数据中提取唯一的 code 字段
                    const jobCodes = [...new Set(data.map(item => item.code))].filter(Boolean);
                    setAvailableCodes(jobCodes);
                }
            } catch (error) {
                console.error('Error fetching job codes:', error);
                // 如果 API 不存在，使用默认列表
                setAvailableCodes(['L1', 'L2', 'L3', 'L5', 'L6', 'L9', 'L10', 'L11', 'L12']);
            }
        };
        fetchAvailableCodes();
    }, []);

    // 当 selectedCodes 改变时自动获取数据
    useEffect(() => {
        if (showTable) {
            fetchOutputsForYear(displayYear);
        }
    }, [selectedCodes]); // 添加 selectedCodes 作为依赖

    const monthFields = [
        { key: 'jan', name: 'Jan' },
        { key: 'feb', name: 'Feb' },
        { key: 'mar', name: 'Mar' },
        { key: 'apr', name: 'Apr' },
        { key: 'may', name: 'May' },
        { key: 'jun', name: 'Jun' },
        { key: 'jul', name: 'Jul' },
        { key: 'aug', name: 'Aug' },
        { key: 'sep', name: 'Sep' },
        { key: 'oct', name: 'Oct' },
        { key: 'nov', name: 'Nov' },
        { key: 'dec', name: 'Dec' }
    ]

    const dataTypes = [
        { value: 'totalorder', label: 'Total Order' },
        { value: 'totaloutput', label: 'Total Output' },
        { value: 'totalmeter', label: 'Total Meter' },
        { value: 'wastage', label: 'Wastage' },
        { value: 'reject', label: 'Reject' },
        { value: 'downtime', label: 'Downtime' },
        { value: 'prodleadtime', label: 'Prod Leadtime' },
        { value: 'operatingtime', label: 'Operating Time' },
        { value: 'arr', label: 'ARR' },
        { value: 'screwout', label: 'Screw out' },
        { value: 'availability', label: 'Availability' },
        { value: 'performance', label: 'Performance' },
        { value: 'quality', label: 'Quality' },
        { value: 'oee', label: 'OEE' }
    ]

    // 图表类型选项
    const chartTypes = [
        { value: 'bar', label: 'Bar' },
        { value: 'line', label: 'Line' },
        { value: 'pie', label: 'Pie' }
    ]

    useEffect(() => {
        // 组件加载时自动获取当前年份的所有数据
        fetchOutputsForYear(new Date().getFullYear().toString())
    }, [currentUser._id])

    const fetchOutputsForYear = async (year) => {
        try {
            setLoading(true)
            setErrorMessage(null)
            
            // 为每种数据类型获取数据
            const allOutputs = []
            
            for (const dataType of dataTypes) {
                // 构建查询参数
                const params = new URLSearchParams({
                    year: year,
                    data: dataType.value
                })
                
                // 如果选择了特定的 Job Code，添加到查询参数
                if (selectedCodes.length > 0) {
                    params.append('codes', selectedCodes.join(','))
                }
                
                const res = await fetch(`/api/output/calculate?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    // 确保数据格式正确
                    if (Array.isArray(data)) {
                        // 为每个数据项添加标识符并清理数据精度
                        const dataWithType = data.map(item => {
                            const cleanedItem = { ...item };
                            // 清理月份数据中的浮点数精度
                            monthFields.forEach(month => {
                                if (cleanedItem[month.key] !== undefined) {
                                    cleanedItem[month.key] = formatNumber(cleanedItem[month.key]);
                                }
                            });
                            // 清理总计数据
                            if (cleanedItem.total !== undefined) {
                                cleanedItem.total = formatNumber(cleanedItem.total);
                            }
                            return {
                                ...cleanedItem,
                                dataType: dataType.value,
                                dataTypeLabel: dataType.label
                            }
                        })
                        allOutputs.push(...dataWithType)
                    } else if (typeof data === 'object') {
                        // 为单个数据对象添加标识符并清理精度
                        const cleanedData = { ...data };
                        monthFields.forEach(month => {
                            if (cleanedData[month.key] !== undefined) {
                                cleanedData[month.key] = formatNumber(cleanedData[month.key]);
                            }
                        });
                        if (cleanedData.total !== undefined) {
                            cleanedData.total = formatNumber(cleanedData.total);
                        }
                        allOutputs.push({
                            ...cleanedData,
                            dataType: dataType.value,
                            dataTypeLabel: dataType.label
                        })
                    }
                } else {
                    console.error(`Failed to fetch data for ${dataType.value}:`, res.status)
                }
            }
            
            setOutputs(allOutputs)
            setDisplayYear(year)
            setShowTable(true)
            
        } catch (error) {
            setErrorMessage('Error fetching data: ' + error.message)
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    // 准备图表数据
    const prepareChartData = () => {
        if (outputs.length === 0) {
            console.log('No outputs data available');
            return null;
        }

        console.log('Available outputs:', outputs);
        console.log('Looking for data type:', selectedDataType);

        // 获取当前选中的数据类型的输出
        const selectedData = outputs.find(output => 
            output.dataType === selectedDataType
        );

        console.log('Found data for chart:', selectedData);

        if (!selectedData) {
            console.log('No data found for selected data type');
            return null;
        }

        // 月份标签
        const labels = monthFields.map(month => month.name);
        
        // 数据值 - 使用 formatNumber 确保精度
        const data = monthFields.map(month => {
            const value = selectedData[month.key];
            return formatNumber(value);
        });

        console.log('Chart data values:', data);

        // 修复后的饼图插件配置
        const piePlugins = {
            legend: { 
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        // 修复：处理浮点数精度
                        const roundedValue = formatNumber(value);
                        const percentage = total > 0 ? formatNumber((value / total) * 100) : 0;
                        return `${label}: ${roundedValue} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        }

        const plugins = selectedChartType === 'pie' ? [piePlugins] : [];

        // 图表配置
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `${dataTypes.find(dt => dt.value === selectedDataType)?.label} - ${displayYear}${selectedCodes.length > 0 ? ` (${selectedCodes.join(', ')})` : ''}`,
                    font: {
                        size: 16
                    }
                },
                ...(selectedChartType === 'pie' && {
                    tooltip: piePlugins.tooltip
                })
            },
            scales: selectedChartType !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            } : undefined
        };

        // 图表数据
        const chartData = {
            labels,
            datasets: [
                {
                    label: dataTypes.find(dt => dt.value === selectedDataType)?.label,
                    data,
                    backgroundColor: selectedChartType === 'pie' 
                        ? [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
                          ]
                        : 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: selectedChartType === 'line',
                    tension: selectedChartType === 'line' ? 0.1 : undefined
                },
            ],
        };

        return { options, data: chartData, plugins };
    };

    const generateExcelReport = () => {
        if (outputs.length === 0) {
            setErrorMessage('No data to export')
            return
        }

        try {
            const worksheetData = []
            
            // 添加报告标题和筛选信息
            worksheetData.push(['Outputs Report'])
            worksheetData.push([`Year: ${displayYear}`])
            
            // 添加筛选的 Job Code 信息
            if (selectedCodes.length > 0) {
                worksheetData.push([`Filtered Job Codes: ${selectedCodes.join(', ')}`])
            } else {
                worksheetData.push(['Filtered Job Codes: All codes selected'])
            }
            
            worksheetData.push([]) // 空行
            
            // 添加标题行
            const headers = ['Data Type', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
            worksheetData.push(headers)
            
            // 添加数据行
            outputs.forEach(output => {
                const rowData = [output.dataTypeLabel || 'Unknown']
                
                monthFields.forEach(month => {
                    const value = output[month.key] || 0
                    rowData.push(formatNumber(value))
                })
                
                const total = output.total || 0
                rowData.push(formatNumber(total))
                
                worksheetData.push(rowData)
            })
            
            // 创建工作簿和工作表
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
            
            // 设置列宽
            const colWidths = [
                { wch: 25 }, // Data Type 列
                ...Array(12).fill({ wch: 10 }), // 月份列
                { wch: 12 } // Total 列
            ]
            worksheet['!cols'] = colWidths
            
            // 合并标题单元格
            if (!worksheet['!merges']) worksheet['!merges'] = [];
            worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }); // 合并标题行
            worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }); // 合并年份行
            worksheet['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 13 } }); // 合并筛选信息行
            
            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, `Outputs ${displayYear}`)
            
            // 生成 Excel 文件并下载
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            // 生成文件名，包含筛选的 Job Code
            let fileName = `Outputs_Report_${displayYear}`
            if (selectedCodes.length > 0) {
                fileName += `_${selectedCodes.join('_')}`
            }
            
            saveAs(data, `${fileName}.xlsx`)
            
        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message)
            console.error('Excel export error:', error)
        }
    }

    const handleYearChange = () => {
        setOpenModal(!openModal)
        setYearInput(displayYear)
        setErrorMessage(null)
    }

    const handleYearInputChange = (e) => {
        setYearInput(e.target.value.trim())
    }

    const handleCodeSelection = (code) => {
        if (selectedCodes.includes(code)) {
            setSelectedCodes(selectedCodes.filter(c => c !== code))
        } else {
            setSelectedCodes([...selectedCodes, code])
        }
    }

    const clearSelectedCodes = () => {
        setSelectedCodes([])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!yearInput) {
            setErrorMessage('Please enter a year')
            return
        }
        
        await fetchOutputsForYear(yearInput)
        setOpenModal(false)
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredOutputs = outputs.filter(output => 
        output.dataTypeLabel && output.dataTypeLabel.toLowerCase().includes(searchTerm)
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentOutputs = filteredOutputs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredOutputs.length
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

    // 格式化数字显示（保留2位小数）- 用于显示
    const formatDisplayNumber = (value) => {
        if (value === undefined || value === null) return '0.00';
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return num.toFixed(2);
    }

    // 获取图表数据
    const chartData = prepareChartData();

    // 移动端卡片渲染函数
    const renderMobileCards = () => {
        return (
            <div className="space-y-4">
                {currentOutputs.map((output, index) => (
                    <Card key={output._id || index} className="p-4">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {output.dataTypeLabel || 'Unknown'}
                            </h3>
                        </div>
                        
                        {/* 月份数据网格 - 4行 x 3列 */}
                        <div className="space-y-3">
                            {/* 第一行: Jan, Feb, Mar */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Jan</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.jan)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Feb</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.feb)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Mar</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.mar)}</div>
                                </div>
                            </div>
                            
                            {/* 第二行: Apr, May, Jun */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Apr</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.apr)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">May</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.may)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Jun</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.jun)}</div>
                                </div>
                            </div>
                            
                            {/* 第三行: Jul, Aug, Sep */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Jul</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.jul)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Aug</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.aug)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Sep</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.sep)}</div>
                                </div>
                            </div>
                            
                            {/* 第四行: Oct, Nov, Dec */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Oct</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.oct)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Nov</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.nov)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-900 dark:text-gray-400">Dec</div>
                                    <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output.dec)}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 总计 */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatDisplayNumber(output.total)}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Outputs {displayYear}</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Search data' 
                        value={searchTerm}
                        onChange={handleSearch}
                        disabled={!showTable}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleYearChange}>
                        Change Year
                    </Button>
                    <Button 
                        color='green' 
                        className='cursor-pointer flex-1 sm:flex-none'
                        onClick={generateExcelReport}
                        disabled={outputs.length === 0}
                    >
                        Report
                    </Button>
                </div>
            </div>

            {/* Job Code 筛选器 - 移动端优化显示 */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Filter by Job Code</Label>
                    {selectedCodes.length > 0 && (
                        <Button size="xs" color="light" onClick={clearSelectedCodes}>
                            Clear All
                        </Button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedCodes.map(code => (
                        <Badge key={code} color="info" className="flex items-center gap-1 py-0.5 px-2 text-xs">
                            {code}
                            <HiX 
                                className="cursor-pointer text-xs" 
                                onClick={() => handleCodeSelection(code)} 
                            />
                        </Badge>
                    ))}
                    {selectedCodes.length === 0 && (
                        <span className="text-gray-500 text-xs">All codes selected</span>
                    )}
                </div>
                
                {/* Job Code 选项 - 移动端优化 */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {availableCodes.map(code => (
                        <div 
                            key={code}
                            className={`flex items-center p-1 rounded cursor-pointer text-xs ${
                                selectedCodes.includes(code) 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => handleCodeSelection(code)}
                        >
                            <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                                selectedCodes.includes(code) 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'bg-white border-gray-300 dark:bg-gray-600 dark:border-gray-500'
                            }`}>
                                {selectedCodes.includes(code) && (
                                    <HiCheck className="w-2 h-2 text-white" />
                                )}
                            </div>
                            {code}
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    {selectedCodes.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Showing: {selectedCodes.join(' + ')}
                        </div>
                    )}
                </div>
            </div>

            {/* 图表控制区域 */}
            {outputs.length > 0 && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-950 dark:text-gray-800">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <Label className="font-semibold">Chart Options:</Label>
                        
                        <div className="flex items-center gap-2">
                            <Label htmlFor="dataType" className="text-sm">Data Type:</Label>
                            <select
                                id="dataType"
                                value={selectedDataType}
                                onChange={(e) => setSelectedDataType(e.target.value)}
                                className={`text-sm p-2 border rounded-md ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {dataTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Label htmlFor="chartType" className="text-sm">Chart Type:</Label>
                            <select
                                id="chartType"
                                value={selectedChartType}
                                onChange={(e) => setSelectedChartType(e.target.value)}
                                className={`text-sm p-2 border rounded-md ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {chartTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 图表显示区域 */}
                    {chartData ? (
                        <div className="h-80 dark:bg-white">
                            {selectedChartType === 'bar' && (
                                <Bar options={chartData.options} data={chartData.data}/>
                            )}
                            {selectedChartType === 'line' && (
                                <Line options={chartData.options} data={chartData.data}/>
                            )}
                            {selectedChartType === 'pie' && (
                                <Pie options={chartData.options} data={chartData.data} plugins={chartData.plugins}/>
                            )}
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">
                            No chart data available for selected data type
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <Spinner size="xl" />
                    <p className="mt-2 min-h-screen">Loading outputs...</p>
                </div>
            ) : showTable && outputs.length > 0 ? (
                <>
                    {/* 移动端显示卡片，桌面端显示表格 */}
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        <Table hoverable className='mb-6'>
                            <TableHead>
                                <TableRow >
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Data Type</TableHeadCell>
                                    {monthFields.map(month => (
                                        <TableHeadCell key={month.key} className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>{month.name}</TableHeadCell>
                                    ))}
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentOutputs.map((output, index) => ( 
                                    <TableRow key={output._id || index}> 
                                        <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {output.dataTypeLabel || 'Unknown'} 
                                        </TableCell>
                                        {monthFields.map(month => (
                                            <TableCell key={month.key} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                {formatDisplayNumber(output[month.key])}
                                            </TableCell>
                                        ))}
                                        <TableCell className={`font-semibold ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {formatDisplayNumber(output.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                </>
            ) : showTable ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No data available for {displayYear}.</p>
                    {selectedCodes.length > 0 && (
                        <p className="text-gray-400 text-sm mt-2">
                            Try selecting different job codes or year
                        </p>
                    )}
                </div>
            ) : null}

            {errorMessage && (
                <Alert color='failure' className='mt-4 font-semibold'>
                    {errorMessage}
                </Alert>
            )}

            <Modal show={openModal} size="md" onClose={handleYearChange} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className={`px-4 py-2 text-xl font-semibold ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                        Change Year
                    </div>
                </ModalHeader>
                <ModalBody className={`p-6 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Year</Label>
                                <TextInput 
                                    type="number"
                                    placeholder="Enter year" 
                                    value={yearInput}
                                    onChange={handleYearInputChange}
                                    required
                                    min="2000"
                                    max="2100"
                                    className="w-full" 
                                />
                            </div>
                            
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='sm'/> : 'LOAD DATA'}
                                </Button>
                            </div>
                        </form>
                        
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>
                                {errorMessage}
                            </Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default Outputs