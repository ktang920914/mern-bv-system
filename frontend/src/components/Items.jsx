import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useState, useEffect } from 'react';
import useUserstore from '../store';
import { QRCodeCanvas } from 'qrcode.react';
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const Items = () => {

    const {theme} = useThemeStore()
    const { currentUser } = useUserstore();
    const [formData, setFormData] = useState({});
    const [updateFormData, setUpdateFormData] = useState({});
    const [openModalCreateItem, setOpenModalCreateItem] = useState(false);
    const [openModalDeleteItem, setOpenModalDeleteItem] = useState(false);
    const [openModalUpdateItem, setOpenModalUpdateItem] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [itemIdToDelete, setItemIdToDelete] = useState('');
    const [itemIdToUpdate, setItemIdToUpdate] = useState('');
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
    const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
    const [itemsPage] = useState(10);
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

    // Fetch suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await fetch('/api/purchase/getsuppliers');
                const data = await res.json();
                if(res.ok) setSuppliers(data);
            } catch (error) {
                console.log(error.message);
            }
        };
        fetchSuppliers();
    }, [currentUser._id]);

    // Fetch items
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/inventory/getitems');
                const data = await res.json();
                if(res.ok) setItems(data);
            } catch (error) {
                console.log(error.message);
            }
        };
        fetchItems();
    }, [currentUser._id]);

    // Handle input change
    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    const handleUpdateChange = (e) => setUpdateFormData({ ...updateFormData, [e.target.id]: e.target.value.trim() });
    const handleFocus = () => { setErrorMessage(null); setLoading(false); };

    // Open/close modals
    const handleCreateItem = () => { setOpenModalCreateItem(!openModalCreateItem); setErrorMessage(null); setLoading(false); };
    const handleUpdate = (item) => {
        setErrorMessage(null); setLoading(false);
        setOpenModalUpdateItem(true);
        setItemIdToUpdate(item._id);
        setUpdateFormData({
            code: item.code,
            type: item.type,
            location: item.location,
            supplier: item.supplier,
            status: item.status,
            balance: item.balance
        });
    };

    // Submit create
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if(data.success === false) setErrorMessage(data.message);
            else {
                setOpenModalCreateItem(false);
                const itemsRes = await fetch('/api/inventory/getitems');
                const itemsData = await itemsRes.json();
                if(itemsRes.ok) setItems(itemsData);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Submit update
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/update/${itemIdToUpdate}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateFormData)
            });
            const data = await res.json();
            if(data.success === false) setErrorMessage(data.message);
            else {
                setOpenModalUpdateItem(false);
                const itemsRes = await fetch('/api/inventory/getitems');
                const itemsData = await itemsRes.json();
                if(itemsRes.ok) setItems(itemsData);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete item
    const handleDelete = async () => {
        setOpenModalDeleteItem(false);
        try {
            const res = await fetch(`/api/inventory/delete/${itemIdToDelete}`, { method: 'DELETE' });
            const data = await res.json();
            if(res.ok) setItems(prev => prev.filter(item => item._id !== itemIdToDelete));
        } catch (error) {
            console.log(error.message);
        }
    };

    // Search & pagination
    const handleSearch = (e) => { setSearchTerm(e.target.value.toLowerCase()); setCurrentPage(1); };
    const filteredItems = items.filter(item =>
        item.code.toLowerCase().includes(searchTerm) && item.code.toLowerCase() === searchTerm ||
        item.type.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm) ||
        item.supplier.toLowerCase().includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm) ||
        item.balance.toString().toLowerCase().includes(searchTerm)
    );
    const indexOfLastItem = currentPage * itemsPage;
    const indexOfFirstItem = indexOfLastItem - itemsPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalEntries = filteredItems.length;
    const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1;
    const showingTo = Math.min(indexOfLastItem, totalEntries);
    
    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 修改 QR 码生成函数，确保使用最新的数据
    const generateQRContent = (item) => {
        // 优先使用后端存储的 QR 码内容
        if (item && item.qrCode) {
            return item.qrCode;
        }
        
        // 备用方案：前端生成（包含所有必要字段）
        return JSON.stringify({
            code: item?.code || '',
            type: item?.type || '',
            location: item?.location || '',
            supplier: item?.supplier || '',
            status: item?.status || '',
            balance: item?.balance !== undefined ? item.balance : 0,
            createdAt: item?.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }, null, 2);
    };

    // 移动端卡片组件
    const ItemCard = ({ item }) => (
        <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
            theme === 'light' 
                ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
        }`}>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-500">Code</p>
                    <Popover 
                        className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
                        content={
                            <div className="p-4 text-center">
                                <h3 className="font-semibold mb-2">QR Code - {item.code}</h3>
                                <QRCodeCanvas value={generateQRContent(item)} size={150} level="M" includeMargin={true}/>
                                <p className="text-xs dark:text-gray-300 text-gray-500 mt-2">Scan to view item details</p>
                            </div>
                        }
                        trigger='hover'
                        placement="top"
                        arrow={false}
                    >
                        <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
                            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                        }`}>
                            {item.code}
                        </span>
                    </Popover>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Type</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.type}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Location</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.location}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-500">Status</p>
                    <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.status}</p>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Supplier</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.supplier}</p>
            </div>

            <div className="mb-3">
                <p className="text-sm font-semibold text-gray-500">Balance</p>
                <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{item.balance}</p>
            </div>

            <div className="flex gap-2">
                <Button 
                    outline 
                    className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                    onClick={() => handleUpdate(item)}
                >
                    Edit
                </Button>
                {currentUser.role === 'Admin' && (
                    <Button 
                        color='red' 
                        outline 
                        className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
                        onClick={() => {
                            setItemIdToDelete(item._id)
                            setOpenModalDeleteItem(true)
                        }}
                    >
                        Delete
                    </Button>
                )}
            </div>
        </div>
    )

    // 生成Excel报告的函数
    const generateExcelReport = () => {
        // 准备Excel数据 - 包含所有物品字段
        const excelData = items.map(item => ({
            'Code': item.code,
            'Type': item.type,
            'Location': item.location,
            'Supplier': item.supplier,
            'Status': item.status,
            'Balance': item.balance,
            'QR Code Content': item.qrCode || generateQRContent(item),
            'Created At': new Date(item.createdAt).toLocaleString(),
            'Updated At': new Date(item.updatedAt).toLocaleString()
        }))

        // 创建工作簿和工作表
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        
        // 设置列宽
        const colWidths = [
            { wch: 15 }, // Code
            { wch: 20 }, // Type
            { wch: 15 }, // Location
            { wch: 20 }, // Supplier
            { wch: 10 }, // Status
            { wch: 10 }, // Balance
            { wch: 50 }, // QR Code Content
            { wch: 20 }, // Created At
            { wch: 20 }  // Updated At
        ]
        worksheet['!cols'] = colWidths

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Report')
        
        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // 使用当前日期作为文件名
        const date = new Date().toISOString().split('T')[0]
        saveAs(blob, `Items_Report_${date}.xlsx`)
    }

    return (
        <div className='min-h-screen'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
                <h1 className='text-2xl font-semibold'>Items</h1>
                <div className='w-full sm:w-auto'>
                    <TextInput 
                        placeholder='Enter searching' 
                        value={searchTerm} 
                        onChange={handleSearch}
                        className='w-full'
                    />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateItem}>
                        Create Item
                    </Button>
                    <Button className='cursor-pointer flex-1 sm:flex-none' onClick={generateExcelReport} color='green'>
                        Report
                    </Button>
                </div>
            </div>

            {/* 桌面端表格视图 */}
            {!isMobile && (
                <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Code</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Type</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Location</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Balance</TableHeadCell>
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
                            {currentUser.role === 'Admin' && (
                            <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentItems.map(item => (
                            <TableRow key={item._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                                <TableCell>
                                    <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                        content={
                                            <div className="p-4 text-center">
                                                <h3 className="font-semibold mb-2">QR Code - {item.code}</h3>
                                                <QRCodeCanvas value={generateQRContent(item)} size={150} level="M" includeMargin={true}/>
                                                <p className="text-xs dark:text-gray-300  text-gray-500 mt-2">Scan to view item details</p>
                                            </div>
                                        }
                                        trigger="hover"
                                        placement="right"
                                        arrow={false}
                                    >
                                        <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-blue-300">{item.code}</span>
                                    </Popover>
                                </TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.location}</TableCell>
                                <TableCell>{item.supplier}</TableCell>
                                <TableCell>{item.status}</TableCell>
                                <TableCell>{item.balance}</TableCell>
                                <TableCell><Button className='cursor-pointer py-1 px-1 text-sm h-8' outline onClick={() => handleUpdate(item)}>Edit</Button></TableCell>
                                {currentUser.role === 'Admin' && (
                                <TableCell><Button className='cursor-pointer py-1 px-1 text-sm h-8' color='red' outline onClick={() => { setItemIdToDelete(item._id); setOpenModalDeleteItem(true); }}>Delete</Button></TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* 移动端卡片视图 */}
            {isMobile && (
                <div className="space-y-4">
                    {currentItems.map((item) => (
                        <ItemCard key={item._id} item={item} />
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center mt-4">
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-500' : ' text-gray-100'}`}>Showing {showingFrom} to {showingTo} of {totalEntries} entries</p>
                <Pagination showIcons currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))} onPageChange={handlePageChange} />
            </div>

            {/* 模态框保持不变 */}
            <Modal show={openModalCreateItem} onClose={handleCreateItem} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`text-xl font-medium ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Item</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Code</Label>
                                <TextInput id="code" placeholder="Enter code" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Type</Label>
                                <TextInput id="type" placeholder="Enter type" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4 block">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label>
                                <Select id="location" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    <option>QA/QC</option>
                                    <option>Production</option>
                                    <option>Dryblent</option>
                                    <option>Maintenance</option>
                                    <option>Stock</option>
                                </Select>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                                <Select id="supplier" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                                </Select>
                            </div>
                            <div className="mb-4">
                                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                                <Select id="status" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </Select>
                            </div>
                            <Button className="w-full cursor-pointer" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalUpdateItem} onClose={() => setOpenModalUpdateItem(false)} popup>
                <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
                <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
                    <div className="space-y-6">
                        <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Item</h3>
                        
                        {/* 添加 QR 码显示区域 */}
                        <div className="flex justify-center mb-4">
                            <div className="text-center">
                                <QRCodeCanvas className='text-center'
                                    value={generateQRContent(items.find(item => item._id === itemIdToUpdate) || {})} 
                                    size={120} 
                                    level="M" 
                                    includeMargin={true}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleUpdateSubmit}>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Code</Label><TextInput value={updateFormData.code || ''} id="code" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Type</Label><TextInput value={updateFormData.type || ''} id="type" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Location</Label><Select value={updateFormData.location || ''} id="location" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>QA/QC</option>
                                <option>Production</option>
                                <option>Dryblent</option>
                                <option>Maintenance</option>
                                <option>Stock</option>
                            </Select></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label><Select value={updateFormData.supplier || ''} id="supplier" onChange={handleUpdateChange} required>
                                <option></option>
                                {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                            </Select></div>
                            <div className="mb-4"><Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label><Select value={updateFormData.status || ''} id="status" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </Select></div>
                            <Button className="w-full cursor-pointer" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            <Modal show={openModalDeleteItem} size="md" onClose={() => setOpenModalDeleteItem(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">Are you sure you want to delete this item?</h3>
                        <div className="flex justify-center gap-4">
                            <Button color="red" onClick={handleDelete}>Yes, I'm sure</Button>
                            <Button color="alternative" onClick={() => setOpenModalDeleteItem(false)}>No, cancel</Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default Items;