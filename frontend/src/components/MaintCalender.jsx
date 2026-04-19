import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Card,
  Badge,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
} from 'flowbite-react'
import useThemeStore from '../themeStore'

const localizer = momentLocalizer(moment)

const monthOptions = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const parseDate = (value) => {
  if (!value) return null

  const parsed = moment(
    value,
    [
      moment.ISO_8601,
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DDTHH:mm',
      'YYYY-MM-DD',
    ],
    true
  )

  if (parsed.isValid()) return parsed

  const fallback = moment(new Date(value))
  return fallback.isValid() ? fallback : null
}

const isIncompleteStatus = (status = '') => {
  const normalized = String(status).toLowerCase().trim()
  return (
    normalized.includes('minor incomplete') ||
    normalized.includes('major incomplete') ||
    normalized.includes('incomplete')
  )
}

const isCompleteStatus = (status = '') => {
  const normalized = String(status).toLowerCase().trim()
  return normalized.includes('complete') && !normalized.includes('incomplete')
}

const isBreakdownMaintenance = (item) => {
  const jobtype = String(item?.jobtype || '').toLowerCase().trim()
  const status = String(item?.status || '').toLowerCase().trim()
  const problem = String(item?.problem || '').toLowerCase().trim()

  return (
    jobtype.includes('breakdown') ||
    status.includes('major') ||
    status.includes('minor') ||
    problem.includes('breakdown')
  )
}

const getStatusColor = (item) => {
  if (isIncompleteStatus(item?.status)) return '#EF4444'
  return '#06B6D4'
}

