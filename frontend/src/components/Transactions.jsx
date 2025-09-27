import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useState, useEffect } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';

const Transactions = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [openModalCreateTransaction,setOpenModalCreateTransaction] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [items,setItems] = useState([])
  const [records,setRecords] = useState([])
  const [openModalDeleteRecord,setOpenModalDeleteRecord] = useState(false)
  const [openModalUpdateRecord,setOpenModalUpdateRecord] = useState(false)
  const [recordIdToDelete,setRecordIdToDelete] = useState('')
  const [recordIdToUpdate,setRecordIdToUpdate] = useState('')
  const [searchTerm,setSearchTerm] = useState('')
  const [currentPage,setCurrentPage] = useState(1)
  const [itemsPage] = useState(10)

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
    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/transaction/getrecords')
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setRecords(data)
            }
        } catch (error) {
            console.log(error.message)
        }
    }
    fetchRecords()
  },[currentUser._id])

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]: e.target.value.trim()})
  }

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleCreateTransaction = () => {
    setOpenModalCreateTransaction(!openModalCreateTransaction)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
      try {
          const res = await fetch('/api/transaction/record',{
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
              setOpenModalCreateTransaction(false)
              const fetchRecords = async () => {
                  try {
                      const res = await fetch('/api/transaction/getrecords')
                      const data = await res.json()
                      if(data.success === false){
                          console.log(data.message)
                      }
                      if(res.ok){
                          setRecords(data)
                      }
                  } catch (error) {
                      console.log(error.message)
                  }
              }
              fetchRecords()
          }
      } catch (error) {
          console.log(error.message)
      }
  }

  const handleDeleteTransaction = () => {
    setOpenModalDeleteRecord(!openModalDeleteRecord)
    setErrorMessage(null)
  }

  const handleDelete = async () => {
        try {
            const res = await fetch(`/api/transaction/delete/${recordIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
              setErrorMessage(data.message)
              console.log(data.message)
            }
            if(res.ok){
              setOpenModalDeleteRecord(false)
              setRecords((prev) => prev.filter((record) => record._id !== recordIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
  }

  const handleUpdate = (record) => {
    setRecordIdToUpdate(record._id)
    setUpdateFormData({balance: record.balance})
    setOpenModalUpdateRecord(!openModalUpdateRecord)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
      try {
          const res = await fetch(`/api/transaction/update/${recordIdToUpdate}`,{
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
              setOpenModalUpdateRecord(false)
              const fetchRecords = async () => {
                  try {
                      const res = await fetch('/api/transaction/getrecords')
                      const data = await res.json()
                      if(res.ok){
                          setRecords(data)
                      }
                  } catch (error) {
                      console.log(error.message)
                  }
              }
              fetchRecords()
          }
      } catch (error) {
          console.log(error.message)
      }
  }

  const handleSearch = (e) => {
      setSearchTerm(e.target.value.toLowerCase())
      setCurrentPage(1)
  }

  const filteredRecords = records.filter(record => 
      record.date.toLowerCase().includes(searchTerm) ||
      record.code.toLowerCase().includes(searchTerm) && record.code.toLowerCase() === searchTerm ||
      record.transaction.toLowerCase().includes(searchTerm) && record.transaction.toLowerCase() === searchTerm ||
      record.quantity.toString().toLowerCase().includes(searchTerm) ||
      record.balance.toString().toLowerCase().includes(searchTerm) ||
      record.user.toLowerCase().includes(searchTerm) && record.user.toString().toLowerCase() === searchTerm
    );

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredRecords.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-semibold'>Transactions</h1>
        <div>
            <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
        </div>
        <Button className='cursor-pointer' onClick={handleCreateTransaction}>Create Transaction</Button>
      </div>

      <Table hoverable className="[&_td]:py-1 [&_th]:py-2"> 
        <TableHead>
          <TableRow>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Date</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Code</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Transaction</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Quantity</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Balance</TableHeadCell>
            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>User</TableHeadCell>
            {currentUser.role === 'Admin' && (
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
            )}
            {currentUser.role === 'Admin' && (
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
            )}
          </TableRow>
        </TableHead>
        {currentRecords.map((record) => (
          <TableBody key={record._id}>
            <TableRow className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              <TableCell>{record.date}</TableCell>
              <TableCell>{record.code}</TableCell>
              <TableCell>{record.transaction}</TableCell>
              <TableCell>{record.quantity}</TableCell>
              <TableCell>{record.balance}</TableCell>
              <TableCell>{record.user}</TableCell>
              {currentUser.role === 'Admin' && (
                <TableCell>
                  <Button outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(record)}}>Edit</Button>
                </TableCell>
              )}
              {currentUser.role === 'Admin' && (
                <TableCell>
                  <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8' onClick={() => {setRecordIdToDelete(record._id);handleDeleteTransaction()}}>Delete</Button>
                </TableCell>
              )}
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

      <Modal show={openModalCreateTransaction} onClose={handleCreateTransaction} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
            <div className="space-y-6">
                <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Transaction</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-4 block">
                            <Label htmlFor='date' className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Date</Label>
                            <TextInput  type='date' id="date" placeholder="Enter date" onChange={handleChange} onFocus={handleFocus} required/>
                        </div>
                    </div>
                        
                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                      <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                      {items.map((item) => (
                      <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                    ))}
                      </Select>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Transaction</Label>
                      <Select id="transaction" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                          <option>In</option>
                          <option>Out</option>
                      </Select>
                    </div>

                    <div className="mb-4 block">
                        <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Quantity</Label>
                        <TextInput id="quantity" type='number' min='1' placeholder='Enter quantity' onChange={handleChange} onFocus={handleFocus} required/>
                    </div>

                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>User</Label>
                      <Select id="user" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                          <option></option>
                          <option>{currentUser.username}</option>
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

      <Modal show={openModalDeleteRecord} size="md" onClose={() => setOpenModalDeleteRecord(!openModalDeleteRecord)} popup>
        <ModalHeader />
        <ModalBody>
        <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this transaction?
            </h3>
            <div className="flex justify-center gap-4">
            <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
            </Button>
            <Button color="alternative" onClick={() => setOpenModalDeleteRecord(false)}>
                No, cancel
            </Button>
            </div>
        </div>
        {
          errorMessage && (
              <Alert color='failure' className='mt-4 font-semibold'>
                  {errorMessage}
              </Alert>
          )
        }
        </ModalBody>
      </Modal>

      <Modal show={openModalUpdateRecord} size='md' onClose={() => setOpenModalUpdateRecord(!openModalUpdateRecord)} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
            <div className="space-y-6">
                <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Transaction</h3>
                <form onSubmit={handleUpdateSubmit}>
                    <div className="mb-4 block">
                      <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Balance</Label>
                      <TextInput value={updateFormData.balance || ''} id="balance" type='number' placeholder='Enter balance' onChange={handleUpdateChange} onFocus={handleFocus} required/>
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

export default Transactions