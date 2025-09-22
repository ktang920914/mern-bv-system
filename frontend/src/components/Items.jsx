import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useState, useEffect } from 'react';
import useUserstore from '../store';
import { QRCodeCanvas } from 'qrcode.react';

const Items = () => {
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPage] = useState(7);

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
        item.code.toLowerCase().includes(searchTerm) ||
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
    const handlePageChange = (page) => setCurrentPage(page);

    // QR code content
    const generateQRContent = (item) => JSON.stringify({
        code: item.code,
        type: item.type,
        location: item.location,
        supplier: item.supplier,
        status: item.status,
        balance: item.balance,
        createdAt: item.createdAt
    }, null, 2);

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-semibold'>Items</h1>
                <TextInput placeholder='Enter searching' value={searchTerm} onChange={handleSearch}/>
                <Button className='cursor-pointer' onClick={handleCreateItem}>Create Item</Button>
            </div>

            <Table hoverable>
                <TableHead>
                    <TableRow>
                        <TableHeadCell>Code</TableHeadCell>
                        <TableHeadCell>Type</TableHeadCell>
                        <TableHeadCell>Location</TableHeadCell>
                        <TableHeadCell>Supplier</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Balance</TableHeadCell>
                        <TableHeadCell>Edit</TableHeadCell>
                        <TableHeadCell>Delete</TableHeadCell>
                    </TableRow>
                </TableHead>
                {currentItems.map(item => (
                    <TableBody key={item._id}>
                        <TableRow>
                            <TableCell>
                                <Popover
                                    content={
                                        <div className="p-4 text-center">
                                            <h3 className="font-semibold mb-2">QR Code - {item.code}</h3>
                                            <QRCodeCanvas value={generateQRContent(item)} size={150} level="M" includeMargin={true}/>
                                            <p className="text-xs text-gray-500 mt-2">Scan to view item details</p>
                                        </div>
                                    }
                                    trigger="hover"
                                    placement="right"
                                >
                                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed border-blue-300">{item.code}</span>
                                </Popover>
                            </TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.balance}</TableCell>
                            <TableCell><Button className='cursor-pointer' outline onClick={() => handleUpdate(item)}>Edit</Button></TableCell>
                            <TableCell><Button className='cursor-pointer' color='red' outline onClick={() => { setItemIdToDelete(item._id); setOpenModalDeleteItem(true); }}>Delete</Button></TableCell>
                        </TableRow>
                    </TableBody>
                ))}
            </Table>

            <div className="flex flex-col items-center mt-4">
                <p className='text-gray-500 font-semibold'>Showing {showingFrom} to {showingTo} of {totalEntries} entries</p>
                <Pagination showIcons currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalEntries / itemsPage))} onPageChange={handlePageChange} />
            </div>

            {/* Create Modal */}
            <Modal show={openModalCreateItem} onClose={handleCreateItem} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">Create Item</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <Label>Code</Label>
                                <TextInput id="code" placeholder="Enter code" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4">
                                <Label>Type</Label>
                                <TextInput id="type" placeholder="Enter type" onChange={handleChange} onFocus={handleFocus} required/>
                            </div>
                            <div className="mb-4 block">
                                <Label>Location</Label>
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
                                <Label>Supplier</Label>
                                <Select id="supplier" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                                </Select>
                            </div>
                            <div className="mb-4">
                                <Label>Status</Label>
                                <Select id="status" onChange={handleChange} onFocus={handleFocus} required>
                                    <option></option>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </Select>
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'S U B M I T'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            {/* Update Modal */}
            <Modal show={openModalUpdateItem} onClose={() => setOpenModalUpdateItem(false)} popup>
                <ModalHeader />
                <ModalBody>
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">Update Item</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="mb-4"><Label>Code</Label><TextInput value={updateFormData.code || ''} id="code" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label>Type</Label><TextInput value={updateFormData.type || ''} id="type" onChange={handleUpdateChange} required/></div>
                            <div className="mb-4"><Label>Location</Label><Select value={updateFormData.location || ''} id="location" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>QA/QC</option>
                                <option>Production</option>
                                <option>Dryblent</option>
                                <option>Maintenance</option>
                                <option>Stock</option>
                            </Select></div>
                            <div className="mb-4"><Label>Supplier</Label><Select value={updateFormData.supplier || ''} id="supplier" onChange={handleUpdateChange} required>
                                <option></option>
                                {suppliers.map(s => <option key={s._id} value={s.supplier}>{`${s.supplier} --- ${s.status}`}</option>)}
                            </Select></div>
                            <div className="mb-4"><Label>Status</Label><Select value={updateFormData.status || ''} id="status" onChange={handleUpdateChange} required>
                                <option></option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </Select></div>
                            <Button className="w-full" type="submit" disabled={loading}>{loading ? <Spinner size='md' color='failure'/> : 'SUBMIT'}</Button>
                        </form>
                        {errorMessage && <Alert color='failure' className='mt-4 font-semibold'>{errorMessage}</Alert>}
                    </div>
                </ModalBody>
            </Modal>

            {/* Delete Modal */}
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
