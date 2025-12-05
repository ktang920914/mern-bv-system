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
  const [preventiveData, setPreventiveData] = useState([])
  const [calendarYear, setCalendarYear] = useState(moment().year())
  const [parentActivities, setParentActivities] = useState({})

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
    const fetchTodos = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/preventive/getTodos')
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const data = await res.json()
        
        const parentMap = {}
        data.forEach(todo => {
          if (todo.parentTodo) {
            if (!parentMap[todo.parentTodo]) {
              const parent = data.find(d => d._id === todo.parentTodo)
              if (parent) {
                parentMap[todo.parentTodo] = {
                  activity: parent.activity,
                  repeatType: parent.repeatType
                }
              }
            }
          }
        })
        
        setParentActivities(parentMap)
        setPreventiveData(data)
        
        const calendarEvents = data.map(todo => {
          let displayActivity = todo.activity
          if (todo.parentTodo && parentMap[todo.parentTodo]) {
            displayActivity = parentMap[todo.parentTodo].activity
          }
          
          return {
            id: todo._id,
            title: `${todo.code}`,
            start: new Date(todo.date),
            end: new Date(todo.date),
            allDay: true,
            resource: {
              ...todo,
              displayActivity: displayActivity
            }
          }
        })
        
        setEvents(calendarEvents)
      } catch (error) {
        console.error('Error fetching todos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTodos()
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

  const generateScheduleReport = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const reportYear = calendarYear
      const worksheet = workbook.addWorksheet(reportYear.toString())
      
      setupWorksheetPrint(worksheet, {
        fitToHeight: 1,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: false
      })
      
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

      const calibri9Font = { name: 'Calibri', size: 9, bold: true }
      const arialBlack18Font = { name: 'Arial Black', size: 18, bold: true }
      const defaultFont = { name: 'Calibri', size: 11 }
      const headerFont = { name: 'Calibri', size: 9, bold: true }
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      const centerAlignment = { horizontal: 'center', vertical: 'middle' }
      const leftAlignment = { horizontal: 'left', vertical: 'middle' }
      const wrapTextAlignment = { 
        horizontal: 'left', 
        vertical: 'middle',
        wrapText: true
      }
      // 添加wrap text的居中样式
      const wrapTextCenterAlignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      }

      const row1 = worksheet.getRow(1)
      row1.height = 35.2

      row1.getCell(1).value = 'Bold Vision Sdn. Bhd.'
      row1.getCell(1).font = calibri9Font
      row1.getCell(1).alignment = { 
        ...leftAlignment, 
        vertical: 'bottom'
      }
      worksheet.mergeCells(`A1:B1`)

      row1.getCell(3).value = `MASTER SCHEDULE OF MAINTENANCE ACTIVITY YEAR ${reportYear}`
      row1.getCell(3).font = arialBlack18Font
      row1.getCell(3).alignment = centerAlignment
      worksheet.mergeCells(`C1:O1`)

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

      // =================== 修正的数据处理函数 START ===================
      const processDataForExcel = (data, year) => {
        const activityGroups = {}
        
        // 找出所有独立的活动（主任务，不是生成的实例）
        const mainActivities = data.filter(item => !item.isGenerated || item.parentTodo === null)
        
        // 第一步：按活动、重复类型和间隔分组收集所有item codes
        mainActivities.forEach((activity) => {
          const activityName = activity.activity
          const repeatType = activity.repeatType || 'none'
          const repeatInterval = activity.repeatInterval || 1
          const startDate = activity.date ? moment(activity.date) : null
          
          if (!startDate) return
          
          const startYear = startDate.year()
          const startMonth = startDate.month() + 1
          
          if (startYear > year) return
          
          // 使用活动名称、重复类型和间隔作为分组键
          const groupKey = `${activityName}_${repeatType}_${repeatInterval}`
          
          if (!activityGroups[groupKey]) {
            activityGroups[groupKey] = {
              activity: activityName,
              repeatType: repeatType,
              repeatInterval: repeatInterval,
              startYear: startYear,
              startMonth: startMonth,
              itemCodes: new Set(), // 存储该组的所有item codes
              monthsToDisplay: new Set() // 存储需要显示的月份
            }
          }
          
          // 添加item code到集合中
          if (activity.code) {
            activityGroups[groupKey].itemCodes.add(activity.code)
          }
          
          // 计算结束月份
          let endMonth = 12
          if (activity.repeatEndDate) {
            const endDate = moment(activity.repeatEndDate)
            if (endDate.year() < year) return
            if (endDate.year() === year) {
              endMonth = endDate.month() + 1
            }
          }
          
          // 根据重复类型确定哪些月份需要显示
          switch (repeatType) {
            case 'none':
              if (startYear === year) {
                activityGroups[groupKey].monthsToDisplay.add(startMonth)
              }
              break
              
            case 'weekly':
            case 'monthly':
            case 'daily':
              if (startYear <= year) {
                let displayStartMonth = 1
                if (startYear === year) {
                  displayStartMonth = startMonth
                }
                
                for (let month = displayStartMonth; month <= endMonth; month++) {
                  activityGroups[groupKey].monthsToDisplay.add(month)
                }
              }
              break
              
            case 'yearly':
              if (startYear <= year) {
                activityGroups[groupKey].monthsToDisplay.add(startMonth)
              }
              break
              
            case 'custom':
              if (startYear <= year) {
                const customInterval = repeatInterval
                let currentMonth = startMonth
                
                if (startYear < year) {
                  const yearsDiff = year - startYear
                  const monthsDiff = yearsDiff * 12
                  while (currentMonth + customInterval <= startMonth + monthsDiff) {
                    currentMonth += customInterval
                  }
                  while (currentMonth > 12) {
                    currentMonth -= 12
                  }
                }
                
                for (let month = currentMonth; month <= endMonth; month += customInterval) {
                  if (month > 0 && month <= 12) {
                    activityGroups[groupKey].monthsToDisplay.add(month)
                  }
                }
              }
              break
          }
        })
        
        // 第二步：转换为输出格式
        const activitiesArray = []
        Object.values(activityGroups).forEach((group) => {
          if (group.itemCodes.size > 0 && group.monthsToDisplay.size > 0) {
            // 对item codes进行排序
            const sortedCodes = Array.from(group.itemCodes).sort()
            const itemCodesStr = sortedCodes.join(', ')
            
            // 为每个需要显示的月份填充数据
            const monthsData = {}
            Array.from(group.monthsToDisplay).sort((a, b) => a - b).forEach(month => {
              monthsData[month] = itemCodesStr
            })
            
            // 计算频率显示文本
            const getFrequencyText = (type, interval) => {
              switch (type) {
                case 'none': return 'Once'
                case 'daily': return 'Daily'
                case 'weekly': return 'Weekly'
                case 'monthly': return 'Monthly'
                case 'yearly': return 'Yearly'
                case 'custom': return `${interval} Months`
                default: return type
              }
            }
            
            activitiesArray.push({
              activity: group.activity,
              frequency: getFrequencyText(group.repeatType, group.repeatInterval),
              months: monthsData
            })
          }
        })
        
        // 第三步：排序并分配序号
        return activitiesArray
          .sort((a, b) => a.activity.localeCompare(b.activity))
          .map((item, index) => ({
            no: index + 1, // 确保序号是连续的 1, 2, 3...
            ...item
          }))
      }
      // =================== 修正的数据处理函数 END ===================

      const scheduleData = processDataForExcel(preventiveData, reportYear)
      const dataToUse = scheduleData.length > 0 ? scheduleData : []

      let rowIndex = 3
      dataToUse.forEach((item) => {
        const row = worksheet.getRow(rowIndex)
        row.height = 46.8
        
        row.getCell(1).value = item.no
        row.getCell(1).font = defaultFont
        row.getCell(1).alignment = centerAlignment
        row.getCell(1).border = borderStyle

        row.getCell(2).value = item.activity || ''
        row.getCell(2).font = defaultFont
        row.getCell(2).alignment = wrapTextAlignment
        row.getCell(2).border = borderStyle

        row.getCell(3).value = item.frequency || ''
        row.getCell(3).font = defaultFont
        // C列（频率列）设置为自动换行
        row.getCell(3).alignment = wrapTextCenterAlignment
        row.getCell(3).border = borderStyle

        // D-O列（月份列）设置为自动换行
        for (let month = 1; month <= 12; month++) {
          const columnIndex = month + 3
          const monthData = item.months && item.months[month] ? item.months[month] : ''
          row.getCell(columnIndex).value = monthData
          row.getCell(columnIndex).font = defaultFont
          // 使用wrapTextCenterAlignment而不是centerAlignment
          row.getCell(columnIndex).alignment = wrapTextCenterAlignment
          row.getCell(columnIndex).border = borderStyle
        }

        rowIndex++
      })

      // 填充空白行（3-21行）
      while (rowIndex <= 21) {
        const row = worksheet.getRow(rowIndex)
        row.height = 44.1
        
        for (let col = 1; col <= 15; col++) {
          const cell = row.getCell(col)
          if (col === 1) {
            cell.value = rowIndex - 2
            cell.font = defaultFont
            // C列设置为自动换行
            cell.alignment = wrapTextCenterAlignment
          } else if (col === 2) {
            cell.value = ''
            cell.alignment = wrapTextAlignment
          } else if (col >= 3 && col <= 15) {
            cell.value = ''
            // D-O列设置为自动换行
            cell.alignment = wrapTextCenterAlignment
          }
          cell.border = borderStyle
        }
        rowIndex++
      }

      const row22 = worksheet.getRow(22)
      row22.height = 30.9

      row22.getCell(1).value = 'Prepared by :'
      row22.getCell(1).alignment = { 
        horizontal: 'left',
        vertical: 'bottom'
      }
      worksheet.mergeCells(`A22:B22`)

      row22.getCell(12).value = 'Approved by :'
      row22.getCell(12).alignment = {
        horizontal: 'left',
        vertical: 'bottom'
      }
      row22.getCell(12).font = defaultFont

      const row23 = worksheet.getRow(23)
      row23.height = 18.7

      row23.getCell(1).value = 'Date :'
      row23.getCell(1).alignment = leftAlignment
      worksheet.mergeCells(`A23:B23`)

      row23.getCell(12).value = 'Date :'
      row23.getCell(12).alignment = leftAlignment
      row23.getCell(12).font = defaultFont

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

  const goToPrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'))
  }

  const goToNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'))
  }

  const goToToday = () => {
    setCurrentDate(moment())
  }

  const getEventsForDay = (day) => {
    return events.filter(event => 
      moment(event.start).isSame(day, 'day')
    )
  }

  const handleDayClick = (day, dayEvents) => {
    if (dayEvents.length > 0) {
      setSelectedDay({
        date: day,
        events: dayEvents
      })
      setShowDayEvents(true)
    }
  }

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
                  <div><span className="font-medium">Activity:</span> {event.resource.displayActivity}</div>
                </div>
                
                <div className={`grid grid-cols-2 gap-2 text-xs  ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                  <div>
                    <span className="font-medium">Repeat:</span> {event.resource.repeatType === 'none' ? 'No Repeat' : event.resource.repeatType}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {event.resource.isGenerated ? 'Recurring Instance' : 'Main Task'}
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

  const MobileCalendar = () => {
    const generateCalendar = () => {
      const firstDayOfMonth = currentDate.clone().startOf('month')
      const lastDayOfMonth = currentDate.clone().endOf('month')
      
      // 计算日历应该从哪一天开始（当月第一个星期天）
      const startDay = firstDayOfMonth.clone().startOf('week')
      
      // 计算日历应该到哪一天结束（当月最后一个星期六）
      const endDay = lastDayOfMonth.clone().endOf('week')
      
      const calendar = []
      let day = startDay.clone()
      
      // 生成周数
      while (day.isBefore(endDay) || day.isSame(endDay, 'day')) {
        const week = []
        
        // 生成一周的日期
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

    // 验证日期
    const testDate = moment('2025-12-05')
    console.log(`Test: 2025-12-05 is ${testDate.format('dddd')}`)

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <Button size="sm" onClick={goToPrevMonth} color="gray" className="px-2">
                ‹
              </Button>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                  const dayEvents = getEventsForDay(day)

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

        <DayEventsModal />
      </>
    )
  }

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

  const StatsCards = () => {
    const totalTasks = preventiveData.length
    const completedTasks = preventiveData.filter(e => e.status === 'Complete').length

    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalTasks}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Tasks</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {completedTasks}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Completed</div>
        </div>
      </div>
    )
  }

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
          <p className={`${theme === 'light' ? ' text-gray-900' : 'text-gray-300'}`}>
            Showing maintenance schedule for {calendarYear}
          </p>
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
          </>
        )}
        
        <StatsCards />
      </Card>
    </div>
  )
}

export default Schedule