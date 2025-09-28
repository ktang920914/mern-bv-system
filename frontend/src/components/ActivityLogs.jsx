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
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)

    // 当页码变化时更新 URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (currentPage === 1) {
            params.delete('page')
        } else {
            params.set('page', currentPage.toString())
        }
        setSearchParams(params)
    }, [currentPage, searchParams, setSearchParams])

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
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
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

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Activities Logs</h1>
            <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
        </div>

        <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
            <TableHead>
                <TableRow>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Activity</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Detail</TableHeadCell>
                    <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                </TableRow>
            </TableHead>
            {currentLogs.map((log) => (
                <TableBody key={log._id}>
                <TableRow className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.activity}</TableCell>
                    <TableCell>{log.detail}</TableCell>
                    <TableCell>
                        <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setLogIdToDelete(log._id);setOpenModalDeleteLog(!openModalDeleteLog)}}>Delete</Button>
                    </TableCell>
                </TableRow>
                </TableBody>
            ))}
        </Table>

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