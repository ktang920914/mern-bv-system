import { Button, Label, Modal, ModalBody, ModalHeader, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Card, Badge } from 'flowbite-react'
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
    const [selectedChartType, setSelectedChartType] = useState('bar')
    const [selectedCategories, setSelectedCategories] = useState([]) // 初始为空数组
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [comparisonMode, setComparisonMode] = useState(false)

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
        
        if (currentPage === 1) {
            params.delete('page')
        } else {
            params.set('page', currentPage.toString())
        }
        
        if (searchTerm === '') {
            params.delete('search')
        } else {
            params.set('search', searchTerm)
        }
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    // 成本类别及其简称
    const costCategories = [
        { name: "Spareparts", short: "SP" },
        { name: "Extruder", short: "EXT" },
        { name: "Electrical & Installation", short: "E&I" },
        { name: "Injection machine", short: "IM" },
        { name: "QC", short: "QC" },
        { name: "Mould", short: "Mould" },
        { name: "Others", short: "Others" },
        { name: "TNB", short: "TNB" },
        { name: "Air Selangor", short: "SYABAS" },
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

    // 生成颜色用于图表
    const generateColors = (count) => {
        const baseColors = [
            { bg: 'rgba(54, 162, 235, 0.5)', border: 'rgba(54, 162, 235, 1)' },
            { bg: 'rgba(255, 99, 132, 0.5)', border: 'rgba(255, 99, 132, 1)' },
            { bg: 'rgba(75, 192, 192, 0.5)', border: 'rgba(75, 192, 192, 1)' },
            { bg: 'rgba(255, 159, 64, 0.5)', border: 'rgba(255, 159, 64, 1)' },
            { bg: 'rgba(153, 102, 255, 0.5)', border: 'rgba(153, 102, 255, 1)' },
            { bg: 'rgba(255, 205, 86, 0.5)', border: 'rgba(255, 205, 86, 1)' },
            { bg: 'rgba(201, 203, 207, 0.5)', border: 'rgba(201, 203, 207, 1)' },
            { bg: 'rgba(255, 99, 71, 0.5)', border: 'rgba(255, 99, 71, 1)' },
            { bg: 'rgba(46, 204, 113, 0.5)', border: 'rgba(46, 204, 113, 1)' },
            { bg: 'rgba(155, 89, 182, 0.5)', border: 'rgba(155, 89, 182, 1)' },
        ];

        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }

        const colors = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = (i * 137.5) % 360;
            colors.push({
                bg: `hsla(${hue}, 70%, 65%, 0.5)`,
                border: `hsl(${hue}, 70%, 50%)`
            });
        }
        return colors;
    };

    // 获取类别简称
    const getCategoryShortName = (fullName) => {
        const category = costCategories.find(cat => cat.name === fullName);
        return category ? category.short : fullName;
    }

    // 获取类别全称
    const getCategoryFullName = (shortName) => {
        const category = costCategories.find(cat => cat.short === shortName);
        return category ? category.name : shortName;
    }

    // 初始获取数据
    useEffect(() => {
        const fetchInitialCosts = async () => {
            try {
                const res = await fetch('/api/cost/getcosts')
                const data = await res.json()
                if (res.ok) {
                    const currentYear = new Date().getFullYear().toString()
                    const filteredCosts = data.filter(cost => cost.year === currentYear)
                    const cleanedCosts = filteredCosts.map(cost => {
                        const cleanedCost = { ...cost };
                        monthFields.forEach(month => {
                            if (cleanedCost[month.key] !== undefined) {
                                cleanedCost[month.key] = formatNumber(cleanedCost[month.key]);
                            }
                        });
                        if (cleanedCost.total !== undefined) {
                            cleanedCost.total = formatNumber(cleanedCost.total);
                        }
                        return cleanedCost;
                    });
                    setCosts(cleanedCosts)
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
                const cleanedCosts = filteredCosts.map(cost => {
                    const cleanedCost = { ...cost };
                    monthFields.forEach(month => {
                        if (cleanedCost[month.key] !== undefined) {
                            cleanedCost[month.key] = formatNumber(cleanedCost[month.key]);
                        }
                    });
                    if (cleanedCost.total !== undefined) {
                        cleanedCost.total = formatNumber(cleanedCost.total);
                    }
                    return cleanedCost;
                });
                setCosts(cleanedCosts)
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

    // 处理类别选择
    const handleCategorySelection = (categoryName) => {
        if (selectedCategories.includes(categoryName)) {
            setSelectedCategories(selectedCategories.filter(c => c !== categoryName))
        } else {
            setSelectedCategories([...selectedCategories, categoryName])
        }
    }

    // 全选所有类别
    const selectAllCategories = () => {
        setSelectedCategories(costCategories.map(cat => cat.name))
    }

    // 清除所有选中的类别
    const clearSelectedCategories = () => {
        setSelectedCategories([])
    }

    // 获取要在表格中显示的成本数据
    const getDisplayCosts = () => {
        // 如果没有选择任何类别，创建一个汇总数据（所有类别的总和）
        if (selectedCategories.length === 0) {
            // 创建汇总数据对象
            const aggregatedData = {
                _id: 'aggregated-all',
                type: 'All Costs (Total)',
                year: displayYear
            };

            // 初始化月份数据
            monthFields.forEach(month => {
                aggregatedData[month.key] = 0;
            });
            aggregatedData.total = 0;

            // 累加所有类别的数据
            costs.forEach(cost => {
                monthFields.forEach(month => {
                    aggregatedData[month.key] += cost[month.key] || 0;
                });
                aggregatedData.total += cost.total || 0;
            });

            // 格式化数字
            monthFields.forEach(month => {
                aggregatedData[month.key] = formatNumber(aggregatedData[month.key]);
            });
            aggregatedData.total = formatNumber(aggregatedData.total);

            return [aggregatedData];
        }
        
        // 如果选择了多个类别，创建这些类别的汇总数据
        if (selectedCategories.length > 1) {
            const aggregatedData = {
                _id: `aggregated-${selectedCategories.join('-')}`,
                type: selectedCategories.join(' + '),
                year: displayYear
            };

            // 初始化月份数据
            monthFields.forEach(month => {
                aggregatedData[month.key] = 0;
            });
            aggregatedData.total = 0;

            // 累加选中类别的数据
            selectedCategories.forEach(category => {
                const categoryData = costs.find(cost => cost.type === category);
                if (categoryData) {
                    monthFields.forEach(month => {
                        aggregatedData[month.key] += categoryData[month.key] || 0;
                    });
                    aggregatedData.total += categoryData.total || 0;
                }
            });

            // 格式化数字
            monthFields.forEach(month => {
                aggregatedData[month.key] = formatNumber(aggregatedData[month.key]);
            });
            aggregatedData.total = formatNumber(aggregatedData.total);

            return [aggregatedData];
        }
        
        // 如果只选择了一个类别，显示该类别
        return costs.filter(cost => selectedCategories.includes(cost.type));
    }

    // 准备图表数据 - 支持比较模式
    const prepareChartData = () => {
        if (costs.length === 0) {
            return null;
        }

        let selectedData;
        
        if (comparisonMode) {
            // 比较模式：显示所有选中类别的数据
            const categoriesToShow = selectedCategories.length > 0 ? selectedCategories : costCategories.map(cat => cat.name);
            selectedData = costs.filter(cost => 
                categoriesToShow.includes(cost.type)
            );
            
            if (selectedData.length === 0) {
                return null;
            }
        } else {
            // 普通模式：显示选中类别的总和
            const categoriesToShow = selectedCategories.length > 0 ? selectedCategories : costCategories.map(cat => cat.name);
            
            // 创建汇总数据
            const aggregatedData = {
                type: selectedCategories.length === 0 
                    ? 'All Costs (Total)' 
                    : categoriesToShow.join(' + '),
                year: displayYear
            };

            // 初始化月份数据
            monthFields.forEach(month => {
                aggregatedData[month.key] = 0;
            });
            aggregatedData.total = 0;

            // 累加所有要显示的类别的数据
            categoriesToShow.forEach(category => {
                const categoryData = costs.find(cost => cost.type === category);
                if (categoryData) {
                    monthFields.forEach(month => {
                        aggregatedData[month.key] += categoryData[month.key] || 0;
                    });
                    aggregatedData.total += categoryData.total || 0;
                }
            });

            // 格式化数字
            monthFields.forEach(month => {
                aggregatedData[month.key] = formatNumber(aggregatedData[month.key]);
            });
            aggregatedData.total = formatNumber(aggregatedData.total);

            selectedData = [aggregatedData];
        }

        if (!selectedData || selectedData.length === 0) {
            console.log('No data found for selected categories');
            return null;
        }

        // 月份标签
        const labels = monthFields.map(month => month.name);
        
        let chartData;
        
        if (comparisonMode && Array.isArray(selectedData) && selectedData.length > 0) {
            // 比较模式：多个数据集 - 使用简称
            const colors = generateColors(selectedData.length);
            
            const datasets = selectedData.map((costItem, index) => {
                const data = monthFields.map(month => {
                    const value = costItem[month.key];
                    return formatNumber(value);
                });

                const color = colors[index];
                const categoryShort = getCategoryShortName(costItem.type);

                return {
                    label: categoryShort,
                    data,
                    backgroundColor: selectedChartType === 'pie' 
                        ? [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
                          ]
                        : color.bg,
                    borderColor: color.border,
                    borderWidth: 2,
                    fill: selectedChartType === 'line',
                    tension: selectedChartType === 'line' ? 0.1 : undefined
                };
            });

            chartData = {
                labels,
                datasets
            };
        } else {
            // 普通模式：单个数据集（汇总数据）
            const singleData = Array.isArray(selectedData) ? selectedData[0] : selectedData;
            const data = monthFields.map(month => {
                const value = singleData[month.key];
                return formatNumber(value);
            });

            // 对于汇总数据，保持完整名称
            const label = singleData.type;

            chartData = {
                labels,
                datasets: [
                    {
                        label: label,
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
        }

        // 饼图插件配置
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
                        const shortLabel = context.label || '';
                        const fullLabel = getCategoryFullName(shortLabel);
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const roundedValue = formatNumber(value);
                        const percentage = total > 0 ? formatNumber((value / total) * 100) : 0;
                        return `${fullLabel}: ${roundedValue} (${percentage.toFixed(1)}%)`;
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
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        font: {
                            size: comparisonMode && selectedData.length > 6 ? 10 : 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: comparisonMode 
                        ? `Cost Comparison - ${displayYear} (${selectedData.length} Categories)`
                        : `${selectedData[0]?.type || 'All Costs'} - ${displayYear}`,
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
                        text: 'Cost Value'
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

        return { options, data: chartData, plugins };
    };

    const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
    }

    const displayCosts = getDisplayCosts();
    const filteredCosts = displayCosts.filter(cost => 
        cost.type.toLowerCase().includes(searchTerm) 
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentCosts = filteredCosts.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredCosts.length
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

    // 格式化数字显示
    const formatDisplayNumber = (value) => {
        if (value === undefined || value === null) return '0.00';
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return num.toFixed(2);
    }

    const generateExcelReport = () => {
        const displayCosts = getDisplayCosts();
        
        if (displayCosts.length === 0) {
            setErrorMessage('No data to export')
            return
        }

        try {
            const worksheetData = []
            
            // 添加报告标题和年份信息
            worksheetData.push(['Costs Report'])
            worksheetData.push([`Year: ${displayYear}`])
            worksheetData.push([`Display Mode: ${comparisonMode ? 'Comparison' : 'Normal'}`])
            if (selectedCategories.length === 0) {
                worksheetData.push(['Selected Categories: Total of all categories'])
            } else {
                worksheetData.push([`Selected Categories: ${selectedCategories.join(', ')}`])
            }
            worksheetData.push([])
            
            // 如果是汇总数据，添加说明行
            if (displayCosts[0]?.type.includes('All Costs') || displayCosts[0]?.type.includes(' + ')) {
                worksheetData.push(['*Note: This is aggregated total data'])
            }
            worksheetData.push([])
            
            const headers = ['Cost Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
            worksheetData.push(headers)
            
            displayCosts.forEach(cost => {
                const rowData = [cost.type]
                
                monthFields.forEach(month => {
                    const value = cost[month.key] || 0
                    rowData.push(formatDisplayNumber(value))
                })
                
                const total = cost.total || 0
                rowData.push(formatDisplayNumber(total))
                
                worksheetData.push(rowData)
            })
            
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
            
            // 设置列宽和自动换行
            const colWidths = [
                { wch: 30 }, // 增加列宽以容纳更长的类别名称
                ...Array(12).fill({ wch: 10 }),
                { wch: 12 } 
            ]
            worksheet['!cols'] = colWidths
            
            // 为成本类别列设置自动换行样式
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
            for (let R = 4; R <= range.e.r; R++) {
                const cell_address = XLSX.utils.encode_cell({r:R, c:0});
                if (!worksheet[cell_address]) continue;
                worksheet[cell_address].s = {
                    alignment: {
                        wrapText: true,
                        vertical: 'top'
                    }
                };
            }
            
            // 合并标题单元格
            if (!worksheet['!merges']) worksheet['!merges'] = [];
            worksheet['!merges'].push(
                { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
                { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } }
            );
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `Costs ${displayYear}`)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            let fileName = `Costs_Report_${displayYear}`
            if (selectedCategories.length === 0) {
                fileName += '_total_all'
            } else if (selectedCategories.length === 1) {
                fileName += `_${selectedCategories[0]}`
            } else {
                fileName += `_total_${selectedCategories.length}_categories`
            }
            if (comparisonMode) {
                fileName += '_comparison'
            }
            
            saveAs(data, `${fileName}.xlsx`)
            
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
                    <Card key={cost._id || cost.type || index} className="p-4">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {cost.type}
                            </h3>
                            {comparisonMode && selectedCategories.length > 1 && (
                                <Badge color="info" className="mt-1">
                                    Comparison Mode
                                </Badge>
                            )}
                        </div>
                        
                        {/* 月份数据网格 - 4行 x 3列 */}
                        <div className="space-y-3">
                            {[0, 3, 6, 9].map((startIndex) => (
                                <div key={startIndex} className="grid grid-cols-3 gap-2">
                                    {monthFields.slice(startIndex, startIndex + 3).map(month => (
                                        <div key={month.key} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <div className="text-xs text-gray-900 dark:text-gray-400">{month.name}</div>
                                            <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(cost[month.key])}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
                        {/* 总计 */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatDisplayNumber(cost.total)}
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
                <h1 className='text-2xl font-semibold'>Costs {displayYear}</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Search cost category...' 
                        value={searchTerm}
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateCost}>
                        Change Year
                    </Button>
                    <Button className='cursor-pointer flex-1 sm:flex-none' color='green' onClick={generateExcelReport} disabled={costs.length === 0}>
                        Report
                    </Button>
                </div>
            </div>

            {/* 成本类别筛选器 */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Select Cost Categories</Label>
                    <div className="flex gap-2">
                        {selectedCategories.length > 0 ? (
                            <>
                                <Button size="xs" color="light" onClick={clearSelectedCategories}>
                                    Clear All
                                </Button>
                                <Button size="xs" color="light" onClick={selectAllCategories}>
                                    Select All
                                </Button>
                            </>
                        ) : (
                            <Button size="xs" color="light" onClick={selectAllCategories}>
                                Select All
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedCategories.map(category => (
                        <Badge key={category} color="info" className="flex items-center gap-1 py-0.5 px-2 text-xs">
                            {category}
                            <HiX 
                                className="cursor-pointer text-xs" 
                                onClick={() => handleCategorySelection(category)} 
                            />
                        </Badge>
                    ))}
                    {selectedCategories.length === 0 && (
                        <span className="text-gray-500 text-xs">Showing total of all categories</span>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {costCategories.map(category => (
                        <div 
                            key={category.name}
                            className={`flex items-center p-1 rounded cursor-pointer text-xs ${
                                selectedCategories.includes(category.name) 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    : selectedCategories.length === 0
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => handleCategorySelection(category.name)}
                        >
                            <div className={`w-3 h-3 flex items-center justify-center rounded-sm border mr-1 ${
                                selectedCategories.includes(category.name) 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : selectedCategories.length === 0
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-gray-300 dark:bg-gray-600 dark:border-gray-500'
                            }`}>
                                {(selectedCategories.length === 0 || selectedCategories.includes(category.name)) && (
                                    <HiCheck className="w-2 h-2 text-white" />
                                )}
                            </div>
                            <div>
                                <div className="text-xs font-medium">{category.name}</div>
                                <div className="text-[10px] text-gray-500">({category.short})</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* 比较模式开关 */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="comparisonMode" className="text-sm font-medium">
                            Comparison Mode
                        </Label>
                        <input
                            id="comparisonMode"
                            type="checkbox"
                            checked={comparisonMode}
                            onChange={(e) => setComparisonMode(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <Label htmlFor="comparisonMode" className="text-xs text-gray-500">
                            Compare selected categories in chart
                        </Label>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Normal Mode:</strong> {
                                selectedCategories.length === 0 
                                    ? 'Showing total of all categories' 
                                    : selectedCategories.length === 1 
                                    ? `Showing ${selectedCategories[0]} only`
                                    : `Showing total of ${selectedCategories.join(' + ')}`
                            }
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Comparison Mode:</strong> {
                                selectedCategories.length === 0 
                                    ? 'Comparing all categories (using abbreviations)' 
                                    : selectedCategories.length === 1 
                                    ? `Showing ${selectedCategories[0]} only`
                                    : `Comparing ${selectedCategories.length} categories (using abbreviations)`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* 图表控制区域 */}
            {costs.length > 0 && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-950 dark:text-gray-800">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <Label className="font-semibold">Chart Options:</Label>
                        
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
                                <Pie options={chartData.options} data={chartData.data} plugins={chartData.plugins} />
                            )}
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500">
                            No chart data available
                        </div>
                    )}
                </div>
            )}

            {showTable && costs.length > 0 ? (
                <>
                    {/* 移动端显示卡片，桌面端显示压缩表格 */}
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        // 桌面端：添加水平滚动和小字体
                        <div className="w-full overflow-x-auto">
                            <Table hoverable className="[&_td]:py-1 [&_th]:py-2 [&_td]:text-[10px] [&_th]:text-[10px] min-w-full">
                                <TableHead>
                                    <TableRow>
                                        <TableHeadCell className={`w-40 ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Cost Category</TableHeadCell>
                                        {monthFields.map(month => (
                                            <TableHeadCell className={`w-16 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`} key={month.key}>
                                                {month.name}
                                            </TableHeadCell>
                                        ))}
                                        <TableHeadCell className={`w-20 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentCosts.map(cost => ( 
                                        <TableRow key={cost._id || cost.type}> 
                                            <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px]">{cost.type}</span>
                                                {comparisonMode && selectedCategories.length > 0 && selectedCategories.includes(cost.type) && (
                                                    <Badge color="info" size="xs" className="ml-1">
                                                        Comparing
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            {monthFields.map(month => (
                                                <TableCell className={`text-center font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} key={month.key}>
                                                    <span className="text-[10px]">{formatDisplayNumber(cost[month.key])}</span>
                                                </TableCell>
                                            ))}
                                            <TableCell className={`text-center font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px] font-bold">{formatDisplayNumber(cost.total)}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex-col justify-center text-center mt-4">
                        <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                            Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                        </p>
                        
                        {/* 分页 */}
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