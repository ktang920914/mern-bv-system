import { Button, Label, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Badge, Card } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { HiX, HiCheck } from 'react-icons/hi'

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

const Cases = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [cases, setCases] = useState([]) 
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(7)
    const [selectedChartType, setSelectedChartType] = useState('bar')
    const [selectedCaseType, setSelectedCaseType] = useState('Breakdown')
    const [isUpdating, setIsUpdating] = useState(false)
    const [dataType, setDataType] = useState('count') // 'count' or 'cost'
    const [selectedCodes, setSelectedCodes] = useState([]) // 新增：选中的 Job Codes
    const [availableCodes, setAvailableCodes] = useState([]) // 可用的 Job Code 列表
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768) // 新增移动端检测

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

     // 修复：获取可用的 Job Code 列表
    useEffect(() => {
        const fetchAvailableCodes = async () => {
            try {
                // 使用现有的路由
                const res = await fetch('/api/maintenance/getmaintenances');
                const data = await res.json();
                if (res.ok) {
                    // 从 maintenance 数据中提取唯一的 code 字段
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

    const caseTypes = ["Breakdown", "Kaizen", "Inspect", "Maintenance"]

    const monthFields = [
        { key: 'Jan', name: 'Jan' },
        { key: 'Feb', name: 'Feb' },
        { key: 'Mar', name: 'Mar' },
        { key: 'Apr', name: 'Apr' },
        { key: 'May', name: 'May' },
        { key: 'Jun', name: 'Jun' },
        { key: 'Jul', name: 'Jul' },
        { key: 'Aug', name: 'Aug' },
        { key: 'Sep', name: 'Sep' },
        { key: 'Oct', name: 'Oct' },
        { key: 'Nov', name: 'Nov' },
        { key: 'Dec', name: 'Dec' }
    ]

    const chartTypes = [
        { value: 'bar', label: 'Bar' },
        { value: 'line', label: 'Line' },
        { value: 'pie', label: 'Pie' }
    ]

    const dataTypes = [
        { value: 'count', label: 'Case Count' },
        { value: 'cost', label: 'Cost Amount' }
    ]

    // 修改后的 handleUpdateStats 函数，支持静默更新
    const handleUpdateStats = async (silent = false) => {
        try {
            if (!silent) {
                setIsUpdating(true);
            }
            setErrorMessage(null);
            setSuccessMessage(null);
            
            const res = await fetch('/api/case/updatecasestats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    year: displayYear
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // 重新获取数据
                const params = new URLSearchParams({
                    year: displayYear
                })
                
                if (selectedCodes.length > 0) {
                    params.append('codes', selectedCodes.join(','))
                }
                
                const res2 = await fetch(`/api/case/getcases?${params}`);
                const data2 = await res2.json();
                if (res2.ok) {
                    setCases(data2);
                }
            } else {
                setErrorMessage(data.message || 'Failed to update statistics');
            }
        } catch (error) {
            setErrorMessage('Error updating statistics: ' + error.message);
        } finally {
            if (!silent) {
                setIsUpdating(false);
            }
        }
    };

    // 在组件加载和依赖变化时自动更新数据
    useEffect(() => {
        handleUpdateStats(true); // 静默更新
    }, [displayYear, selectedCodes]);

    const handleYearChange = (e) => {
        setDisplayYear(e.target.value)
        setCurrentPage(1)
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // Job Code 选择处理函数
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

    // 准备表格数据
    const prepareTableData = () => {
        const tableData = []
        
        caseTypes.forEach(type => {
            const row = { type }
            let total = 0
            
            monthFields.forEach(month => {
                const caseData = cases.find(c => c.type === type && c.month === month.name)
                const value = caseData ? (dataType === 'cost' ? caseData.totalCost : caseData.count) : 0
                row[month.key] = value
                total += value
            })
            
            row.total = total
            tableData.push(row)
        })
        
        return tableData
    }

    const tableData = prepareTableData()
    const filteredTableData = tableData.filter(item => 
        item.type.toLowerCase().includes(searchTerm)
    )

    // 准备图表数据
    const prepareChartData = () => {
        if (cases.length === 0) return null

        const selectedData = cases.filter(caseItem => 
            caseItem.type === selectedCaseType
        )

        if (selectedData.length === 0) return null

        const labels = monthFields.map(month => month.name)
        
        const data = monthFields.map(month => {
            const monthData = selectedData.find(d => d.month === month.name)
            return monthData ? (dataType === 'cost' ? monthData.totalCost : monthData.count) : 0
        })

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `${selectedCaseType} ${dataType === 'cost' ? 'Costs' : 'Cases'} - ${displayYear}${selectedCodes.length > 0 ? ` (${selectedCodes.join(', ')})` : ''}`,
                    font: {
                        size: 16
                    }
                },
            },
            scales: selectedChartType !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: dataType === 'cost' ? 'Cost Amount' : 'Number of Cases'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            } : undefined
        }

        const chartData = {
            labels,
            datasets: [
                {
                    label: dataType === 'cost' ? `${selectedCaseType} Cost` : selectedCaseType,
                    data,
                    backgroundColor: selectedChartType === 'pie' 
                        ? [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
                          ]
                        : dataType === 'cost' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(54, 162, 235, 0.5)',
                    borderColor: dataType === 'cost' ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: selectedChartType === 'line',
                    tension: selectedChartType === 'line' ? 0.1 : undefined
                },
            ],
        }

        return { options, data: chartData }
    }

    const generateExcelReport = () => {
        if (tableData.length === 0) {
            setErrorMessage('No data to export')
            return
        }

        try {
            const worksheetData = []
            
            worksheetData.push([`${dataType === 'cost' ? 'Cost' : 'Cases'} Report - ${displayYear}`])
            
            // 添加筛选的 Job Code 信息
            if (selectedCodes.length > 0) {
                worksheetData.push([`Filtered Job Codes: ${selectedCodes.join(', ')}`])
            } else {
                worksheetData.push(['Filtered Job Codes: All codes selected'])
            }
            
            worksheetData.push([])
            
            const headers = ['Case Type', ...monthFields.map(month => month.name), 'Total']
            worksheetData.push(headers)
            
            tableData.forEach(row => {
                const rowData = [row.type]
                
                monthFields.forEach(month => {
                    const value = row[month.key] || 0
                    rowData.push(dataType === 'cost' ? `$${value.toFixed(2)}` : value)
                })
                
                const totalValue = row.total || 0
                rowData.push(dataType === 'cost' ? `$${totalValue.toFixed(2)}` : totalValue)
                worksheetData.push(rowData)
            })
            
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
            
            const colWidths = [
                { wch: 20 }, 
                ...Array(12).fill({ wch: 10 }),
                { wch: 12 } 
            ]
            worksheet['!cols'] = colWidths
            
            // 合并标题单元格
            if (!worksheet['!merges']) worksheet['!merges'] = [];
            worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }); // 合并标题行
            worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }); // 合并筛选信息行
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `${dataType === 'cost' ? 'Cost' : 'Cases'}_${displayYear}`)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            // 生成文件名，包含筛选的 Job Code
            let fileName = `${dataType === 'cost' ? 'Cost' : 'Cases'}_Report_${displayYear}`
            if (selectedCodes.length > 0) {
                fileName += `_${selectedCodes.join('_')}`
            }
            
            saveAs(data, `${fileName}.xlsx`)
            
        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message)
        }
    }

    // 格式化数字显示
    const formatNumber = (value) => {
        if (value === undefined || value === null) return '0';
        if (dataType === 'cost') {
            return typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2);
        }
        return typeof value === 'number' ? value.toString() : value || '0';
    }

    const chartData = prepareChartData()
    const currentItems = filteredTableData.slice(
        (currentPage - 1) * itemsPage, 
        currentPage * itemsPage
    )
    const totalPages = Math.ceil(filteredTableData.length / itemsPage)

    // 移动端卡片渲染函数
    const renderMobileCards = () => {
        return (
            <div className="space-y-4">
                {currentItems.map((item, index) => (
                    <Card key={index} className="p-4">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {item.type}
                            </h3>
                        </div>
                        
                        {/* 月份数据网格 - 4行 x 3列 */}
                        <div className="space-y-3">
                            {/* 第一行: Jan, Feb, Mar */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jan</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Jan)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Feb</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Feb)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Mar</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Mar)}</div>
                                </div>
                            </div>
                            
                            {/* 第二行: Apr, May, Jun */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Apr</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Apr)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">May</div>
                                    <div className="font-medium text-sm">{formatNumber(item.May)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jun</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Jun)}</div>
                                </div>
                            </div>
                            
                            {/* 第三行: Jul, Aug, Sep */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jul</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Jul)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Aug</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Aug)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Sep</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Sep)}</div>
                                </div>
                            </div>
                            
                            {/* 第四行: Oct, Nov, Dec */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Oct</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Oct)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Nov</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Nov)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Dec</div>
                                    <div className="font-medium text-sm">{formatNumber(item.Dec)}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 总计 */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatNumber(item.total)}
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
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>
                    {dataType === 'cost' ? 'Costs' : 'Cases'} {displayYear}
                </h1>
                <div>
                    <TextInput 
                        placeholder='Search case' 
                        onChange={handleSearch}
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <TextInput
                        type="number"
                        value={displayYear}
                        onChange={handleYearChange}
                        className="w-18"
                    />
                    <Button 
                        className='cursor-pointer hidden sm:block' 
                        onClick={() => handleUpdateStats(false)} // 手动更新，显示加载状态
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Spinner size="sm" /> : 'Update Stat'}
                    </Button>
                    <Button 
                        className='cursor-pointer' 
                        onClick={generateExcelReport} 
                        color='green'
                        disabled={tableData.length === 0}
                    >
                        Report
                    </Button>
                </div>
            </div>

            {/* Job Code 筛选器 - 单行显示 */}
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
                
                {/* 单行显示的 Job Code 选项 */}
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

            {errorMessage && (
                <Alert color="failure" className="mb-4" onDismiss={() => setErrorMessage(null)}>
                    {errorMessage}
                </Alert>
            )}

            {successMessage && (
                <Alert color="success" className="mb-4" onDismiss={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            {/* 图表控制区域 */}
            {cases.length > 0 && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-white">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <Label className="font-semibold">Options:</Label>
                        
                        <div className="flex items-center gap-2">
                            <Label htmlFor="dataType" className="text-sm">Data Type:</Label>
                            <select
                                id="dataType"
                                value={dataType}
                                onChange={(e) => setDataType(e.target.value)}
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
                            <Label htmlFor="caseType" className="text-sm">Case Type:</Label>
                            <select
                                id="caseType"
                                value={selectedCaseType}
                                onChange={(e) => setSelectedCaseType(e.target.value)}
                                className={`text-sm p-2 border rounded-md ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {caseTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type}
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
                                <Bar options={chartData.options} data={chartData.data} />
                            )}
                            {selectedChartType === 'line' && (
                                <Line options={chartData.options} data={chartData.data} />
                            )}
                            {selectedChartType === 'pie' && (
                                <Pie options={chartData.options} data={chartData.data} />
                            )}
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">
                            No chart data available
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center my-8">
                    <Spinner size="xl" />
                </div>
            ) : (
                <>
                    {/* 移动端显示卡片，桌面端显示表格 */}
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        <Table hoverable className='mb-6'>
                            <TableHead>
                                <TableRow>
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Case Type</TableHeadCell>
                                    {monthFields.map(month => (
                                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`} key={month.key}>{month.name}</TableHeadCell>
                                    ))}
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentItems.map((item, index) => ( 
                                    <TableRow key={index}> 
                                        <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {item.type} 
                                        </TableCell>
                                        {monthFields.map(month => (
                                            <TableCell className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} key={month.key}>
                                                {dataType === 'cost' ? 
                                                    `${item[month.key] ? item[month.key].toFixed(2) : '0.00'}` : 
                                                    item[month.key] || 0
                                                }
                                            </TableCell>
                                        ))}
                                        <TableCell className={`font-semibold ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {dataType === 'cost' ? 
                                                `${item.total ? item.total.toFixed(2) : '0.00'}` : 
                                                item.total || 0
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </>
            )}

            {filteredTableData.length > 0 && (
                <div className="flex-col justify-center text-center mt-4">
                    <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                        Showing {Math.min(filteredTableData.length, (currentPage - 1) * itemsPage + 1)} to {Math.min(currentPage * itemsPage, filteredTableData.length)} of {filteredTableData.length} Entries
                    </p>
                    <Pagination
                        showIcons
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    )
}

export default Cases