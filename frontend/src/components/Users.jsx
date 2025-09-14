import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, TextInput } from 'flowbite-react'
import { Table, TableHead, TableHeadCell, TableRow, TableBody, TableCell } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useEffect, useState } from 'react';
import useUserstore from '../store';
import useThemeStore from '../themeStore';

const Users = () => {

    const {currentUser} = useUserstore()
    const {theme} = useThemeStore()
    const [users,setUsers] = useState([])
    const [openModalCreateUser,setOpenModalCreateUser] = useState(false)
    const [formData,setFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const [openModalDeleteUser,setOpenModalDeleteUser] = useState(false)
    const [openModalUpdateUser,setOpenModalUpdateUser] = useState(false)
    const [userIdToDelete,setUserIdToDelete] = useState('')
    const [userIdToUpdate,setUserIdToUpdate] = useState('')
    const [updateFormData, setUpdateFormData] = useState({})
    const [searchTerm,setSearchTerm] = useState('')
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPage] = useState(7)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/auth/getusers')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setUsers(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchUsers()
    },[currentUser._id])

    const handleCreateUser = () => {
        setOpenModalCreateUser(!openModalCreateUser)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/auth/register',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(data.success !== false){
                setOpenModalCreateUser(false)
                const fetchUsers = async () => {
                    try {
                        const res = await fetch('/api/auth/getusers')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setUsers(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchUsers()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteUser(false)
        try {
            const res = await fetch(`/api/auth/delete/${userIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setUsers((prev) => prev.filter((user) => user._id !== userIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleUpdate = (user) => {
        setUserIdToUpdate(user._id)
        setUpdateFormData({username: user.username, role: user.role})
        setOpenModalUpdateUser(!openModalUpdateUser)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/auth/update/${userIdToUpdate}`,{
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
                setOpenModalUpdateUser(false)
                const fetchUsers = async () => {
                    try {
                        const res = await fetch('/api/auth/getusers')
                        const data = await res.json()
                        if(res.ok){
                            setUsers(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchUsers()
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) || 
        user.role.toLowerCase().includes(searchTerm)
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredUsers.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Users</h1>
            <div>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
            </div>
            <Button className='cursor-pointer' onClick={handleCreateUser}>Create User</Button>
        </div>

        <Table hoverable>
            <TableHead>
                <TableRow>
                    <TableHeadCell /*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>Username</TableHeadCell>
                    <TableHeadCell /*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>Role</TableHeadCell>
                    <TableHeadCell /*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>Edit</TableHeadCell>
                    <TableHeadCell /*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>Delete</TableHeadCell>
                </TableRow>
            </TableHead>
            {currentUsers.map((user) => (
            <TableBody key={user._id}>
              <TableRow /*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell><Button outline className='cursor-pointer' onClick={() => {handleUpdate(user)}}>Edit</Button></TableCell>
                <TableCell><Button color='red' outline className='cursor-pointer' onClick={() => {setUserIdToDelete(user._id);setOpenModalDeleteUser(!openModalDeleteUser)}}>Delete</Button></TableCell>
              </TableRow>
            </TableBody>
          ))}
        </Table>

            <div className="flex-col justify-center text-center mt-4">
                <p className='text-gray-500 font-semibold'>
                    Showing {showingFrom} to {showingTo} of {totalEntries} Entries
                </p>
                    <Pagination
                        showIcons
                        currentPage={currentPage}
                        totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))}
                        onPageChange={handlePageChange}
                    />
            </div>

        <Modal show={openModalCreateUser} size="md" onClose={handleCreateUser} popup>
        <ModalHeader />
        <ModalBody>
            <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create User</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label>Your username</Label>
                            <TextInput id="username" placeholder="Enter username" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label htmlFor="password">Your password</Label>
                        <TextInput id="password" type="password" placeholder='Enter password' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Your Role</Label>
                        <Select id="role" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                            <option></option>
                            <option>Admin</option>
                            <option>Sale</option>
                            <option>Technical</option>
                            <option>Operation</option>
                        </Select>
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

      <Modal show={openModalDeleteUser} size="md" onClose={() => setOpenModalDeleteUser(!openModalDeleteUser)} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this user?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
              </Button>
              <Button color="alternative" onClick={() => setOpenModalDeleteUser(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={openModalUpdateUser} size="md" onClose={() => setOpenModalUpdateUser(!openModalUpdateUser)} popup>
        <ModalHeader />
        <ModalBody>
            <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Update User</h3>
                <form onSubmit={handleUpdateSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label>Your username</Label>
                            <TextInput value={updateFormData.username || ''} id="username" placeholder="Enter username" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                        </div>
                    </div>
                        
                    <div className="mb-4 block">
                        <Label>Your Role</Label>
                        <Select value={updateFormData.role} id="role" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                            <option></option>
                            <option>Admin</option>
                            <option>Sale</option>
                            <option>Technical</option>
                            <option>Operation</option>
                        </Select>
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

export default Users