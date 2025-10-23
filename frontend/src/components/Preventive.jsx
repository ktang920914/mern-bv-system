import { useState, useEffect } from 'react'
import { 
  Button, 
  Modal, 
  Label, 
  TextInput, 
  Select,
  Badge,
  Card
} from 'flowbite-react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 简单的 Tabs 组件替代方案
const SimpleTabs = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => onTabChange(index)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {children[activeTab]}
      </div>
    </div>
  )
}

// 简单的 Table 组件替代方案
const SimpleTable = ({ children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </table>
    </div>
  )
}

const SimpleTableHead = ({ children }) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        {children}
      </tr>
    </thead>
  )
}

const SimpleTableHeadCell = ({ children }) => {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </th>
  )
}

const SimpleTableBody = ({ children }) => {
  return (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  )
}

const SimpleTableRow = ({ children }) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      {children}
    </tr>
  )
}

const SimpleTableCell = ({ children }) => {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {children}
    </td>
  )
}

const Preventive = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [tasks, setTasks] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [formData, setFormData] = useState({})
  const [completeForm, setCompleteForm] = useState({ result: 'good', notes: '' })
  
  const localizer = momentLocalizer(moment)

  // 模拟数据 - 在实际应用中从API获取
  const extruders = [
    { _id: '1', code: 'EXT001', type: 'Single Screw', status: 'Active' },
    { _id: '2', code: 'EXT002', type: 'Twin Screw', status: 'Active' },
  ]

  const maintenanceTemplates = [
    {
      category: "Control Panel",
      items: ["检查电源线路", "清洁控制面板", "检查按钮功能", "检查指示灯"]
    },
    {
      category: "Motor",
      items: ["检查电机温度", "检查振动情况", "清洁电机外壳", "检查接线端子"]
    },
    {
      category: "AC Inverter", 
      items: ["检查参数设置", "清洁散热片", "检查输入输出电压", "检查故障记录"]
    },
    {
      category: "Gearbox",
      items: ["检查油位", "检查油质", "检查噪音", "检查密封性"]
    },
    {
      category: "Barrel",
      items: ["检查加热器", "检查热电偶", "清洁表面", "检查隔热层"]
    },
    {
      category: "Water Bath",
      items: ["检查水温", "检查水泵", "清洁水箱", "检查水位"]
    },
    {
      category: "Screw",
      items: ["检查磨损情况", "清洁螺纹", "检查同心度", "检查表面状况"]
    }
  ]

  // 初始化一些示例任务
  useEffect(() => {
    const sampleTasks = [
      {
        _id: '1',
        extruderCode: 'EXT001',
        category: 'Control Panel',
        task: '检查电源线路',
        scheduledDate: '2025-10-25',
        frequency: 'monthly',
        status: 'pending',
        result: '',
        notes: ''
      },
      {
        _id: '2',
        extruderCode: 'EXT002',
        category: 'Motor',
        task: '检查电机温度',
        scheduledDate: '2025-10-26',
        frequency: 'weekly',
        status: 'completed',
        result: 'good',
        notes: '一切正常',
        completedAt: '2024-12-15T10:00:00Z'
      }
    ]
    setTasks(sampleTasks)
  }, [])

  const handleCreateTask = (e) => {
    e.preventDefault()
    const newTask = {
      _id: Date.now().toString(),
      ...formData,
      status: 'pending',
      result: '',
      notes: ''
    }
    setTasks(prev => [...prev, newTask])
    setShowCreateModal(false)
    setFormData({})
  }

  const handleCompleteTask = () => {
    if (!selectedTask) return
    
    const updatedTasks = tasks.map(task => 
      task._id === selectedTask._id 
        ? { 
            ...task, 
            status: 'completed',
            result: completeForm.result,
            notes: completeForm.notes,
            completedAt: new Date().toISOString()
          }
        : task
    )
    
    setTasks(updatedTasks)
    setShowCompleteModal(false)
    setCompleteForm({ result: 'good', notes: '' })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  // 日历事件数据
  const calendarEvents = tasks.map(task => ({
    id: task._id,
    title: `${task.extruderCode} - ${task.category}`,
    start: new Date(task.scheduledDate),
    end: new Date(task.scheduledDate),
    allDay: true,
    resource: task
  }))

  // 事件样式
  const eventStyleGetter = (event) => {
    const backgroundColor = event.resource.status === 'completed' 
      ? '#10B981' 
      : event.resource.status === 'overdue' 
        ? '#EF4444' 
        : '#3B82F6'
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px'
      }
    }
  }

  // 状态徽章
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      overdue: 'failure'
    }
    return <Badge color={colors[status]}>{status.toUpperCase()}</Badge>
  }

  // 结果徽章
  const ResultBadge = ({ result }) => {
    if (!result) return null
    return (
      <Badge color={result === 'good' ? 'success' : 'failure'}>
        {result.toUpperCase()}
      </Badge>
    )
  }

  // 过滤任务
  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  // 标签配置
  const tabs = [
    { title: "Calendar View", key: "calendar" },
    { title: "Table View", key: "table" },
    { title: `Pending Tasks (${pendingTasks.length})`, key: "pending" },
    { title: `Completed Tasks (${completedTasks.length})`, key: "completed" }
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Preventive Maintenance</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Maintenance Schedule
        </Button>
      </div>

      {/* 使用自定义 Tabs 组件 */}
      <SimpleTabs 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* 日历视图 */}
        <Card>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => {
                setSelectedTask(event.resource)
                setShowCompleteModal(true)
              }}
              views={['month', 'week', 'day']}
              popup
            />
          </div>
        </Card>
        
        {/* 表格视图 */}
        <Card>
          <SimpleTable>
            <SimpleTableHead>
              <SimpleTableHeadCell>Extruder</SimpleTableHeadCell>
              <SimpleTableHeadCell>Category</SimpleTableHeadCell>
              <SimpleTableHeadCell>Task</SimpleTableHeadCell>
              <SimpleTableHeadCell>Scheduled Date</SimpleTableHeadCell>
              <SimpleTableHeadCell>Status</SimpleTableHeadCell>
              <SimpleTableHeadCell>Result</SimpleTableHeadCell>
              <SimpleTableHeadCell>Actions</SimpleTableHeadCell>
            </SimpleTableHead>
            <SimpleTableBody>
              {tasks.map(task => (
                <SimpleTableRow key={task._id}>
                  <SimpleTableCell>{task.extruderCode}</SimpleTableCell>
                  <SimpleTableCell>{task.category}</SimpleTableCell>
                  <SimpleTableCell>{task.task}</SimpleTableCell>
                  <SimpleTableCell>{task.scheduledDate}</SimpleTableCell>
                  <SimpleTableCell>
                    <StatusBadge status={task.status} />
                  </SimpleTableCell>
                  <SimpleTableCell>
                    <ResultBadge result={task.result} />
                  </SimpleTableCell>
                  <SimpleTableCell>
                    {task.status === 'pending' && (
                      <Button 
                        size="xs" 
                        onClick={() => {
                          setSelectedTask(task)
                          setShowCompleteModal(true)
                        }}
                      >
                        Complete
                      </Button>
                    )}
                  </SimpleTableCell>
                </SimpleTableRow>
              ))}
            </SimpleTableBody>
          </SimpleTable>
        </Card>
        
        {/* 待处理任务 */}
        <Card>
          <div className="space-y-4">
            {pendingTasks.map(task => (
              <div key={task._id} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {task.extruderCode} - {task.category}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{task.task}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Scheduled: {task.scheduledDate}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setSelectedTask(task)
                      setShowCompleteModal(true)
                    }}
                  >
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">No pending tasks</p>
            )}
          </div>
        </Card>
        
        {/* 已完成任务 */}
        <Card>
          <div className="space-y-4">
            {completedTasks.map(task => (
              <div key={task._id} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {task.extruderCode} - {task.category}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{task.task}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Completed: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm">
                      Result: <span className={
                        task.result === 'good' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                      }>
                        {task.result ? task.result.toUpperCase() : 'N/A'}
                      </span>
                    </p>
                    {task.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Notes: {task.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">No completed tasks</p>
            )}
          </div>
        </Card>
      </SimpleTabs>

      {/* 创建维护计划模态框 */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <Modal.Header>Create Maintenance Schedule</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label htmlFor="extruderCode" value="Extruder" />
              <Select 
                id="extruderCode" 
                value={formData.extruderCode || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select Extruder</option>
                {extruders.map(extruder => (
                  <option key={extruder._id} value={extruder.code}>
                    {extruder.code} - {extruder.type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="category" value="Maintenance Category" />
              <Select 
                id="category" 
                value={formData.category || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {maintenanceTemplates.map(template => (
                  <option key={template.category} value={template.category}>
                    {template.category}
                  </option>
                ))}
              </Select>
            </div>

            {formData.category && (
              <div>
                <Label htmlFor="task" value="Maintenance Task" />
                <Select 
                  id="task" 
                  value={formData.task || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Task</option>
                  {maintenanceTemplates
                    .find(t => t.category === formData.category)
                    ?.items.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))
                  }
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="scheduledDate" value="Scheduled Date" />
              <TextInput
                type="date"
                id="scheduledDate"
                value={formData.scheduledDate || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="frequency" value="Frequency" />
              <Select 
                id="frequency" 
                value={formData.frequency || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select Frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="custom">Custom Days</option>
              </Select>
            </div>

            {formData.frequency === 'custom' && (
              <div>
                <Label htmlFor="customDays" value="Repeat Every (Days)" />
                <TextInput
                  type="number"
                  id="customDays"
                  min="1"
                  value={formData.customDays || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button color="gray" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Schedule
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* 完成任务模态框 */}
      <Modal show={showCompleteModal} onClose={() => setShowCompleteModal(false)}>
        <Modal.Header>Complete Maintenance Task</Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTask.extruderCode}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedTask.category} - {selectedTask.task}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scheduled: {selectedTask.scheduledDate}
                </p>
              </div>

              <div>
                <Label htmlFor="result" value="Inspection Result" />
                <Select 
                  value={completeForm.result}
                  onChange={(e) => setCompleteForm({...completeForm, result: e.target.value})}
                >
                  <option value="good">Good</option>
                  <option value="ng">No Good (NG)</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" value="Notes" />
                <TextInput
                  id="notes"
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({...completeForm, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button color="gray" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCompleteTask}>
                  Submit Result
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Preventive