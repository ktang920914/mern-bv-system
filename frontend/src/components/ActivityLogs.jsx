import { Button, Modal, ModalBody, ModalHeader, Pagination, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import useUserstore from '../store'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useEffect, useState } from 'react'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';

const ActivityLogs = () => {

    const {theme} = useThemeStore()
    const [searchParams, setSearchParams] = useSearchParams()
    const [activity,setActivities] = useState([])
    const [logIdToDelete,setLogIdToDelete] = useState('')
    const [openModalDeleteLog,setOpenModalDeleteLog] = useState(false)
    const {currentUser} = useUserstore()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
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
        
        // 处理页码参数
        if (currentPage === 1) {
            params.delete('page')
        } else {
            params.set('page', currentPage.toString())
        }
        
        // 处理搜索参数
        if (searchTerm === '') {
            params.delete('search')
        } else {
            params.set('search', searchTerm)
        }
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    // 当 URL 参数变化时同步状态
    useEffect(() => {
        const page = searchParams.get('page')
        const search = searchParams.get('search')
        
        if (page && Number(page) !== currentPage) {
            setCurrentPage(Number(page))
        }
        
        if (search !== null && search !== searchTerm) {
            setSearchTerm(search)
        }
    }, [searchParams])

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/activity/getlogs')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setActivities(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchLogs()
    },[currentUser._id])

    const handleDelete = async () => {
        setOpenModalDeleteLog(false)
        try {
            const res = await fetch(`/api/activity/delete/${logIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setActivities((prev) => prev.filter((log) => log._id !== logIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        const newSearchTerm = e.target.value.toLowerCase()
        setSearchTerm(newSearchTerm)
        setCurrentPage(1) // 搜索时重置到第一页
    }

    const filteredLogs = activity.filter(log => 
      log.date.toLowerCase().includes(searchTerm) ||
      log.activity.toLowerCase().includes(searchTerm) ||
      log.detail.toLowerCase().includes(searchTerm) ||
      log.detail.toLowerCase() === searchTerm
    );

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredLogs.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

    // 移动端卡片组件
    const ActivityLogCard = ({ log }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Date</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{log.date}</p>
                </div>
            </div>

            <div className='mb-3'>
                <p className="text-sm font-semibold text-gray-500">Activity</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{log.activity}</p>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Detail</p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{log.detail}</p>
            </div>

            <div className="flex justify-end">
                <Button 
                    color='red' 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm'
                    onClick={() => {
                        setLogIdToDelete(log._id)
                        setOpenModalDeleteLog(!openModalDeleteLog)
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
            <h1 className='text-2xl font-semibold'>Activities Logs</h1>
            <div className='w-full sm:w-auto'>
                <TextInput 
                    placeholder='Enter searching' 
                    value={searchTerm} 
                    onChange={handleSearch}
                    className='w-full'
                />
            </div>
        </div>

        {/* 桌面端表格视图 */}
        {!isMobile && (
            <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                <TableHead>
                    <TableRow>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Activity</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Detail</TableHeadCell>
                        <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentLogs.map((log) => (
                        <TableRow key={log._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                            <TableCell>{log.date}</TableCell>
                            <TableCell>{log.activity}</TableCell>
                            <TableCell>{log.detail}</TableCell>
                            <TableCell>
                                <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setLogIdToDelete(log._id);setOpenModalDeleteLog(!openModalDeleteLog)}}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}

        {/* 移动端卡片视图 */}
        {isMobile && (
            <div className="space-y-4">
                {currentLogs.map((log) => (
                    <ActivityLogCard key={log._id} log={log} />
                ))}
            </div>
        )}

        <div className="flex-col justify-center text-center mt-4">
            <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>
                Showing {showingFrom} to {showingTo} of {totalEntries} Entries
            </p>
            <Pagination
                showIcons
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                onPageChange={handlePageChange}
            />
        </div>

        <Modal show={openModalDeleteLog} size="md" onClose={() => setOpenModalDeleteLog(!openModalDeleteLog)} popup>
            <ModalHeader />
            <ModalBody>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this log?
                    </h3>
                    <div className="flex justify-center gap-4">
                        <Button color="red" onClick={handleDelete}>
                            Yes, I'm sure
                        </Button>
                        <Button color="alternative" onClick={() => setOpenModalDeleteLog(false)}>
                            No, cancel
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    </div>
  )
}

export default ActivityLogs