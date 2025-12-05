// Schedule.jsx
import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Button, Badge, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react'
import useThemeStore from '../themeStore'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const localizer = momentLocalizer(moment)

const Schedule = () => {
  const { theme } = useThemeStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [currentDate, setCurrentDate] = useState(moment())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showDayEvents, setShowDayEvents] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [preventiveData, setPreventiveData] = useState([])
  const [calendarYear, setCalendarYear] = useState(moment().year()) // 新增：跟踪日历显示的年份

  // 检测屏幕大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 当 currentDate 变化时更新 calendarYear（移动端）
  useEffect(() => {
    setCalendarYear(currentDate.year())
  }, [currentDate])

  // 获取 Todo 数据
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/preventive/getTodos')
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const data = await res.json()
        
        // 将 todos 转换为日历事件
        const calendarEvents = data.map(todo => ({
          id: todo._id,
          title: `${todo.code}`,
          start: new Date(todo.date),
          end: new Date(todo.date),
          allDay: true,
          resource: todo
        }))
        
        setEvents(calendarEvents)
        setPreventiveData(data)
      } catch (error) {
        console.error('Error fetching todos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTodos()
  }, [])

  // 页面设置辅助函数
  const setupWorksheetPrint = (worksheet, options = {}) => {
    const {
      paperSize = 9, // A4
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

  // 生成Excel维护计划报告
  const generateScheduleReport = async () => {
    try {
      // 创建工作簿
      const workbook = new ExcelJS.Workbook()
      
      // 使用日历显示的年份
      const reportYear = calendarYear
      
      // 创建工作表 - 只创建当前年份
      const worksheet = workbook.addWorksheet(reportYear.toString())
      
      // 设置页面打印属性
      setupWorksheetPrint(worksheet, {
        fitToHeight: 1,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: false
      })
      
      // 设置精确的列宽（移除了PQR列）
      worksheet.columns = [
        { width: 5.45 },   // A列
        { width: 42.89 },  // B列
        { width: 12.1 },   // C列
        { width: 11.45 },  // D列 (JAN)
        { width: 11.45 },  // E列 (FEB)
        { width: 11.45 },  // F列 (MAR)
        { width: 11.45 },  // G列 (APR)
        { width: 11.45 },  // H列 (MAY)
        { width: 11.45 },  // I列 (JUN)
        { width: 11.45 },  // J列 (JUL)
        { width: 11.45 },  // K列 (AUG)
        { width: 11.45 },  // L列 (SEP)
        { width: 11.45 },  // M列 (OCT)
        { width: 11.45 },  // N列 (NOV)
        { width: 11.45 }   // O列 (DEC)
      ]

      // 定义样式
      const calibri9Font = { name: 'Calibri', size: 9, bold: true }
      const arialBlack18Font = { name: 'Arial Black', size: 18, bold: true }
      const defaultFont = { name: 'Calibri', size: 9 }
      const headerFont = { name: 'Calibri', size: 9, bold: true }
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      // 定义对齐方式
      const centerAlignment = { horizontal: 'center', vertical: 'middle' }
      const leftAlignment = { horizontal: 'left', vertical: 'middle' }
      const wrapTextAlignment = { 
        horizontal: 'left', 
        vertical: 'middle',
        wrapText: true  // 添加文字换行属性
      }

      // 第1行: 公司名称和标题
      const row1 = worksheet.getRow(1)
      row1.height = 35.2

      // A-B合并: Bold Vision Sdn Bhd (Calibri 9, Bold) - 底部对齐
      row1.getCell(1).value = 'Bold Vision Sdn. Bhd.'
      row1.getCell(1).font = calibri9Font
      row1.getCell(1).alignment = { 
        ...leftAlignment, 
        vertical: 'bottom'  // 添加底部对齐
      }
      worksheet.mergeCells(`A1:B1`)

      // C-O合并: 标题 (Arial Black 18, Bold)
      row1.getCell(3).value = `MASTER SCHEDULE OF MAINTENANCE ACTIVITY YEAR ${reportYear}`
      row1.getCell(3).font = arialBlack18Font
      row1.getCell(3).alignment = centerAlignment
      worksheet.mergeCells(`C1:O1`)

      // 第2行: 表头
      const row2 = worksheet.getRow(2)
      row2.height = 22.5
      const headers = ['No.', 'Activity', 'Frequency', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      headers.forEach((header, index) => {
        const cell = row2.getCell(index + 1)
        cell.value = header
        cell.font = headerFont
        cell.alignment = centerAlignment
        cell.border = borderStyle
      })

      // 获取数据（使用实际数据）
      const scheduleData = processPreventiveData(preventiveData, reportYear)

      // 如果没有数据，创建一个空数组
      const dataToUse = scheduleData.length > 0 ? scheduleData : []

      // 填充数据行 (row3到row21的行高为39.8)
      let rowIndex = 3  // 从第3行开始
      dataToUse.forEach((item, index) => {
        const row = worksheet.getRow(rowIndex)
        row.height = 46.8  // 设置行高为46.8（原39.8）
        
        // No. (A列)
        row.getCell(1).value = item.no || index + 1
        row.getCell(1).font = defaultFont
        row.getCell(1).alignment = centerAlignment
        row.getCell(1).border = borderStyle

        // Activity (B列) - 设置文字换行
        row.getCell(2).value = item.activity || ''
        row.getCell(2).font = defaultFont
        row.getCell(2).alignment = wrapTextAlignment  // 使用文字换行对齐方式
        row.getCell(2).border = borderStyle

        // Frequency (C列) - 居中对齐
        row.getCell(3).value = item.frequency || ''
        row.getCell(3).font = defaultFont
        row.getCell(3).alignment = centerAlignment
        row.getCell(3).border = borderStyle

        // 月份数据 (D-O列, JAN-DEC) - 所有月份列都居中对齐
        for (let month = 1; month <= 12; month++) {
          const columnIndex = month + 3 // D=4 (JAN), E=5 (FEB), etc.
          const monthData = item.months && item.months[month] ? item.months[month] : ''
          row.getCell(columnIndex).value = monthData
          row.getCell(columnIndex).font = defaultFont
          row.getCell(columnIndex).alignment = centerAlignment  // 月份列居中对齐
          row.getCell(columnIndex).border = borderStyle
        }

        rowIndex++
      })

      // 如果数据行数少于19行（row3到row21是19行），填充剩余行
      while (rowIndex <= 21) {
        const row = worksheet.getRow(rowIndex)
        row.height = 44.1  // 设置行高为44.1
        
        // 填充所有列（1-15列，移除了PQR列）
        for (let col = 1; col <= 15; col++) {
          const cell = row.getCell(col)
          if (col === 1) {
            cell.value = rowIndex - 2 // No.列填充序号
            cell.font = defaultFont
            cell.alignment = centerAlignment
          } else if (col === 2) {
            // B列: 设置文字换行
            cell.value = '' // 其他列为空
            cell.alignment = wrapTextAlignment
          } else if (col >= 3 && col <= 15) {
            // C列到O列: 居中对齐
            cell.value = '' // 其他列为空
            cell.alignment = centerAlignment
          }
          cell.border = borderStyle
        }
        rowIndex++
      }

      // 第22行: 批准人信息
      const row22 = worksheet.getRow(22)
      row22.height = 30.9

      // A-B合并：Prepared by :
      row22.getCell(1).value = 'Prepared by :'
      row22.getCell(1).alignment = { 
        horizontal: 'left',
        vertical: 'bottom'
      }
      worksheet.mergeCells(`A22:B22`)

      // L列：Approved by:
      row22.getCell(12).value = 'Approved by :'  // L列是第12列
      row22.getCell(12).alignment = {
        horizontal: 'left',
        vertical: 'bottom'
      }
      row22.getCell(12).font = defaultFont

      // 第23行: 最后一行 - Date签名
      const row23 = worksheet.getRow(23)
      row23.height = 18.7

      // A-B合并：Date :
      row23.getCell(1).value = 'Date :'
      row23.getCell(1).alignment = leftAlignment
      worksheet.mergeCells(`A23:B23`)

      // L列：Date :
      row23.getCell(12).value = 'Date :'  // L列是第12列
      row23.getCell(12).alignment = leftAlignment
      row23.getCell(12).font = defaultFont

      // 生成Excel文件并下载
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const date = moment().format('YYYY_MM_DD')
      saveAs(blob, `Maintenance_Schedule_${reportYear}_${date}.xlsx`)

    } catch (error) {
      console.error('Error generating Excel report:', error)
      alert('Failed to generate Excel report. Please try again.')
    }
  }

  // 处理预防性维护数据的函数
  const processPreventiveData = (data, year) => {
    // 按活动和频率分组
    const activitiesMap = {}
    
    data.forEach((item, index) => {
      if (!item.date) return
      
      const itemYear = moment(item.date).year()
      if (itemYear !== year) return
      
      const activity = item.activity || 'Uncategorized'
      const frequency = item.repeatType || 'Once'
      
      const key = `${activity}-${frequency}`
      if (!activitiesMap[key]) {
        activitiesMap[key] = {
          activity,
          frequency,
          months: {}
        }
      }
      
      const month = moment(item.date).month() + 1
      if (item.code) {
        if (!activitiesMap[key].months[month]) {
          activitiesMap[key].months[month] = []
        }
        activitiesMap[key].months[month].push(item.code)
      }
    })
    
    // 转换为需要的格式
    return Object.values(activitiesMap).map((item, index) => ({
      no: index + 1,
      activity: item.activity,
      frequency: item.frequency,
      months: Object.keys(item.months).reduce((acc, month) => {
        acc[month] = item.months[month].join(', ')
        return acc
      }, {})
    }))
  }

  // 桌面端事件样式
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3B82F6'
    
    if (event.resource.status === 'Complete') {
      backgroundColor = '#10B981'
    } else if (event.resource.status === 'Incomplete') {
      backgroundColor = '#EF4444'
    }

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

  // 桌面端事件点击处理
  const handleSelectEvent = (event) => {
    const dayEvents = events.filter(e => 
      moment(e.start).isSame(event.start, 'day')
    )
    
    setSelectedDay({
      date: moment(event.start),
      events: dayEvents
    })
    setShowDayEvents(true)
  }

  // 桌面端日期点击处理（点击空白区域）
  const handleSelectSlot = (slotInfo) => {
    const dayEvents = events.filter(event => 
      moment(event.start).isSame(slotInfo.start, 'day')
    )
    
    if (dayEvents.length > 0) {
      setSelectedDay({
        date: moment(slotInfo.start),
        events: dayEvents
      })
      setShowDayEvents(true)
    }
  }

  // 桌面端工具栏
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

    // 当月份变化时更新年份
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
          <span className="text-lg font-semibold">
            {moment(date).format('MMMM YYYY')}
          </span>
        </div>
        
        <div className="w-20">
        </div>
      </div>
    )
  }

  // 桌面端自定义事件组件 - 简化显示
  const CustomEvent = ({ event }) => {
    return (
      <div className="text-xs p-0.5">
        <div className="font-semibold truncate" title={event.resource.code}>
          {event.resource.code}
        </div>
        <div className="flex justify-center mt-0.5">
          <Badge 
            color={event.resource.status === 'Complete' ? 'success' : 'failure'}
            size="xs"
          >
            {event.resource.status}
          </Badge>
        </div>
      </div>
    )
  }

  // 移动端日历导航
  const goToPrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'))
  }

  const goToNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'))
  }

  const goToToday = () => {
    setCurrentDate(moment())
  }

  // 生成移动端日历数据
  const generateCalendar = () => {
    const startDay = currentDate.clone().startOf('month').startOf('week')
    const endDay = currentDate.clone().endOf('month').endOf('week')
    const calendar = []
    const day = startDay.clone()

    while (day.isBefore(endDay, 'day')) {
      calendar.push(
        Array(7)
          .fill(0)
          .map(() => day.add(1, 'day').clone())
      )
    }

    return calendar
  }

  // 获取某一天的事件
  const getEventsForDay = (day) => {
    return events.filter(event => 
      moment(event.start).isSame(day, 'day')
    )
  }

  // 处理移动端日期点击事件
  const handleDayClick = (day, dayEvents) => {
    if (dayEvents.length > 0) {
      setSelectedDay({
        date: day,
        events: dayEvents
      })
      setShowDayEvents(true)
    }
  }

  // 通用的事件详情模态框（桌面端和移动端共用）
  const DayEventsModal = () => {
    if (!selectedDay) return null

    return (
      <Modal show={showDayEvents} onClose={() => setShowDayEvents(false)} size="md">
        <ModalHeader>
          {selectedDay.date.format('MMMM D, YYYY')}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedDay.events.map((event, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  theme === 'light' 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">{event.resource.code}</div>
                  <Badge 
                    color={event.resource.status === 'Complete' ? 'success' : 'failure'}
                    size="sm"
                  >
                    {event.resource.status}
                  </Badge>
                </div>
                
                <div className={`text-xs ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                  <div><span className="font-medium">Activity:</span> {event.resource.activity}</div>
                </div>
                
                <div className={`grid grid-cols-2 gap-2 text-xs  ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                  <div>
                    <span className="font-medium">Repeat:</span> {event.resource.repeatType === 'none' ? 'No Repeat' : event.resource.repeatType}
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

  // 移动端自定义日历组件
  const MobileCalendar = () => {
    const calendar = generateCalendar()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 日历头部 */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <Button size="sm" onClick={goToPrevMonth} color="gray" className="px-2">
                ‹
              </Button>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-900">
                  {currentDate.format('MMMM YYYY')}
                </span>
              </div>
              <Button size="sm" onClick={goToNextMonth} color="gray" className="px-2">
                ›
              </Button>
            </div>
            <div className="flex justify-center">
              <Button size="sm" onClick={goToToday} color="blue" className="px-3">
                Today
              </Button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                {day}
              </div>
            ))}
          </div>

          {/* 日历内容 */}
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {calendar.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.month() === currentDate.month()
                  const isToday = day.isSame(moment(), 'day')
                  const dayEvents = getEventsForDay(day)

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[80px] p-1 border-r border-gray-200 dark:border-gray-600 relative ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''
                      } ${isToday ? 'bg-blue-50 dark:bg-blue-900' : ''} ${
                        dayIndex === 6 ? 'border-r-0' : ''
                      }`}
                    >
                      <div className={`text-xs text-center mb-1 ${
                        isToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {day.format('D')}
                      </div>
                      
                      {/* 事件列表 */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`text-[10px] p-1 rounded text-white truncate cursor-pointer ${
                              event.resource.status === 'Complete' 
                                ? 'bg-green-500' 
                                : event.resource.status === 'Incomplete'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            title={event.resource.code}
                            onClick={() => handleDayClick(day, dayEvents)}
                          >
                            {event.resource.code}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div 
                            className="text-[10px] text-blue-500 text-center bg-blue-50 dark:bg-blue-900 rounded p-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            onClick={() => handleDayClick(day, dayEvents)}
                          >
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                      
                      {/* 透明点击层 - 点击单元格任意位置打开模态框 */}
                      {dayEvents.length > 0 && (
                        <div 
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => handleDayClick(day, dayEvents)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 事件详情模态框 */}
        <DayEventsModal />
      </>
    )
  }

  // 简化图例说明
  const EventLegend = () => (
    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded bg-green-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded bg-red-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Incomplete</span>
      </div>
    </div>
  )

  // 统计信息卡片
  const StatsCards = () => (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {events.length}
        </div>
        <div className="text-sm text-blue-600 dark:text-blue-400">Total Tasks</div>
      </div>
      <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {events.filter(e => e.resource.status === 'Complete').length}
        </div>
        <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => window.location.href = '/?tab=ToDoListPreventive'}
            color="blue"
            className='cursor-pointer'
          >
            Go Todos
          </Button>
          <Button 
            onClick={generateScheduleReport}
            color="green"
            className='cursor-pointer'
          >
            Schedule Report
          </Button>
        </div>
      </div>

      <Card>
        <EventLegend />
        
        {/* 内容区域 */}
        {isMobile ? (
          // 移动端：只显示自定义日历
          <MobileCalendar />
        ) : (
          // 桌面端：显示 react-big-calendar
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
            
            {/* 桌面端也使用同一个 Modal */}
            <DayEventsModal />
          </>
        )}
        
        {/* 统计信息 - 移动端和桌面端都显示 */}
        <StatsCards />
      </Card>
    </div>
  )
}

export default Schedule