const formatMinutes = (minutes) => {
  const total = Number(minutes) || 0
  if (!total) return '0m'

  const hours = Math.floor(total / 60)
  const mins = total % 60

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

const isOverKpiJobTime = (minutes) => {
  return Number(minutes) > 360
}

const formatDateTime = (value) => {
  const parsed = parseDate(value)
  if (!parsed) return 'N/A'
  return parsed.format('YYYY-MM-DD HH:mm')
}

const getMonthLabelByNumber = (monthNumber) => {
  if (!monthNumber) return 'Unknown'
  return moment().month(Number(monthNumber) - 1).format('MMMM')
}

const buildMaintenanceEvent = (item) => {
  const startMoment = parseDate(item.jobdate)
  if (!startMoment) return null

  const completionMoment = parseDate(item.completiondate)

  let endMoment = completionMoment
  if (!endMoment || !endMoment.isValid() || !endMoment.isAfter(startMoment)) {
    endMoment = startMoment.clone().add(30, 'minutes')
  }

  return {
    id: item._id,
    title: `${item.code || 'N/A'} - ${item.problem || item.jobtype || 'Maintenance'}`,
    start: startMoment.toDate(),
    end: endMoment.toDate(),
    allDay: false,
    resource: {
      ...item,
      actualStart: startMoment.toISOString(),
      actualEnd: endMoment.toISOString(),
    },
  }
}

const MaintCalender = () => {
  const { theme } = useThemeStore()

  const [maintenances, setMaintenances] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentDate, setCurrentDate] = useState(moment())
  const [calendarYear, setCalendarYear] = useState(moment().year())
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showDayEvents, setShowDayEvents] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedMonths, setExpandedMonths] = useState({})

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setCalendarYear(currentDate.year())
  }, [currentDate])

  useEffect(() => {
    if (selectedMonth !== 'all') {
      const targetMonth = Number(selectedMonth) - 1
      setCurrentDate((prev) => prev.clone().year(calendarYear).month(targetMonth).date(1))
    }
  }, [selectedMonth, calendarYear])

  useEffect(() => {
    if (selectedMonth === 'all') {
      setExpandedMonths({})
    }
  }, [selectedMonth, calendarYear])

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const res = await fetch(`/api/maintenance/getmaintenances?year=${calendarYear}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || 'Failed to fetch maintenance records')
        }

        const normalized = (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          jobtime: Number(item.jobtime) || 0,
        }))

        setMaintenances(normalized)
      } catch (error) {
        setErrorMessage(error.message || 'Error fetching maintenance records')
      } finally {
        setLoading(false)
      }
    }

    fetchMaintenances()
  }, [calendarYear])

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((item) => {
      const jobDate = parseDate(item.jobdate)
      if (!jobDate) return false
      if (jobDate.year() !== calendarYear) return false

      if (selectedMonth !== 'all' && jobDate.month() + 1 !== Number(selectedMonth)) {
        return false
      }

      return true
    })
  }, [maintenances, calendarYear, selectedMonth])

  useEffect(() => {
    const mapped = filteredMaintenances
      .map(buildMaintenanceEvent)
      .filter(Boolean)
      .sort((a, b) => new Date(a.start) - new Date(b.start))

    setEvents(mapped)
  }, [filteredMaintenances])

  const breakdownMaintenances = useMemo(() => {
    return filteredMaintenances.filter(isBreakdownMaintenance)
  }, [filteredMaintenances])

  const totalJobTime = useMemo(() => {
    return filteredMaintenances.reduce((sum, item) => sum + (Number(item.jobtime) || 0), 0)
  }, [filteredMaintenances])

  const completedCount = useMemo(() => {
    return filteredMaintenances.filter((item) => isCompleteStatus(item.status)).length
  }, [filteredMaintenances])

  const incompleteCount = useMemo(() => {
    return filteredMaintenances.filter((item) => isIncompleteStatus(item.status)).length
  }, [filteredMaintenances])

  const averageJobTime = useMemo(() => {
    const valid = filteredMaintenances.filter((item) => (Number(item.jobtime) || 0) > 0)
    if (valid.length === 0) return 0
    const total = valid.reduce((sum, item) => sum + (Number(item.jobtime) || 0), 0)
    return Math.round(total / valid.length)
  }, [filteredMaintenances])

  const machineBreakdownSummary = useMemo(() => {
    const grouped = {}

    breakdownMaintenances.forEach((item) => {
      const code = item.code || 'N/A'

      if (!grouped[code]) {
        grouped[code] = {
          code,
          totalCases: 0,
          completeCases: 0,
          incompleteCases: 0,
          totalJobTime: 0,
          lastBreakdownDate: '',
          problems: [],
        }
      }

      grouped[code].totalCases += 1
      grouped[code].totalJobTime += Number(item.jobtime) || 0

      if (isIncompleteStatus(item.status)) {
        grouped[code].incompleteCases += 1
      } else {
        grouped[code].completeCases += 1
      }

      const formattedDate = formatDateTime(item.jobdate)
      if (!grouped[code].lastBreakdownDate || formattedDate > grouped[code].lastBreakdownDate) {
        grouped[code].lastBreakdownDate = formattedDate
      }

      if (item.problem && !grouped[code].problems.includes(item.problem)) {
        grouped[code].problems.push(item.problem)
      }
    })

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        avgJobTime:
          item.totalCases > 0 ? Math.round(item.totalJobTime / item.totalCases) : 0,
      }))
      .sort((a, b) => b.totalCases - a.totalCases)
  }, [breakdownMaintenances])

  const monthlyGroupedMaintenances = useMemo(() => {
    if (selectedMonth !== 'all') return []

    const grouped = {}

    filteredMaintenances.forEach((item) => {
      const jobDate = parseDate(item.jobdate)
      if (!jobDate) return

      const monthNumber = jobDate.month() + 1

      if (!grouped[monthNumber]) {
        grouped[monthNumber] = {
          monthNumber,
          monthLabel: getMonthLabelByNumber(monthNumber),
          totalJobs: 0,
          breakdownCases: 0,
          incompleteCount: 0,
          completeCount: 0,
          totalJobTime: 0,
          records: [],
        }
      }

      grouped[monthNumber].totalJobs += 1
      grouped[monthNumber].totalJobTime += Number(item.jobtime) || 0

      if (isBreakdownMaintenance(item)) {
        grouped[monthNumber].breakdownCases += 1
      }

      if (isIncompleteStatus(item.status)) {
        grouped[monthNumber].incompleteCount += 1
      } else if (isCompleteStatus(item.status)) {
        grouped[monthNumber].completeCount += 1
      }

      grouped[monthNumber].records.push(item)
    })

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        records: group.records
          .slice()
          .sort((a, b) => {
            const timeA = parseDate(a.jobdate)?.valueOf() || 0
            const timeB = parseDate(b.jobdate)?.valueOf() || 0
            return timeB - timeA
          }),
      }))
      .sort((a, b) => b.monthNumber - a.monthNumber)
  }, [filteredMaintenances, selectedMonth])

  const handleSelectEvent = (event) => {
    setSelectedJob(event.resource)
    setShowJobDetails(true)
  }

  const handleSelectSlot = (slotInfo) => {
    const dayEvents = events
      .filter((event) => {
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
        events: dayEvents,
      })
      setShowDayEvents(true)
    }
  }

  const toggleMonthExpand = (monthNumber) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthNumber]: !prev[monthNumber],
    }))
  }

  const eventStyleGetter = (event) => {
    const item = event.resource

    return {
      style: {
        backgroundColor: getStatusColor(item),
        borderRadius: '4px',
        opacity: 0.92,
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
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      },
    }
  }

  const CustomEvent = ({ event }) => {
    const item = event.resource

    return (
      <div className="text-xs p-0.5">
        <div className="font-semibold truncate" title={item.code || 'N/A'}>
          {item.code || 'N/A'}
        </div>
        <div
          className="text-[10px] opacity-90 truncate"
          title={item.problem || item.jobtype || 'Maintenance'}
        >
          {item.problem || item.jobtype || 'Maintenance'}
        </div>
      </div>
    )
  }

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
          <Button size="sm" className="cursor-pointer" onClick={goToBack} color="gray">
            ‹
          </Button>
          <Button size="sm" className="cursor-pointer" onClick={goToCurrent} color="gray">
            Today
          </Button>
          <Button size="sm" className="cursor-pointer" onClick={goToNext} color="gray">
            ›
          </Button>
        </div>

        <div className="flex-1 text-center">
          <div className="flex justify-center items-center space-x-4">
            <Button size="xs" className="cursor-pointer" onClick={goToPrevYear} color="gray">
              «
            </Button>
            <span className="text-lg font-semibold">
              {moment(date).format('MMMM YYYY')}
            </span>
            <Button size="xs" className="cursor-pointer" onClick={goToNextYear} color="gray">
              »
            </Button>
          </div>
        </div>

        <div className="w-20 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">
          {calendarYear}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <div className="flex space-x-1">
              <Button
                size="xs"
                className="cursor-pointer px-2"
                onClick={() => {
                  const newDate = currentDate.clone().subtract(1, 'year')
                  setCalendarYear(newDate.year())
                  setCurrentDate(newDate)
                }}
                color="gray"
              >
                «
              </Button>
              <Button
                size="sm"
                className="cursor-pointer px-2"
                onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))}
                color="gray"
              >
                ‹
              </Button>
            </div>

            <div className="text-center flex-1">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDate.format('MMMM YYYY')}
              </span>
            </div>

            <div className="flex space-x-1">
              <Button
                size="sm"
                className="cursor-pointer px-2"
                onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))}
                color="gray"
              >
                ›
              </Button>
              <Button
                size="xs"
                className="cursor-pointer px-2"
                onClick={() => {
                  const newDate = currentDate.clone().add(1, 'year')
                  setCalendarYear(newDate.year())
                  setCurrentDate(newDate)
                }}
                color="gray"
              >
                »
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="sm"
              onClick={() => {
                const today = moment()
                setCurrentDate(today)
                setCalendarYear(today.year())
              }}
              color="blue"
              className="px-6"
            >
              Today
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {calendar.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7">
              {week.map((day, dIdx) => {
                const isCurrentMonth = day.month() === currentDate.month()
                const isToday = day.isSame(moment(), 'day')

                const dayEvents = events
                  .filter((e) => day.isSame(moment(e.resource.actualStart || e.start), 'day'))
                  .sort((a, b) => new Date(a.start) - new Date(b.start))

                return (
                  <div
                    key={dIdx}
                    className={`min-h-[85px] p-1 border-r border-gray-200 dark:border-gray-600 relative ${
                      !isCurrentMonth
                        ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 opacity-40'
                        : ''
                    } ${isToday ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  >
                    <div
                      className={`text-xs text-center mb-1 ${
                        isToday
                          ? 'font-black text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 font-medium'
                      }`}
                    >
                      {day.format('D')}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((ev, eIdx) => (
                        <div
                          key={eIdx}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectEvent(ev)
                          }}
                          style={{ backgroundColor: getStatusColor(ev.resource) }}
                          className="text-[9px] p-1 rounded text-white truncate cursor-pointer text-center leading-tight shadow-sm"
                        >
                          {ev.resource.code || 'N/A'}
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <div
                          className="text-[9px] text-blue-500 text-center bg-blue-50 dark:bg-blue-900/50 rounded py-0.5 cursor-pointer font-bold"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDay({ date: day, events: dayEvents })
                            setShowDayEvents(true)
                          }}
                        >
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label || 'All Months'

  const DayEventsModal = () => (
    <Modal show={showDayEvents} onClose={() => setShowDayEvents(false)} size="lg">
      <ModalHeader>
        Maintenance Jobs - {selectedDay?.date?.format('YYYY-MM-DD')}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-3">
          {selectedDay?.events?.map((event, index) => (
            <div
              key={event.id || index}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer"
              onClick={() => {
                setSelectedJob(event.resource)
                setShowDayEvents(false)
                setShowJobDetails(true)
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">
                    {event.resource.code || 'N/A'} -{' '}
                    {event.resource.problem || event.resource.jobtype || 'Maintenance'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(event.resource.jobdate)}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isOverKpiJobTime(event.resource.jobtime)
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Job Time: {formatMinutes(event.resource.jobtime)}
                  </div>
                </div>

                <Badge color={isIncompleteStatus(event.resource.status) ? 'failure' : 'info'}>
                  {event.resource.status || 'N/A'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button color="gray" className="cursor-pointer" onClick={() => setShowDayEvents(false)}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )

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
          <h1 className="text-2xl font-semibold">Maintenance Calendar</h1>
          <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            Machine breakdown and maintenance overview for {calendarYear}
          </p>
        </div>
      </div>

      {errorMessage && (
        <Alert color="failure" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <Card className="mb-6 border-none shadow-md dark:bg-gray-800">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3
              className={`${
                theme === 'light'
                  ? 'text-lg font-bold text-gray-900'
                  : 'text-lg font-bold text-gray-300'
              }`}
            >
              Calendar View
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click event to see maintenance details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 min-w-[160px] cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-sm mr-1 bg-red-500"></span>
                Incomplete
              </span>
              <span className="flex items-center text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-sm mr-1 bg-cyan-500"></span>
                Complete
              </span>
            </div>
          </div>
        </div>

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
                event: CustomEvent,
              }}
              popup
              messages={{
                today: 'Today',
                previous: 'Back',
                next: 'Next',
                month: 'Month',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Time',
                event: 'Event',
                noEventsInRange: 'No maintenance jobs in this range',
                showMore: (total) => `+${total} more`,
              }}
            />
          </div>
        )}
      </Card>

      <DayEventsModal />

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3
          className={`${
            theme === 'light'
              ? 'text-lg font-bold text-gray-900'
              : 'text-lg font-bold text-gray-300'
          }`}
        >
          Summary ({calendarYear}
          {selectedMonth !== 'all' ? ` - ${selectedMonthLabel}` : ''})
        </h3>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing records: {filteredMaintenances.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Jobs</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredMaintenances.length}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Breakdown Cases</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {breakdownMaintenances.length}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Incomplete / Complete</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge color="failure">Incomplete: {incompleteCount}</Badge>
            <Badge color="info">Complete: {completedCount}</Badge>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Job Time</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatMinutes(averageJobTime)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total: {formatMinutes(totalJobTime)}
          </div>
        </div>
      </div>

      <Card className="mb-6 border-none shadow-md dark:bg-gray-800">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3
              className={`${
                theme === 'light'
                  ? 'text-lg font-bold text-gray-900'
                  : 'text-lg font-bold text-gray-300'
              }`}
            >
              Machine Breakdown Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              See which machine broke down in the selected month
            </p>
          </div>
        </div>

        {machineBreakdownSummary.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No breakdown records for this period
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {machineBreakdownSummary.map((machine) => (
              <div
                key={machine.code}
                className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {machine.code}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last: {machine.lastBreakdownDate || 'N/A'}
                    </div>
                  </div>

                  <Badge color="failure">{machine.totalCases} Cases</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-xs text-red-600 dark:text-red-300">Incomplete</div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-300">
                      {machine.incompleteCases}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                    <div className="text-xs text-cyan-700 dark:text-cyan-300">Complete</div>
                    <div className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
                      {machine.completeCases}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Job Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatMinutes(machine.totalJobTime)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Average Job Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatMinutes(machine.avgJobTime)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Problem Preview
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {machine.problems.slice(0, 3).join(' | ') || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedMonth === 'all' ? (
        <Card className="border-none shadow-md dark:bg-gray-800">
          <div className="mb-4">
            <h3
              className={`${
                theme === 'light'
                  ? 'text-lg font-bold text-gray-900'
                  : 'text-lg font-bold text-gray-300'
              }`}
            >
              Maintenance Job Records by Month
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All months grouped to keep the list shorter and cleaner
            </p>
          </div>

          {monthlyGroupedMaintenances.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No maintenance records found
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyGroupedMaintenances.map((monthGroup) => {
                const isExpanded = !!expandedMonths[monthGroup.monthNumber]

                return (
                  <div
                    key={monthGroup.monthNumber}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleMonthExpand(monthGroup.monthNumber)}
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {monthGroup.monthLabel}
                            </div>
                            <Badge color="gray">{monthGroup.totalJobs} Jobs</Badge>
                            <Badge color="failure">
                              {monthGroup.breakdownCases} Breakdown
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Total Job Time: {formatMinutes(monthGroup.totalJobTime)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge color="failure">
                            Incomplete: {monthGroup.incompleteCount}
                          </Badge>
                          <Badge color="info">
                            Complete: {monthGroup.completeCount}
                          </Badge>
                          <Button
                            size="xs"
                            color="gray"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMonthExpand(monthGroup.monthNumber)
                            }}
                          >
                            {isExpanded ? 'Show Less' : 'View Records'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4">
                        <div className="space-y-3 pt-4">
                          {monthGroup.records.map((item) => (
                            <div
                              key={item._id}
                              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm cursor-pointer"
                              onClick={() => {
                                setSelectedJob(item)
                                setShowJobDetails(true)
                              }}
                            >
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {item.code || 'N/A'} -{' '}
                                    {item.problem || item.jobtype || 'Maintenance'}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDateTime(item.jobdate)}
                                  </div>
                                  <div
                                    className={`text-sm font-medium ${
                                      isOverKpiJobTime(item.jobtime)
                                        ? 'text-red-500 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  >
                                    Job Time: {formatMinutes(item.jobtime)}
                                  </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                  <Badge
                                    color={
                                      isIncompleteStatus(item.status) ? 'failure' : 'info'
                                    }
                                  >
                                    {item.status || 'N/A'}
                                  </Badge>

                                  {isBreakdownMaintenance(item) && (
                                    <Badge color="failure">Breakdown</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card className="border-none shadow-md dark:bg-gray-800">
          <div className="mb-4">
            <h3
              className={`${
                theme === 'light'
                  ? 'text-lg font-bold text-gray-900'
                  : 'text-lg font-bold text-gray-300'
              }`}
            >
              Maintenance Job Records
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Each job with date, machine, status and job time
            </p>
          </div>

          {filteredMaintenances.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No maintenance records found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaintenances
                .slice()
                .sort((a, b) => {
                  const timeA = parseDate(a.jobdate)?.valueOf() || 0
                  const timeB = parseDate(b.jobdate)?.valueOf() || 0
                  return timeB - timeA
                })
                .map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm cursor-pointer"
                    onClick={() => {
                      setSelectedJob(item)
                      setShowJobDetails(true)
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {item.code || 'N/A'} - {item.problem || item.jobtype || 'Maintenance'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(item.jobdate)}
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            isOverKpiJobTime(item.jobtime)
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          Job Time: {formatMinutes(item.jobtime)}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge color={isIncompleteStatus(item.status) ? 'failure' : 'info'}>
                          {item.status || 'N/A'}
                        </Badge>

                        {isBreakdownMaintenance(item) && <Badge color="failure">Breakdown</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      <Modal show={showJobDetails} onClose={() => setShowJobDetails(false)} size="lg">
        <ModalHeader>Maintenance Job Details</ModalHeader>

        <ModalBody>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Machine Code:</span> {selectedJob.code || '-'}
                </div>
                <div>
                  <span className="font-medium">Job Type:</span> {selectedJob.jobtype || '-'}
                </div>
                <div>
                  <span className="font-medium">Job Date:</span> {formatDateTime(selectedJob.jobdate)}
                </div>
                <div>
                  <span className="font-medium">Completion Date:</span>{' '}
                  {formatDateTime(selectedJob.completiondate)}
                </div>
                <div>
                  <span className="font-medium">Job Time:</span>{' '}
                  <span
                    className={`font-medium ${
                      isOverKpiJobTime(selectedJob.jobtime)
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatMinutes(selectedJob.jobtime)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Cost:</span> RM{' '}
                  {Number(selectedJob.cost || 0).toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Request By:</span> {selectedJob.requestby || '-'}
                </div>
                <div>
                  <span className="font-medium">Supplier:</span> {selectedJob.supplier || '-'}
                </div>
              </div>

              <div>
                <span className="font-medium">Status:</span>{' '}
                <Badge color={isIncompleteStatus(selectedJob.status) ? 'failure' : 'info'}>
                  {selectedJob.status || '-'}
                </Badge>
              </div>

              <div>
                <span className="font-medium">Problem:</span>
                <div className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {selectedJob.problem || '-'}
                </div>
              </div>

              <div>
                <span className="font-medium">Job Detail:</span>
                <div className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {selectedJob.jobdetail || '-'}
                </div>
              </div>

              <div>
                <span className="font-medium">Root Cause:</span>
                <div className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {selectedJob.rootcause || '-'}
                </div>
              </div>

              <div>
                <span className="font-medium">Comment Preventive:</span>
                <div className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {selectedJob.commentPreventive || '-'}
                </div>
              </div>

              <div>
                <span className="font-medium">Comment:</span>
                <div className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {selectedJob.comment || '-'}
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="gray" className="cursor-pointer" onClick={() => setShowJobDetails(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default MaintCalender