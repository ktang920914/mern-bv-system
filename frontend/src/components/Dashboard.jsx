import { useState, useEffect } from 'react'
import { Spinner, Alert, Label, Select, Button, Badge, TextInput } from 'flowbite-react'
import { HiX, HiCheck } from 'react-icons/hi'
import useThemeStore from '../themeStore'

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

const Dashboard = () => {
  const { theme } = useThemeStore()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear().toString())
  const [yearInput, setYearInput] = useState(new Date().getFullYear().toString())
  
  // Outputs 相关状态
  const [outputsData, setOutputsData] = useState([])
  const [selectedOutputDataType, setSelectedOutputDataType] = useState('totaloutput')
  const [selectedOutputChartType, setSelectedOutputChartType] = useState('bar')
  const [selectedCodes, setSelectedCodes] = useState([]) // Job Code 筛选

  // Costs 相关状态
  const [costsData, setCostsData] = useState([])
  const [selectedCostCategory, setSelectedCostCategory] = useState('Spareparts')
  const [selectedCostChartType, setSelectedCostChartType] = useState('bar')

  // Cases 相关状态
  const [casesData, setCasesData] = useState([])
  const [selectedCaseType, setSelectedCaseType] = useState('Breakdown')
  const [selectedCaseChartType, setSelectedCaseChartType] = useState('bar')
  const [casesDataType, setCasesDataType] = useState('count')

  // 数据配置
  const outputDataTypes = [
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

  const costCategories = [
    "Spareparts",
    "Extruder",
    "Electrical & Installation",
    "Injection machine",
    "QC",
    "Mould",
    "Others"
  ]

  const caseTypes = ["Breakdown", "Kaizen", "Inspect", "Maintenance"]

  const chartTypes = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' }
  ]

  const casesDataTypes = [
    { value: 'count', label: 'Case Count' },
    { value: 'cost', label: 'Cost Amount' }
  ]

  const jobCodeOptions = ['L1', 'L2', 'L3', 'L5', 'L6', 'L9', 'L10', 'L11', 'L12']

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

  useEffect(() => {
    fetchDashboardData()
  }, [displayYear]) // 当 displayYear 改变时重新获取数据

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)

      // 获取 Outputs 数据
      const outputsRes = await fetch(`/api/output/calculate?year=${displayYear}&data=totaloutput`)
      if (outputsRes.ok) {
        const outputsData = await outputsRes.json()
        setOutputsData(Array.isArray(outputsData) ? outputsData : [outputsData])
      } else {
        setOutputsData([])
      }

      // 获取 Costs 数据
      const costsRes = await fetch('/api/cost/getcosts')
      if (costsRes.ok) {
        const allCosts = await costsRes.json()
        const filteredCosts = allCosts.filter(cost => cost.year === displayYear)
        setCostsData(filteredCosts)
      } else {
        setCostsData([])
      }

      // 获取 Cases 数据
      const casesRes = await fetch(`/api/case/getcases?year=${displayYear}`)
      if (casesRes.ok) {
        const casesData = await casesRes.json()
        setCasesData(casesData)
      } else {
        setCasesData([])
      }

    } catch (error) {
      setErrorMessage('Error fetching dashboard data: ' + error.message)
      console.error('Dashboard fetch error:', error)
      setOutputsData([])
      setCostsData([])
      setCasesData([])
    } finally {
      setLoading(false)
    }
  }

  // 处理年份变更
  const handleYearChange = (e) => {
    setYearInput(e.target.value.trim())
  }

  const handleYearSubmit = (e) => {
    e.preventDefault()
    if (!yearInput) {
      setErrorMessage('Please enter a year')
      return
    }
    
    const year = parseInt(yearInput)
    if (year < 2000 || year > 2100) {
      setErrorMessage('Please enter a valid year between 2000 and 2100')
      return
    }
    
    setDisplayYear(yearInput)
    setErrorMessage(null)
  }

  // Job Code 选择处理
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

  // 重新获取 Outputs 数据（当 Job Code 改变时）
  const fetchOutputsWithCodes = async () => {
    try {
      setLoading(true)
      
      // 为每种数据类型获取数据
      const allOutputs = []
      
      for (const dataType of outputDataTypes) {
        // 构建查询参数
        const params = new URLSearchParams({
          year: displayYear,
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
            // 为每个数据项添加标识符
            const dataWithType = data.map(item => ({
              ...item,
              dataType: dataType.value,
              dataTypeLabel: dataType.label
            }))
            allOutputs.push(...dataWithType)
          } else if (typeof data === 'object') {
            // 为单个数据对象添加标识符
            allOutputs.push({
              ...data,
              dataType: dataType.value,
              dataTypeLabel: dataType.label
            })
          }
        }
      }
      
      setOutputsData(allOutputs)
      
    } catch (error) {
      setErrorMessage('Error fetching outputs data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 准备 Outputs 图表数据
  const prepareOutputsChartData = () => {
    if (outputsData.length === 0) return null

    const selectedData = outputsData.find(output => 
      output.dataType === selectedOutputDataType
    )

    if (!selectedData) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const value = selectedData[month.key]
      return typeof value === 'number' ? value : parseFloat(value) || 0
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
          text: `${outputDataTypes.find(dt => dt.value === selectedOutputDataType)?.label} - ${displayYear}`,
          font: { size: 14 }
        },
      },
      scales: selectedOutputChartType !== 'pie' ? {
        y: { beginAtZero: true }
      } : undefined
    }

    const chartData = {
      labels,
      datasets: [
        {
          label: outputDataTypes.find(dt => dt.value === selectedOutputDataType)?.label,
          data,
          backgroundColor: selectedOutputChartType === 'pie' 
            ? [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
              ]
            : 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: selectedOutputChartType === 'line',
          tension: selectedOutputChartType === 'line' ? 0.1 : undefined
        },
      ],
    }

    return { options, data: chartData }
  }

  // 准备 Costs 图表数据
  const prepareCostsChartData = () => {
    if (costsData.length === 0) return null

    const selectedData = costsData.find(cost => 
      cost.type === selectedCostCategory
    )

    if (!selectedData) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const value = selectedData[month.key]
      return typeof value === 'number' ? value : parseFloat(value) || 0
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
          text: `${selectedCostCategory} Costs - ${displayYear}`,
          font: { size: 14 }
        },
      },
      scales: selectedCostChartType !== 'pie' ? {
        y: { beginAtZero: true }
      } : undefined
    }

    const chartData = {
      labels,
      datasets: [
        {
          label: selectedCostCategory,
          data,
          backgroundColor: selectedCostChartType === 'pie' 
            ? [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
              ]
            : 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: selectedCostChartType === 'line',
          tension: selectedCostChartType === 'line' ? 0.1 : undefined
        },
      ],
    }

    return { options, data: chartData }
  }

  // 准备 Cases 图表数据
  const prepareCasesChartData = () => {
    if (casesData.length === 0) return null

    const selectedData = casesData.filter(caseItem => 
      caseItem.type === selectedCaseType
    )

    if (selectedData.length === 0) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const monthData = selectedData.find(d => d.month === month.name)
      return monthData ? (casesDataType === 'cost' ? monthData.totalCost : monthData.count) : 0
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
          text: `${selectedCaseType} ${casesDataType === 'cost' ? 'Costs' : 'Cases'} - ${displayYear}`,
          font: { size: 14 }
        },
      },
      scales: selectedCaseChartType !== 'pie' ? {
        y: { beginAtZero: true }
      } : undefined
    }

    const chartData = {
      labels,
      datasets: [
        {
          label: casesDataType === 'cost' ? `${selectedCaseType} Cost` : selectedCaseType,
          data,
          backgroundColor: selectedCaseChartType === 'pie' 
            ? [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
              ]
            : casesDataType === 'cost' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(54, 162, 235, 0.5)',
          borderColor: casesDataType === 'cost' ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: selectedCaseChartType === 'line',
          tension: selectedCaseChartType === 'line' ? 0.1 : undefined
        },
      ],
    }

    return { options, data: chartData }
  }

  const outputsChartData = prepareOutputsChartData()
  const costsChartData = prepareCostsChartData()
  const casesChartData = prepareCasesChartData()

  const renderChart = (chartData, chartType) => {
    if (!chartData) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          No chart data available for {displayYear}
        </div>
      )
    }

    return (
      <div className="h-48">
        {chartType === 'bar' && <Bar options={chartData.options} data={chartData.data} />}
        {chartType === 'line' && <Line options={chartData.options} data={chartData.data} />}
        {chartType === 'pie' && <Pie options={chartData.options} data={chartData.data} />}
      </div>
    )
  }

  // 自定义 Select 样式
  const customSelectClass = `
    text-xs 
    py-1 
    px-2 
    border 
    rounded-md 
    focus:ring-2 
    focus:ring-blue-500 
    focus:border-blue-500 
    transition-all 
    duration-200
    ${theme === 'light' 
      ? 'bg-white border-gray-300 text-gray-900 hover:border-gray-400' 
      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
    }
  `

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size="xl" />
        <p className="mt-2">Loading dashboard data for {displayYear}...</p>
      </div>
    )
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Dashboard {displayYear}</h1>
        
        {/* 年份选择器 */}
        <form onSubmit={handleYearSubmit} className="flex items-center gap-2">
          <label htmlFor="yearInput" className="text-sm font-medium whitespace-nowrap dark:text-white">
            Change Year:
          </label>
          <TextInput
            id="yearInput"
            type="number"
            value={yearInput}
            onChange={handleYearChange}
            min="2000"
            max="2100"
            className="w-20"
            sizing="sm"
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Go'}
          </Button>
        </form>
      </div>

      {errorMessage && (
        <Alert color='failure' className='mb-4 font-semibold' onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* 使用网格布局让三个图表并排显示 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Outputs Chart Section */}
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="mb-4">
            <Label className="font-semibold text-base mb-2 block">Outputs Analytics</Label>
            
            {/* Job Code 筛选器 */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Job Code Filter</Label>
                {selectedCodes.length > 0 && (
                  <Button 
                    size="xs" 
                    color="light" 
                    onClick={clearSelectedCodes}
                    className="text-xs px-2 py-1"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedCodes.map(code => (
                  <Badge 
                    key={code} 
                    color="info" 
                    className="flex items-center gap-1 py-0.5 px-1.5 text-xs"
                  >
                    {code}
                    <HiX 
                      className="cursor-pointer text-xs hover:text-red-500 transition-colors" 
                      onClick={() => handleCodeSelection(code)} 
                    />
                  </Badge>
                ))}
                {selectedCodes.length === 0 && (
                  <span className="text-gray-500 text-xs">All codes selected</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {jobCodeOptions.map(code => (
                  <div 
                    key={code}
                    className={`flex items-center p-1 rounded cursor-pointer text-xs transition-colors ${
                      selectedCodes.includes(code) 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500'
                    }`}
                    onClick={() => handleCodeSelection(code)}
                  >
                    <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                      selectedCodes.includes(code) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-400 dark:bg-gray-500 dark:border-gray-400'
                    }`}>
                      {selectedCodes.includes(code) && (
                        <HiCheck className="w-2 h-2 text-white" />
                      )}
                    </div>
                    {code}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-1 mt-2">
                <Button 
                  size="xs"
                  onClick={fetchOutputsWithCodes}
                  disabled={loading}
                  className="text-xs px-2 py-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="outputDataType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Data Type:
                </Label>
                <select
                  id="outputDataType"
                  value={selectedOutputDataType}
                  onChange={(e) => setSelectedOutputDataType(e.target.value)}
                  className={customSelectClass}
                >
                  {outputDataTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="outputChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Chart Type:
                </Label>
                <select
                  id="outputChartType"
                  value={selectedOutputChartType}
                  onChange={(e) => setSelectedOutputChartType(e.target.value)}
                  className={customSelectClass}
                >
                  {chartTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {renderChart(outputsChartData, selectedOutputChartType)}
        </div>

        {/* Costs Chart Section */}
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="mb-4">
            <Label className="font-semibold text-base mb-2 block">Costs Analytics</Label>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="costCategory" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Category:
                </Label>
                <select
                  id="costCategory"
                  value={selectedCostCategory}
                  onChange={(e) => setSelectedCostCategory(e.target.value)}
                  className={customSelectClass}
                >
                  {costCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="costChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Chart Type:
                </Label>
                <select
                  id="costChartType"
                  value={selectedCostChartType}
                  onChange={(e) => setSelectedCostChartType(e.target.value)}
                  className={customSelectClass}
                >
                  {chartTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {renderChart(costsChartData, selectedCostChartType)}
        </div>

        {/* Cases Chart Section */}
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="mb-4">
            <Label className="font-semibold text-base mb-2 block">Cases Analytics</Label>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="casesDataType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Data Type:
                </Label>
                <select
                  id="casesDataType"
                  value={casesDataType}
                  onChange={(e) => setCasesDataType(e.target.value)}
                  className={customSelectClass}
                >
                  {casesDataTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Label htmlFor="caseType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Case Type:
                </Label>
                <select
                  id="caseType"
                  value={selectedCaseType}
                  onChange={(e) => setSelectedCaseType(e.target.value)}
                  className={customSelectClass}
                >
                  {caseTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="caseChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Chart Type:
                </Label>
                <select
                  id="caseChartType"
                  value={selectedCaseChartType}
                  onChange={(e) => setSelectedCaseChartType(e.target.value)}
                  className={customSelectClass}
                >
                  {chartTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {renderChart(casesChartData, selectedCaseChartType)}
        </div>
      </div>
    </div>
  )
}

export default Dashboard