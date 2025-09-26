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
import useThemeStore from '../themeStore'

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
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)
    const [selectedChartType, setSelectedChartType] = useState('bar')
    const [selectedCaseType, setSelectedCaseType] = useState('Breakdown')
    const [isUpdating, setIsUpdating] = useState(false)
    const [dataType, setDataType] = useState('count') // 'count' or 'cost'

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
            
            const res = await fetch('/api/case/updatecasestats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ year: displayYear })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setSuccessMessage('Case statistics updated successfully');
                
                // 重新获取数据
                const res2 = await fetch(`/api/case/getcases?year=${displayYear}`);
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
                    text: `${selectedCaseType} ${dataType === 'cost' ? 'Costs' : 'Cases'} - ${displayYear}`,
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
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `${dataType === 'cost' ? 'Cost' : 'Cases'}_${displayYear}`)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            saveAs(data, `${dataType === 'cost' ? 'Cost' : 'Cases'}_Report_${displayYear}.xlsx`)
            
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
                <h1 className='text-2xl font-semibold'>
                    {dataType === 'cost' ? 'Costs' : 'Cases'} {displayYear}
                </h1>
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