import { Button, Label, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Select } from 'flowbite-react'
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
    const {currentUser} = useUserstore()
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [cases, setCases] = useState([]) 
    const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)
    const [selectedChartType, setSelectedChartType] = useState('bar')
    const [selectedCaseType, setSelectedCaseType] = useState('Breakdown')
    const [isUpdating, setIsUpdating] = useState(false)

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

    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/case/getcases?year=${displayYear}`)
                const data = await res.json()
                if (res.ok) {
                    setCases(data)
                }
            } catch (error) {
                setErrorMessage('Error fetching cases: ' + error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchCases()
    }, [displayYear])

    const handleYearChange = (e) => {
        setDisplayYear(e.target.value)
        setCurrentPage(1)
    }

    const handleUpdateStats = async () => {
        try {
            setIsUpdating(true);
            setErrorMessage(null);
            setSuccessMessage(null);
            
            console.log('Updating stats for year:', displayYear);
            
            const res = await fetch('/api/case/updatecasestats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ year: displayYear })
            });
            
            const data = await res.json();
            console.log('Update response:', data);
            
            if (res.ok) {
                setSuccessMessage(
                    `Case statistics updated successfully. ` +
                    `Total records: ${data.totalRecords}, ` +
                    `Year matches: ${data.yearMatchCount}, ` +
                    `Generated: ${data.statisticsGenerated} statistics.`
                );
                
                // 重新获取数据
                const res2 = await fetch(`/api/case/getcases?year=${displayYear}`);
                const data2 = await res2.json();
                if (res2.ok) {
                    setCases(data2);
                    console.log('Refreshed case data:', data2);
                }
            } else {
                setErrorMessage(data.message || 'Failed to update statistics');
            }
        } catch (error) {
            console.error('Update error:', error);
            setErrorMessage('Error updating statistics: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    // 准备表格数据
    const prepareTableData = () => {
        const tableData = []
        
        caseTypes.forEach(type => {
            const row = { type }
            let total = 0
            
            monthFields.forEach(month => {
                const caseData = cases.find(c => c.type === type && c.month === month.name)
                const count = caseData ? caseData.count : 0
                row[month.key] = count
                total += count
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

        // 获取当前选中的案例类型的数据
        const selectedData = cases.filter(caseItem => 
            caseItem.type === selectedCaseType
        )

        if (selectedData.length === 0) return null

        // 月份标签
        const labels = monthFields.map(month => month.name)
        
        // 数据值 - 确保所有月份都有数据
        const data = monthFields.map(month => {
            const monthData = selectedData.find(d => d.month === month.name)
            return monthData ? monthData.count : 0
        })

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
                    text: `${selectedCaseType} Cases - ${displayYear}`,
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
                        text: 'Number of Cases'
                    },
                    ticks: {
                        stepSize: 1
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

        // 图表数据
        const chartData = {
            labels,
            datasets: [
                {
                    label: selectedCaseType,
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
            
            // 添加报告标题和年份信息
            worksheetData.push(['Cases Report'])
            worksheetData.push([`Year: ${displayYear}`])
            worksheetData.push([]) // 空行
            
            const headers = ['Case Type', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
            worksheetData.push(headers)
            
            tableData.forEach(row => {
                const rowData = [row.type]
                
                monthFields.forEach(month => {
                    rowData.push(row[month.key] || 0)
                })
                
                rowData.push(row.total || 0)
                worksheetData.push(rowData)
            })
            
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
            
            // 设置列宽
            const colWidths = [
                { wch: 20 }, 
                ...Array(12).fill({ wch: 8 }),
                { wch: 10 } 
            ]
            worksheet['!cols'] = colWidths
            
            // 合并标题单元格
            if (!worksheet['!merges']) worksheet['!merges'] = [];
            worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } });
            worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } });
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `Cases ${displayYear}`)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            saveAs(data, `Cases_Report_${displayYear}.xlsx`)
            
        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message)
        }
    }

    const chartData = prepareChartData()
    const currentItems = filteredTableData.slice(
        (currentPage - 1) * itemsPage, 
        currentPage * itemsPage
    )
    const totalPages = Math.ceil(filteredTableData.length / itemsPage)

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>Cases {displayYear}</h1>
                <div>
                    <TextInput 
                        placeholder='Search case type...' 
                        onChange={handleSearch}
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <TextInput
                        type="number"
                        value={displayYear}
                        onChange={handleYearChange}
                        className="w-24"
                    />
                    <Button 
                        outline 
                        className='cursor-pointer' 
                        onClick={generateExcelReport} 
                        disabled={tableData.length === 0}
                    >
                        Report
                    </Button>
                    <Button 
                        className='cursor-pointer' 
                        onClick={handleUpdateStats}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Spinner size="sm" /> : 'Update Stats'}
                    </Button>
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
                        <Label className="font-semibold">Chart Options:</Label>
                        
                        <div className="flex items-center gap-2">
                            <Label htmlFor="caseType" className="text-sm">Case Type:</Label>
                            <select
                                id="caseType"
                                value={selectedCaseType}
                                onChange={(e) => setSelectedCaseType(e.target.value)}
                                className="text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
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
                                className="text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
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
                            No chart data available for selected case type
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center my-8">
                    <Spinner size="xl" />
                </div>
            ) : (
                <Table hoverable className='mb-6'>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Case Type</TableHeadCell>
                            {monthFields.map(month => (
                                <TableHeadCell key={month.key}>{month.name}</TableHeadCell>
                            ))}
                            <TableHeadCell>Total</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentItems.map((item, index) => ( 
                            <TableRow key={index}> 
                                <TableCell className="font-medium text-gray-900 dark:text-white">
                                    {item.type} 
                                </TableCell>
                                {monthFields.map(month => (
                                    <TableCell key={month.key}>
                                        {item[month.key] || 0} 
                                    </TableCell>
                                ))}
                                <TableCell className="font-semibold">
                                    {item.total || 0}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {filteredTableData.length > 0 && (
                <div className="flex-col justify-center text-center mt-4">
                    <p className='text-gray-500 font-semibold mb-2'>
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