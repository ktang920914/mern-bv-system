import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput} from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useThemeStore from '../themeStore'
import useUserstore from '../store'
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const ToDoListPreventive = () => {
    const {theme} = useThemeStore()
    const {currentUser} = useUserstore()
    const [openModalCreateToDo,setOpenModalCreateToDo] = useState(false)
    const [openModalDeleteToDo,setOpenModalDeleteToDo] = useState(false)
    const [openModalUpdateToDo,setOpenModalUpdateToDo] = useState(false)
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({
        selectedCodes: [] // 改为存储多个item codes
    })
    const [updateFormData,setUpdateFormData] = useState({})
    const [extruders,setExtruders] = useState([])
    const [items,setItems] = useState([])
    const [allItems, setAllItems] = useState([]) // 合并的items列表
    const [todos,setTodos] = useState([])
    const [todoIdToDelete,setTodoIdToDelete] = useState('')
    const [todoIdToUpdate,setTodoIdToUpdate] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [showCustomInterval, setShowCustomInterval] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // 监听窗口大小变化
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

    useEffect(() => {
        const fetchExtruders = async () => {
            try {
                const res = await fetch('/api/machine/getExtruders')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setExtruders(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchExtruders()
    },[currentUser._id])

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/inventory/getitems')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setItems(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchItems()
    },[currentUser._id])

    // 合并extruders和items到allItems
    useEffect(() => {
        const combined = [
            ...extruders.map(extruder => ({
                ...extruder,
                type: 'Machine',
                displayText: `${extruder.code} --- ${extruder.type} --- ${extruder.status}`
            })),
            ...items.map(item => ({
                ...item,
                type: 'Inventory',
                displayText: `${item.code} --- ${item.type} --- ${item.status}`
            }))
        ]
        setAllItems(combined)
    }, [extruders, items])

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const res = await fetch('/api/preventive/getTodos')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setTodos(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchTodos()
    },[currentUser._id])

    const handleCreateToDo = () => {
        setOpenModalCreateToDo(!openModalCreateToDo)
        setErrorMessage(null)
        setLoading(false)
        setFormData({
            selectedCodes: [],
            activity: '',
            date: '',
            repeatType: 'none',
            repeatInterval: 1,
            repeatEndDate: '',
            status: 'Incomplete'
        })
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({...formData, [id]: value.trim()})
        
        if (id === 'repeatType') {
            setShowCustomInterval(value === 'custom');
        }
    }

    // 处理多选item codes
    const handleCodeSelect = (selectedOptions) => {
        const selectedCodes = selectedOptions.map(option => option.value)
        setFormData({...formData, selectedCodes})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        if (formData.selectedCodes.length === 0) {
            setErrorMessage('Please select at least one item')
            setLoading(false)
            return
        }

        try {
            // 为每个选中的item code创建一个todo
            const promises = formData.selectedCodes.map(async (code) => {
                const todoData = {
                    date: formData.date,
                    code: code,
                    activity: formData.activity,
                    status: formData.status || 'Incomplete',
                    repeatType: formData.repeatType || 'none',
                    repeatInterval: formData.repeatInterval || 1,
                    repeatEndDate: formData.repeatEndDate,
                    userId: currentUser._id
                }

                const res = await fetch('/api/preventive/todo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(todoData),
                })
                
                return res.json()
            })

            const results = await Promise.all(promises)
            const hasError = results.some(result => !result.success)
            
            if (hasError) {
                setErrorMessage('Some items failed to create. Please try again.')
                setLoading(false)
                return
            }
            
            setOpenModalCreateToDo(false)
            // 刷新todos列表
            const fetchTodos = async () => {
                try {
                    const res = await fetch('/api/preventive/getTodos')
                    const data = await res.json()
                    if(data.success === false){
                        console.log(data.message)
                    }
                    if(res.ok){
                        setTodos(data)
                    }
                } catch (error) {
                    console.log(error.message)
                }
            }
            await fetchTodos()
            
        } catch (error) {
            setErrorMessage(error.message)
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteToDo(false)
        try {
            const res = await fetch(`/api/preventive/delete/${todoIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setTodos((prev) => prev.filter((todo) => todo._id !== todoIdToDelete))
                const fetchTodos = async () => {
                    try {
                        const res = await fetch('/api/preventive/getTodos')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setTodos(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchTodos()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (t) => {
        setTodoIdToUpdate(t._id)
        setUpdateFormData({
            date: t.date, 
            code: t.code, 
            status: t.status, 
            activity: t.activity,
            repeatType: t.repeatType,
            repeatEndDate: t.repeatEndDate
        })
        setOpenModalUpdateToDo(!openModalUpdateToDo)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        if(e.target.id === 'activity'){
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
        }else{
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
        }
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/preventive/update/${todoIdToUpdate}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(updateFormData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(res.ok){
                setOpenModalUpdateToDo(false)
                const fetchTodos = async () => {
                    try {
                        const res = await fetch('/api/preventive/getTodos')
                        const data = await res.json()
                        if(res.ok){
                            setTodos(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchTodos()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredTodos = todos.filter(todo => 
        todo.date.toLowerCase().includes(searchTerm) || 
        todo.code.toLowerCase().includes(searchTerm) ||
        todo.activity.toLowerCase().includes(searchTerm) ||
        todo.repeatType.toLowerCase().includes(searchTerm) ||
        todo.status.toLowerCase().includes(searchTerm) && todo.status.toString().toLowerCase() === searchTerm
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentTodos = filteredTodos.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredTodos.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // 生成Excel报告的函数
    const generateExcelReport = () => {
        // 准备Excel数据 - 包含所有待办事项字段
        const excelData = todos.map(todo => ({
            'Date': todo.date,
            'Item': todo.code,
            'Description': todo.description,
            'Status': todo.status,
            'Repeat Type': todo.repeatType || 'None',
            'Repeat End Date': todo.repeatEndDate || 'N/A',
            'Created At': new Date(todo.createdAt).toLocaleString(),
            'Updated At': new Date(todo.updatedAt).toLocaleString()
        }))

        // 创建工作簿和工作表
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        
        // 设置列宽
        const colWidths = [
            { wch: 15 }, // Date
            { wch: 20 }, // Item
            { wch: 30 }, // Activity
            { wch: 12 }, // Status
            { wch: 15 }, // Repeat Type
            { wch: 18 }, // Repeat End Date
            { wch: 20 }, // Created At
            { wch: 20 }  // Updated At
        ]
        worksheet['!cols'] = colWidths

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ToDo List Report')
        
        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // 使用当前日期作为文件名
        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ToDo_List_Report_${date}.xlsx`)
    }

    // 移动端简洁分页组件
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

    // 移动端卡片组件
    const TodoCard = ({ todo }) => (
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
                    <p className="text-sm font-semibold text-gray-500">Activity</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.activity}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.status}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(todo)}
                >
                    Edit
                </Button>
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => {
                        setTodoIdToDelete(todo._id)
                        setOpenModalDeleteToDo(!openModalDeleteToDo)
                    }}
                >
                    Delete
                </Button>
            </div>
        </div>
    )

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>ToDos</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'> 
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateToDo}>
                        Create ToDo
                    </Button>
                    <Button 
                        color='green' 
                        className='cursor-pointer flex-1 sm:flex-none' 
                        onClick={generateExcelReport}
                    >
                        Report
                    </Button>
                </div>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Activity</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentTodos.map((todo) => (
                            <TableRow key={todo._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle">{todo.date}</TableCell>
                                <TableCell className="align-middle">{todo.code}</TableCell>
                                <TableCell className="align-middle">{todo.activity}</TableCell>
                                <TableCell className="align-middle">{todo.status}</TableCell>
                                <TableCell className="align-middle">
                                    <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(todo)}}>
                                        Edit
                                    </Button>
                                </TableCell>
                                <TableCell className="align-middle">
                                    <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' 
                                        onClick={() => {setTodoIdToDelete(todo._id);setOpenModalDeleteToDo(!openModalDeleteToDo)}}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentTodos.map((todo) => (
                        <TodoCard key={todo._id} todo={todo} />
                    ))}
                </div>
            )}

            <div className="flex-col justify-center text-center mt-4">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                
                {/* 分页：手机模式用简洁版，桌面模式用完整版 */}
                {isMobile ? (
                    <div className="mt-4">
                        <MobileSimplePagination />
                    </div>
                ) : (
                    <Pagination
                        showIcons
                        currentPage={currentPage}
                        totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* 模态框 */}
            <Modal show={openModalCreateToDo} onClose={handleCreateToDo} popup size="xl">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Create ToDo</h3>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Start Date</Label>
                                <TextInput type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                                </div>
                                
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Repeat Type</Label>
                                    <Select id="repeatType" className='mb-4' onChange={handleChange} onFocus={handleFocus}>
                                        <option value="none">No Repeat</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="custom">Custom</option>
                                    </Select>
                                </div>

                                {showCustomInterval && (
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Repeat Every (months)</Label>
                                        <TextInput 
                                            type="number" 
                                            id="repeatInterval" 
                                            placeholder="e.g., 3 for every 3 months" 
                                            min="1"
                                            onChange={handleChange} 
                                            onFocus={handleFocus}
                                        />
                                    </div>
                                )}

                                <div className="mb-4 block">
                                    <Label htmlFor='repeatEndDate' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>End Date (Optional)</Label>
                                    <TextInput type='date' id="repeatEndDate" placeholder="Enter end date" onChange={handleChange} onFocus={handleFocus}/>
                                </div>

                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Select Items (Multiple)</Label>
                                    <div className="mt-2 p-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                                        {allItems.map((item) => (
                                            <div key={item._id} className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    id={`item-${item._id}`}
                                                    value={item.code}
                                                    checked={formData.selectedCodes?.includes(item.code)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                selectedCodes: [...(formData.selectedCodes || []), item.code]
                                                            })
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                selectedCodes: formData.selectedCodes?.filter(code => code !== item.code)
                                                            })
                                                        }
                                                    }}
                                                    className="mr-2"
                                                />
                                                <label htmlFor={`item-${item._id}`} className="text-sm">
                                                    {item.displayText}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.selectedCodes && formData.selectedCodes.length > 0 && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            Selected: {formData.selectedCodes.join(', ')}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Activity</Label>
                                <Textarea id="activity" placeholder='Enter activity' onChange={handleChange} onFocus={handleFocus} required/>
                                </div>

                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Status</Label>
                                    <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                                        <option></option>
                                        <option>Complete</option>
                                        <option>Incomplete</option>
                                    </Select>
                                </div>
                            </div>
                                
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {
                                        loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'
                                    }
                                    </Button>
                                </div>
                            </form>
                            {
                                errorMessage && (
                                    <Alert color='failure' className='mt-4 font-semibold'>
                                        {errorMessage}
                                    </Alert>
                                )
                            }
                    </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalDeleteToDo} size="md" onClose={() => setOpenModalDeleteToDo(!openModalDeleteToDo)} popup>
                <ModalHeader />
                <ModalBody>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this todo?
                    </h3>
                    <div className="flex justify-center gap-4">
                    <Button color="red" onClick={handleDelete}>
                        Yes, I'm sure
                    </Button>
                    <Button color="alternative" onClick={() => setOpenModalDeleteToDo(false)}>
                        No, cancel
                    </Button>
                    </div>
                </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalUpdateToDo} onClose={() => setOpenModalUpdateToDo(!openModalUpdateToDo)} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Update ToDo</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div>
                                <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Start Date</Label>
                                <TextInput value={updateFormData.date || ''} type='date' id="date" placeholder="Enter date" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                </div>
                                
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Repeat Type</Label>
                                    <Select value={updateFormData.repeatType || ''} id="repeatType" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus}>
                                        <option value="none">No Repeat</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="custom">Custom</option>
                                    </Select>
                                </div>

                                {showCustomInterval && (
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Repeat Every (months)</Label>
                                        <TextInput 
                                            type="number" 
                                            id="repeatInterval" 
                                            placeholder="e.g., 3 for every 3 months" 
                                            min="1"
                                            onChange={handleUpdateChange} 
                                            onFocus={handleFocus}
                                        />
                                    </div>
                                )}

                                <div className="mb-4 block">
                                    <Label htmlFor='repeatEndDate' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>End Date (Optional)</Label>
                                    <TextInput value={updateFormData.repeatEndDate || ''} type='date' id="repeatEndDate" placeholder="Enter end date" onChange={handleUpdateChange} onFocus={handleFocus}/>
                                </div>

                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Item</Label>
                                    <Select value={updateFormData.code || ''} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                        <option></option>
                                        {extruders.map((extruder) => (
                                        <option key={extruder._id} value={extruder.code}>{`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                                    ))}
                                        {items.map((item) => (
                                        <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                                    ))}
                                    </Select>
                                </div>

                                <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Activity</Label>
                                <TextInput value={updateFormData.activity || ''} id="activity" placeholder='Enter description' onChange={handleUpdateChange} onFocus={handleFocus} required/>
                                </div>

                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Status</Label>
                                    <Select value={updateFormData.status || ''} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                                        <option></option>
                                        <option>Complete</option>
                                        <option>Incomplete</option>
                                    </Select>
                                </div>
                            </div>
                                
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {
                                        loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'
                                    }
                                    </Button>
                                </div>
                            </form>
                            {
                                errorMessage && (
                                    <Alert color='failure' className='mt-4 font-semibold'>
                                        {errorMessage}
                                    </Alert>
                                )
                            }
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ToDoListPreventive