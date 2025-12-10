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
        selectedCodes: []
    })
    const [updateFormData,setUpdateFormData] = useState({})
    const [extruders,setExtruders] = useState([])
    const [items,setItems] = useState([])
    const [allItems, setAllItems] = useState([])
    const [todos,setTodos] = useState([])
    const [todoIdToDelete,setTodoIdToDelete] = useState('')
    const [todoIdToUpdate,setTodoIdToUpdate] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [showCustomInterval, setShowCustomInterval] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
        setShowCustomInterval(false)
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        const { id, value, type } = e.target;
        
        if (id === 'repeatType') {
            setShowCustomInterval(value === 'custom');
        }
        
        if (type === 'checkbox') {
            const { value: checkboxValue, checked } = e.target;
            const currentSelected = formData.selectedCodes || [];
            
            if (checked) {
                setFormData({
                    ...formData,
                    selectedCodes: [...currentSelected, checkboxValue]
                })
            } else {
                setFormData({
                    ...formData,
                    selectedCodes: currentSelected.filter(code => code !== checkboxValue)
                })
            }
        } else {
            setFormData({...formData, [id]: value.trim()})
        }
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
            const todoData = {
                date: formData.date,
                selectedCodes: formData.selectedCodes,
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
            
            const data = await res.json()
            
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(false)
                return
            }
            
            setOpenModalCreateToDo(false)
            
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
            repeatType: t.repeatType || 'none',
            repeatInterval: t.repeatInterval || 1,
            repeatEndDate: t.repeatEndDate || '',
            isGenerated: t.isGenerated || false,
            parentTodo: t.parentTodo || null
        })
        setOpenModalUpdateToDo(!openModalUpdateToDo)
        setErrorMessage(null)
        setLoading(false)
        setShowCustomInterval(t.repeatType === 'custom')
    }

    const handleUpdateChange = (e) => {
        const { id, value, type } = e.target;
        
        if (id === 'repeatType') {
            setShowCustomInterval(value === 'custom');
        }
        
        setUpdateFormData({
            ...updateFormData, 
            [id]: value
        })
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        // 如果是生成的实例，只验证date和status
        if (updateFormData.isGenerated) {
            if (!updateFormData.date || !updateFormData.status) {
                setErrorMessage('Date and status are required')
                setLoading(false)
                return
            }

            const updateData = {
                date: updateFormData.date,
                status: updateFormData.status,
                action: 'updateOnly',
                updateType: 'instance'
            }

            try {
                const res = await fetch(`/api/preventive/update/${todoIdToUpdate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                })
                
                const data = await res.json()
                
                if(data.success === false){
                    setErrorMessage(data.message)
                    setLoading(false)
                    return
                }
                
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
                await fetchTodos()
                
            } catch (error) {
                console.log(error.message)
                setErrorMessage('An error occurred while updating the todo.')
                setLoading(false)
            }
        } else {
            // 如果是主任务，验证所有字段
            if (!updateFormData.date || !updateFormData.code || !updateFormData.activity || !updateFormData.status) {
                setErrorMessage('Please fill in all required fields')
                setLoading(false)
                return
            }

            const updateData = {
                date: updateFormData.date,
                code: updateFormData.code,
                activity: updateFormData.activity,
                status: updateFormData.status,
                repeatType: updateFormData.repeatType || 'none',
                repeatInterval: updateFormData.repeatInterval || 1,
                repeatEndDate: updateFormData.repeatEndDate || '',
                action: 'updateOnly',
                updateType: 'main'
            }

            try {
                const res = await fetch(`/api/preventive/update/${todoIdToUpdate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                })
                
                const data = await res.json()
                
                if(data.success === false){
                    setErrorMessage(data.message)
                    setLoading(false)
                    return
                }
                
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
                await fetchTodos()
                
            } catch (error) {
                console.log(error.message)
                setErrorMessage('An error occurred while updating the todo.')
                setLoading(false)
            }
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0)
        return new Date(dateStr)
    }

    const filteredAndSortedTodos = todos
        .filter(todo => 
            todo.date.toLowerCase().includes(searchTerm) || 
            todo.code.toLowerCase().includes(searchTerm) ||
            todo.activity.toLowerCase().includes(searchTerm) ||
            todo.repeatType.toLowerCase().includes(searchTerm) ||
            todo.status.toLowerCase().includes(searchTerm) && todo.status.toString().toLowerCase() === searchTerm
        )
        .sort((a, b) => {
            const dateA = parseDate(a.date)
            const dateB = parseDate(b.date)
            
            if (sortOrder === 'asc') {
                return dateA - dateB
            } else {
                return dateB - dateA
            }
        })

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentTodos = filteredAndSortedTodos.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredAndSortedTodos.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    const generateExcelReport = () => {
        const excelData = todos.map(todo => ({
            'Date': todo.date,
            'Item': todo.code,
            'Activity': todo.activity,
            'Status': todo.status,
            'Repeat Type': todo.repeatType || 'None',
            'Repeat Interval': todo.repeatInterval || 1,
            'Repeat End Date': todo.repeatEndDate || 'N/A',
            'Is Recurring': todo.isRecurring ? 'Yes' : 'No',
            'Is Generated': todo.isGenerated ? 'Yes' : 'No',
            'Created At': new Date(todo.createdAt).toLocaleString(),
            'Updated At': new Date(todo.updatedAt).toLocaleString()
        }))

        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        
        const colWidths = [
            { wch: 15 },
            { wch: 20 },
            { wch: 30 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 18 },
            { wch: 12 },
            { wch: 12 },
            { wch: 20 },
            { wch: 20 }
        ]
        worksheet['!cols'] = colWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, 'ToDo List Report')
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `ToDo_List_Report_${date}.xlsx`)
    }

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

    const getStatusColorClass = (status) => {
        if (status === 'Complete') {
            return 'text-green-500'
        } else if (status === 'Incomplete') {
            return 'text-red-500'
        }
        return ''
    }

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
            </div>
                <div className='mb-3'>
                    <p className="text-sm font-semibold text-gray-500">Activity</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{todo.activity}</p>
                </div>
                <div className='mb-3'>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${getStatusColorClass(todo.status)} font-medium`}>
                        {todo.status}
                    </p>
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
                
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    <div className='w-full sm:w-40'>
                        <Select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className='w-full'
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </Select>
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
            </div>

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
                                <TableCell className="align-middle">
                                    <span className={`font-medium ${getStatusColorClass(todo.status)}`}>
                                        {todo.status}
                                    </span>
                                </TableCell>
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

            <Modal show={openModalCreateToDo} onClose={handleCreateToDo} popup size="xl">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>Create ToDo</h3>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <div className="mb-4 block">
                                <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Start Date</Label>
                                <TextInput type='date' id="date" onChange={handleChange} onFocus={handleFocus} required/>
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

                                {(formData.repeatType && formData.repeatType !== 'none') && (
                                    <div className="mb-4 block">
                                        <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>
                                            {formData.repeatType === 'custom' 
                                                ? 'Repeat Every (months)' 
                                                : formData.repeatType === 'daily' ? 'Repeat Every (days)'
                                                : formData.repeatType === 'weekly' ? 'Repeat Every (weeks)'
                                                : formData.repeatType === 'monthly' ? 'Repeat Every (months)'
                                                : 'Repeat Every (years)'}
                                        </Label>
                                        <TextInput 
                                            type="number" 
                                            id="repeatInterval" 
                                            placeholder={
                                                formData.repeatType === 'custom' 
                                                    ? "e.g., 3 for every 3 months" 
                                                    : `e.g., 2 for every 2 ${formData.repeatType.replace('ly', 's')}`
                                            }
                                            min="1"
                                            value={formData.repeatInterval || 1}
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
                                    <div className={`${theme === 'light' ? 'mt-2 p-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto' : 'bg-gray-900 mt-2 p-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto text-gray-50'}`}>
                                        {allItems.map((item) => (
                                            <div key={item._id} className="flex items-center mb-2">
                                                <input
                                                    type="checkbox"
                                                    id={`item-${item._id}`}
                                                    value={item.code}
                                                    checked={formData.selectedCodes?.includes(item.code)}
                                                    onChange={handleChange}
                                                    className="mr-2"
                                                />
                                                <label htmlFor={`item-${item._id}`} className="text-sm">
                                                    {item.displayText}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.selectedCodes && formData.selectedCodes.length > 0 && (
                                        <div className={`${theme === 'light' ? 'mt-2 text-sm' : 'text-gray-50 mt-2 text-sm'}`}>
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

            <Modal show={openModalUpdateToDo} onClose={() => setOpenModalUpdateToDo(!openModalUpdateToDo)} popup size="xl">
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`}/>
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`} >
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'text-gray-50'}`}>
                            {updateFormData.isGenerated ? 'Update Instance' : 'Update ToDo'}
                        </h3>
                        {updateFormData.isGenerated && (
                            <Alert color="info" className="mb-4">
                                <span className="font-medium">Note:</span> This is a recurring task instance. 
                                You can only change the date and status. Other fields are locked.
                            </Alert>
                        )}
                        <form onSubmit={handleUpdateSubmit}>
                            <div>
                                <div className="mb-4 block">
                                    <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                                    <TextInput 
                                        value={updateFormData.date || ''} 
                                        type='date' 
                                        id="date" 
                                        onChange={handleUpdateChange} 
                                        onFocus={handleFocus} 
                                        required
                                    />
                                </div>
                                
                                <div className="mb-4 block">
                                    <Label htmlFor='code' className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Item</Label>
                                    <Select 
                                        id="code" 
                                        value={updateFormData.code || ''}
                                        onChange={handleUpdateChange}
                                        disabled={updateFormData.isGenerated}
                                        required
                                    >
                                        <option value="">-- Select an item --</option>
                                        {allItems.map((item) => (
                                            <option key={item._id} value={item.code}>
                                                {item.displayText}
                                            </option>
                                        ))}
                                    </Select>
                                    {updateFormData.isGenerated && (
                                        <p className="text-xs text-gray-500 mt-1">Item is locked for recurring instances</p>
                                    )}
                                </div>
                                
                                {!updateFormData.isGenerated && (
                                    <>
                                        <div className="mb-4 block">
                                            <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Repeat Type</Label>
                                            <Select 
                                                value={updateFormData.repeatType || 'none'} 
                                                id="repeatType" 
                                                className='mb-4' 
                                                onChange={handleUpdateChange} 
                                                onFocus={handleFocus}
                                            >
                                                <option value="none">No Repeat</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                                <option value="custom">Custom</option>
                                            </Select>
                                        </div>

                                        {(updateFormData.repeatType && updateFormData.repeatType !== 'none') && (
                                            <div className="mb-4 block">
                                                <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>
                                                    {updateFormData.repeatType === 'custom' 
                                                        ? 'Repeat Every (months)' 
                                                        : updateFormData.repeatType === 'daily' ? 'Repeat Every (days)'
                                                        : updateFormData.repeatType === 'weekly' ? 'Repeat Every (weeks)'
                                                        : updateFormData.repeatType === 'monthly' ? 'Repeat Every (months)'
                                                        : 'Repeat Every (years)'}
                                                </Label>
                                                <TextInput 
                                                    type="number" 
                                                    id="repeatInterval" 
                                                    placeholder={
                                                        updateFormData.repeatType === 'custom' 
                                                            ? "e.g., 3 for every 3 months" 
                                                            : `e.g., 2 for every 2 ${updateFormData.repeatType.replace('ly', 's')}`
                                                    }
                                                    min="1"
                                                    value={updateFormData.repeatInterval || 1}
                                                    onChange={handleUpdateChange} 
                                                    onFocus={handleFocus}
                                                />
                                            </div>
                                        )}

                                        <div className="mb-4 block">
                                            <Label htmlFor='repeatEndDate' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>End Date (Optional)</Label>
                                            <TextInput 
                                                value={updateFormData.repeatEndDate || ''} 
                                                type='date' 
                                                id="repeatEndDate" 
                                                placeholder="Enter end date" 
                                                onChange={handleUpdateChange} 
                                                onFocus={handleFocus}
                                            />
                                        </div>
                                    </>
                                )}
                                
                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Activity</Label>
                                    <TextInput 
                                        value={updateFormData.activity || ''} 
                                        id="activity" 
                                        placeholder='Enter activity' 
                                        onChange={handleUpdateChange} 
                                        onFocus={handleFocus} 
                                        disabled={updateFormData.isGenerated}
                                        required
                                    />
                                    {updateFormData.isGenerated && (
                                        <p className="text-xs text-gray-500 mt-1">Activity is locked for recurring instances</p>
                                    )}
                                </div>

                                <div className="mb-4 block">
                                    <Label className={`${theme === 'light' ? '' : 'text-gray-50'}`}>Status</Label>
                                    <Select 
                                        value={updateFormData.status || ''} 
                                        id="status" 
                                        className='mb-4' 
                                        onChange={handleUpdateChange} 
                                        onFocus={handleFocus} 
                                        required
                                    >
                                        <option value="">-- Select status --</option>
                                        <option value="Complete">Complete</option>
                                        <option value="Incomplete">Incomplete</option>
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