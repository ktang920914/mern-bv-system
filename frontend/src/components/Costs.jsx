import { Button, Label, Modal, ModalBody, ModalHeader, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Card, Badge } from 'flowbite-react'
import { useEffect, useState } from 'react'
import useUserstore from '../store'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { HiX, HiCheck } from 'react-icons/hi'
import ExcelJS from 'exceljs'

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

    // 辅助函数：将长标签分割成多行
    const wrapLabelText = (text, maxLineLength = 20) => {
        if (!text || text.length <= maxLineLength || !text.includes('+')) {
            return text;
        }
        
        const parts = text.split('+').map(part => part.trim());
        let lines = [];
        let currentLine = '';
        
        for (const part of parts) {
            if (currentLine.length + part.length + 1 > maxLineLength) {
                if (currentLine) lines.push(currentLine);
                currentLine = part;
            } else {
                currentLine = currentLine ? `${currentLine}+${part}` : part;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines.join('\n');
    };

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
            // 普通模式：显示选中类别的总和 - 使用简称
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
            // 普通模式：单个数据集（汇总数据） - 使用简称
            const singleData = Array.isArray(selectedData) ? selectedData[0] : selectedData;
            const data = monthFields.map(month => {
                const value = singleData[month.key];
                return formatNumber(value);
            });

            // 普通模式也使用简称或缩写
            let label;
            if (selectedCategories.length === 0) {
                // 如果是全部类别，使用 "All (Total)"
                label = 'All (Total)';
            } else if (selectedCategories.length === 1) {
                // 如果只选择一个类别，使用该类别的简称
                label = getCategoryShortName(selectedCategories[0]);
            } else {
                // 如果选择多个类别，使用缩写组合
                const shortNames = selectedCategories.map(cat => getCategoryShortName(cat));
                label = shortNames.join('/ ');
            }

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
                            : 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: selectedChartType === 'line',
                        tension: selectedChartType === 'line' ? 0.1 : undefined
                    },
                ],
            };
        }

        // 更新工具提示显示全称
        const getChartTooltip = (context) => {
            if (context.dataset && context.dataset.data) {
                const label = context.label || '';
                const fullLabel = getCategoryFullName(label);
                const value = context.raw || 0;
                const roundedValue = formatNumber(value);
                
                // 对于普通模式的汇总数据
                if (!comparisonMode && selectedCategories.length === 0) {
                    return `Total: ${roundedValue}`;
                } else if (!comparisonMode && selectedCategories.length > 0) {
                    if (selectedCategories.length === 1) {
                        return `${fullLabel}: ${roundedValue}`;
                    } else {
                        return `Total of ${selectedCategories.length} categories: ${roundedValue}`;
                    }
                }
                
                return `${fullLabel}: ${roundedValue}`;
            }
            return label;
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
                    },
                    // 为图例也使用简称，并添加自动换行
                    generateLabels: function(chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const displayText = wrapLabelText(label);
                                return {
                                    text: displayText,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor,
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const fullLabel = getCategoryFullName(label);
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const roundedValue = formatNumber(value);
                        const percentage = total > 0 ? formatNumber((value / total) * 100) : 0;
                        
                        if (!comparisonMode && selectedCategories.length === 0) {
                            return `Total: ${roundedValue} (${percentage.toFixed(1)}%)`;
                        }
                        
                        return `${fullLabel}: ${roundedValue} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        }

        const plugins = selectedChartType === 'pie' ? [piePlugins] : [];

        // 图表配置 - 添加自动换行
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
                        },
                        // 添加自动换行功能
                        generateLabels: selectedChartType !== 'pie' ? function(chart) {
                            const data = chart.data;
                            if (data.datasets.length) {
                                return data.datasets.map((dataset, i) => {
                                    const label = dataset.label || '';
                                    let displayLabel = label;
                                    
                                    // 如果是单个类别或比较模式中的单个数据集，获取全称
                                    if (!comparisonMode && selectedCategories.length === 1) {
                                        displayLabel = getCategoryFullName(label);
                                    } else if (comparisonMode) {
                                        displayLabel = getCategoryFullName(label);
                                    }
                                    
                                    // 将长标签分割成多行
                                    displayLabel = wrapLabelText(displayLabel);
                                    
                                    return {
                                        text: displayLabel,
                                        fillStyle: dataset.backgroundColor,
                                        strokeStyle: dataset.borderColor,
                                        lineWidth: 2,
                                        hidden: dataset.hidden || false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        } : undefined
                    }
                },
                title: {
                    display: true,
                    text: comparisonMode 
                        ? `Cost Comparison - ${displayYear} (${selectedData.length} Categories)`
                        : `${selectedCategories.length === 0 ? 'All Costs' : (selectedCategories.length === 1 ? getCategoryFullName(selectedCategories[0]) : selectedCategories.length + ' Categories')} - ${displayYear}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return getChartTooltip(context);
                        }
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

    // 替换现有的 generateExcelReport 函数

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
  } = options

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
  }
}

