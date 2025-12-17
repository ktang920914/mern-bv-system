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

// 颜色映射 - 与 statistics.jsx 保持一致
const jobCodeColors = {
  'L1': { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 1)' },  // 蓝色
  'L2': { bg: 'rgba(16, 185, 129, 0.5)', border: 'rgba(16, 185, 129, 1)' },  // 绿色
  'L3': { bg: 'rgba(139, 92, 246, 0.5)', border: 'rgba(139, 92, 246, 1)' },  // 紫色
  'L5': { bg: 'rgba(245, 158, 11, 0.5)', border: 'rgba(245, 158, 11, 1)' },  // 黄色
  'L6': { bg: 'rgba(239, 68, 68, 0.5)', border: 'rgba(239, 68, 68, 1)' },     // 红色
  'L9': { bg: 'rgba(236, 72, 153, 0.5)', border: 'rgba(236, 72, 153, 1)' },  // 粉色
  'L10': { bg: 'rgba(6, 182, 212, 0.5)', border: 'rgba(6, 182, 212, 1)' },    // 青色
  'L11': { bg: 'rgba(132, 204, 22, 0.5)', border: 'rgba(132, 204, 22, 1)' },  // 青绿色
  'L12': { bg: 'rgba(249, 115, 22, 0.5)', border: 'rgba(249, 115, 22, 1)' }   // 橙色
}

