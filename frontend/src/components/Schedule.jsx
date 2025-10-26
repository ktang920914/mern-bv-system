// Schedule.jsx
import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Button, Badge, Spinner, Popover, Pagination } from 'flowbite-react'
import useThemeStore from '../themeStore'
import { useSearchParams } from 'react-router-dom'

const localizer = momentLocalizer(moment)

const Schedule = () => {
  const { theme } = useThemeStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [itemsPage] = useState(10)

  // 检测屏幕大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 当页码变化时更新 URL - 只在移动端需要
  useEffect(() => {
    // 只有在移动端卡片视图才需要分页URL
    if (isMobile) {
      const params = new URLSearchParams(searchParams)
      
      if (currentPage === 1) {
        params.delete('page')
      } else {
        params.set('page', currentPage.toString())
      }
      
      setSearchParams(params)
    }
  }, [currentPage, searchParams, setSearchParams, isMobile])

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

  // 移动端卡片组件 - 模仿 Jobs 页面的样式
  const ScheduleCard = ({ todo }) => (
    <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
      theme === 'light' 
        ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
    }`}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">Date</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.date}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Item</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.code}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Section</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.section}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Status</p>
          <Badge 
            color={todo.status === 'Complete' ? 'success' : 'failure'}
            size="sm"
          >
            {todo.status}
          </Badge>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Description</p>
        <Popover 
          className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
          content={
            <div className="p-3 max-w-xs">
              <p className="font-semibold text-sm">Full Description:</p>
              <p className="text-xs mb-2">{todo.description}</p>
              <p className="font-semibold text-sm">I/M:</p>
              <p className="text-xs mb-2">{todo.im}</p>
              <p className="font-semibold text-sm">Check Point:</p>
              <p className="text-xs mb-2">{todo.checkpoint}</p>
              <p className="font-semibold text-sm">Tools:</p>
              <p className="text-xs mb-2">{todo.tool}</p>
              <p className="font-semibold text-sm">Reaction Plan:</p>
              <p className="text-xs">{todo.reactionplan}</p>
            </div>
          }
          trigger='hover'
          placement="top"
          arrow={false}
        >
          <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
          }`}>
            {todo.description.length > 30 ? `${todo.description.substring(0, 30)}...` : todo.description}
          </span>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
        <div>
          <span className="font-medium">I/M Type:</span> {todo.im}
        </div>
        <div>
          <span className="font-medium">Repeat:</span> {todo.repeatType === 'none' ? 'No Repeat' : todo.repeatType}
        </div>
      </div>
    </div>
  )

  // 移动端简洁分页组件 - 和 Jobs 页面一样
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

  // 分页处理函数 - 只在移动端使用
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 分页计算 - 只在移动端使用
  const indexOfLastItem = currentPage * itemsPage
  const indexOfFirstItem = indexOfLastItem - itemsPage
  const currentEvents = events.slice(indexOfFirstItem, indexOfLastItem)
  const totalEntries = events.length
  const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
  const showingTo = Math.min(indexOfLastItem, totalEntries)
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

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
        
        {/* 内容区域 */}
        {isMobile ? (
          // 移动端：卡片视图（模仿 Jobs 页面）
          <>
            <div className="space-y-4">
              {currentEvents.map((event) => (
                <ScheduleCard key={event.id} todo={event.resource} />
              ))}
            </div>

            {/* 移动端分页和信息显示 - 和 Jobs 页面一样 */}
            <div className="flex-col justify-center text-center mt-4">
              <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-900'}`}>
                Showing {showingFrom} to {showingTo} of {totalEntries} Entries
              </p>
              
              <div className="mt-4">
                <MobileSimplePagination />
              </div>
            </div>
          </>
        ) : (
          // 桌面端：日历视图（不需要分页）
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
                popup
              />
            </div>
            
            {/* 桌面端只显示统计信息，不需要分页 */}
            <StatsCards />
          </>
        )}
        
        {/* 移动端也显示统计信息 */}
        {isMobile && <StatsCards />}
      </Card>
    </div>
  )
}

export default Schedule