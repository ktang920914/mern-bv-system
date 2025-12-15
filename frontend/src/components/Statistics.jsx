import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Button, Badge, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react'
import useThemeStore from '../themeStore'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const localizer = momentLocalizer(moment)

const Statistics = () => {
  const { theme } = useThemeStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [currentDate, setCurrentDate] = useState(moment())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showDayEvents, setShowDayEvents] = useState(false)
  const [jobsData, setJobsData] = useState([])
  const [calendarYear, setCalendarYear] = useState(moment().year())
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetails, setShowJobDetails] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setCalendarYear(currentDate.year())
  }, [currentDate])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/analysis/getjobs')
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const data = await res.json()
        
        // 按 starttime 排序（最早的在前）
        const sortedData = data.sort((a, b) => {
          const timeA = a.starttime ? new Date(a.starttime).getTime() : 0
          const timeB = b.starttime ? new Date(b.starttime).getTime() : 0
          return timeA - timeB
        })
        
        setJobsData(sortedData)
        
        // 转换 Job 数据为日历事件
        const calendarEvents = sortedData.map(job => {
          // 处理日期格式
          const startDate = job.starttime ? new Date(job.starttime) : new Date()
          const endDate = job.endtime ? new Date(job.endtime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 默认2小时
          
          // 计算持续时间（小时）
          const duration = (endDate - startDate) / (1000 * 60 * 60)
          
          return {
            id: job._id,
            title: `${job.code} - ${job.lotno}`,
            start: startDate,
            end: endDate,
            allDay: false,
            resource: {
              ...job,
              duration: duration.toFixed(1)
            }
          }
        })
        
        setEvents(calendarEvents)
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchJobs()
  }, [])

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

  const generateJobReport = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const reportYear = calendarYear
      const worksheet = workbook.addWorksheet(`Jobs ${reportYear}`)
      
      setupWorksheetPrint(worksheet, {
        fitToHeight: 1,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: false
      })
      
      // 设置列宽
      worksheet.columns = [
        { width: 5 },    // No.
        { width: 15 },   // Job Code
        { width: 20 },   // Lot No
        { width: 20 },   // Material
        { width: 15 },   // Color Code
        { width: 20 },   // Start Time
        { width: 20 },   // End Time
        { width: 15 },   // Duration (hrs)
        { width: 15 },   // Total Order
        { width: 15 },   // Downtime
        { width: 15 },   // Operating Time
        { width: 15 },   // Prod Lead Time
        { width: 15 },   // Availability
        { width: 15 },   // Performance
        { width: 15 },   // Quality
        { width: 15 },   // OEE
      ]

      const headerFont = { name: 'Calibri', size: 11, bold: true }
      const titleFont = { name: 'Arial Black', size: 16, bold: true }
      const defaultFont = { name: 'Calibri', size: 11 }
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      const centerAlignment = { horizontal: 'center', vertical: 'middle' }
      const leftAlignment = { horizontal: 'left', vertical: 'middle' }

      // 标题行
      const titleRow = worksheet.getRow(1)
      titleRow.height = 30
      titleRow.getCell(1).value = `JOB PRODUCTION SCHEDULE - ${reportYear}`
      titleRow.getCell(1).font = titleFont
      titleRow.getCell(1).alignment = centerAlignment
      worksheet.mergeCells(`A1:P1`)

      // 表头行
      const headerRow = worksheet.getRow(2)
      headerRow.height = 25
      const headers = [
        'No.', 'Job Code', 'Lot No', 'Material', 'Color Code', 
        'Start Time', 'End Time', 'Duration (hrs)', 'Total Order',
        'Downtime', 'Operating Time', 'Prod Lead Time', 'Availability',
        'Performance', 'Quality', 'OEE'
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

      // 过滤当前年份的数据并排序
      const yearJobs = jobsData
        .filter(job => {
          const jobDate = job.starttime ? new Date(job.starttime) : null
          return jobDate && jobDate.getFullYear() === reportYear
        })
        .sort((a, b) => {
          const timeA = a.starttime ? new Date(a.starttime).getTime() : 0
          const timeB = b.starttime ? new Date(b.starttime).getTime() : 0
          return timeB - timeA
        })

      // 数据行
      let rowIndex = 3
      yearJobs.forEach((job, index) => {
        const row = worksheet.getRow(rowIndex)
        row.height = 20
        
        const startTime = job.starttime ? moment(job.starttime).format('YYYY-MM-DD HH:mm') : ''
        const endTime = job.endtime ? moment(job.endtime).format('YYYY-MM-DD HH:mm') : ''
        
        // 计算持续时间
        let duration = 0
        if (job.starttime && job.endtime) {
          const start = moment(job.starttime)
          const end = moment(job.endtime)
          duration = end.diff(start, 'hours', true)
        }

        const rowData = [
          index + 1,
          job.code || '',
          job.lotno || '',
          job.material || '',
          job.colourcode || '',
          startTime,
          endTime,
          duration.toFixed(1),
          job.totalorder || 0,
          job.downtime || 0,
          job.operatingtime || 0,
          job.prodleadtime || 0,
          job.availability ? (job.availability * 100).toFixed(1) + '%' : '0%',
          job.performance ? (job.performance * 100).toFixed(1) + '%' : '0%',
          job.quality ? (job.quality * 100).toFixed(1) + '%' : '0%',
          job.oee ? (job.oee * 100).toFixed(1) + '%' : '0%'
        ]

        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1)
          cell.value = value
          cell.font = defaultFont
          cell.alignment = colIndex >= 5 ? centerAlignment : leftAlignment
          cell.border = borderStyle
        })

        rowIndex++
      })

      // 如果没有数据，添加提示行
      if (yearJobs.length === 0) {
        const row = worksheet.getRow(rowIndex)
        row.getCell(1).value = `No job data for ${reportYear}`
        worksheet.mergeCells(`A${rowIndex}:P${rowIndex}`)
        row.getCell(1).alignment = centerAlignment
        row.getCell(1).font = { ...defaultFont, italic: true }
        rowIndex++
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const date = moment().format('YYYY_MM_DD')
      saveAs(blob, `Job_Production_Schedule_${reportYear}_${date}.xlsx`)

    } catch (error) {
      console.error('Error generating Excel report:', error)
      alert('Failed to generate Excel report. Please try again.')
    }
  }

  const eventStyleGetter = (event) => {
    // 根据 Job Code 分配不同的颜色
    const jobCode = event.resource.code || 'L1'
    const colorMap = {
      'L1': '#3B82F6',  // 蓝色
      'L2': '#10B981',  // 绿色
      'L3': '#8B5CF6',  // 紫色
      'L5': '#F59E0B',  // 黄色
      'L6': '#EF4444',  // 红色
      'L9': '#EC4899',  // 粉色
      'L10': '#06B6D4', // 青色
      'L11': '#84CC16', // 青绿色
      'L12': '#F97316'  // 橙色
    }

    const backgroundColor = colorMap[jobCode] || '#6B7280' // 默认灰色

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        fontSize: '11px',
        padding: '1px 3px',
        fontWeight: '500',
        margin: '1px 0',
        height: '20px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer'
      }
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedJob(event.resource)
    setShowJobDetails(true)
  }

  const handleSelectSlot = (slotInfo) => {
    // 获取当天的事件并按 starttime 排序
    const dayEvents = events
      .filter(event => 
        moment(event.start).isSame(slotInfo.start, 'day')
      )
      .sort((a, b) => {
        const timeA = new Date(a.resource.starttime).getTime()
        const timeB = new Date(b.resource.starttime).getTime()
        return timeB - timeA // 最早的在前
      })
    
    if (dayEvents.length > 0) {
      setSelectedDay({
        date: moment(slotInfo.start),
        events: dayEvents
      })
      setShowDayEvents(true)
    }
  }

  const CustomToolbar = ({ onNavigate, date, label }) => {
    const goToBack = () => {
      onNavigate('PREV')
    }

    const goToNext = () => {
      onNavigate('NEXT')
    }

    const goToCurrent = () => {
      onNavigate('TODAY')
    }

    const goToPrevYear = () => {
      const newDate = moment(date).subtract(1, 'year')
      setCalendarYear(newDate.year())
      setCurrentDate(newDate)
    }

    const goToNextYear = () => {
      const newDate = moment(date).add(1, 'year')
      setCalendarYear(newDate.year())
      setCurrentDate(newDate)
    }

    useEffect(() => {
      setCalendarYear(moment(date).year())
    }, [date])

    return (
      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex space-x-2">
          <Button size="sm" className='cursor-pointer' onClick={goToBack} color="gray">
            ‹
          </Button>
          <Button size="sm" className='cursor-pointer' onClick={goToCurrent} color="gray">
            Today
          </Button>
          <Button size="sm" className='cursor-pointer' onClick={goToNext} color="gray">
            ›
          </Button>
        </div>
        
        <div className="flex-1 text-center">
          <div className="flex justify-center items-center space-x-4">
            <Button size="xs" className='cursor-pointer' onClick={goToPrevYear} color="gray">
              «
            </Button>
            <span className="text-lg font-semibold">
              {moment(date).format('MMMM YYYY')}
            </span>
            <Button size="xs" className='cursor-pointer' onClick={goToNextYear} color="gray">
              »
            </Button>
          </div>
        </div>
        
        <div className="w-20 text-sm font-medium text-blue-600 dark:text-blue-400">
          {calendarYear}
        </div>
      </div>
    )
  }

  const CustomEvent = ({ event }) => {
    const duration = event.resource.duration || 0
    
    return (
      <div className="text-xs p-0.5">
        <div className="font-semibold truncate" title={event.title}>
          {event.resource.code} - {event.resource.lotno}
        </div>
        <div className="text-[10px] opacity-90">
          {duration}h
        </div>
      </div>
    )
  }

  const MobileCalendar = () => {
    const generateCalendar = () => {
      const firstDayOfMonth = currentDate.clone().startOf('month')
      const lastDayOfMonth = currentDate.clone().endOf('month')
      
      const startDay = firstDayOfMonth.clone().startOf('week')
      const endDay = lastDayOfMonth.clone().endOf('week')
      
      const calendar = []
      let day = startDay.clone()
      
      while (day.isBefore(endDay) || day.isSame(endDay, 'day')) {
        const week = []
        
        for (let i = 0; i < 7; i++) {
          week.push(day.clone())
          day = day.add(1, 'day')
        }
        
        calendar.push(week)
      }
      
      return calendar
    }

    const calendar = generateCalendar()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
              {/* 年份切换按钮 - 左侧 */}
              <div className="flex space-x-1">
                <Button size="xs" className='cursor-pointer px-2' onClick={() => {
                  const newDate = currentDate.clone().subtract(1, 'year')
                  setCalendarYear(newDate.year())
                  setCurrentDate(newDate)
                }} color="gray">
                  «
                </Button>
                <Button size="sm" className='cursor-pointer px-2' onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} color="gray">
                  ‹
                </Button>
              </div>
              
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentDate.format('MMMM YYYY')}
                </span>
              </div>
              
              {/* 年份切换按钮 - 右侧 */}
              <div className="flex space-x-1">
                <Button size="sm" className='cursor-pointer px-2' onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} color="gray">
                  ›
                </Button>
                <Button size="xs" className='cursor-pointer px-2' onClick={() => {
                  const newDate = currentDate.clone().add(1, 'year')
                  setCalendarYear(newDate.year())
                  setCurrentDate(newDate)
                }} color="gray">
                  »
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button size="sm" onClick={() => setCurrentDate(moment())} color="blue">
                Today
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            {weekDays.map((day, index) => (
              <div key={index} className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                {day}
              </div>
            ))}
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {calendar.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.month() === currentDate.month()
                  const isToday = day.isSame(moment(), 'day')
                  
                  // 获取当天事件并按 starttime 排序
                  const dayEvents = events
                    .filter(event => 
                      moment(event.start).isSame(day, 'day')
                    )
                    .sort((a, b) => {
                      const timeA = new Date(a.resource.starttime).getTime()
                      const timeB = new Date(b.resource.starttime).getTime()
                      return timeA - timeB
                    })

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`min-h-[80px] p-1 border-r border-gray-200 dark:border-gray-600 relative ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''
                      } ${isToday ? 'bg-blue-50 dark:bg-blue-900' : ''} ${
                        dayIndex === 6 ? 'border-r-0' : ''
                      }`}
                    >
                      <div className={`text-xs text-center mb-1 ${
                        isToday 
                          ? 'font-bold text-blue-600 dark:text-blue-400' 
                          : isCurrentMonth 
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {day.format('D')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => {
                          const jobCode = event.resource.code || 'L1'
                          const colorMap = {
                            'L1': 'bg-blue-500',
                            'L2': 'bg-green-500',
                            'L3': 'bg-purple-500',
                            'L5': 'bg-yellow-500',
                            'L6': 'bg-red-500',
                            'L9': 'bg-pink-500',
                            'L10': 'bg-cyan-500',
                            'L11': 'bg-lime-500',
                            'L12': 'bg-orange-500'
                          }
                          const bgColor = colorMap[jobCode] || 'bg-gray-500'
                          
                          return (
                            <div
                              key={eventIndex}
                              className={`text-[10px] p-1 rounded text-white truncate cursor-pointer ${bgColor}`}
                              title={`${event.resource.code} - ${event.resource.lotno} (${moment(event.resource.starttime).format('HH:mm')})`}
                              onClick={() => handleSelectEvent(event)}
                            >
                              {event.resource.code}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div 
                            className="text-[10px] text-blue-500 text-center bg-blue-50 dark:bg-blue-900 rounded p-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            onClick={() => {
                              if (dayEvents.length > 0) {
                                setSelectedDay({
                                  date: day,
                                  events: dayEvents
                                })
                                setShowDayEvents(true)
                              }
                            }}
                          >
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                      
                      {dayEvents.length > 0 && (
                        <div 
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => {
                            if (dayEvents.length > 0) {
                              setSelectedDay({
                                date: day,
                                events: dayEvents
                              })
                              setShowDayEvents(true)
                            }
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <DayEventsModal />
        <JobDetailsModal />
      </>
    )
  }

  const EventLegend = () => {
    const jobCodes = [...new Set(jobsData.map(job => job.code).filter(Boolean))]
    
    const colorMap = {
      'L1': 'bg-blue-500',
      'L2': 'bg-green-500',
      'L3': 'bg-purple-500',
      'L5': 'bg-yellow-500',
      'L6': 'bg-red-500',
      'L9': 'bg-pink-500',
      'L10': 'bg-cyan-500',
      'L11': 'bg-lime-500',
      'L12': 'bg-orange-500'
    }
    
    return (
      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {jobCodes.map(code => (
          <div key={code} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded ${colorMap[code] || 'bg-gray-500'}`} />
            <span className="text-sm text-gray-700 dark:text-gray-300">{code}</span>
          </div>
        ))}
      </div>
    )
  }

  const StatsCards = () => {
    // 过滤当前年份的数据
    const yearlyData = jobsData.filter(job => {
      const jobDate = job.starttime ? new Date(job.starttime) : null
      return jobDate && jobDate.getFullYear() === calendarYear
    })
    
    // 基础统计
    const totalJobs = yearlyData.length
    const totalDuration = yearlyData.reduce((sum, job) => {
      if (job.starttime && job.endtime) {
        const start = moment(job.starttime)
        const end = moment(job.endtime)
        return sum + end.diff(start, 'hours', true)
      }
      return sum
    }, 0)
    
    const totalOrder = yearlyData.reduce((sum, job) => sum + (Number(job.totalorder) || 0), 0)
    const totalDowntime = yearlyData.reduce((sum, job) => sum + (Number(job.downtime) || 0), 0)
    
    // 性能指标平均
    const avgAvailability = yearlyData.length > 0 
      ? yearlyData.reduce((sum, job) => sum + (Number(job.availability) || 0), 0) / yearlyData.length
      : 0
    
    const avgPerformance = yearlyData.length > 0
      ? yearlyData.reduce((sum, job) => sum + (Number(job.performance) || 0), 0) / yearlyData.length
      : 0
    
    const avgQuality = yearlyData.length > 0
      ? yearlyData.reduce((sum, job) => sum + (Number(job.quality) || 0), 0) / yearlyData.length
      : 0
    
    const avgOEE = yearlyData.length > 0
      ? yearlyData.reduce((sum, job) => sum + (Number(job.oee) || 0), 0) / yearlyData.length
      : 0

    // 按 Job Code 分组统计
    const jobsByCode = {}
    yearlyData.forEach(job => {
      const code = job.code || 'Unknown'
      if (!jobsByCode[code]) {
        jobsByCode[code] = {
          count: 0,
          totalOrder: 0,
          totalDuration: 0
        }
      }
      jobsByCode[code].count++
      jobsByCode[code].totalOrder += Number(job.totalorder) || 0
      
      if (job.starttime && job.endtime) {
        const start = moment(job.starttime)
        const end = moment(job.endtime)
        jobsByCode[code].totalDuration += end.diff(start, 'hours', true)
      }
    })

    // 最忙的 Job Code
    let busiestCode = 'N/A'
    let maxJobs = 0
    Object.entries(jobsByCode).forEach(([code, data]) => {
      if (data.count > maxJobs) {
        maxJobs = data.count
        busiestCode = code
      }
    })

    return (
      <div className="mt-4">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Production Statistics for {calendarYear}</h3>
          <Badge color="blue" size="sm">
            Year {calendarYear}
          </Badge>
        </div>
        
        {/* 基础统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalJobs}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Jobs</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {busiestCode} ({maxJobs} jobs)
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalDuration.toFixed(1)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Hours</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Avg: {(totalDuration / totalJobs).toFixed(1)}h/job
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalOrder.toLocaleString()}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Order</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Avg: {totalJobs > 0 ? Math.round(totalOrder / totalJobs) : 0}/job
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {totalDowntime.toFixed(1)}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">Downtime (mins)</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Avg: {(totalDowntime / totalJobs).toFixed(1)}m/job
            </div>
          </div>
        </div>
        
        {/* 性能指标卡片 */}
        <div className="mb-2 flex justify-between items-center">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">Performance Metrics</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {(avgAvailability * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Availability</div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${avgAvailability * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {(avgPerformance * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Performance</div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${avgPerformance * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {(avgQuality * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Quality</div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${avgQuality * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {(avgOEE * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">OEE</div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-yellow-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${avgOEE * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Job Code 分布 */}
        {Object.keys(jobsByCode).length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Jobs by Code</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(jobsByCode).map(([code, data]) => {
                const percentage = (data.count / totalJobs * 100).toFixed(1)
                const colorMap = {
                  'L1': 'border-blue-500 bg-blue-50 dark:bg-blue-900',
                  'L2': 'border-green-500 bg-green-50 dark:bg-green-900',
                  'L3': 'border-purple-500 bg-purple-50 dark:bg-purple-900',
                  'L5': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900',
                  'L6': 'border-red-500 bg-red-50 dark:bg-red-900',
                  'L9': 'border-pink-500 bg-pink-50 dark:bg-pink-900',
                  'L10': 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900',
                  'L11': 'border-lime-500 bg-lime-50 dark:bg-lime-900',
                  'L12': 'border-orange-500 bg-orange-50 dark:bg-orange-900'
                }
                const bgClass = colorMap[code] || 'border-gray-500 bg-gray-50 dark:bg-gray-900'
                
                return (
                  <div 
                    key={code} 
                    className={`p-3 rounded-lg border-l-4 ${bgClass}`}
                  >
                    <div className="text-lg font-bold">{code}</div>
                    <div className="text-sm">{data.count} jobs</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {percentage}% • {data.totalDuration.toFixed(1)}h
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const DayEventsModal = () => {
    if (!selectedDay) return null

    // 确保事件按 starttime 排序
    const sortedEvents = [...selectedDay.events].sort((a, b) => {
      const timeA = new Date(a.resource.starttime).getTime()
      const timeB = new Date(b.resource.starttime).getTime()
      return timeA - timeB
    })

    return (
      <Modal show={showDayEvents} onClose={() => setShowDayEvents(false)} size="md">
        <ModalHeader>
          Jobs on {selectedDay.date.format('MMMM D, YYYY')}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedEvents.map((event, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  theme === 'light' 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-sm">
                      {index + 1}. {event.resource.code} - {event.resource.lotno}
                    </div>
                    <div className={`text-xs mt-1 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                      Start: {moment(event.resource.starttime).format('HH:mm')} 
                      {event.resource.endtime && 
                        ` → End: ${moment(event.resource.endtime).format('HH:mm')}`
                      }
                    </div>
                  </div>
                  <Badge 
                    color="info"
                    size="sm"
                  >
                    {event.resource.duration || 0}h
                  </Badge>
                </div>
                
                <div className={`grid grid-cols-2 gap-2 text-xs mb-2 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                  <div>
                    <span className="font-medium">Time:</span> 
                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">Order:</span> {event.resource.totalorder}
                  </div>
                </div>
                
                <div className={`text-xs ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                  <div>
                    <span className="font-medium">Material:</span> {event.resource.material}
                  </div>
                  <div>
                    <span className="font-medium">Color Code:</span> {event.resource.colourcode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" className='cursor-pointer' onClick={() => setShowDayEvents(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  const JobDetailsModal = () => {
    if (!selectedJob) return null

    return (
      <Modal show={showJobDetails} onClose={() => setShowJobDetails(false)} size="lg">
        <ModalHeader>
          Job Details - {selectedJob.code} / {selectedJob.lotno}
        </ModalHeader>
        <ModalBody>
          <div className={`space-y-4 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Production Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Code:</span> {selectedJob.code}</div>
                  <div><span className="font-medium">Lot No:</span> {selectedJob.lotno}</div>
                  <div><span className="font-medium">Material:</span> {selectedJob.material}</div>
                  <div><span className="font-medium">Color Code:</span> {selectedJob.colourcode}</div>
                  <div><span className="font-medium">Total Order:</span> {selectedJob.totalorder}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Time Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Start:</span> {selectedJob.starttime}</div>
                  <div><span className="font-medium">End:</span> {selectedJob.endtime}</div>
                  <div><span className="font-medium">Order Date:</span> {selectedJob.orderdate}</div>
                  <div><span className="font-medium">Duration:</span> {selectedJob.duration || 0} hours</div>
                  <div><span className="font-medium">Prod Lead Time:</span> {selectedJob.prodleadtime || 0} days</div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedJob.availability ? (selectedJob.availability * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Availability</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedJob.performance ? (selectedJob.performance * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Performance</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedJob.quality ? (selectedJob.quality * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Quality</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {selectedJob.oee ? (selectedJob.oee * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">OEE</div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Additional Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Downtime:</span> {selectedJob.downtime || 0} mins
                </div>
                <div>
                  <span className="font-medium">Operating Time:</span> {selectedJob.operatingtime || 0} mins
                </div>
                <div>
                  <span className="font-medium">ARR:</span> {selectedJob.arr || 0}
                </div>
                <div>
                  <span className="font-medium">Wastage:</span> {selectedJob.wastage || 0}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" className='cursor-pointer' onClick={() => setShowJobDetails(false)}>
            Close
          </Button>
          <Button 
            color="blue" 
            className='cursor-pointer'
            onClick={() => window.location.href = '/?tab=Jobs'}
          >
            Go to Jobs
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading production schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Production Statistics</h1>
          <p className={`${theme === 'light' ? ' text-gray-900' : 'text-gray-300'}`}>
            Showing production schedule and statistics for {calendarYear}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => window.location.href = '/?tab=Jobs'}
            color="blue"
            className='cursor-pointer'
          >
            Go to Jobs
          </Button>
          <Button 
            onClick={generateJobReport}
            color="green"
            className='cursor-pointer'
          >
            Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <EventLegend />
        
        {isMobile ? (
          <MobileCalendar />
        ) : (
          <>
            <div style={{ height: '600px' }} className={theme === 'dark' ? 'text-gray-900' : ''}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                views={['month']}
                defaultView="month"
                date={currentDate.toDate()}
                onNavigate={(newDate) => {
                  setCurrentDate(moment(newDate))
                }}
                components={{
                  toolbar: CustomToolbar,
                  event: CustomEvent
                }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                popup
              />
            </div>
            
            <DayEventsModal />
            <JobDetailsModal />
          </>
        )}
        
        <StatsCards />
      </Card>
    </div>
  )
}

export default Statistics