const Outputs = () => {
    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [loadingChart, setLoadingChart] = useState(false)
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
    const [selectedChartType, setSelectedChartType] = useState('bar')
    const [selectedDataType, setSelectedDataType] = useState('totaloutput')
    const [availableCodes, setAvailableCodes] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [comparisonMode, setComparisonMode] = useState(false)
    const [debouncedSelectedCodes, setDebouncedSelectedCodes] = useState([])
    const [dataCache, setDataCache] = useState({})

    // 常量定义
    const API_BATCH_SIZE = 3
    const DEBOUNCE_DELAY = 500

    // 需要计算平均值的数据类型
    const averageDataTypes = ['arr', 'availability', 'performance', 'quality', 'oee'];

    // 辅助函数：处理浮点数精度
    const formatNumber = (value) => {
        if (value === undefined || value === null) return 0;
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return parseFloat(num.toFixed(2));
    }

    // 生成缓存键
    const getCacheKey = (year, dataType, codes, comparisonMode) => {
        const codeKey = Array.isArray(codes) ? codes.sort().join(',') : codes;
        return `${year}-${dataType}-${codeKey}-${comparisonMode}`;
    }

    // 检测屏幕大小变化
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 防抖优化 - 延迟处理选中的 Job Codes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSelectedCodes(selectedCodes)
        }, DEBOUNCE_DELAY)
        
        return () => clearTimeout(timer)
    }, [selectedCodes])

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

    // 获取可用的 Job Code 列表
    useEffect(() => {
        const fetchAvailableCodes = async () => {
            try {
                const res = await fetch('/api/analysis/getjobs');
                const data = await res.json();
                if (res.ok) {
                    const jobCodes = [...new Set(data.map(item => item.code))].filter(Boolean);
                    setAvailableCodes(jobCodes);
                }
            } catch (error) {
                console.error('Error fetching job codes:', error);
                setAvailableCodes(['L1', 'L2', 'L3', 'L5', 'L6', 'L9', 'L10', 'L11', 'L12']);
            }
        };
        fetchAvailableCodes();
    }, []);

    // 当 selectedCodes 或 comparisonMode 改变时自动获取数据
    useEffect(() => {
        if (showTable && debouncedSelectedCodes.length >= 0) {
            fetchOutputsForYear(displayYear);
        }
    }, [debouncedSelectedCodes, comparisonMode]);

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

    const chartTypes = [
        { value: 'bar', label: 'Bar' },
        { value: 'line', label: 'Line' },
        { value: 'pie', label: 'Pie' }
    ]

    // 获取饼图颜色（为每个月份生成不同的颜色）
    const getPieChartColors = (numColors) => {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const hue = (i * 360 / numColors) % 360;
            const saturation = 70;
            const lightness = 60;
            
            colors.push({
                backgroundColor: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`,
                borderColor: `hsl(${hue}, ${saturation}%, ${lightness - 15}%)`,
                hoverBackgroundColor: `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.9)`
            });
        }
        return colors;
    };

    // 生成颜色 - 优先使用 jobCodeColors
    const generateColors = (count, jobCodes = []) => {
        const colors = [];
        
        // 如果提供了jobCodes，使用对应的颜色
        jobCodes.forEach((code, index) => {
            if (jobCodeColors[code]) {
                colors.push(jobCodeColors[code]);
            } else {
                // 如果没有对应的颜色，使用默认颜色
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
                    { bg: 'rgba(155, 89, 182, 0.5)', border: 'rgba(155, 89, 182, 1)' }
                ];
                colors.push(baseColors[index % baseColors.length]);
            }
        });
        
        // 如果colors数量不够，补充颜色
        if (colors.length < count) {
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
                { bg: 'rgba(155, 89, 182, 0.5)', border: 'rgba(155, 89, 182, 1)' }
            ];
            
            for (let i = colors.length; i < count; i++) {
                const hue = (i * 137.5) % 360;
                colors.push({
                    bg: `hsla(${hue}, 70%, 65%, 0.5)`,
                    border: `hsl(${hue}, 70%, 50%)`
                });
            }
        }
        
        return colors;
    };

    useEffect(() => {
        fetchOutputsForYear(new Date().getFullYear().toString())
    }, [currentUser._id])

    // 数据处理函数
    const processDataItem = (dataItem, dataType, code = null) => {
        const cleanedItem = { ...dataItem };
        
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
            dataTypeLabel: dataType.label,
            ...(code && { code })
        };
    };

    // 优化的数据获取函数
    const fetchOutputsForYear = async (year) => {
        try {
            setLoading(true)
            setLoadingChart(true)
            setErrorMessage(null)
            
            const allOutputs = []
            
            // 批量获取单个数据类型的函数
            const fetchDataTypeData = async (dataType) => {
                const cacheKey = getCacheKey(year, dataType.value, selectedCodes, comparisonMode);
                
                // 检查缓存
                if (dataCache[cacheKey]) {
                    return dataCache[cacheKey];
                }

                let results = [];

                if (comparisonMode && selectedCodes.length > 0) {
                    // 比较模式：并行获取所有 Job Code 的数据
                    const fetchPromises = selectedCodes.map(async (code) => {
                        try {
                            const params = new URLSearchParams({
                                year: year,
                                data: dataType.value,
                                codes: code
                            });
                            
                            const res = await fetch(`/api/output/calculate?${params}`);
                            if (res.ok) {
                                const data = await res.json();
                                if (Array.isArray(data)) {
                                    return data.map(item => processDataItem(item, dataType, code));
                                } else if (typeof data === 'object') {
                                    return [processDataItem(data, dataType, code)];
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching ${dataType.value} for ${code}:`, error);
                        }
                        return [];
                    });
                    
                    const batchResults = await Promise.all(fetchPromises);
                    results = batchResults.flat();
                } else {
                    // 普通模式：单个请求
                    try {
                        const params = new URLSearchParams({
                            year: year,
                            data: dataType.value
                        });
                        
                        if (selectedCodes.length > 0) {
                            params.append('codes', selectedCodes.join(','));
                        }
                        
                        const res = await fetch(`/api/output/calculate?${params}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (Array.isArray(data)) {
                                results = data.map(item => processDataItem(item, dataType));
                            } else if (typeof data === 'object') {
                                results = [processDataItem(data, dataType)];
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching ${dataType.value}:`, error);
                    }
                }

                // 缓存结果
                if (results.length > 0) {
                    setDataCache(prev => ({
                        ...prev,
                        [cacheKey]: results
                    }));
                }

                return results;
            };

            // 分批处理数据类型的获取，避免同时发起太多请求
            for (let i = 0; i < dataTypes.length; i += API_BATCH_SIZE) {
                const batch = dataTypes.slice(i, i + API_BATCH_SIZE);
                const batchPromises = batch.map(dataType => fetchDataTypeData(dataType));
                const batchResults = await Promise.all(batchPromises);
                allOutputs.push(...batchResults.flat());
                
                // 小批量延迟，避免阻塞UI
                if (i + API_BATCH_SIZE < dataTypes.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            setOutputs(allOutputs);
            setDisplayYear(year);
            setShowTable(true);
            
        } catch (error) {
            setErrorMessage('Error fetching data: ' + error.message);
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setLoadingChart(false);
        }
    };

    // 准备图表数据 - 支持比较模式
    const prepareChartData = () => {
        if (outputs.length === 0) {
            return null;
        }

        let selectedData;
        
        if (comparisonMode && selectedCodes.length > 0) {
            // 比较模式：过滤出当前数据类型和所有选中 codes 的数据
            selectedData = outputs.filter(output => 
                output.dataType === selectedDataType && 
                selectedCodes.includes(output.code)
            );
        } else {
            // 普通模式：获取当前数据类型的汇总数据
            selectedData = outputs.filter(output => 
                output.dataType === selectedDataType && 
                !output.code
            );
            
            // 如果没有找到汇总数据，尝试获取任何该类型的数据
            if (selectedData.length === 0) {
                selectedData = outputs.filter(output => 
                    output.dataType === selectedDataType
                );
            }
        }

        if (!selectedData || selectedData.length === 0) {
            return null;
        }

        // 月份标签
        const labels = monthFields.map(month => month.name);
        
        // 图表数据
        let chartData;
        
        if (comparisonMode && Array.isArray(selectedData) && selectedData.length > 0) {
            // 比较模式：多个数据集（多个饼图 - 每个Job Code一个）
            const datasets = selectedData.map((dataItem) => {
                const data = monthFields.map(month => {
                    const value = dataItem[month.key];
                    return formatNumber(value);
                });

                const jobCode = dataItem.code || 'All';
                const color = jobCodeColors[jobCode] || { 
                    bg: 'rgba(59, 130, 246, 0.5)', 
                    border: 'rgba(59, 130, 246, 1)' 
                };

                // 如果是饼图，需要为每个月份生成不同的颜色
                if (selectedChartType === 'pie') {
                    const pieColors = getPieChartColors(data.length);
                    return {
                        label: `${jobCode} - ${dataTypes.find(dt => dt.value === selectedDataType)?.label}`,
                        data,
                        backgroundColor: pieColors.map(c => c.backgroundColor),
                        borderColor: pieColors.map(c => c.borderColor),
                        borderWidth: 2,
                        hoverBackgroundColor: pieColors.map(c => c.hoverBackgroundColor),
                    };
                } else {
                    return {
                        label: `${jobCode} - ${dataTypes.find(dt => dt.value === selectedDataType)?.label}`,
                        data,
                        backgroundColor: color.bg,
                        borderColor: color.border,
                        borderWidth: 2,
                        fill: selectedChartType === 'line',
                        tension: selectedChartType === 'line' ? 0.1 : undefined
                    };
                }
            });

            chartData = {
                labels,
                datasets
            };
        } else {
            // 普通模式：单个数据集
            const singleData = Array.isArray(selectedData) ? selectedData[0] : selectedData;
            const jobCode = singleData.code || 'All';
            const color = jobCodeColors[jobCode] || { 
                bg: 'rgba(59, 130, 246, 0.5)', 
                border: 'rgba(59, 130, 246, 1)' 
            };
            
            const data = monthFields.map(month => {
                const value = singleData[month.key];
                return formatNumber(value);
            });

            // 如果是饼图，为每个月份生成不同的颜色
            if (selectedChartType === 'pie') {
                const pieColors = getPieChartColors(data.length);
                chartData = {
                    labels,
                    datasets: [
                        {
                            label: `${jobCode} - ${dataTypes.find(dt => dt.value === selectedDataType)?.label}`,
                            data,
                            backgroundColor: pieColors.map(c => c.backgroundColor),
                            borderColor: pieColors.map(c => c.borderColor),
                            borderWidth: 2,
                            hoverBackgroundColor: pieColors.map(c => c.hoverBackgroundColor),
                        },
                    ],
                };
            } else {
                chartData = {
                    labels,
                    datasets: [
                        {
                            label: `${jobCode} - ${dataTypes.find(dt => dt.value === selectedDataType)?.label}`,
                            data,
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            borderWidth: 2,
                            fill: selectedChartType === 'line',
                            tension: selectedChartType === 'line' ? 0.1 : undefined
                        },
                    ],
                };
            }
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
                    color: theme === 'light' ? '#374151' : '#D1D5DB'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const roundedValue = formatNumber(value);
                        const percentage = total > 0 ? formatNumber((value / total) * 100) : 0;
                        return `${label}: ${roundedValue} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        }

        const plugins = selectedChartType === 'pie' ? [piePlugins] : [];

        // 图表配置 - 优化图例显示
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
                            size: comparisonMode && selectedCodes.length > 8 ? 10 : 12
                        },
                        // 修复标签颜色
                        // color: theme === 'light' ? '#374151' : '#D1D5DB'
                    }
                },
                title: {
                    display: true,
                    text: comparisonMode 
                        ? `${dataTypes.find(dt => dt.value === selectedDataType)?.label} Comparison - ${displayYear} (${selectedCodes.length} Job Codes)`
                        : `${dataTypes.find(dt => dt.value === selectedDataType)?.label} - ${displayYear}${selectedCodes.length > 0 ? ` (${selectedCodes.join(', ')})` : ''}`,
                    font: {
                        size: 16
                    },
                    // 标题颜色
                    // color: theme === 'light' ? 'text-gray-900' : 'text-gray-900'
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
                        text: 'Value',
                        //color: theme === 'light' ? '#374151' : '#D1D5DB'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        },
                        //color: theme === 'light' ? '#374151' : '#D1D5DB'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        //color: theme === 'light' ? '#374151' : '#D1D5DB'
                    },
                    ticks: {
                        //color: theme === 'light' ? '#374151' : '#D1D5DB'
                    }
                }
            } : undefined
        };

        return { options, data: chartData, plugins };
    };

    // 准备表格数据
    const prepareTableData = () => {
        if (outputs.length === 0) return [];

        // 按数据类型分组
        const groupedByDataType = {};
        
        outputs.forEach(output => {
            const dataType = output.dataType;
            if (!groupedByDataType[dataType]) {
                groupedByDataType[dataType] = [];
            }
            groupedByDataType[dataType].push(output);
        });

        const tableData = [];

        Object.keys(groupedByDataType).forEach(dataType => {
            const dataTypeOutputs = groupedByDataType[dataType];
            const dataTypeLabel = dataTypeOutputs[0]?.dataTypeLabel || 'Unknown';
            const isAverageType = averageDataTypes.includes(dataType);

            if (comparisonMode && selectedCodes.length > 0) {
                // 只过滤出当前选中的 job codes 的数据
                const filteredOutputs = dataTypeOutputs.filter(output => 
                    selectedCodes.includes(output.code)
                );

                if (filteredOutputs.length === 0) {
                    return;
                }

                const aggregatedData = {
                    dataType,
                    dataTypeLabel,
                    code: null,
                    total: 0
                };

                // 初始化月份数据
                monthFields.forEach(month => {
                    aggregatedData[month.key] = 0;
                });

                if (isAverageType) {
                    // 对于平均值类型：计算每个月份的平均值
                    monthFields.forEach(month => {
                        const monthKey = month.key;
                        let sum = 0;
                        let count = 0;

                        filteredOutputs.forEach(output => {
                            const value = output[monthKey];
                            if (value !== undefined && value !== null && value !== 0) {
                                sum += value;
                                count++;
                            }
                        });

                        if (count > 0) {
                            aggregatedData[monthKey] = sum / count;
                        } else {
                            aggregatedData[monthKey] = 0;
                        }
                    });

                    // 计算年度总计（各月平均值的平均值）
                    const monthlyValues = monthFields
                        .map(month => aggregatedData[month.key])
                        .filter(value => value > 0);
                    
                    if (monthlyValues.length > 0) {
                        const totalSum = monthlyValues.reduce((a, b) => a + b, 0);
                        aggregatedData.total = totalSum / monthlyValues.length;
                    } else {
                        aggregatedData.total = 0;
                    }
                } else {
                    // 对于总和类型：直接累加所有 job code 的值
                    filteredOutputs.forEach(output => {
                        monthFields.forEach(month => {
                            aggregatedData[month.key] += output[month.key] || 0;
                        });
                        aggregatedData.total += output.total || 0;
                    });
                }

                // 格式化数字
                monthFields.forEach(month => {
                    aggregatedData[month.key] = formatNumber(aggregatedData[month.key]);
                });
                aggregatedData.total = formatNumber(aggregatedData.total);
                tableData.push(aggregatedData);
            } else {
                // 普通模式：显示汇总数据或不带 code 的数据
                dataTypeOutputs.forEach(output => {
                    // 在普通模式下，只显示汇总数据或不带 code 的数据
                    if (!output.code || selectedCodes.length === 0) {
                        tableData.push(output);
                    }
                });
            }
        });

        return tableData;
    };

    const generateExcelReport = () => {
        const tableData = prepareTableData();
        if (tableData.length === 0) {
            setErrorMessage('No data to export')
            return
        }

        try {
            const worksheetData = []
            
            // 添加报告标题和筛选信息
            worksheetData.push(['Outputs Report'])
            worksheetData.push([`Year: ${displayYear}`])
            worksheetData.push([`Filtered Job Codes: ${selectedCodes.length > 0 ? selectedCodes.join(', ') : 'All codes selected'}`])
            worksheetData.push([`Comparison Mode: ${comparisonMode ? 'Enabled' : 'Disabled'}`])
            worksheetData.push([])
            
            // 添加标题行
            const headers = ['Data Type', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']
            worksheetData.push(headers)
            
            // 添加数据行
            tableData.forEach(output => {
                const rowData = [
                    output.dataTypeLabel || 'Unknown'
                ]
                
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
                { wch: 25 },
                ...Array(12).fill({ wch: 10 }),
                { wch: 12 }
            ]
            worksheet['!cols'] = colWidths
            
            // 合并标题单元格
            if (!worksheet['!merges']) worksheet['!merges'] = [];
            worksheet['!merges'].push(
                { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
                { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } }
            );
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `Outputs ${displayYear}`)
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            let fileName = `Outputs_Report_${displayYear}`
            if (selectedCodes.length > 0) {
                fileName += `_${selectedCodes.join('_')}`
            }
            if (comparisonMode) {
                fileName += '_comparison'
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

    // 使用 prepareTableData 来获取过滤后的数据
    const tableData = prepareTableData();
    const filteredOutputs = tableData.filter(output => 
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
                            {/* 在比较模式下显示汇总信息 */}
                            {comparisonMode && selectedCodes.length > 0 && (
                                <Badge color="info" className="mt-1">
                                    {selectedCodes.join(' + ')}
                                </Badge>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {[0, 3, 6, 9].map((startIndex) => (
                                <div key={startIndex} className="grid grid-cols-3 gap-2">
                                    {monthFields.slice(startIndex, startIndex + 3).map(month => (
                                        <div key={month.key} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <div className="text-xs text-gray-900 dark:text-gray-400">{month.name}</div>
                                            <div className="font-medium text-sm text-gray-900">{formatDisplayNumber(output[month.key])}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
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
                        disabled={tableData.length === 0}
                    >
                        Report
                    </Button>
                </div>
            </div>

            {/* Job Code 筛选器 */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Filter by Job Code</Label>
                    <div className="flex gap-2">
                        {selectedCodes.length > 0 && (
                            <Button size="xs" color="light" onClick={clearSelectedCodes}>
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedCodes.map(code => {
                        const color = jobCodeColors[code] || { bg: '#6B7280', border: '#6B7280' };
                        return (
                            <Badge 
                                key={code} 
                                color="info" 
                                className="flex items-center gap-1 py-0.5 px-2 text-xs"
                                style={{ backgroundColor: color.bg, borderColor: color.border }}
                            >
                                <div 
                                    className="w-2 h-2 rounded-full bg-white"
                                />
                                {code}
                                <HiX 
                                    className="cursor-pointer text-xs" 
                                    onClick={() => handleCodeSelection(code)} 
                                />
                            </Badge>
                        );
                    })}
                    {selectedCodes.length === 0 && (
                        <span className="text-gray-500 text-xs">All codes selected</span>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                    {availableCodes.map(code => {
                        const color = jobCodeColors[code] || { bg: '#6B7280', border: '#6B7280' };
                        
                        return (
                            <div 
                                key={code}
                                className={`flex items-center p-1 rounded cursor-pointer text-xs ${
                                    selectedCodes.includes(code) 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                                onClick={() => handleCodeSelection(code)}
                            >
                                {/* 颜色标记 */}
                                <div 
                                    className={`w-3 h-3 rounded-sm mr-1 border`}
                                    style={{ 
                                        backgroundColor: color.bg, 
                                        borderColor: color.border 
                                    }}
                                />
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
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    {selectedCodes.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            {comparisonMode ? `Comparing ${selectedCodes.length} Job Codes: ${selectedCodes.join(' + ')}` : `Showing: ${selectedCodes.join(' + ')}`}
                        </div>
                    )}
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
                            Compare selected Job Codes in chart
                        </Label>
                    </div>
                    {comparisonMode && selectedCodes.length < 2 && (
                        <p className="text-xs text-yellow-600 mt-1">
                            Select at least 2 Job Codes for comparison
                        </p>
                    )}
                    {comparisonMode && selectedCodes.length > 8 && (
                        <p className="text-xs text-blue-600 mt-1">
                            Comparing {selectedCodes.length} Job Codes - Chart may take longer to load
                        </p>
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
                    {loadingChart ? (
                        <div className="h-80 flex items-center justify-center">
                            <Spinner size="xl" />
                            <p className="ml-2">Loading chart data... ({selectedCodes.length} Job Codes)</p>
                        </div>
                    ) : chartData ? (
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
                    <p className="mt-2 min-h-screen">Loading outputs...{comparisonMode && ` (${selectedCodes.length} Job Codes)`}</p>
                </div>
            ) : showTable && tableData.length > 0 ? (
                <>
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        // 桌面端：添加水平滚动和小字体
                        <div className="w-full overflow-x-auto">
                            <Table hoverable className="[&_td]:py-1 [&_th]:py-2 [&_td]:text-[10px] [&_th]:text-[10px] min-w-full">
                                <TableHead>
                                    <TableRow>
                                        <TableHeadCell className={`w-40 ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Data Type</TableHeadCell>
                                        {monthFields.map(month => (
                                            <TableHeadCell key={month.key} className={`w-16 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>
                                                {month.name}
                                            </TableHeadCell>
                                        ))}
                                        <TableHeadCell className={`w-20 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentOutputs.map((output, index) => ( 
                                        <TableRow key={output._id || index}> 
                                            <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px]">{output.dataTypeLabel || 'Unknown'}</span>
                                            </TableCell>
                                            {monthFields.map(month => (
                                                <TableCell key={month.key} className={`text-center font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                    <span className="text-[10px]">{formatDisplayNumber(output[month.key])}</span>
                                                </TableCell>
                                            ))}
                                            <TableCell className={`text-center font-semibold ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px] font-bold">{formatDisplayNumber(output.total)}</span>
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