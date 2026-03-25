import React, { useEffect, useState } from 'react'
import { Alert, Button, Label, Modal, ModalBody, ModalHeader, ModalFooter, Pagination, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const Customers = () => {
    const { theme } = useThemeStore()
    const { currentUser } = useUserstore()
    const [formData, setFormData] = useState({})
    const [customers, setCustomers] = useState([])
    const [openModalCreateCustomer, setOpenModalCreateCustomer] = useState(false)
    const [openModalDeleteCustomer, setOpenModalDeleteCustomer] = useState(false)
    const [openModalUpdateCustomer, setOpenModalUpdateCustomer] = useState(false)
    const [customerIdToDelete, setCustomerIdToDelete] = useState('')
    const [customerIdToUpdate, setCustomerIdToUpdate] = useState('')
    const [updateFormData, setUpdateFormData] = useState({})
    const [errorMessage, setErrorMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    
    // Modal 状态
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [saveStatus, setSaveStatus] = useState('') 
    const [saveMessage, setSaveMessage] = useState('')
    const [saveDetails, setSaveDetails] = useState({ fileName: '', path: '' })
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (currentPage === 1) params.delete('page')
        else params.set('page', currentPage.toString())
        
        if (searchTerm === '') params.delete('search')
        else params.set('search', searchTerm)
        
        setSearchParams(params)
    }, [currentPage, searchTerm, searchParams, setSearchParams])

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/client/getcustomers')
                const data = await res.json()
                if(data.success === false){
                    console.log(data.message)
                }
                if(res.ok){
                    setCustomers(data)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchCustomers()
    },[currentUser._id])

    const handleCreateCustomer = () => {
        setOpenModalCreateCustomer(!openModalCreateCustomer)
        setErrorMessage(null)
        setLoading(false)
        setFormData({}) // 重置表单
    }   

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }
    
    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value.trim()})
    }

    // 提交创建
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const res = await fetch('/api/client/customer',{ // 与后端 router.post('/customer') 对应
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(false)
            } 
            if(data.success !== false){
                setOpenModalCreateCustomer(false)
                const fetchCustomers = async () => {
                    try {
                        const res = await fetch('/api/client/getcustomers')
                        const data = await res.json()
                        if(data.success === false){
                            console.log(data.message)
                        }
                        if(res.ok){
                            setCustomers(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchCustomers()
            }
        } catch (error) {
            setErrorMessage(error.message)
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setOpenModalDeleteCustomer(false)
        try {
            const res = await fetch(`/api/client/delete/${customerIdToDelete}`,{
                method:'DELETE',
            })
            const data = await res.json()
            if(data.success === false){
                console.log(data.message)
            }
            if(res.ok){
                setCustomers((prev) => prev.filter((customer) => customer._id !== customerIdToDelete))
            }
        } catch (error) {
            console.log(error.message)
        }
    }


    // 打开更新 Modal
    const handleUpdate = (customer) => {
        setCustomerIdToUpdate(customer._id)
        setUpdateFormData({ clientID: customer.clientID, clientName: customer.clientName })
        setOpenModalUpdateCustomer(!openModalUpdateCustomer)
        setErrorMessage(null)
        setLoading(false)
    }

    const handleUpdateChange = (e) => {
        setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }

    // 提交更新
    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const res = await fetch(`/api/client/update/${customerIdToUpdate}`,{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(updateFormData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(false)
            }if(res.ok){
                setOpenModalUpdateCustomer(false)
                const fetchCustomers = async () => {
                    try {
                        const res = await fetch('/api/client/getcustomers')
                        const data = await res.json()
                        if(res.ok){
                            setCustomers(data)
                        }
                    } catch (error) {
                        console.log(error.message)
                    }
                }
                fetchCustomers()
            }
        } catch (error) {
            setErrorMessage(error.message)
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase())
        setCurrentPage(1)
    }

    const filteredCustomers = customers.filter(customer => 
        (customer.clientName && customer.clientName.toLowerCase().includes(searchTerm)) || 
        (customer.clientID && customer.clientID.toLowerCase().includes(searchTerm))
    )

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const indexOfLastItem = currentPage * itemsPage
    const indexOfFirstItem = indexOfLastItem - itemsPage
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem)
    const totalEntries = filteredCustomers.length
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
    const showingTo = Math.min(indexOfLastItem, totalEntries)
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

    // 移动端简洁分页组件
    const MobileSimplePagination = () => (
        <div className="flex items-center justify-center space-x-4">
            <Button size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="flex items-center">
                <span>‹</span><span className="ml-1">Previous</span>
            </Button>
            <Button size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="flex items-center">
                <span className="mr-1">Next</span><span>›</span>
            </Button>
        </div>
    )

    // 移动端卡片组件
    const CustomerCard = ({ customer }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Customer ID</p>
                    <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{customer.clientID}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Customer Name</p>
                    <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{customer.clientName}</p>
                </div>
            </div>
            
            <div className="flex gap-2">
                <Button outline className='cursor-pointer flex-1 py-1 text-sm' onClick={() => handleUpdate(customer)}>Edit</Button>
                <Button color='red' outline className='cursor-pointer flex-1 py-1 text-sm' onClick={() => {
                    setCustomerIdToDelete(customer._id)
                    setOpenModalDeleteCustomer(!openModalDeleteCustomer)
                }}>Delete</Button>
            </div>
        </div>
    )

    const setupWorksheetPrint = (worksheet, options = {}) => {
        const { paperSize = 9, orientation = 'landscape', margins = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }, horizontalCentered = true, verticalCentered = false, fitToPage = true, fitToHeight = 1, fitToWidth = 1, scale = 100 } = options
        worksheet.pageSetup = { paperSize, orientation, margins, horizontalCentered, verticalCentered, fitToPage, fitToHeight, fitToWidth, scale, showGridLines: false, blackAndWhite: false }
    }

    // 生成Excel报告
    const generateExcelReport = async () => {
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Customers Report')
            
            setupWorksheetPrint(worksheet, { fitToHeight: 1, fitToWidth: 1, horizontalCentered: true, verticalCentered: false })
            
            worksheet.columns = [
                { width: 10 },   // No.
                { width: 25 },   // Customer ID
                { width: 40 },   // Customer Name
                { width: 25 },   // Created At
                { width: 25 }    // Updated At
            ]

            const headerFont = { name: 'Calibri', size: 11, bold: true }
            const titleFont = { name: 'Arial Black', size: 16, bold: true }
            const defaultFont = { name: 'Calibri', size: 11 }
            const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            const centerAlignment = { horizontal: 'center', vertical: 'middle' }
            const leftAlignment = { horizontal: 'left', vertical: 'middle' }

            const reportDate = new Date();
            const dateStr = reportDate.toISOString().split('T')[0];
            const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');

            const titleRow = worksheet.getRow(1)
            titleRow.height = 30
            titleRow.getCell(1).value = 'CUSTOMERS REPORT'
            titleRow.getCell(1).font = titleFont
            titleRow.getCell(1).alignment = centerAlignment
            worksheet.mergeCells('A1:E1')

            const subtitleRow = worksheet.getRow(2)
            subtitleRow.height = 20
            subtitleRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`
            subtitleRow.getCell(1).font = { ...defaultFont, italic: true }
            subtitleRow.getCell(1).alignment = centerAlignment
            worksheet.mergeCells('A2:E2')

            const headerRow = worksheet.getRow(3)
            headerRow.height = 25
            const headers = ['No.', 'Customer ID', 'Customer Name', 'Created At', 'Updated At']
            
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1)
                cell.value = header
                cell.font = headerFont
                cell.alignment = centerAlignment
                cell.border = borderStyle
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
            })

            const excelData = customers.map(customer => ({
                'Customer ID': customer.clientID || '-',
                'Customer Name': customer.clientName || '-',
                'Created At': new Date(customer.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
                'Updated At': new Date(customer.updatedAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
            }))

            let rowIndex = 4
            excelData.forEach((customer, index) => {
                const row = worksheet.getRow(rowIndex)
                row.height = 20
                
                const rowData = [ index + 1, customer['Customer ID'], customer['Customer Name'], customer['Created At'], customer['Updated At'] ]

                rowData.forEach((value, colIndex) => {
                    const cell = row.getCell(colIndex + 1)
                    cell.value = value
                    cell.font = defaultFont
                    cell.border = borderStyle
                    cell.alignment = (colIndex === 2) ? leftAlignment : centerAlignment 
                    
                    if (rowIndex % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }
                })
                rowIndex++
            })

            if (excelData.length === 0) {
                const row = worksheet.getRow(rowIndex)
                row.getCell(1).value = 'No customer data available'
                worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`)
                row.getCell(1).alignment = centerAlignment
                row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } }
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
                row.getCell(1).border = borderStyle
                rowIndex++
            } else {
                worksheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: rowIndex - 1, column: 5 } };
            }

            const totalRow = worksheet.getRow(rowIndex)
            totalRow.height = 25
            totalRow.getCell(1).value = 'TOTAL CUSTOMERS'
            worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`)
            totalRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
            totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' }
            totalRow.getCell(1).border = borderStyle
            totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }
            
            totalRow.getCell(5).value = excelData.length
            totalRow.getCell(5).font = { name: 'Calibri', size: 11, bold: true }
            totalRow.getCell(5).alignment = centerAlignment
            totalRow.getCell(5).border = borderStyle
            totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            
            return { blob, fileName: `Customers_Report_${dateStr}_${timeStr}.xlsx` }
        } catch (error) {
            console.error('Error generating Excel report:', error)
            throw error
        }
    }

    const saveToFileServer = async () => {
        try {
            setShowSaveModal(true)
            setSaveStatus('saving')
            setSaveMessage('Generating...')
            setSaveDetails({ fileName: '', path: '' })

            const result = await generateExcelReport()
            const { blob, fileName } = result

            setSaveMessage('Saving...')
            setSaveDetails(prev => ({ ...prev, fileName }))

            const formData = new FormData()
            formData.append('file', blob, fileName)
            formData.append('fileServerPath', 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)')

            const response = await fetch('/api/file/save-excel', { method: 'POST', body: formData })
            const data = await response.json()

            if (response.ok) {
                setSaveStatus('success')
                setSaveMessage('Success！')
                setSaveDetails({ fileName, path: data.path || 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)' })
            } else {
                setSaveStatus('error')
                setSaveMessage(`Failed: ${data.message || 'Error'}`)
                setSaveDetails({ fileName, path: 'Failed' })
            }
        } catch (error) {
            console.error('Error saving to file server:', error)
            setSaveStatus('error')
            setSaveMessage('error')
            setSaveDetails({ fileName: 'unknown', path: 'error' })
        }
    }

    const handleDownloadReport = async () => {
        try {
            const result = await generateExcelReport()
            const { blob, fileName } = result
            saveAs(blob, fileName)
        } catch (error) {
            console.error('Error downloading report:', error)
            alert('Failed to download report. Please try again.')
        }
    }

    const handleManualDownload = () => {
        handleDownloadReport()
        setShowSaveModal(false)
    }

    const closeSaveModal = () => {
        setShowSaveModal(false)
        setTimeout(() => {
            setSaveStatus('')
            setSaveMessage('')
            setSaveDetails({ fileName: '', path: '' })
        }, 300)
    }

    const confirmSaveToServer = () => {
        setShowConfirmModal(true)
    }

    const executeSaveToServer = () => {
        setShowConfirmModal(false)
        saveToFileServer()
    }

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Customers</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Search Name or ID...' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateCustomer}>
                        Create Customer
                    </Button>
                    <Button className='cursor-pointer flex-1 sm:flex-none' color='green' onClick={handleDownloadReport}>
                        Report
                    </Button>
                    <Button className='cursor-pointer flex-1 sm:flex-none' color='blue' onClick={confirmSaveToServer}>
                        Save
                    </Button>
                </div>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-2 [&_th]:py-3">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Customer ID</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Customer Name</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Edit</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'} text-center`}>Delete</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentCustomers.map((customer) => (
                            <TableRow key={customer._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell className="align-middle font-medium">{customer.clientID}</TableCell>
                                <TableCell className="align-middle font-medium">{customer.clientName}</TableCell>
                                <TableCell className="align-middle text-center w-24">
                                    <Button outline className='cursor-pointer py-1 px-1 text-sm h-8 w-full' onClick={() => handleUpdate(customer)}>Edit</Button>
                                </TableCell>
                                <TableCell className="align-middle text-center w-24">
                                    <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8 w-full' onClick={() => { setCustomerIdToDelete(customer._id); setOpenModalDeleteCustomer(true) }}>
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
                    {currentCustomers.map((customer) => (
                        <CustomerCard key={customer._id} customer={customer} />
                    ))}
                </div>
            )}

            <div className="flex-col justify-center text-center mt-4 mb-8">
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

            {/* CREATE MODAL */}
            <Modal show={openModalCreateCustomer} onClose={handleCreateCustomer} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900'}`}>
                    <div className="space-y-6">
                        <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Customer</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Customer ID</Label>
                                <TextInput id="clientID" placeholder="Enter Customer ID" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Customer Name</Label>
                                <TextInput id="clientName" placeholder="Enter Customer Name" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            {/* DELETE MODAL */}
            <Modal show={openModalDeleteCustomer} size="md" onClose={() => setOpenModalDeleteCustomer(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this customer?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color="red" onClick={handleDelete}>Yes, I'm sure</Button>
                            <Button color="alternative" onClick={() => setOpenModalDeleteCustomer(false)}>No, cancel</Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* UPDATE MODAL */}
            <Modal show={openModalUpdateCustomer} onClose={() => setOpenModalUpdateCustomer(false)} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium`}>Update Customer</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Customer ID</Label>
                                <TextInput value={updateFormData.clientID || ''} id="clientID" placeholder="Enter Customer ID" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Customer Name</Label>
                                <TextInput value={updateFormData.clientName || ''} id="clientName" placeholder="Enter Customer Name" onChange={handleUpdateChange} onFocus={handleFocus} required/>
                            </div>
                            <div className='mb-4 block'>
                                <Button className='cursor-pointer w-full' type='submit' disabled={loading}>
                                    {loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}
                                </Button>
                            </div>
                        </form>
                        {errorMessage && (
                            <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            {/* 确认保存 Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} size="md">
                <ModalHeader>Server</ModalHeader>
                <ModalBody>
                    <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300">Are you sure want to save into server?</p>
                        <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'border border-gray-600'}`}>
                            <p className={`text-sm font-semibold`}>File path:</p>
                            <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)</p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button className='cursor-pointer' color="gray" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                    <Button className='cursor-pointer' color="blue" onClick={executeSaveToServer}>Save</Button>
                </ModalFooter>
            </Modal>

            {/* 保存状态 Modal */}
            <Modal show={showSaveModal} onClose={closeSaveModal} size="md">
                <ModalHeader>
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Success' : saveStatus === 'error' ? 'Failed' : 'Saving'}
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            {saveStatus === 'saving' && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>}
                            {saveStatus === 'success' && (
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            )}
                            {saveStatus === 'error' && (
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-gray-700 dark:text-gray-300">{saveMessage}</p>
                        {saveDetails.fileName && (
                            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'}`}>
                                <p className="text-sm font-semibold">Document information:</p>
                                <p className="text-sm mt-1"><span className="font-medium">File name:</span> {saveDetails.fileName}</p>
                                {saveDetails.path && <p className="text-sm mt-1"><span className="font-medium">File path:</span> {saveDetails.path}</p>}
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Failed to save into server, Please save as manual into server</p>
                                <div className="space-y-2">
                                    <Button className='cursor-pointer w-full' color="blue" onClick={handleManualDownload}>Download manual</Button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">File path: Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    {saveStatus === 'saving' ? (
                        <Button color="gray" disabled>Please wait...</Button>
                    ) : (
                        <Button className='cursor-pointer' color='gray' onClick={closeSaveModal}>Cancel</Button>
                    )}
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default Customers