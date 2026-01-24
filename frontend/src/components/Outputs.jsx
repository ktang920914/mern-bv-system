import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput, Badge, Card, ModalFooter } from 'flowbite-react'
import { useEffect } from 'react'
import { useState } from 'react'
import useUserstore from '../store'
import { HiX, HiCheck } from 'react-icons/hi'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs';
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
    
    // 新增 Modal 状态
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [saveStatus, setSaveStatus] = useState('') // 'saving', 'success', 'error'
    const [saveMessage, setSaveMessage] = useState('')
    const [saveDetails, setSaveDetails] = useState({ fileName: '', path: '' })
    const [showConfirmModal, setShowConfirmModal] = useState(false)

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
        window.removeEventListener('resize', handleResize)
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

    // 修改：当 displayYear 变化时，重新获取该年份可用的 Job Codes
    useEffect(() => {
        const fetchAvailableCodes = async () => {
            try {
                // 使用新的 API，并传入当前显示的年份
                const res = await fetch(`/api/analysis/get-codes-by-year?year=${displayYear}`);
                const data = await res.json();
                
                if (res.ok) {
                    // 后端已经返回了去重且排序好的数组，直接使用
                    setAvailableCodes(data);
                }
            } catch (error) {
                console.error('Error fetching job codes:', error);
                // 出错时的默认值
                setAvailableCodes(['L1', 'L2', 'L3', 'L5', 'L6', 'L9', 'L10', 'L11', 'L12']);
            }
        };

        if (displayYear) {
            fetchAvailableCodes();
        }
    }, [displayYear]);

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
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        },
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                    },
                    ticks: {}
                }
            } : undefined
        };

        return { options, data: chartData, plugins };
    };

    // 准备表格数据 - 修复多选 Job Code 不显示的问题
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

            // 只要选择了 Job Code
            if (selectedCodes.length > 0) {
                
                // --- 核心修复点 START ---
                // 普通模式下，后端返回的聚合数据 code 为 null
                // 所以我们必须允许没有 code 的数据通过，或者匹配 code 的数据通过
                const filteredOutputs = dataTypeOutputs.filter(output => {
                    if (comparisonMode) {
                        // 比较模式：必须严格匹配 code
                        return output.code && selectedCodes.includes(output.code);
                    } else {
                        // 普通模式：接受没有 code (后端聚合) 或者 code 匹配 (单选)
                        return !output.code || (output.code && selectedCodes.includes(output.code));
                    }
                });
                // --- 核心修复点 END ---

                if (filteredOutputs.length === 0) {
                    return;
                }

                // 2. 准备汇总数据对象
                const aggregatedData = {
                    dataType,
                    dataTypeLabel,
                    // 显示选中的 codes 供参考
                    code: selectedCodes.join(', '), 
                    total: 0
                };

                // 初始化月份数据
                monthFields.forEach(month => {
                    aggregatedData[month.key] = 0;
                });

                // 3. 计算聚合数据
                if (isAverageType) {
                    // --- 平均值类型 (如 OEE, Availability) ---
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
                    // --- 总和类型 (如 Total Output, Wastage) ---
                    filteredOutputs.forEach(output => {
                        monthFields.forEach(month => {
                            aggregatedData[month.key] += output[month.key] || 0;
                        });
                        aggregatedData.total += output.total || 0;
                    });
                }

                // 4. 格式化数字
                monthFields.forEach(month => {
                    aggregatedData[month.key] = formatNumber(aggregatedData[month.key]);
                });
                aggregatedData.total = formatNumber(aggregatedData.total);
                
                // 将聚合后的一行数据加入表格
                tableData.push(aggregatedData);

            } else {
                // 没有选择 Job Code (显示 Global Total)
                dataTypeOutputs.forEach(output => {
                    if (!output.code) {
                        tableData.push(output);
                    }
                });
            }
        });

        return tableData;
    };

    // 生成Excel报告的函数 - 支持返回blob
    const generateExcelReport = async (returnBlob = false) => {
        const tableData = prepareTableData();
        if (tableData.length === 0) {
            setErrorMessage('No data to export');
            return returnBlob ? null : undefined;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            
            // 使用当前日期作为报告日期
            const reportDate = new Date();
            const dateStr = reportDate.toISOString().split('T')[0];
            const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
            
            const worksheet = workbook.addWorksheet(`Outputs Report ${displayYear}`);
            
            // 设置工作表打印选项
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
                } = options;

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
                };
            };

            // 应用打印设置
            setupWorksheetPrint(worksheet, {
                fitToHeight: 1,
                fitToWidth: 1,
                horizontalCentered: true,
                verticalCentered: false
            });

            // 定义列宽
            const columnWidths = [
                25,    // Data Type
                10,    // Jan
                10,    // Feb
                10,    // Mar
                10,    // Apr
                10,    // May
                10,    // Jun
                10,    // Jul
                10,    // Aug
                10,    // Sep
                10,    // Oct
                10,    // Nov
                10,    // Dec
                12     // Total
            ];

            worksheet.columns = columnWidths.map(width => ({ width }));

            // 定义样式
            const titleFont = { name: 'Arial Black', size: 16, bold: true };
            const headerFont = { name: 'Calibri', size: 11, bold: true };
            const defaultFont = { name: 'Calibri', size: 11 };
            
            // 边框样式
            const borderStyle = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // 对齐方式
            const centerAlignment = { horizontal: 'center', vertical: 'middle' };
            const leftAlignment = { horizontal: 'left', vertical: 'middle' };
            const rightAlignment = { horizontal: 'right', vertical: 'middle' };

            // 标题行
            const titleRow = worksheet.getRow(1);
            titleRow.height = 30;
            titleRow.getCell(1).value = `OUTPUTS REPORT - YEAR ${displayYear}`;
            titleRow.getCell(1).font = titleFont;
            titleRow.getCell(1).alignment = centerAlignment;
            worksheet.mergeCells(1, 1, 1, columnWidths.length);

            // 副标题行
            const subtitleRow = worksheet.getRow(2);
            subtitleRow.height = 20;
            
            let subtitleText = `Generated on: ${reportDate.toLocaleString()}`;
            if (selectedCodes.length > 0) {
                subtitleText += ` | Job Codes: ${selectedCodes.join(', ')}`;
            }
            if (comparisonMode) {
                subtitleText += ' | Comparison Mode';
            }
            
            subtitleRow.getCell(1).value = subtitleText;
            subtitleRow.getCell(1).font = { ...defaultFont, italic: true };
            subtitleRow.getCell(1).alignment = centerAlignment;
            worksheet.mergeCells(2, 1, 2, columnWidths.length);

            // 表头行
            const headerRow = worksheet.getRow(3);
            headerRow.height = 25;
            
            const headers = [
                'Data Type',
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                'Total'
            ];

            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.font = headerFont;
                cell.alignment = centerAlignment;
                cell.border = borderStyle;
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
            });

            // 数据行
            let rowIndex = 4;
            tableData.forEach((output, index) => {
                const row = worksheet.getRow(rowIndex);
                row.height = 20;

                // 准备行数据
                const rowData = [
                    output.dataTypeLabel || 'Unknown'
                ];
                
                // 添加月份数据
                monthFields.forEach(month => {
                    const value = output[month.key] || 0;
                    rowData.push(formatNumber(value));
                });
                
                // 添加总计
                rowData.push(formatNumber(output.total || 0));

                // 填充数据并设置样式
                rowData.forEach((value, colIndex) => {
                    const cell = row.getCell(colIndex + 1);
                    cell.value = value;
                    cell.font = defaultFont;
                    
                    // 设置对齐方式
                    if (colIndex === 0) {
                        cell.alignment = leftAlignment;
                    } else {
                        cell.alignment = rightAlignment;
                    }
                    
                    // 设置边框
                    cell.border = borderStyle;
                    
                    // 为总计列添加特殊背景色
                    if (colIndex === rowData.length - 1) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF2F2F2' }
                        };
                    }
                });

                rowIndex++;
            });

            // 设置自动筛选器
            const autoFilterRange = {
                from: { row: 3, column: 1 },
                to: { row: rowIndex - 1, column: columnWidths.length }
            };
            
            worksheet.autoFilter = autoFilterRange;

            // 添加总计行
            const totalRow = worksheet.getRow(rowIndex);
            totalRow.height = 25;
            
            // 合并单元格用于总计文本
            worksheet.mergeCells(rowIndex, 1, rowIndex, columnWidths.length);
            totalRow.getCell(1).value = `Total Records: ${tableData.length} | Year: ${displayYear}${selectedCodes.length > 0 ? ` | Job Codes: ${selectedCodes.join(', ')}` : ''}`;
            totalRow.getCell(1).font = { ...defaultFont, bold: true };
            totalRow.getCell(1).alignment = centerAlignment;
            
            // 设置总计行背景色
            for (let i = 1; i <= columnWidths.length; i++) {
                const cell = totalRow.getCell(i);
                cell.border = borderStyle;
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9EAD3' }
                };
            }

            // 生成 Excel 文件
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // 生成文件名
            let fileName = `Outputs_Report_${displayYear}`;
            if (selectedCodes.length > 0) {
                const codesStr = selectedCodes.join('_').substring(0, 20);
                fileName += `_${codesStr}`;
            }
            if (comparisonMode) {
                fileName += '_comparison';
            }
            fileName += `_${dateStr}_${timeStr}`;
            
            if (returnBlob) {
                return { blob, fileName: `${fileName}.xlsx` };
            } else {
                saveAs(blob, `${fileName}.xlsx`);
                console.log('Outputs Excel report generated successfully!');
            }

        } catch (error) {
            setErrorMessage('Error generating Excel report: ' + error.message);
            console.error('Excel export error:', error);
            if (returnBlob) {
                throw error;
            }
        }
    };

    // 保存到文件服务器的函数
    const saveToFileServer = async () => {
        try {
            // 显示 Modal 并设置状态为保存中
            setShowSaveModal(true)
            setSaveStatus('saving')
            setSaveMessage('Generating...')
            setSaveDetails({ fileName: '', path: '' })

            // 首先生成 Excel 文件
            const result = await generateExcelReport(true)
            const { blob, fileName } = result

            // 更新状态
            setSaveMessage('Saving...')
            setSaveDetails(prev => ({ ...prev, fileName }))

            // 创建 FormData 对象
            const formData = new FormData()
            formData.append('file', blob, fileName)
            formData.append('fileServerPath', 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)')

            // 发送到后端 API 保存到文件服务器
            const response = await fetch('/api/file/save-excel', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setSaveStatus('success')
                setSaveMessage('Success！')
                setSaveDetails({
                    fileName,
                    path: data.path || 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)'
                })
                
                console.log('File saved to server:', data)
            } else {
                setSaveStatus('error')
                setSaveMessage(`Failed: ${data.message || 'Error'}`)
                setSaveDetails({
                    fileName,
                    path: 'Failed'
                })
            }

        } catch (error) {
            console.error('Error saving to file server:', error)
            setSaveStatus('error')
            setSaveMessage('error')
            setSaveDetails({
                fileName: 'unknown',
                path: 'error'
            })
        }
    }

    // 处理下载到本地
    const handleDownloadReport = async () => {
        try {
            await generateExcelReport(false)
        } catch (error) {
            console.error('Error downloading report:', error)
            alert('Failed to download report. Please try again.')
        }
    }

    // 处理手动下载（当服务器保存失败时）
    const handleManualDownload = () => {
        handleDownloadReport()
        setShowSaveModal(false)
    }

    // 关闭保存 Modal
    const closeSaveModal = () => {
        setShowSaveModal(false)
        setTimeout(() => {
            setSaveStatus('')
            setSaveMessage('')
            setSaveDetails({ fileName: '', path: '' })
        }, 300)
    }

    // 确认保存到服务器
    const confirmSaveToServer = () => {
        setShowConfirmModal(true)
    }

    // 实际执行保存
    const executeSaveToServer = () => {
        setShowConfirmModal(false)
        saveToFileServer()
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
                        onClick={handleDownloadReport}
                        disabled={tableData.length === 0}
                    >
                        Report
                    </Button>
                    {/* 新增 Save to Server 按钮 */}
                    <Button 
                        color='blue' 
                        className='cursor-pointer flex-1 sm:flex-none'
                        onClick={confirmSaveToServer}
                        disabled={tableData.length === 0}
                    >
                        Save
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

            {/* 现有的 Change Year Modal */}
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

            {/* 新增：确认保存 Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} size="md">
                <ModalHeader>Server</ModalHeader>
                <ModalBody>
                    <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300">
                            Are you sure want to save into server?
                        </p>
                        <div className={`p-3 rounded-lg ${
                            theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'border border-gray-600'
                        }`}>
                            <p className={`text-sm font-semibold`}>File path:</p>
                            <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                                Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button className='cursor-pointer' color="gray" onClick={() => setShowConfirmModal(false)}>
                        Cancel
                    </Button>
                    <Button className='cursor-pointer' color="blue" onClick={executeSaveToServer}>
                        Save
                    </Button>
                </ModalFooter>
            </Modal>

            {/* 新增：保存状态 Modal */}
            <Modal show={showSaveModal} onClose={closeSaveModal} size="md">
                <ModalHeader>
                    {saveStatus === 'saving' ? 'Saving...' : 
                     saveStatus === 'success' ? 'Success' : 
                     saveStatus === 'error' ? 'Failed' : 'Saving'}
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        {/* 状态图标 */}
                        <div className="flex justify-center">
                            {saveStatus === 'saving' && (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            )}
                            {saveStatus === 'success' && (
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                            )}
                            {saveStatus === 'error' && (
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                        
                        {/* 消息 */}
                        <p className="text-center text-gray-700 dark:text-gray-300">
                            {saveMessage}
                        </p>
                        
                        {/* 详细信息 */}
                        {saveDetails.fileName && (
                            <div className={`p-3 rounded-lg ${
                                theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'
                            }`}>
                                <p className="text-sm font-semibold">Document information:</p>
                                <p className="text-sm mt-1">
                                    <span className="font-medium">File name:</span> {saveDetails.fileName}
                                </p>
                                {saveDetails.path && (
                                    <p className="text-sm mt-1">
                                        <span className="font-medium">File path:</span> {saveDetails.path}
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* 错误时的额外选项 */}
                        {saveStatus === 'error' && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Failed to save into server, Please save as manual into server
                                </p>
                                <div className="space-y-2">
                                    <Button 
                                        className='cursor-pointer'
                                        fullSized 
                                        color="blue" 
                                        onClick={handleManualDownload}
                                    >
                                        Download manual
                                    </Button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        File path: Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    {saveStatus === 'saving' ? (
                        <Button color="gray" disabled>
                            Please wait...
                        </Button>
                    ) : (
                        <Button 
                            className='cursor-pointer'
                            color='gray' 
                            onClick={closeSaveModal}
                        >
                            Cancel
                        </Button>
                    )}
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default Outputs