// Schedule.jsx
import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Button, Badge, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react'
import useThemeStore from '../themeStore'

const localizer = momentLocalizer(moment)

const Schedule = () => {
  const { theme } = useThemeStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [currentDate, setCurrentDate] = useState(moment())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showDayEvents, setShowDayEvents] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([]) // 新增：用于桌面端的事件选择

  // 检测屏幕大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      } catch (error) {
        console.error('Error fetching todos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTodos()
  }, [])

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
        cursor: 'pointer' // 添加指针样式表示可点击
      }
    }
  }

  // 桌面端事件点击处理
  const handleSelectEvent = (event) => {
    // 获取同一天的所有事件
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
  const CustomToolbar = ({ onNavigate, date }) => {
    const goToBack = () => {
      onNavigate('PREV')
    }

    const goToNext = () => {
      onNavigate('NEXT')
    }

    const goToCurrent = () => {
      onNavigate('TODAY')
    }

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
                onSelectEvent={handleSelectEvent} // 新增：事件点击处理
                onSelectSlot={handleSelectSlot}   // 新增：日期点击处理
                selectable                         // 新增：启用选择功能
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