// 新的 generateExcelReport 函数
const generateExcelReport = async () => {
  try {
    const displayCosts = getDisplayCosts();
    
    if (displayCosts.length === 0) {
      setErrorMessage('No data to export')
      return
    }

    // 使用 ExcelJS 创建报表
    const workbook = new ExcelJS.Workbook()
    let worksheetName = `Costs ${displayYear}`
    
    // 简化工作表名称
    if (selectedCategories.length === 0) {
      worksheetName = 'Total All Categories'
    } else if (selectedCategories.length === 1) {
      worksheetName = selectedCategories[0]
    } else if (selectedCategories.length > 1) {
      worksheetName = `Total ${selectedCategories.length} Categories`
    }
    
    const worksheet = workbook.addWorksheet(worksheetName)
    
    // 设置打印选项
    setupWorksheetPrint(worksheet, {
      orientation: 'landscape',
      fitToHeight: 1,
      fitToWidth: 1,
      horizontalCentered: true
    })
    
    // 设置列宽 - 调整以适应成本数据
    worksheet.columns = [
      { width: 25 },    // Cost Category
      { width: 12 },    // Jan
      { width: 12 },    // Feb
      { width: 12 },    // Mar
      { width: 12 },    // Apr
      { width: 12 },    // May
      { width: 12 },    // Jun
      { width: 12 },    // Jul
      { width: 12 },    // Aug
      { width: 12 },    // Sep
      { width: 12 },    // Oct
      { width: 12 },    // Nov
      { width: 12 },    // Dec
      { width: 15 }     // Total
    ]

    // 定义样式
    const headerFont = { name: 'Calibri', size: 11, bold: true }
    const titleFont = { name: 'Arial Black', size: 16, bold: true }
    const defaultFont = { name: 'Calibri', size: 11 }
    const boldFont = { name: 'Calibri', size: 11, bold: true }
    
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    const centerAlignment = { horizontal: 'center', vertical: 'middle' }
    const leftAlignment = { horizontal: 'left', vertical: 'middle' }
    const rightAlignment = { horizontal: 'right', vertical: 'middle' }

    // 添加标题和报告信息
    let titleRow = 1
    
    // 主标题
    const mainTitleRow = worksheet.getRow(titleRow)
    mainTitleRow.height = 30
    mainTitleRow.getCell(1).value = 'COSTS MANAGEMENT REPORT'
    mainTitleRow.getCell(1).font = titleFont
    mainTitleRow.getCell(1).alignment = centerAlignment
    worksheet.mergeCells(`A${titleRow}:N${titleRow}`)
    
    titleRow++
    
    // 年份信息
    const yearRow = worksheet.getRow(titleRow)
    yearRow.height = 22
    yearRow.getCell(1).value = `Year: ${displayYear}`
    yearRow.getCell(1).font = boldFont
    yearRow.getCell(1).alignment = leftAlignment
    worksheet.mergeCells(`A${titleRow}:N${titleRow}`)
    
    titleRow++
    
    // 显示模式
    const modeRow = worksheet.getRow(titleRow)
    modeRow.height = 22
    const modeText = comparisonMode ? 'Comparison Mode' : 'Normal Mode'
    modeRow.getCell(1).value = `Mode: ${modeText}`
    modeRow.getCell(1).font = boldFont
    modeRow.getCell(1).alignment = leftAlignment
    worksheet.mergeCells(`A${titleRow}:N${titleRow}`)
    
    titleRow++
    
    // 类别信息
    const categoryRow = worksheet.getRow(titleRow)
    categoryRow.height = 22
    let categoryText = ''
    
    if (selectedCategories.length === 0) {
      categoryText = 'All Categories (Total of all categories)'
    } else if (selectedCategories.length === 1) {
      categoryText = `Category: ${selectedCategories[0]}`
    } else {
      categoryText = `Selected Categories: ${selectedCategories.join(', ')}`
    }
    
    categoryRow.getCell(1).value = categoryText
    categoryRow.getCell(1).font = { ...boldFont, color: { argb: 'FF0000FF' } } // 蓝色
    categoryRow.getCell(1).alignment = leftAlignment
    worksheet.mergeCells(`A${titleRow}:N${titleRow}`)
    
    titleRow++
    
    // 空行分隔
    titleRow++

    // 表头行
    const headerRow = worksheet.getRow(titleRow)
    headerRow.height = 25
    
    const headers = [
      'Cost Category',
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'Total'
    ]
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = headerFont
      cell.alignment = centerAlignment
      cell.border = borderStyle
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
    })
    
    titleRow++

    // 准备数据行
    let dataRowIndex = titleRow
    let monthlyTotals = Array(12).fill(0) // 存储每个月的总计
    let grandTotal = 0
    
    displayCosts.forEach((cost, index) => {
      const row = worksheet.getRow(dataRowIndex)
      row.height = 20
      
      const rowData = [cost.type]
      
      // 月份数据
      monthFields.forEach((month, monthIndex) => {
        const value = cost[month.key] || 0
        rowData.push(value)
        monthlyTotals[monthIndex] += value
      })
      
      // 总计
      const total = cost.total || 0
      rowData.push(total)
      grandTotal += total
      
      // 填充单元格数据
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        
        if (colIndex === 0) {
          // 成本类别列
          cell.value = value
          cell.font = boldFont
          cell.alignment = leftAlignment
          cell.border = borderStyle
          
          // 根据是否是汇总数据添加不同颜色
          if (cost.type.includes('All Costs') || cost.type.includes(' + ')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDDEBF7' } // 浅蓝色
            }
          } else {
            // 隔行着色
            if (index % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F8F8' }
              }
            }
          }
        } else if (colIndex === 13) {
          // 总计列
          cell.value = Number(value) || 0
          cell.numFmt = '#,##0.00'
          cell.font = { ...boldFont, color: { argb: 'FF006100' } } // 深绿色
          cell.alignment = rightAlignment
          cell.border = borderStyle
          
          // 为较大金额添加不同背景色
          const amount = Number(value) || 0
          if (amount > 100000) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' } // 浅红色
            }
          } else if (amount > 50000) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEB9C' } // 浅黄色
            }
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE2EFDA' } // 浅绿色
            }
          }
        } else {
          // 月份数据列
          cell.value = Number(value) || 0
          cell.numFmt = '#,##0.00'
          cell.font = defaultFont
          cell.alignment = rightAlignment
          cell.border = borderStyle
          
          // 高亮显示较大金额
          const amount = Number(value) || 0
          if (amount > 20000) {
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } } // 红色
          } else if (amount > 10000) {
            cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } } // 橙色
          }
          
          // 隔行着色
          if (index % 2 === 0 && !cost.type.includes('All Costs')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F8F8' }
            }
          }
        }
      })
      
      dataRowIndex++
    })

    // 如果没有数据，添加提示行
    if (displayCosts.length === 0) {
      const row = worksheet.getRow(dataRowIndex)
      row.getCell(1).value = 'No cost data available for selected criteria'
      worksheet.mergeCells(`A${dataRowIndex}:N${dataRowIndex}`)
      row.getCell(1).alignment = centerAlignment
      row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } }
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' }
      }
      row.getCell(1).border = borderStyle
      dataRowIndex++
    }

    // 添加月度总计行
    const monthlyTotalRow = worksheet.getRow(dataRowIndex)
    monthlyTotalRow.height = 25
    
    // 总计标题
    monthlyTotalRow.getCell(1).value = 'Monthly Totals'
    monthlyTotalRow.getCell(1).font = { ...boldFont, size: 12 }
    monthlyTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
    monthlyTotalRow.getCell(1).border = borderStyle
    monthlyTotalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' } // 灰色
    }
    
    // 每月总计数据
    monthlyTotals.forEach((total, index) => {
      const cell = monthlyTotalRow.getCell(index + 2)
      cell.value = Number(total) || 0
      cell.numFmt = '#,##0.00'
      cell.font = { ...boldFont, size: 11, color: { argb: 'FF000080' } } // 深蓝色
      cell.alignment = rightAlignment
      cell.border = borderStyle
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      }
    })
    
    // 月度总计的合计
    const monthlyGrandTotalCell = monthlyTotalRow.getCell(14)
    const monthlySum = monthlyTotals.reduce((sum, value) => sum + value, 0)
    monthlyGrandTotalCell.value = monthlySum
    monthlyGrandTotalCell.numFmt = '#,##0.00'
    monthlyGrandTotalCell.font = { ...boldFont, size: 11, color: { argb: 'FF006100' } } // 深绿色
    monthlyGrandTotalCell.alignment = rightAlignment
    monthlyGrandTotalCell.border = borderStyle
    monthlyGrandTotalCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC6EFCE' } // 浅绿色
    }
    
    dataRowIndex++

    // 添加总计行
    const grandTotalRow = worksheet.getRow(dataRowIndex)
    grandTotalRow.height = 28
    
    // 合并单元格显示总计标题
    grandTotalRow.getCell(1).value = 'GRAND TOTAL'
    worksheet.mergeCells(`A${dataRowIndex}:M${dataRowIndex}`)
    grandTotalRow.getCell(1).font = { ...boldFont, size: 13, color: { argb: 'FFFFFFFF' } }
    grandTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
    grandTotalRow.getCell(1).border = borderStyle
    grandTotalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // 蓝色
    }
    
    // 总计数值
    grandTotalRow.getCell(14).value = grandTotal
    grandTotalRow.getCell(14).numFmt = '#,##0.00'
    grandTotalRow.getCell(14).font = { ...boldFont, size: 13, color: { argb: 'FFFFFFFF' } }
    grandTotalRow.getCell(14).alignment = rightAlignment
    grandTotalRow.getCell(14).border = borderStyle
    grandTotalRow.getCell(14).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    
    dataRowIndex++
    
    // 添加信息行
    const infoRow = worksheet.getRow(dataRowIndex)
    infoRow.height = 20
    infoRow.getCell(1).value = `Generated on: ${new Date().toLocaleString()}`
    worksheet.mergeCells(`A${dataRowIndex}:N${dataRowIndex}`)
    infoRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    infoRow.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FF7F7F7F' } }

    // 生成文件名
    let fileName = `Costs_Report_${displayYear}`
    if (selectedCategories.length === 0) {
      fileName += '_All_Categories'
    } else if (selectedCategories.length === 1) {
      fileName += `_${selectedCategories[0].replace(/[^a-zA-Z0-9]/g, '_')}`
    } else {
      fileName += `_${selectedCategories.length}_Categories`
    }
    if (comparisonMode) {
      fileName += '_Comparison'
    }
    
    // 保存文件
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    saveAs(blob, `${fileName}.xlsx`)

  } catch (error) {
    console.error('Error generating Excel report:', error)
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