import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, Badge, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'flowbite-react'
import useThemeStore from '../themeStore'

const localizer = momentLocalizer(moment)

// 智能颜色生成器：和 Statistics.jsx 保持完全一致，使用 137.508 黄金角度强制打散新机器颜色
export const getDynamicJobColorStats = (code) => {
  const staticMap = {
    'L1': { bgClass: 'bg-blue-500', borderClass: 'border-blue-500', hex: '#3B82F6' },
    'L2': { bgClass: 'bg-green-500', borderClass: 'border-green-500', hex: '#10B981' },
    'L3': { bgClass: 'bg-purple-500', borderClass: 'border-purple-500', hex: '#8B5CF6' },
    'L5': { bgClass: 'bg-yellow-500', borderClass: 'border-yellow-500', hex: '#F59E0B' },
    'L6': { bgClass: 'bg-red-500', borderClass: 'border-red-500', hex: '#EF4444' },
    'L9': { bgClass: 'bg-pink-500', borderClass: 'border-pink-500', hex: '#EC4899' },
    'L10': { bgClass: 'bg-cyan-500', borderClass: 'border-cyan-500', hex: '#06B6D4' },
    'L11': { bgClass: 'bg-lime-500', borderClass: 'border-lime-500', hex: '#84CC16' },
    'L12': { bgClass: 'bg-orange-500', borderClass: 'border-orange-500', hex: '#F97316' }
  };

  if (!code) return { bgClass: 'bg-gray-500', borderClass: 'border-gray-500', hex: '#6B7280' };
  if (staticMap[code]) return staticMap[code];

  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.floor(Math.abs(hash * 137.508) % 360);
  
  return {
    bgClass: '', 
    borderClass: '', 
    hex: `hsl(${h}, 75%, 50%)`,
    isDynamic: true
  };
};

