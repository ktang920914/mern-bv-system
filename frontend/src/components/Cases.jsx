import { Button, Label, TextInput, Spinner, Alert, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Pagination, Badge, Card } from 'flowbite-react'
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

const Cases = () => {

    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadingChart, setLoadingChart] = useState(false)
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
    const [selectedCodes, setSelectedCodes] = useState([])
    const [availableCodes, setAvailableCodes] = useState([])
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

    // 获取可用的 Job Code 列表
    useEffect(() => {
        const fetchAvailableCodes = async () => {
            try {
                const res = await fetch('/api/maintenance/getmaintenances');
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

    // 当 selectedCodes 或 comparisonMode 改变时自动更新数据
    useEffect(() => {
        handleUpdateStats(true); // 静默更新
    }, [displayYear, selectedCodes, comparisonMode, dataType]);

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

    // 生成更多颜色用于图表
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
            { bg: 'rgba(241, 196, 15, 0.5)', border: 'rgba(241, 196, 15, 1)' },
            { bg: 'rgba(230, 126, 34, 0.5)', border: 'rgba(230, 126, 34, 1)' },
            { bg: 'rgba(231, 76, 60, 0.5)', border: 'rgba(231, 76, 60, 1)' },
            { bg: 'rgba(52, 152, 219, 0.5)', border: 'rgba(52, 152, 219, 1)' },
            { bg: 'rgba(142, 68, 173, 0.5)', border: 'rgba(142, 68, 173, 1)' }
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

    // 数据获取函数 - 修改为直接调用实时 API
    const handleUpdateStats = async (silent = false) => {
        try {
            if (!silent) {
                setIsUpdating(true);
                setLoading(true);
            }
            setLoadingChart(true);
            setErrorMessage(null);
            setSuccessMessage(null);

            let allCases = [];

            if (comparisonMode && selectedCodes.length > 0) {
                // 比较模式：为每个选中的 Job Code 单独获取数据
                const fetchPromises = selectedCodes.map(async (code) => {
                    try {
                        const params = new URLSearchParams({
                            year: displayYear,
                            code: code
                        });
                        
                        const res = await fetch(`/api/case/getcases?${params}`);
                        if (res.ok) {
                            const data = await res.json();
                            
                            // 处理数据并添加 code 标识
                            return data.map(caseItem => ({
                                ...caseItem,
                                totalCost: formatNumber(caseItem.totalCost),
                                count: formatNumber(caseItem.count),
                                code: code
                            }));
                        }
                    } catch (error) {
                        console.error(`Error fetching data for ${code}:`, error);
                    }
                    return [];
                });
                
                const batchResults = await Promise.all(fetchPromises);
                allCases = batchResults.flat();
            } else {
                // 普通模式：获取汇总数据
                const params = new URLSearchParams({
                    year: displayYear
                });
                
                if (selectedCodes.length > 0) {
                    params.append('codes', selectedCodes.join(','));
                }
                
                const res = await fetch(`/api/case/getcases?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    // 清理数据精度
                    allCases = data.map(caseItem => ({
                        ...caseItem,
                        totalCost: formatNumber(caseItem.totalCost),
                        count: formatNumber(caseItem.count)
                    }));
                }
            }

            setCases(allCases);
            
        } catch (error) {
            setErrorMessage('Error updating statistics: ' + error.message);
        } finally {
            if (!silent) {
                setIsUpdating(false);
                setLoading(false);
            }
            setLoadingChart(false);
        }
    };

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

    // 表格数据准备函数 - 支持比较模式
    const prepareTableData = () => {
        const tableData = []
        
        caseTypes.forEach(type => {
            const row = { type }
            let total = 0
            
            monthFields.forEach(month => {
                let value = 0;
                
                if (comparisonMode && selectedCodes.length > 0) {
                    // 比较模式：计算所有选中 codes 的总和
                    const monthCases = cases.filter(c => 
                        c.type === type && 
                        c.month === month.name && 
                        selectedCodes.includes(c.code)
                    );
                    const sum = monthCases.reduce((acc, curr) => {
                        const currValue = dataType === 'cost' ? curr.totalCost : curr.count;
                        return acc + (currValue || 0);
                    }, 0);
                    value = sum;
                } else {
                    // 普通模式
                    const monthCases = cases.filter(c => 
                        c.type === type && 
                        c.month === month.name
                    );
                    
                    if (monthCases.length > 0) {
                        const sum = monthCases.reduce((acc, curr) => {
                            const currValue = dataType === 'cost' ? curr.totalCost : curr.count;
                            return acc + (currValue || 0);
                        }, 0);
                        value = sum;
                    }
                }
                
                // 确保值是数字
                const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                row[month.key] = formatNumber(numericValue);
                total += numericValue;
            })
            
            // 确保 total 是有效数字
            row.total = formatNumber(total);
            tableData.push(row);
        })
        
        return tableData;
    }

    const tableData = prepareTableData()
    const filteredTableData = tableData.filter(item => 
        item.type.toLowerCase().includes(searchTerm)
    )

    // 图表数据准备函数 - 支持比较模式
    const prepareChartData = () => {
        if (cases.length === 0) return null

        let selectedData;
        
        if (comparisonMode && selectedCodes.length > 0) {
            // 比较模式：过滤出当前 case type 和所有选中 codes 的数据
            selectedData = cases.filter(caseItem => 
                caseItem.type === selectedCaseType && 
                selectedCodes.includes(caseItem.code)
            );
        } else {
            // 普通模式：获取当前 case type 的汇总数据
            selectedData = cases.filter(caseItem => 
                caseItem.type === selectedCaseType
            );
        }

        if (!selectedData || selectedData.length === 0) return null

        const labels = monthFields.map(month => month.name)
        
        // 图表数据
        let chartData;
        
        if (comparisonMode && Array.isArray(selectedData) && selectedData.length > 0) {
            // 比较模式：多个数据集
            const colors = generateColors(selectedCodes.length);
            
            const datasets = selectedCodes.map((code, index) => {
                const codeData = selectedData.filter(item => item.code === code);
                const data = monthFields.map(month => {
                    const monthData = codeData.find(d => d.month === month.name);
                    const value = monthData ? (dataType === 'cost' ? monthData.totalCost : monthData.count) : 0;
                    return formatNumber(value);
                });

                const color = colors[index];

                return {
                    label: `${code} - ${selectedCaseType}`,
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
            // 普通模式：单个数据集
            const data = monthFields.map(month => {
                const monthData = selectedData.find(d => d.month === month.name);
                const value = monthData ? (dataType === 'cost' ? monthData.totalCost : monthData.count) : 0;
                return formatNumber(value);
            });

            chartData = {
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
                        }
                    }
                },
                title: {
                    display: true,
                    text: comparisonMode 
                        ? `${selectedCaseType} ${dataType === 'cost' ? 'Costs' : 'Cases'} Comparison - ${displayYear} (${selectedCodes.length} Job Codes)`
                        : `${selectedCaseType} ${dataType === 'cost' ? 'Costs' : 'Cases'} - ${displayYear}${selectedCodes.length > 0 ? ` (${selectedCodes.join(', ')})` : ''}`,
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
                        text: dataType === 'cost' ? 'Cost Amount' : 'Number of Cases'
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
        }

        return { options, data: chartData, plugins }
    }

    // 添加打印设置函数
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

    // 新的 generateExcelReport 函数（像 cost.jsx 一样）
    const generateExcelReport = async () => {
      try {
        const tableData = prepareTableData();
        
        if (tableData.length === 0) {
          setErrorMessage('No data to export');
          return;
        }

        // 使用 ExcelJS 创建报表
        const workbook = new ExcelJS.Workbook();
        let worksheetName = `Cases ${displayYear}`;
        
        // 简化工作表名称
        if (selectedCodes.length === 0) {
          worksheetName = 'All Job Codes';
        } else if (selectedCodes.length === 1) {
          worksheetName = `Code ${selectedCodes[0]}`;
        } else if (selectedCodes.length > 1) {
          worksheetName = `${selectedCodes.length} Job Codes`;
        }
        
        const worksheet = workbook.addWorksheet(worksheetName);
        
        // 设置打印选项
        setupWorksheetPrint(worksheet, {
          orientation: 'landscape',
          fitToHeight: 1,
          fitToWidth: 1,
          horizontalCentered: true
        });
        
        // 设置列宽
        worksheet.columns = [
          { width: 25 },    // Case Type
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
        ];

        // 定义样式
        const headerFont = { name: 'Calibri', size: 11, bold: true };
        const titleFont = { name: 'Arial Black', size: 16, bold: true };
        const defaultFont = { name: 'Calibri', size: 11 };
        const boldFont = { name: 'Calibri', size: 11, bold: true };
        
        const borderStyle = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        const centerAlignment = { horizontal: 'center', vertical: 'middle' };
        const leftAlignment = { horizontal: 'left', vertical: 'middle' };
        const rightAlignment = { horizontal: 'right', vertical: 'middle' };

        // 添加标题和报告信息
        let titleRow = 1;
        
        // 主标题
        const mainTitleRow = worksheet.getRow(titleRow);
        mainTitleRow.height = 30;
        mainTitleRow.getCell(1).value = `${dataType === 'cost' ? 'CASES COST' : 'CASES COUNT'} MANAGEMENT REPORT`;
        mainTitleRow.getCell(1).font = titleFont;
        mainTitleRow.getCell(1).alignment = centerAlignment;
        worksheet.mergeCells(`A${titleRow}:N${titleRow}`);
        
        titleRow++;
        
        // 年份信息
        const yearRow = worksheet.getRow(titleRow);
        yearRow.height = 22;
        yearRow.getCell(1).value = `Year: ${displayYear}`;
        yearRow.getCell(1).font = boldFont;
        yearRow.getCell(1).alignment = leftAlignment;
        worksheet.mergeCells(`A${titleRow}:N${titleRow}`);
        
        titleRow++;
        
        // 数据模式
        const modeRow = worksheet.getRow(titleRow);
        modeRow.height = 22;
        const modeText = dataType === 'cost' ? 'Cost Mode' : 'Count Mode';
        modeRow.getCell(1).value = `Data Mode: ${modeText}`;
        modeRow.getCell(1).font = boldFont;
        modeRow.getCell(1).alignment = leftAlignment;
        worksheet.mergeCells(`A${titleRow}:N${titleRow}`);
        
        titleRow++;
        
        // 比较模式
        const compModeRow = worksheet.getRow(titleRow);
        compModeRow.height = 22;
        compModeRow.getCell(1).value = `Comparison Mode: ${comparisonMode ? 'Enabled' : 'Disabled'}`;
        compModeRow.getCell(1).font = boldFont;
        compModeRow.getCell(1).alignment = leftAlignment;
        worksheet.mergeCells(`A${titleRow}:N${titleRow}`);
        
        titleRow++;
        
        // Job Code 信息
        const codeRow = worksheet.getRow(titleRow);
        codeRow.height = 22;
        let codeText = '';
        
        if (selectedCodes.length === 0) {
          codeText = 'All Job Codes (All available codes)';
        } else if (selectedCodes.length === 1) {
          codeText = `Job Code: ${selectedCodes[0]}`;
        } else {
          codeText = `Selected Job Codes: ${selectedCodes.join(', ')}`;
        }
        
        codeRow.getCell(1).value = codeText;
        codeRow.getCell(1).font = { ...boldFont, color: { argb: 'FF0000FF' } }; // 蓝色
        codeRow.getCell(1).alignment = leftAlignment;
        worksheet.mergeCells(`A${titleRow}:N${titleRow}`);
        
        titleRow++;
        
        // 空行分隔
        titleRow++;

        // 表头行
        const headerRow = worksheet.getRow(titleRow);
        headerRow.height = 25;
        
        const headers = [
          'Case Type',
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
        
        titleRow++;

        // 准备数据行
        let dataRowIndex = titleRow;
        let monthlyTotals = Array(12).fill(0); // 存储每个月的总计
        let grandTotal = 0;
        
        tableData.forEach((item, index) => {
          const row = worksheet.getRow(dataRowIndex);
          row.height = 20;
          
          const rowData = [item.type];
          
          // 月份数据
          monthFields.forEach((month, monthIndex) => {
            const value = item[month.key] || 0;
            rowData.push(value);
            monthlyTotals[monthIndex] += value;
          });
          
          // 总计
          const total = item.total || 0;
          rowData.push(total);
          grandTotal += total;
          
          // 填充单元格数据
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            
            if (colIndex === 0) {
              // Case Type 列
              cell.value = value;
              cell.font = boldFont;
              cell.alignment = leftAlignment;
              cell.border = borderStyle;
              
              // 隔行着色
              if (index % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8F8F8' }
                };
              }
            } else if (colIndex === 13) {
              // 总计列
              cell.value = Number(value) || 0;
              cell.numFmt = dataType === 'cost' ? '#,##0.00' : '#,##0';
              cell.font = { ...boldFont, color: { argb: 'FF006100' } }; // 深绿色
              cell.alignment = rightAlignment;
              cell.border = borderStyle;
              
              // 根据数据模式设置不同背景色
              const amount = Number(value) || 0;
              if (dataType === 'cost') {
                // 成本模式：为较大金额添加不同背景色
                if (amount > 50000) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC7CE' } // 浅红色
                  };
                } else if (amount > 20000) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFEB9C' } // 浅黄色
                  };
                } else {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE2EFDA' } // 浅绿色
                  };
                }
              } else {
                // 计数模式：为较大数量添加不同背景色
                if (amount > 30) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC7CE' }
                  };
                } else if (amount > 15) {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFEB9C' }
                  };
                } else {
                  cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE2EFDA' }
                  };
                }
              }
            } else {
              // 月份数据列
              cell.value = Number(value) || 0;
              cell.numFmt = dataType === 'cost' ? '#,##0.00' : '#,##0';
              cell.font = defaultFont;
              cell.alignment = rightAlignment;
              cell.border = borderStyle;
              
              // 高亮显示较大数值
              const amount = Number(value) || 0;
              if (dataType === 'cost') {
                if (amount > 10000) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }; // 红色
                } else if (amount > 5000) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } }; // 橙色
                }
              } else {
                if (amount > 10) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } };
                } else if (amount > 5) {
                  cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } };
                }
              }
              
              // 隔行着色
              if (index % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8F8F8' }
                };
              }
            }
          });
          
          dataRowIndex++;
        });

        // 如果没有数据，添加提示行
        if (tableData.length === 0) {
          const row = worksheet.getRow(dataRowIndex);
          row.getCell(1).value = 'No data available for selected criteria';
          worksheet.mergeCells(`A${dataRowIndex}:N${dataRowIndex}`);
          row.getCell(1).alignment = centerAlignment;
          row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } };
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' }
          };
          row.getCell(1).border = borderStyle;
          dataRowIndex++;
        }

        // 添加月度总计行
        const monthlyTotalRow = worksheet.getRow(dataRowIndex);
        monthlyTotalRow.height = 25;
        
        // 总计标题
        monthlyTotalRow.getCell(1).value = 'Monthly Totals';
        monthlyTotalRow.getCell(1).font = { ...boldFont, size: 12 };
        monthlyTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        monthlyTotalRow.getCell(1).border = borderStyle;
        monthlyTotalRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' } // 灰色
        };
        
        // 每月总计数据
        monthlyTotals.forEach((total, index) => {
          const cell = monthlyTotalRow.getCell(index + 2);
          cell.value = Number(total) || 0;
          cell.numFmt = dataType === 'cost' ? '#,##0.00' : '#,##0';
          cell.font = { ...boldFont, size: 11, color: { argb: 'FF000080' } }; // 深蓝色
          cell.alignment = rightAlignment;
          cell.border = borderStyle;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }
          };
        });
        
        // 月度总计的合计
        const monthlyGrandTotalCell = monthlyTotalRow.getCell(14);
        const monthlySum = monthlyTotals.reduce((sum, value) => sum + value, 0);
        monthlyGrandTotalCell.value = monthlySum;
        monthlyGrandTotalCell.numFmt = dataType === 'cost' ? '#,##0.00' : '#,##0';
        monthlyGrandTotalCell.font = { ...boldFont, size: 11, color: { argb: 'FF006100' } }; // 深绿色
        monthlyGrandTotalCell.alignment = rightAlignment;
        monthlyGrandTotalCell.border = borderStyle;
        monthlyGrandTotalCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' } // 浅绿色
        };
        
        dataRowIndex++;

        // 添加总计行
        const grandTotalRow = worksheet.getRow(dataRowIndex);
        grandTotalRow.height = 28;
        
        // 合并单元格显示总计标题
        grandTotalRow.getCell(1).value = 'GRAND TOTAL';
        worksheet.mergeCells(`A${dataRowIndex}:M${dataRowIndex}`);
        grandTotalRow.getCell(1).font = { ...boldFont, size: 13, color: { argb: 'FFFFFFFF' } };
        grandTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        grandTotalRow.getCell(1).border = borderStyle;
        grandTotalRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' } // 蓝色
        };
        
        // 总计数值
        grandTotalRow.getCell(14).value = grandTotal;
        grandTotalRow.getCell(14).numFmt = dataType === 'cost' ? '#,##0.00' : '#,##0';
        grandTotalRow.getCell(14).font = { ...boldFont, size: 13, color: { argb: 'FFFFFFFF' } };
        grandTotalRow.getCell(14).alignment = rightAlignment;
        grandTotalRow.getCell(14).border = borderStyle;
        grandTotalRow.getCell(14).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        
        dataRowIndex++;
        
        // 添加信息行
        const infoRow = worksheet.getRow(dataRowIndex);
        infoRow.height = 20;
        infoRow.getCell(1).value = `Generated on: ${new Date().toLocaleString()}`;
        worksheet.mergeCells(`A${dataRowIndex}:N${dataRowIndex}`);
        infoRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        infoRow.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FF7F7F7F' } };

        // 生成文件名
        let fileName = `${dataType === 'cost' ? 'Cases_Cost' : 'Cases_Count'}_Report_${displayYear}`;
        if (selectedCodes.length === 0) {
          fileName += '_All_Codes';
        } else if (selectedCodes.length === 1) {
          fileName += `_${selectedCodes[0]}`;
        } else {
          fileName += `_${selectedCodes.length}_Codes`;
        }
        if (comparisonMode) {
          fileName += '_Comparison';
        }
        
        // 保存文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, `${fileName}.xlsx`);

      } catch (error) {
        console.error('Error generating Excel report:', error);
        setErrorMessage('Error generating Excel report: ' + error.message);
      }
    };

    // 格式化数字显示
    const formatDisplayNumber = (value) => {
        if (value === undefined || value === null) return '0.00';
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return num.toFixed(2);
    }

    const chartData = prepareChartData()
    const currentItems = filteredTableData.slice(
        (currentPage - 1) * itemsPage, 
        currentPage * itemsPage
    )
    const totalPages = Math.ceil(filteredTableData.length / itemsPage)

    // 移动端简洁分页组件
    const MobileSimplePagination = () => (
        <div className="flex items-center justify-center space-x-4">
            <Button
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="flex items-center"
            >
                <span>‹</span>
                <span className="ml-1">Previous</span>
            </Button>

            <Button
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex items-center"
            >
                <span className="mr-1">Next</span>
                <span>›</span>
            </Button>
        </div>
    )

    // 移动端卡片渲染函数 - 保持不变
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
                        
                        <div className="space-y-3">
                            {[0, 3, 6, 9].map((startIndex) => (
                                <div key={startIndex} className="grid grid-cols-3 gap-2">
                                    {monthFields.slice(startIndex, startIndex + 3).map(month => (
                                        <div key={month.key} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <div className="text-xs text-gray-900 dark:text-gray-400">{month.name}</div>
                                            <div className="font-medium text-sm text-gray-900">
                                                {formatDisplayNumber(item[month.key])}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatDisplayNumber(item.total)}
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
                <h1 className='text-2xl font-semibold hidden sm:inline'>
                    {dataType === 'cost' ? 'Costs' : 'Cases'} {displayYear}
                </h1>
                <div className='flex items-center gap-1'>
                    <TextInput 
                        placeholder='Search case' 
                        onChange={handleSearch}
                    />
                <div className='flex items-center gap-2'>
                    <div>
                            <TextInput
                                type="number"
                                value={displayYear}
                                onChange={handleYearChange}
                                className="w-18"
                            />
                        </div>
                        <Button 
                            className='cursor-pointer hidden sm:block' 
                            onClick={() => handleUpdateStats(false)}
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
            </div>

            {/* Job Code 筛选器 */}
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
                    {loadingChart ? (
                        <div className="h-80 flex items-center justify-center">
                            <Spinner size="xl" />
                            <p className="ml-2">Loading chart data...</p>
                        </div>
                    ) : chartData ? (
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

            {loading ? (
                <div className="flex justify-center my-8">
                    <Spinner size="xl" />
                </div>
            ) : (
                <>
                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        // 桌面端：添加水平滚动和小字体
                        <div className="w-full overflow-x-auto">
                            <Table hoverable className="[&_td]:py-1 [&_th]:py-2 [&_td]:text-[10px] [&_th]:text-[10px] min-w-full">
                                <TableHead>
                                    <TableRow>
                                        <TableHeadCell className={`w-40 ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Case Type</TableHeadCell>
                                        {monthFields.map(month => (
                                            <TableHeadCell className={`w-16 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`} key={month.key}>
                                                {month.name}
                                            </TableHeadCell>
                                        ))}
                                        <TableHeadCell className={`w-20 text-center ${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Total</TableHeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentItems.map((item, index) => ( 
                                        <TableRow key={index}> 
                                            <TableCell className={`font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px]">{item.type}</span>
                                            </TableCell>
                                            {monthFields.map(month => (
                                                <TableCell className={`text-center font-medium ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} key={month.key}>
                                                    <span className="text-[10px]">{formatDisplayNumber(item[month.key])}</span>
                                                </TableCell>
                                            ))}
                                            <TableCell className={`text-center font-semibold ${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                                <span className="text-[10px] font-bold">{formatDisplayNumber(item.total)}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}

            {filteredTableData.length > 0 && (
                <div className="flex-col justify-center text-center mt-4">
                    <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                        Showing {Math.min(filteredTableData.length, (currentPage - 1) * itemsPage + 1)} to {Math.min(currentPage * itemsPage, filteredTableData.length)} of {filteredTableData.length} Entries
                    </p>
                    
                    {isMobile ? (
                        <div className="mt-4">
                            <MobileSimplePagination />
                        </div>
                    ) : (
                        <Pagination
                            showIcons
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default Cases