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
  ArcElement,
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
  const [selectedCodes, setSelectedCodes] = useState([])
  const [outputAvailableCodes, setOutputAvailableCodes] = useState([])

  // Costs 相关状态
  const [costsData, setCostsData] = useState([])
  const [selectedCostCategory, setSelectedCostCategory] = useState('Spareparts')
  const [selectedCostChartType, setSelectedCostChartType] = useState('bar')

  // Cases 相关状态
  const [casesData, setCasesData] = useState([])
  const [selectedCaseType, setSelectedCaseType] = useState('Breakdown')
  const [selectedCaseChartType, setSelectedCaseChartType] = useState('bar')
  const [casesDataType, setCasesDataType] = useState('count')
  const [casesSelectedCodes, setCasesSelectedCodes] = useState([])
  const [casesAvailableCodes, setCasesAvailableCodes] = useState([])
  const [isUpdatingCases, setIsUpdatingCases] = useState(false)
  const [updateMessage, setUpdateMessage] = useState(null)

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
    "Spareparts", "Extruder", "Electrical & Installation", "Injection machine", 
    "QC", "Mould", "Others"
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
    { key: 'jan', name: 'Jan' }, { key: 'feb', name: 'Feb' }, { key: 'mar', name: 'Mar' },
    { key: 'apr', name: 'Apr' }, { key: 'may', name: 'May' }, { key: 'jun', name: 'Jun' },
    { key: 'jul', name: 'Jul' }, { key: 'aug', name: 'Aug' }, { key: 'sep', name: 'Sep' },
    { key: 'oct', name: 'Oct' }, { key: 'nov', name: 'Nov' }, { key: 'dec', name: 'Dec' }
  ]

  // 获取 Outputs 可用的 Job Code 列表
  useEffect(() => {
    const fetchOutputAvailableCodes = async () => {
      try {
        // 使用 Job 的路由而不是 Maintenance 的路由
        const res = await fetch('/api/analysis/getjobs');
        const data = await res.json();
        if (res.ok) {
          // 从 Job 数据中提取唯一的 code 字段
          const jobCodes = [...new Set(data.map(item => item.code))].filter(Boolean);
          setOutputAvailableCodes(jobCodes);
        }
      } catch (error) {
        console.error('Error fetching output job codes:', error);
        setOutputAvailableCodes(jobCodeOptions);
      }
    };
    fetchOutputAvailableCodes();
  }, []);

  // 获取 Cases 可用的 Job Code 列表
  useEffect(() => {
    const fetchCasesAvailableCodes = async () => {
      try {
        // 使用 Maintenance 的路由
        const res = await fetch('/api/maintenance/getmaintenances');
        const data = await res.json();
        if (res.ok) {
          // 从 Maintenance 数据中提取唯一的 code 字段
          const jobCodes = [...new Set(data.map(item => item.code))].filter(Boolean);
          setCasesAvailableCodes(jobCodes);
        }
      } catch (error) {
        console.error('Error fetching cases job codes:', error);
        setCasesAvailableCodes(jobCodeOptions);
      }
    };
    fetchCasesAvailableCodes();
  }, []);

  // 当年份改变时重新获取所有数据
  useEffect(() => {
    fetchDashboardData()
  }, [displayYear])

  // 当 Outputs Job Code 筛选改变时重新获取数据
  useEffect(() => {
    fetchOutputsWithCodes()
  }, [displayYear, selectedCodes])

  // 当 Cases Job Code 筛选改变时重新获取数据
  useEffect(() => {
    fetchCasesData()
  }, [displayYear, casesSelectedCodes])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      await Promise.all([fetchOutputsWithCodes(), fetchCostsData(), fetchCasesData()])
    } catch (error) {
      setErrorMessage('Error fetching dashboard data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOutputsWithCodes = async () => {
    try {
      const allOutputs = []
      for (const dataType of outputDataTypes) {
        const params = new URLSearchParams({ year: displayYear, data: dataType.value })
        if (selectedCodes.length > 0) params.append('codes', selectedCodes.join(','))
        
        const res = await fetch(`/api/output/calculate?${params}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const dataWithType = data.map(item => ({
              ...item,
              dataType: dataType.value,
              dataTypeLabel: dataType.label
            }))
            allOutputs.push(...dataWithType)
          }
        }
      }
      setOutputsData(allOutputs)
    } catch (error) {
      setErrorMessage('Error fetching outputs data: ' + error.message)
    }
  }

  const fetchCostsData = async () => {
    try {
      const res = await fetch('/api/cost/getcosts')
      if (res.ok) {
        const allCosts = await res.json()
        const filteredCosts = allCosts.filter(cost => cost.year === displayYear)
        setCostsData(filteredCosts)
      }
    } catch (error) {
      setErrorMessage('Error fetching costs data: ' + error.message)
    }
  }

  // 修改后的 fetchCasesData 函数，支持静默更新
  const fetchCasesData = async (silent = false) => {
    try {
      if (!silent) {
        setIsUpdatingCases(true)
      }
      
      const params = new URLSearchParams({ year: displayYear })
      if (casesSelectedCodes.length > 0) params.append('codes', casesSelectedCodes.join(','))
      
      const res = await fetch(`/api/case/getcases?${params}`)
      if (res.ok) {
        const casesData = await res.json()
        setCasesData(casesData)
      }
    } catch (error) {
      console.error('Error fetching cases data:', error)
    } finally {
      if (!silent) {
        setIsUpdatingCases(false)
      }
    }
  }

  // 修改后的 handleUpdateCasesStats 函数，支持静默更新
  const handleUpdateCasesStats = async (silent = false) => {
    try {
      if (!silent) {
        setIsUpdatingCases(true)
      }
      setUpdateMessage(null)
      setErrorMessage(null)

      const res = await fetch('/api/case/updatecasestats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: displayYear })
      })
      
      const data = await res.json()
      if (res.ok) {
        if (!silent) {
          setUpdateMessage('Case statistics updated successfully')
          setTimeout(() => setUpdateMessage(null), 3000)
        }
        // 重新获取更新后的数据
        await fetchCasesData(silent)
      } else {
        setErrorMessage(data.message || 'Failed to update statistics')
      }
    } catch (error) {
      setErrorMessage('Error updating statistics: ' + error.message)
    } finally {
      if (!silent) {
        setIsUpdatingCases(false)
      }
    }
  }

  // 在组件加载和依赖变化时自动更新 Cases 数据
  useEffect(() => {
    handleUpdateCasesStats(true) // 静默更新
  }, [displayYear, casesSelectedCodes])

  // 处理函数
  const handleYearChange = (e) => setYearInput(e.target.value.trim())
  
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

  const handleCodeSelection = (code) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter(c => c !== code))
    } else {
      setSelectedCodes([...selectedCodes, code])
    }
  }

  const clearSelectedCodes = () => setSelectedCodes([])

  const handleCasesCodeSelection = (code) => {
    if (casesSelectedCodes.includes(code)) {
      setCasesSelectedCodes(casesSelectedCodes.filter(c => c !== code))
    } else {
      setCasesSelectedCodes([...casesSelectedCodes, code])
    }
  }

  const clearCasesSelectedCodes = () => setCasesSelectedCodes([])

  // 图表数据准备函数
  const prepareOutputsChartData = () => {
    if (outputsData.length === 0) return null
    const selectedData = outputsData.find(output => output.dataType === selectedOutputDataType)
    if (!selectedData) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const value = selectedData[month.key]
      return typeof value === 'number' ? value : parseFloat(value) || 0
    })

    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: `${outputDataTypes.find(dt => dt.value === selectedOutputDataType)?.label} - ${displayYear}${selectedCodes.length > 0 ? ` (${selectedCodes.join(', ')})` : ''}`,
            font: { size: 14 }
          },
        },
        scales: selectedOutputChartType !== 'pie' ? { y: { beginAtZero: true } } : undefined
      },
      data: {
        labels,
        datasets: [{
          label: outputDataTypes.find(dt => dt.value === selectedOutputDataType)?.label,
          data,
          backgroundColor: selectedOutputChartType === 'pie' ? [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
          ] : 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: selectedOutputChartType === 'line',
          tension: selectedOutputChartType === 'line' ? 0.1 : undefined
        }]
      }
    }
  }

  const prepareCostsChartData = () => {
    if (costsData.length === 0) return null
    const selectedData = costsData.find(cost => cost.type === selectedCostCategory)
    if (!selectedData) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const value = selectedData[month.key]
      return typeof value === 'number' ? value : parseFloat(value) || 0
    })

    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: `${selectedCostCategory} Costs - ${displayYear}`,
            font: { size: 14 }
          },
        },
        scales: selectedCostChartType !== 'pie' ? { y: { beginAtZero: true } } : undefined
      },
      data: {
        labels,
        datasets: [{
          label: selectedCostCategory,
          data,
          backgroundColor: selectedCostChartType === 'pie' ? [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
          ] : 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: selectedCostChartType === 'line',
          tension: selectedCostChartType === 'line' ? 0.1 : undefined
        }]
      }
    }
  }

  const prepareCasesChartData = () => {
    if (casesData.length === 0) return null
    const selectedData = casesData.filter(caseItem => caseItem.type === selectedCaseType)
    if (selectedData.length === 0) return null

    const labels = monthFields.map(month => month.name)
    const data = monthFields.map(month => {
      const monthData = selectedData.find(d => d.month === month.name)
      return monthData ? (casesDataType === 'cost' ? monthData.totalCost : monthData.count) : 0
    })

    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: `${selectedCaseType} ${casesDataType === 'cost' ? 'Costs' : 'Cases'} - ${displayYear}${casesSelectedCodes.length > 0 ? ` (${casesSelectedCodes.join(', ')})` : ''}`,
            font: { size: 14 }
          },
        },
        scales: selectedCaseChartType !== 'pie' ? { y: { beginAtZero: true } } : undefined
      },
      data: {
        labels,
        datasets: [{
          label: casesDataType === 'cost' ? `${selectedCaseType} Cost` : selectedCaseType,
          data,
          backgroundColor: selectedCaseChartType === 'pie' ? [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
          ] : casesDataType === 'cost' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(54, 162, 235, 0.5)',
          borderColor: casesDataType === 'cost' ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: selectedCaseChartType === 'line',
          tension: selectedCaseChartType === 'line' ? 0.1 : undefined
        }]
      }
    }
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

  const customSelectClass = `
    text-xs py-1 px-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
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
          <Button type="submit" size="sm" disabled={loading} className='cursor-pointer'>
            {loading ? <Spinner size="sm" /> : 'Go'}
          </Button>
        </form>
      </div>

      {errorMessage && (
        <Alert color='failure' className='mb-4 font-semibold' onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {updateMessage && (
        <Alert color='success' className='mb-4 font-semibold' onDismiss={() => setUpdateMessage(null)}>
          {updateMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Outputs Chart Section */}
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="mb-4">
            <Label className="font-semibold text-base mb-2 block">Outputs Analytics</Label>
            
            <div className="mb-3 p-2 bg-gray-50 rounded-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Job Code Filter</Label>
                {selectedCodes.length > 0 && (
                  <Button size="xs" color="light" onClick={clearSelectedCodes} className="text-xs px-2 py-1">
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedCodes.map(code => (
                  <Badge key={code} color="info" className="flex items-center gap-1 py-0.5 px-1.5 text-xs">
                    {code}
                    <HiX className="cursor-pointer text-xs hover:text-red-500 transition-colors" onClick={() => handleCodeSelection(code)} />
                  </Badge>
                ))}
                {selectedCodes.length === 0 && <span className="text-gray-500 text-xs">All codes selected</span>}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {outputAvailableCodes.map(code => (
                  <div key={code} className={`flex items-center p-1 rounded cursor-pointer text-xs transition-colors ${
                    selectedCodes.includes(code) 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500'
                  }`} onClick={() => handleCodeSelection(code)}>
                    <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                      selectedCodes.includes(code) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400 dark:bg-gray-500 dark:border-gray-400'
                    }`}>
                      {selectedCodes.includes(code) && <HiCheck className="w-2 h-2 text-white" />}
                    </div>
                    {code}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="outputDataType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Data Type:</Label>
                <select id="outputDataType" value={selectedOutputDataType} onChange={(e) => setSelectedOutputDataType(e.target.value)} className={customSelectClass}>
                  {outputDataTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="outputChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Chart Type:</Label>
                <select id="outputChartType" value={selectedOutputChartType} onChange={(e) => setSelectedOutputChartType(e.target.value)} className={customSelectClass}>
                  {chartTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
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
                <Label htmlFor="costCategory" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Category:</Label>
                <select id="costCategory" value={selectedCostCategory} onChange={(e) => setSelectedCostCategory(e.target.value)} className={customSelectClass}>
                  {costCategories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="costChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Chart Type:</Label>
                <select id="costChartType" value={selectedCostChartType} onChange={(e) => setSelectedCostChartType(e.target.value)} className={customSelectClass}>
                  {chartTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
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
            
            <div className="mb-3 p-2 bg-gray-50 rounded-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Job Code Filter</Label>
                {casesSelectedCodes.length > 0 && (
                  <Button size="xs" color="light" onClick={clearCasesSelectedCodes} className="text-xs px-2 py-1">Clear</Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {casesSelectedCodes.map(code => (
                  <Badge key={code} color="info" className="flex items-center gap-1 py-0.5 px-1.5 text-xs">
                    {code}
                    <HiX className="cursor-pointer text-xs hover:text-red-500 transition-colors" onClick={() => handleCasesCodeSelection(code)} />
                  </Badge>
                ))}
                {casesSelectedCodes.length === 0 && <span className="text-gray-500 text-xs">All codes selected</span>}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {casesAvailableCodes.map(code => (
                  <div key={code} className={`flex items-center p-1 rounded cursor-pointer text-xs transition-colors ${
                    casesSelectedCodes.includes(code) 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500'
                  }`} onClick={() => handleCasesCodeSelection(code)}>
                    <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                      casesSelectedCodes.includes(code) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400 dark:bg-gray-500 dark:border-gray-400'
                    }`}>
                      {casesSelectedCodes.includes(code) && <HiCheck className="w-2 h-2 text-white" />}
                    </div>
                    {code}
                  </div>
                ))}
              </div>
              
              {/*<div className="mt-2">
                <Button size="xs" onClick={() => handleUpdateCasesStats(false)} disabled={isUpdatingCases} className="text-xs px-2 py-1">
                  {isUpdatingCases ? <Spinner size="sm" /> : 'Update Stats'}
                </Button>
              </div>*/}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="casesDataType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Data Type:</Label>
                <select id="casesDataType" value={casesDataType} onChange={(e) => setCasesDataType(e.target.value)} className={customSelectClass}>
                  {casesDataTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Label htmlFor="caseType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Case Type:</Label>
                <select id="caseType" value={selectedCaseType} onChange={(e) => setSelectedCaseType(e.target.value)} className={customSelectClass}>
                  {caseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <Label htmlFor="caseChartType" className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Chart Type:</Label>
                <select id="caseChartType" value={selectedCaseChartType} onChange={(e) => setSelectedCaseChartType(e.target.value)} className={customSelectClass}>
                  {chartTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
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