const CustomerDetails = () => {
    const { theme } = useThemeStore()
    const [jobsData, setJobsData] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(moment())
    const [calendarYear, setCalendarYear] = useState(moment().year())
    const [selectedJob, setSelectedJob] = useState(null)
    const [showJobDetails, setShowJobDetails] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // 新增：和 Statistics.jsx 一样，用于控制点击日期弹出的 Modal
    const [selectedDay, setSelectedDay] = useState(null)
    const [showDayEvents, setShowDayEvents] = useState(false)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        setCalendarYear(currentDate.year())
    }, [currentDate])

    // 获取排程数据
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/customerschedule/getcustomerjobs')
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
                
                const data = await res.json()
                setJobsData(data)

                const calendarEvents = data.map(job => {
                    const start = job.prodstart ? moment(job.prodstart) : moment()
                    const end = job.prodend ? moment(job.prodend) : start.clone().add(2, 'hours')
                    const isMultiDay = !start.isSame(end, 'day')

                    return {
                        id: job._id,
                        title: `${job.code} - ${job.customerName || 'N/A'}`,
                        start: start.toDate(),
                        end: end.toDate(),
                        allDay: isMultiDay,
                        resource: {
                            ...job,
                            isMultiDay,
                            actualStart: start.toISOString(), // 增加方便日历排序的值
                            actualEnd: end.toISOString()
                        }
                    }
                })
                
                setEvents(calendarEvents)
            } catch (error) {
                console.error('Error fetching schedules:', error)
            } finally {
                setLoading(false)
            }
        }
        
        fetchSchedules()
    }, [])

    // 日历事件样式 - 完全对齐 Statistics.jsx
    const eventStyleGetter = (event) => {
        const jobCode = event.resource.code || 'UNKNOWN';
        const colorData = getDynamicJobColorStats(jobCode);
        const isCompleted = event.resource.status === 'Completed';
        const isMultiDay = event.resource.isMultiDay;

        return {
            style: {
                backgroundColor: isCompleted ? '#6B7280' : colorData.hex,
                borderRadius: '4px',
                opacity: isCompleted ? 0.7 : 0.9,
                color: 'white',
                border: '0px',
                fontSize: isMultiDay ? '10px' : '11px',
                padding: isMultiDay ? '2px 4px' : '1px 3px',
                fontWeight: isMultiDay ? 'normal' : '500',
                margin: '1px 0',
                height: isMultiDay ? '18px' : '20px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                borderStyle: isMultiDay && !isCompleted ? 'dashed' : 'none',
                borderWidth: isMultiDay && !isCompleted ? '1px' : '0',
                textDecoration: isCompleted ? 'line-through' : 'none'
            }
        }
    }

    const handleSelectEvent = (event) => {
        setSelectedJob(event.resource)
        setShowJobDetails(true)
    }

    // 新增：Web 端大日历点击空位/日期的功能（和 Statistics 一样）
    const handleSelectSlot = (slotInfo) => {
        const dayEvents = events
            .filter(event => {
                const eventStart = moment(event.resource.actualStart || event.start)
                return moment(slotInfo.start).isSame(eventStart, 'day')
            })
            .sort((a, b) => {
                const timeA = new Date(a.resource.actualStart || a.start).getTime()
                const timeB = new Date(b.resource.actualStart || b.start).getTime()
                return timeA - timeB
            })
        
        if (dayEvents.length > 0) {
            setSelectedDay({
                date: moment(slotInfo.start),
                events: dayEvents
            })
            setShowDayEvents(true)
        }
    }

    // 自定义日历头部 - 完全对齐 Statistics.jsx
    const CustomToolbar = ({ onNavigate, date }) => {
        const goToBack = () => {
            const newDate = moment(date).subtract(1, 'month')
            setCurrentDate(newDate)
            onNavigate('PREV')
        }

        const goToNext = () => {
            const newDate = moment(date).add(1, 'month')
            setCurrentDate(newDate)
            onNavigate('NEXT')
        }

        const goToCurrent = () => {
            const today = moment()
            setCurrentDate(today)
            setCalendarYear(today.year())
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

        return (
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex space-x-2">
                    <Button size="sm" className='cursor-pointer' onClick={goToBack} color="gray">‹</Button>
                    <Button size="sm" className='cursor-pointer' onClick={goToCurrent} color="gray">Today</Button>
                    <Button size="sm" className='cursor-pointer' onClick={goToNext} color="gray">›</Button>
                </div>
                
                <div className="flex-1 text-center">
                    <div className="flex justify-center items-center space-x-4">
                        <Button size="xs" className='cursor-pointer' onClick={goToPrevYear} color="gray">«</Button>
                        <span className="text-lg font-semibold">
                            {moment(date).format('MMMM YYYY')}
                        </span>
                        <Button size="xs" className='cursor-pointer' onClick={goToNextYear} color="gray">»</Button>
                    </div>
                </div>
                
                <div className="w-20 text-sm font-medium text-blue-600 dark:text-blue-400">
                    {calendarYear}
                </div>
            </div>
        )
    }

    // 自定义事件区块内容 - 完全对齐 Statistics.jsx
    const CustomEvent = ({ event }) => {
        const isMultiDay = event.resource.isMultiDay;
        const isCompleted = event.resource.status === 'Completed';
        
        return (
            <div className="text-xs p-0.5">
                <div className={`font-semibold truncate ${isMultiDay ? 'text-[10px]' : ''}`} title={event.title}>
                    {event.resource.code} - {event.resource.customerName || 'N/A'}
                </div>
                {!isMultiDay && (
                    <div className="text-[10px] opacity-90">
                        {event.resource.qty ? `${event.resource.qty} KG` : ''}
                    </div>
                )}
                {isMultiDay && (
                    <div className="text-[9px] opacity-80 italic">
                        {moment(event.start).format('MM/DD HH:mm')} → {moment(event.end).format('MM/DD HH:mm')}
                    </div>
                )}
            </div>
        )
    }

    // --- 完全复刻 Statistics.jsx 的 Mobile Calendar，代码不做任何其他更改 ---
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* 移动端专用头部 */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
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
                        <Button size="sm" onClick={() => {
                            const today = moment()
                            setCurrentDate(today)
                            setCalendarYear(today.year())
                        }} color="blue" className="px-6">
                            Today
                        </Button>
                    </div>
                </div>

                {/* 星期行 */}
                <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    {weekDays.map((d, i) => <div key={i} className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">{d}</div>)}
                </div>

                {/* 日期网格 */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {calendar.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-cols-7">
                            {week.map((day, dIdx) => {
                                const isCurrentMonth = day.month() === currentDate.month();
                                const isToday = day.isSame(moment(), 'day');
                                const dayEvents = events.filter(e => day.isSame(moment(e.start), 'day'))
                                    .sort((a, b) => new Date(a.start) - new Date(b.start));

                                return (
                                    <div key={dIdx} 
                                         className={`min-h-[85px] p-1 border-r border-gray-200 dark:border-gray-600 relative ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 opacity-40' : ''} ${isToday ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                        <div className={`text-xs text-center mb-1 ${isToday ? 'font-black text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>{day.format('D')}</div>
                                        
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 2).map((ev, eIdx) => {
                                                const colorData = getDynamicJobColorStats(ev.resource.code);
                                                const isCompleted = ev.resource.status === 'Completed';
                                                return (
                                                    <div key={eIdx} 
                                                         onClick={(e) => { e.stopPropagation(); handleSelectEvent(ev); }}
                                                         style={{ backgroundColor: isCompleted ? '#6B7280' : colorData.hex }}
                                                         className="text-[9px] p-1 rounded text-white truncate cursor-pointer text-center leading-tight shadow-sm">
                                                        {ev.resource.code}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <div className="text-[9px] text-blue-500 text-center bg-blue-50 dark:bg-blue-900/50 rounded py-0.5 cursor-pointer font-bold"
                                                     onClick={(e) => { e.stopPropagation(); setSelectedDay({ date: day, events: dayEvents }); setShowDayEvents(true); }}>
                                                    +{dayEvents.length - 2} more
                                                </div>
                                            )}
                                        </div>

                                        {/* View All 按钮 - 复刻核心功能 */}
                                        {dayEvents.length > 0 && (
                                            <div className="mt-1.5 text-center border-t border-gray-100 dark:border-gray-700 pt-1">
                                                <button className="text-[9px] text-blue-600 dark:text-blue-400 underline font-bold"
                                                        onClick={() => { setSelectedDay({ date: day, events: dayEvents }); setShowDayEvents(true); }}>
                                                    View all ({dayEvents.length})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- 完全复刻 Statistics 的 DayEventsModal，调整为 Customer 字段 ---
    const DayEventsModal = () => {
        if (!selectedDay) return null
        
        const sortedEvents = [...selectedDay.events].sort((a, b) => {
            const timeA = new Date(a.resource.actualStart || a.start).getTime()
            const timeB = new Date(b.resource.actualStart || b.start).getTime()
            return timeA - timeB
        })

        return (
            <Modal 
                show={showDayEvents} 
                onClose={() => setShowDayEvents(false)} 
                size={isMobile ? "md" : "lg"}
            >
                <ModalHeader>
                    Jobs on {selectedDay.date.format('MMMM D, YYYY')}
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sortedEvents.map((event, index) => {
                            const isMultiDay = event.resource.isMultiDay
                            const actualStart = event.resource.actualStart || event.start
                            const actualEnd = event.resource.actualEnd || event.end
                            const isCompleted = event.resource.status === 'Completed'
                            
                            return (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border ${
                                        theme === 'light' 
                                            ? 'bg-white border-gray-200' 
                                            : 'bg-gray-800 border-gray-700 text-white'
                                    } ${isMultiDay ? 'border-dashed' : ''} ${isCompleted ? 'opacity-70' : ''}`}
                                    onClick={() => {
                                        handleSelectEvent(event)
                                        setShowDayEvents(false)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-semibold text-sm">
                                                {index + 1}. {event.resource.code} - {event.resource.lotno}
                                                {isMultiDay && (
                                                    <Badge color="blue" size="xs" className="ml-2">
                                                        Multi-day
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className={`text-xs mt-1 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                                                Start: {moment(actualStart).format('MM/DD HH:mm')} 
                                                {actualEnd && 
                                                    ` → End: ${moment(actualEnd).format('MM/DD HH:mm')}`
                                                }
                                            </div>
                                        </div>
                                        <Badge 
                                            color={isCompleted ? 'success' : 'warning'}
                                            size="sm"
                                        >
                                            {event.resource.status || 'In Progress'}
                                        </Badge>
                                    </div>
                                    
                                    <div className={`grid grid-cols-2 gap-2 text-xs mb-2 ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                                        <div>
                                            <span className="font-medium">Time:</span> 
                                            {moment(actualStart).format('HH:mm')} - {moment(actualEnd).format('HH:mm')}
                                        </div>
                                        <div>
                                            <span className="font-medium">Customer:</span> {event.resource.customerName || 'N/A'}
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
                            )
                        })}
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

    const yearlyJobs = jobsData.filter(job => {
        const jobDate = job.prodstart ? moment(job.prodstart) : null;
        return jobDate && jobDate.year() === calendarYear;
    });

    const totalJobs = yearlyJobs.length;
    const completedJobs = yearlyJobs.filter(j => j.status === 'Completed').length;
    const inProgressJobs = totalJobs - completedJobs;
    const totalPlannedQty = yearlyJobs.reduce((sum, job) => sum + (Number(job.qty) || 0), 0);
    const totalActualOutput = yearlyJobs.reduce((sum, job) => sum + (Number(job.actualoutput) || 0), 0);
    const totalWastage = yearlyJobs.reduce((sum, job) => {
        const wastage = Number(job.wastage) || 0;
        return sum + (wastage > 0 ? wastage : 0);
    }, 0);

    const completionRate = totalPlannedQty > 0 ? ((totalActualOutput / totalPlannedQty) * 100).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        )
    }

    return (
        <div className="min-h-screen mb-8">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className='text-2xl font-semibold'>Customer Details & Overview</h1>
                    <p className={`${theme === 'light' ? ' text-gray-500' : 'text-gray-400'}`}>
                        Production Schedule and Outputs for {calendarYear}
                    </p>
                </div>
            </div>

            {/* --- CALENDAR --- */}
            <Card className="mb-6 border-none shadow-md dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Production Calendar</h3>
                    <div className="flex space-x-3 items-center text-xs font-semibold">
                        <span className="flex items-center text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 bg-gray-500 rounded-sm mr-1"></span> Completed
                        </span>
                        <span className="flex items-center text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 border-dashed border border-gray-400 rounded-sm mr-1"></span> Multi-day
                        </span>
                    </div>
                </div>
                
                {/* 核心判断：如果是手机，用复刻版的 MobileCalendar，如果是网页，用 Big Calendar 并开启 selectable */}
                {isMobile ? (
                    <MobileCalendar />
                ) : (
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
                            onNavigate={(newDate) => setCurrentDate(moment(newDate))}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                            components={{ 
                                toolbar: CustomToolbar,
                                event: CustomEvent
                            }} 
                            popup
                        />
                    </div>
                )}
            </Card>
            
            {/* 新增：挂载每日弹窗（Web 和 Mobile 都可用） */}
            <DayEventsModal />

            {/* --- STATISTICS --- */}
            <h3 className={`${theme === 'light' ? 'mb-4 text-lg font-bold text-gray-900' : 'mb-4 text-lg font-bold text-gray-300'}`}>Yearly Summary ({calendarYear})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-transform hover:scale-105">
                    <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">{totalJobs}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">Total Scheduled Jobs</div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <span className="text-green-500">{completedJobs} Completed</span> • <span className="text-orange-500">{inProgressJobs} In Progress</span>
                    </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-transform hover:scale-105">
                    <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-1">
                        {totalPlannedQty.toLocaleString()} <span className="text-sm text-purple-400 dark:text-purple-500">KG</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">Total Planned Qty</div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Target for {calendarYear}
                    </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-transform hover:scale-105">
                    <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-1">
                        {totalActualOutput.toLocaleString()} <span className="text-sm text-green-400 dark:text-green-500">KG</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">Total Actual Output</div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Completion Rate: <span className="text-green-500 font-bold">{completionRate}%</span>
                    </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-transform hover:scale-105">
                    <div className="text-4xl font-black text-red-500 dark:text-red-400 mb-1">
                        {totalWastage.toLocaleString()} <span className="text-sm text-red-400 dark:text-red-500">KG</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">Total Wastage Recorded</div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Difference from planned
                    </div>
                </div>
            </div>

            {/* --- JOB DETAILS MODAL --- */}
            {selectedJob && (
                <Modal show={showJobDetails} onClose={() => setShowJobDetails(false)} size="lg">
                    <ModalHeader className="dark:bg-gray-800 dark:border-gray-700 [&>h3]:dark:text-white">
                        {selectedJob.customerName} - {selectedJob.code}
                        {selectedJob.isMultiDay && (
                            <Badge color="blue" size="sm" className="ml-2 inline-block">
                                Multi-day Job
                            </Badge>
                        )}
                    </ModalHeader>
                    <ModalBody className="dark:bg-gray-800 dark:text-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-1">Status</p>
                                <Badge color={selectedJob.status === 'Completed' ? 'success' : 'warning'} className="inline-block font-bold">
                                    {selectedJob.status || 'In Progress'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-1">Lot No & Material</p>
                                <p className="font-bold text-gray-900 dark:text-white text-base">{selectedJob.lotno}</p>
                                <p className="text-gray-600 dark:text-gray-300">{selectedJob.material} ({selectedJob.colourcode})</p>
                            </div>
                            
                            <div className="col-span-2 border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-2">Schedule Window</p>
                                <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div>
                                        <span className="block text-[11px] text-green-600 dark:text-green-400 font-black mb-1 uppercase tracking-wider">Start Time</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{moment(selectedJob.prodstart).format('DD MMM YYYY, HH:mm')}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] text-red-600 dark:text-red-400 font-black mb-1 uppercase tracking-wider">End Time</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{moment(selectedJob.prodend).format('DD MMM YYYY, HH:mm')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-2">Production Targets</p>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-left">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Planned Qty</p>
                                            <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{selectedJob.qty} KG</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Actual Output</p>
                                            <p className={`text-xl font-black mt-1 ${selectedJob.actualoutput > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {selectedJob.actualoutput || 0} KG
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2 overflow-hidden">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all duration-500 ${selectedJob.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${Math.min(((selectedJob.actualoutput || 0) / selectedJob.qty) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-[11px] mt-2 font-bold text-gray-500 dark:text-gray-400">
                                        {((selectedJob.actualoutput || 0) / selectedJob.qty * 100).toFixed(1)}% Completed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <Button color="gray" className="cursor-pointer font-semibold w-full sm:w-auto" onClick={() => setShowJobDetails(false)}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </div>
    )
}

export default CustomerDetails