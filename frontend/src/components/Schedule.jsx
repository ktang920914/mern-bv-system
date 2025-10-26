// Schedule.jsx
import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Button, Badge, Spinner } from 'flowbite-react'
import useThemeStore from '../themeStore'

const localizer = momentLocalizer(moment)

const Schedule = () => {
  const { theme } = useThemeStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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
          title: `${todo.code} - ${todo.description.substring(0, 20)}${todo.description.length > 20 ? '...' : ''}`,
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

  // 事件样式 - 只根据状态设置颜色
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
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        fontSize: '12px',
        padding: '2px 4px',
        fontWeight: '500'
      }
    }
  }

  // 简化工具栏 - 只保留月份导航
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
          <Button size="sm" onClick={goToBack} color="gray">
            ‹
          </Button>
          <Button size="sm" onClick={goToCurrent} color="gray">
            Today
          </Button>
          <Button size="sm" onClick={goToNext} color="gray">
            ›
          </Button>
        </div>
        
        <div className="flex-1 text-center">
          <span className="text-lg font-semibold">
            {moment(date).format('MMMM YYYY')}
          </span>
        </div>
        
        <div className="w-20"> {/* 占位空间保持对称 */}
        </div>
      </div>
    )
  }

  // 自定义事件组件
  const CustomEvent = ({ event }) => {
    return (
      <div className="text-xs p-1">
        <div className="font-semibold truncate">{event.resource.code}</div>
        <div className="truncate">{event.resource.description}</div>
        <div className="flex justify-center mt-1">
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

  // 简化图例说明
  const EventLegend = () => (
    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded bg-green-500" />
        <span className={`${theme === 'light' ? '' : 'text-gray-900'}`}>Completed</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded bg-red-500" />
        <span className={`${theme === 'light' ? '' : 'text-gray-900'}`}>Incomplete</span>
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
    <div className="min-h-screen p-4">
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
        
        {/* 修复移动端日历容器 */}
        <div 
          style={{ 
            height: '600px',
            // 添加这些样式来修复移动端问题
            overflow: 'hidden',
            position: 'relative'
          }} 
          className={`
            ${theme === 'dark' ? 'text-gray-900' : ''}
            ${isMobile ? 'overflow-x-hidden touch-pan-y' : ''}
          `}
        >
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
            popup
            // 添加移动端优化属性
            style={{
              // 确保日历不会超出容器
              minWidth: isMobile ? '100%' : 'auto',
              // 防止水平滚动
              overflow: 'hidden'
            }}
          />
        </div>

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
      </Card>

      {/* 添加移动端特定的 CSS 修复 */}
      <style jsx>{`
        /* 修复 react-big-calendar 在移动端的响应式问题 */
        @media (max-width: 768px) {
          .rbc-month-view {
            min-width: 100% !important;
            overflow-x: hidden !important;
          }
          
          .rbc-month-header {
            min-width: 100% !important;
          }
          
          .rbc-row-bg {
            min-width: 100% !important;
          }
          
          .rbc-day-bg {
            min-width: calc(100% / 7) !important;
          }
          
          .rbc-header {
            min-width: calc(100% / 7) !important;
            padding: 4px 2px !important;
            font-size: 12px !important;
          }
          
          .rbc-date-cell {
            font-size: 11px !important;
            padding: 2px !important;
          }
          
          .rbc-row-content {
            min-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Schedule