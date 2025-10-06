import { Button, Label, Modal, ModalBody, ModalHeader, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Card } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
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

const Costs = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [openModalCreateCost, setOpenModalCreateCost] = useState(false)
    const [costs, setCosts] = useState([]) 
    const [formData, setFormData] = useState({year: new Date().getFullYear().toString()})
    const [showTable, setShowTable] = useState(false)
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(7)
    const [selectedChartType, setSelectedChartType] = useState('bar') // 默认显示柱状图
    const [selectedCategory, setSelectedCategory] = useState('Spareparts') // 默认显示第一个类别
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

    const costCategories = [
        "Spareparts",
        "Extruder",
        "Electrical & Installation",
        "Injection machine",
        "QC",
        "Mould",
        "Others"
    ]

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

    // 图表类型选项
    const chartTypes = [
        { value: 'bar', label: 'Bar' },
        { value: 'line', label: 'Line' },
        { value: 'pie', label: 'Pie' }
    ]

    useEffect(() => {
        const fetchInitialCosts = async () => {
            try {
                const res = await fetch('/api/cost/getcosts')
                const data = await res.json()
                if (res.ok) {
                    const currentYear = new Date().getFullYear().toString()
                    const filteredCosts = data.filter(cost => cost.year === currentYear)
                    setCosts(filteredCosts)
                    setDisplayYear(currentYear) 
                    setShowTable(true)
                }
            } catch (error) {
                console.error('Error fetching initial costs:', error)
            }
        }
        fetchInitialCosts()
    }, [currentUser._id]) 

    const handleCreateCost = () => {
        setOpenModalCreateCost(!openModalCreateCost)
        setErrorMessage(null)
        setLoading(false)
        setFormData({year: new Date().getFullYear().toString()})
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const res = await fetch('/api/cost/getcosts')
            const data = await res.json()
            if(data.message === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if (res.ok) {
                const filteredCosts = data.filter(cost => cost.year === formData.year)
                setCosts(filteredCosts)
                setShowTable(true)
                setOpenModalCreateCost(false)
                setDisplayYear(formData.year)
            }
        } catch (error) {
            setErrorMessage('Error fetching costs: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // 准备图表数据
    const prepareChartData = () => {
        if (costs.length === 0) {
            console.log('No costs data available');
            return null;
        }

        // 获取当前选中的成本类别
        const selectedData = costs.find(cost => 
            cost.type === selectedCategory
        );

        if (!selectedData) {
            console.log('No data found for selected category');
            return null;
        }

        // 月份标签
        const labels = monthFields.map(month => month.name);
        
        // 数据值
        const data = monthFields.map(month => {
            const value = selectedData[month.key];
            // 确保返回数字类型
            const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
            return numericValue;
        });

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
                    text: `${selectedCategory} Costs - ${displayYear}`,
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
                        text: 'Cost Value'
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
                    label: selectedCategory,
                    data,
                    backgroundColor: selectedChartType === 'pie' 
                        ? [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
                          ]
                        : 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: selectedChartType === 'line',
                    tension: selectedChartType === 'line' ? 0.1 : undefined
                },
            ],
        };

        return { options, data: chartData };
    };

    const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
    }

    const filteredCosts = costs.filter(cost => 
        cost.type.toLowerCase().includes(searchTerm) 
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentCosts = filteredCosts.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredCosts.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 格式化数字显示（保留2位小数）
    const formatNumber = (value) => {
        if (value === undefined || value === null) return '0';
        return typeof value === 'number' ? value.toFixed(2) : value;
    }

    const generateExcelReport = () => {
    if (costs.length === 0) {
        setErrorMessage('No data to export')
        return
    }

    try {
        const worksheetData = []
        
        // 添加报告标题和年份信息
        worksheetData.push(['Costs Report'])
        worksheetData.push([`Year: ${displayYear}`])
        worksheetData.push([]) // 空行
        
        const headers = ['Cost Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
        worksheetData.push(headers)
        
        costCategories.forEach(category => {
            const costData = costs.find(cost => cost.type === category)
            const rowData = [category]
            
            monthFields.forEach(month => {
                const value = costData ? costData[month.key] || 0 : 0
                rowData.push(typeof value === 'number' ? value.toFixed(2) : value)
            })
            
            const total = costData ? costData.total || 0 : 0
            rowData.push(typeof total === 'number' ? total.toFixed(2) : total)
            
            worksheetData.push(rowData)
        })
        
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        
        // 设置列宽
        const colWidths = [
            { wch: 25 }, 
            ...Array(12).fill({ wch: 10 }),
            { wch: 12 } 
        ]
        worksheet['!cols'] = colWidths
        
        // 合并标题单元格
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }); // 合并标题行
        worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }); // 合并年份行
        
        XLSX.utils.book_append_sheet(workbook, worksheet, `Costs ${displayYear}`)
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        
        saveAs(data, `Costs_Report_${displayYear}.xlsx`)
        
        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message)
        }
    }

    // 获取图表数据
    const chartData = prepareChartData();

    // 移动端卡片渲染函数
    const renderMobileCards = () => {
        return (
            <div className="space-y-4">
                {currentCosts.map((cost, index) => (
                    <Card key={cost.type || index} className="p-4">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {cost.type}
                            </h3>
                        </div>
                        
                        {/* 月份数据网格 - 4行 x 3列 */}
                        <div className="space-y-3">
                            {/* 第一行: Jan, Feb, Mar */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jan</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.jan)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Feb</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.feb)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Mar</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.mar)}</div>
                                </div>
                            </div>
                            
                            {/* 第二行: Apr, May, Jun */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Apr</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.apr)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">May</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.may)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jun</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.jun)}</div>
                                </div>
                            </div>
                            
                            {/* 第三行: Jul, Aug, Sep */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Jul</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.jul)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Aug</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.aug)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Sep</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.sep)}</div>
                                </div>
                            </div>
                            
                            {/* 第四行: Oct, Nov, Dec */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Oct</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.oct)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Nov</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.nov)}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Dec</div>
                                    <div className="font-medium text-sm">{formatNumber(cost.dec)}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 总计 */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatNumber(cost.total)}
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
                <h1 className='text-2xl font-semibold'>Costs {displayYear}</h1>
                <div>
                    <TextInput placeholder='Search cost category...' onChange={handleSearch}/>
                </div>
                <div className='flex items-center gap-2'>
                    <Button className='cursor-pointer' onClick={handleCreateCost}>
                        Change Year
                    </Button>
                    <Button className='cursor-pointer' color='green' onClick={generateExcelReport} disabled={costs.length === 0}>
                        Report
                    </Button>
                </div>
            </div>

            {/* 图表控制区域 */}
            {costs.length > 0 && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-white">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <Label className="font-semibold">Chart Options:</Label>
                        
                        <div className="flex items-center gap-2">
                            <Label htmlFor="category" className="text-sm">Cost Category:</Label>
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className={`text-sm p-2 border rounded-md ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {costCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
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
                            No chart data available for selected category
                        </div>
                    )}
                </div>
            )}

            {showTable && costs.length > 0 ? (
                <>
                    {/* 移动端显示卡片，桌面端显示表格 */}
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        <Table hoverable className='mb-6'>
                            <TableHead>
                                <TableRow>
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Cost category</TableHeadCell>
                                    {monthFields.map(month => (
                                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`} key={month.key}>{month.name}</TableHeadCell>
                                    ))}
                                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentCosts.map(cost => ( 
                                    <TableRow key={cost.type}> 
                                        <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {cost.type} 
                                        </TableCell>
                                        {monthFields.map(month => (
                                            <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} key={month.key}>
                                                {formatNumber(cost[month.key])} 
                                            </TableCell>
                                        ))}
                                        <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                            {formatNumber(cost.total)}
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
                        <Pagination
                            showIcons
                            currentPage={currentPage}
                            totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            ) : showTable ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No data available for {displayYear}.</p>
                </div>
            ) : null}

            {errorMessage && (
                <Alert color='failure' className='mt-4 font-semibold'>
                    {errorMessage}
                </Alert>
            )}

            <Modal show={openModalCreateCost} size="sm" onClose={handleCreateCost} popup>
                <ModalHeader className={`border-b border-gray-200 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className={`text-xl font-semibold px-4 py-2 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                        Change Year
                    </div>
                </ModalHeader>
                <ModalBody className={`p-6 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Year</Label>
                                <TextInput 
                                    id="year" 
                                    type="number"
                                    placeholder="Enter year" 
                                    value={formData.year}
                                    required
                                    className="w-full"
                                    onChange={handleChange}
                                />
                            </div>
                            
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {
                                        loading ? <Spinner size='sm'/> : 'LOAD DATA'
                                    }
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

export default Costs