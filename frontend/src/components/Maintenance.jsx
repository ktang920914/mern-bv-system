import { Alert, Button, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Textarea, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const Maintenance = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()

  const initialFormData = {
    jobtype: '',
    code: '',
    jobdate: '',
    problem: '',
    jobdetail: '',
    rootcause: '',
    cost: '',
    completiondate: '',
    supplier: '',
    status: '',
    requestby: '',
    checkedrequestorby: '',
    verifiedbyhod: '',
    commentPreventive: '',
    comment: '',
  }

  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [openModalCreateJob,setOpenModalCreateJob] = useState(false)
  const [openModalDeleteMaintenance,setOpenModalDeleteMaintenance] = useState(false)
  const [openModalUpdateMaintenance,setOpenModalUpdateMaintenance] = useState(false)
  const [openModalMFR, setOpenModalMFR] = useState(false)
  const [selectedMaintenanceForMFR, setSelectedMaintenanceForMFR] = useState(null)
  const [formData,setFormData] = useState(initialFormData)
  const [updateFormData,setUpdateFormData] = useState(initialFormData)
  const [extruders,setExtruders] = useState([])
  const [items,setItems] = useState([])
  const [spareparts,setSpareparts] = useState([])
  const [others,setOthers] = useState([])
  const [suppliers,setSuppliers] = useState([])
  const [maintenances,setMaintenances] = useState([])
  const [maintenanceIdToDelete,setMaintenanceIdToDelete] = useState('')
  const [maintenanceIdToUpdate,setMaintenanceIdToUpdate] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm,setSearchTerm] = useState(searchParams.get('search') || '')
  const [currentPage,setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [itemsPage] = useState(10)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  const [sortBy, setSortBy] = useState('jobdate')
  const [sortOrder, setSortOrder] = useState('desc')
    
  const [mfrSaveStatus, setMfrSaveStatus] = useState('')
  const [mfrSaveMessage, setMfrSaveMessage] = useState('')
  const [mfrSaveDetails, setMfrSaveDetails] = useState({ fileName: '', path: '' })
  const [showMfrSaveModal, setShowMfrSaveModal] = useState(false)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saveDetails, setSaveDetails] = useState({ fileName: '', path: '' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const formatJobTime = (minutes) => {
    if (minutes === null || minutes === undefined || minutes === 0) return '0m';
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h${remainingMinutes}m`;
      }
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || minutes === 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const formatDurationForExcel = (minutes) => {
    if (minutes === null || minutes === undefined || minutes === 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const formatDateTimeForDisplay = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    
    try {
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateTimeString;
    }
  };

  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        if (dateTimeString.includes(' ')) {
          const [datePart, timePart] = dateTimeString.split(' ');
          if (timePart && timePart.includes(':')) {
            return datePart + 'T' + timePart;
          }
        }
        return dateTimeString;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      return dateTimeString;
    }
  };

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
    const fetchSpareparts = async () => {
      try {
        const res = await fetch('/api/other/getSpareparts')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setSpareparts(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchSpareparts()
  },[currentUser._id])

  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const res = await fetch('/api/rest/getOthers')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setOthers(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchOthers()
  },[currentUser._id])

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/purchase/getsuppliers')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          setSuppliers(data)
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchSuppliers()
  },[currentUser._id])

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        const res = await fetch('/api/maintenance/getMaintenances')
        const data = await res.json()
        if(data.success === false){
          console.log(data.message)
        }
        if(res.ok){
          const maintenancesWithJobTime = data.map(maintenance => {
            let updatedMaintenance = { ...maintenance }

            if (updatedMaintenance.jobtime === undefined || updatedMaintenance.jobtime === null) {
              const jobdate = updatedMaintenance.jobdate;
              const completiondate = updatedMaintenance.completiondate;
              
              if (jobdate && completiondate) {
                try {
                  const startDate = new Date(jobdate);
                  const endDate = new Date(completiondate);
                  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const minutesDiff = Math.round(timeDiff / (1000 * 60));
                    updatedMaintenance.jobtime = minutesDiff;
                  }
                } catch (error) {
                  console.log("Error calculating jobtime:", error);
                }
              }
            }

            updatedMaintenance.requestby = updatedMaintenance.requestby || ''
            updatedMaintenance.checkedrequestorby = updatedMaintenance.checkedrequestorby || updatedMaintenance.requestby || ''
            updatedMaintenance.verifiedbyhod = updatedMaintenance.verifiedbyhod || ''
            updatedMaintenance.commentPreventive = updatedMaintenance.commentPreventive || ''
            updatedMaintenance.comment = updatedMaintenance.comment || ''

            return updatedMaintenance;
          });
          
          setMaintenances(maintenancesWithJobTime);
        }
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchMaintenances()
  },[currentUser._id])

  const handleCreateJob = () => {
    setOpenModalCreateJob(!openModalCreateJob)
    setErrorMessage(null)
    setLoading(false)
    setFormData(initialFormData);
  }

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleChange = (e) => {
    if (
      e.target.id === 'supplier' ||
      e.target.id === 'problem' ||
      e.target.id === 'jobdetail' ||
      e.target.id === 'rootcause' ||
      e.target.id === 'commentPreventive' ||
      e.target.id === 'comment'
    ) {
      setFormData({...formData, [e.target.id]: e.target.value})
    } else {
      setFormData({...formData, [e.target.id]:e.target.value.trim()})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitPayload = {
      ...formData,
      checkedrequestorby: formData.requestby?.trim() || ''
    }
    
    try {
      const res = await fetch('/api/maintenance/job',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(submitPayload)
      })
      const data = await res.json()
      if(data.success === false){
        setErrorMessage(data.message)
        setLoading(false)
      }
      if(res.ok){
        setOpenModalCreateJob(false)
        setLoading(false)
        setFormData(initialFormData)
        
        const fetchMaintenances = async () => {
          try {
            const res = await fetch('/api/maintenance/getmaintenances')
            const data = await res.json()
            if(res.ok){
              setMaintenances(data.map(m => ({
                ...m,
                requestby: m.requestby || '',
                checkedrequestorby: m.checkedrequestorby || m.requestby || '',
                verifiedbyhod: m.verifiedbyhod || '',
                commentPreventive: m.commentPreventive || '',
                comment: m.comment || '',
              })))
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchMaintenances()
      }
    } catch (error) {
      console.log(error.message)
      setErrorMessage('Error creating maintenance job')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setOpenModalDeleteMaintenance(false)
    try {
      const res = await fetch(`/api/maintenance/delete/${maintenanceIdToDelete}`,{
        method:'DELETE',
      })
      const data = await res.json()
      if(data.success === false){
        console.log(data.message)
      }
      if(res.ok){
        setMaintenances((prev) => prev.filter((maintenance) => maintenance._id !== maintenanceIdToDelete))
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleUpdate = (maintenance) => {
    setMaintenanceIdToUpdate(maintenance._id)
    setUpdateFormData({
      jobdate: formatDateTimeForInput(maintenance.jobdate), 
      code: maintenance.code, 
      problem:maintenance.problem,
      jobdetail:maintenance.jobdetail, 
      rootcause: maintenance.rootcause, 
      supplier:maintenance.supplier, 
      status:maintenance.status,
      cost:maintenance.cost, 
      completiondate: formatDateTimeForInput(maintenance.completiondate), 
      jobtype:maintenance.jobtype,
      requestby: maintenance.requestby || '',
      checkedrequestorby: maintenance.checkedrequestorby || maintenance.requestby || '',
      verifiedbyhod: maintenance.verifiedbyhod || '',
      commentPreventive: maintenance.commentPreventive || '',
      comment: maintenance.comment || '',
    })
    setOpenModalUpdateMaintenance(!openModalUpdateMaintenance)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    if(
      e.target.id === 'supplier' ||
      e.target.id === 'problem'||
      e.target.id === 'jobdetail' ||
      e.target.id === 'rootcause' ||
      e.target.id === 'commentPreventive' ||
      e.target.id === 'comment'
    ){
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
    }else{
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitPayload = {
      ...updateFormData,
      checkedrequestorby: updateFormData.requestby?.trim() || ''
    }
    
    try {
      const res = await fetch(`/api/maintenance/update/${maintenanceIdToUpdate}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(submitPayload)
      })
      const data = await res.json()
      if(data.success === false){
        setErrorMessage(data.message)
        setLoading(false)
      }
      if(res.ok){
        setOpenModalUpdateMaintenance(false)
        setLoading(false)
        
        const fetchMaintenances = async () => {
          try {
            const res = await fetch('/api/maintenance/getmaintenances')
            const data = await res.json()
            if(res.ok){
              setMaintenances(data.map(m => ({
                ...m,
                requestby: m.requestby || '',
                checkedrequestorby: m.checkedrequestorby || m.requestby || '',
                verifiedbyhod: m.verifiedbyhod || '',
                commentPreventive: m.commentPreventive || '',
                comment: m.comment || '',
              })))
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchMaintenances()
      }
    } catch (error) {
      console.log(error.message)
      setErrorMessage('Error updating maintenance job')
      setLoading(false)
    }
  }

  const handleMRFClick = (maintenance) => {
    setSelectedMaintenanceForMFR(maintenance)
    setOpenModalMFR(true)
  }

  const saveMFRToServer = async () => {
    if (!selectedMaintenanceForMFR) return
    
    try {
      setOpenModalMFR(false)
      setShowMfrSaveModal(true)
      setMfrSaveStatus('saving')
      setMfrSaveMessage('Generating MFR...')
      setMfrSaveDetails({ fileName: '', path: '' })

      const result = await generateMaintenanceRequestForm(selectedMaintenanceForMFR, true)
      
      if (!result) {
        setMfrSaveStatus('error')
        setMfrSaveMessage('Failed to generate MFR')
        return
      }

      const { blob, fileName } = result

      setSaveMessage('Saving to server...')
      setSaveDetails(prev => ({ ...prev, fileName }))

      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('fileServerPath', 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)\\MRF Forms')

      const response = await fetch('/api/file/save-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMfrSaveStatus('success')
        setMfrSaveMessage('Success！')
        setMfrSaveDetails({
          fileName,
          path: data.path || 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)\\MRF Forms'
        })
      } else {
        setMfrSaveStatus('error')
        setMfrSaveMessage(`Failed: ${data.message || 'Error'}`)
        setMfrSaveDetails({
          fileName,
          path: 'Failed'
        })
      }

    } catch (error) {
      console.error('Error saving MFR to server:', error)
      setMfrSaveStatus('error')
      setMfrSaveMessage('Error saving to server')
      setMfrSaveDetails({
        fileName: 'unknown',
        path: 'error'
      })
    }
  }

  const handleManualMFRDownload = async () => {
    if (!selectedMaintenanceForMFR) return
    
    try {
      await generateMaintenanceRequestForm(selectedMaintenanceForMFR, false)
      setOpenModalMFR(false)
      setShowMfrSaveModal(false)
    } catch (error) {
      console.error('Error downloading MFR:', error)
      setMfrSaveStatus('error')
      setMfrSaveMessage('Failed to download')
    }
  }

  const closeMfrSaveModal = () => {
    setShowMfrSaveModal(false)
    setTimeout(() => {
      setMfrSaveStatus('')
      setMfrSaveMessage('')
      setMfrSaveDetails({ fileName: '', path: '' })
    }, 300)
  }

  const setupWorksheetPrint = (worksheet, options = {}) => {
    const {
      paperSize = 9,
      orientation = 'portrait',
      margins = {
        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.25,
        header: 0.3,
        footer: 0.3
      },
      horizontalCentered = true,
      verticalCentered = true,
      fitToPage = true,
      fitToHeight = 1,
      fitToWidth = 1,
      scale = 100
    } = options

    worksheet.pageSetup = {
      paperSize,
      orientation,
      margins,
      horizontalCentered,
      verticalCentered,
      fitToPage,
      fitToHeight,
      fitToWidth,
      scale,
      showGridLines: false,
      blackAndWhite: false
    }
  }

  const generateMaintenanceRequestForm = async (maintenance, returnBlob = false) => {
    const formatDateTimeForMRF = (dateTimeString) => {
      if (!dateTimeString) return '';
      
      try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return dateTimeString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (error) {
        return dateTimeString;
      }
    };
      
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Maintenance Request Form')
      
    setupWorksheetPrint(worksheet, {
      fitToHeight: 1,
      fitToWidth: 1,
      horizontalCentered: true,
      verticalCentered: true,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    })
      
    worksheet.columns = [
      { width: 4.45 },
      { width: 40.67 },
      { width: 19.34 },
      { width: 30 }
    ]

    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    const smallFont = { name: 'Arial', size: 8 }
    const defaultFont = { name: 'Arial', size: 10 }
    const titleFont = { name: 'Arial', size: 18, bold: true }
    const headerFont = { name: 'Arial', size: 10, bold: true }

    let rowIndex = 1
      
    const row1 = worksheet.getRow(rowIndex++)
    row1.height = 16.5
    row1.getCell(1).value = 'Bold Vision Sdn Bhd'
    row1.getCell(4).value = 'BV-F09-01'
    row1.getCell(1).font = { ...defaultFont, bold: true }
    row1.getCell(4).font = { ...smallFont, bold: true }
    row1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    row1.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
    worksheet.mergeCells(`A${row1.number}:C${row1.number}`)
      
    const row2 = worksheet.getRow(rowIndex++)
    row2.height = 17.3
    row2.getCell(4).value = 'Rev.20170612'
    row2.getCell(4).font = smallFont
    row2.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
      
    const row3 = worksheet.getRow(rowIndex++)
    row3.height = 29.3
    row3.getCell(1).value = 'MAINTENANCE REQUEST FORM'
    row3.getCell(1).font = titleFont
    row3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.mergeCells(`A${row3.number}:D${row3.number}`)
      
    const row4 = worksheet.getRow(rowIndex++)
    row4.height = 16.5
    row4.getCell(1).value = 'REQUESTED BY:'
    row4.getCell(3).value = 'DATE / TIME:'
    row4.getCell(1).font = headerFont
    row4.getCell(3).font = headerFont
    worksheet.mergeCells(`A${row4.number}:B${row4.number}`)
    worksheet.mergeCells(`C${row4.number}:D${row4.number}`)
      
    const row5 = worksheet.getRow(rowIndex++)
    row5.height = 16.5
    row5.getCell(1).value = maintenance.requestby || 'N/A'
    row5.getCell(1).font = defaultFont
    row5.getCell(3).value = formatDateTimeForMRF(maintenance.jobdate) || 'N/A'
    row5.getCell(3).font = defaultFont
    worksheet.mergeCells(`A${row5.number}:B${row5.number}`)
    worksheet.mergeCells(`C${row5.number}:D${row5.number}`)
      
    const row6 = worksheet.getRow(rowIndex++)
    row6.height = 16.5
    row6.getCell(1).value = 'MACHINE / ITEM:'
    row6.getCell(1).font = headerFont
    worksheet.mergeCells(`A${row6.number}:D${row6.number}`)
      
    const row7 = worksheet.getRow(rowIndex++)
    row7.height = 16.5
    const itemInfo = `${maintenance.code} - ${maintenance.jobtype || 'Maintenance Item'}`
    row7.getCell(1).value = itemInfo
    row7.getCell(1).font = defaultFont
    worksheet.mergeCells(`A${row7.number}:D${row7.number}`)
      
    const row8 = worksheet.getRow(rowIndex++)
    row8.height = 16.5
    row8.getCell(1).value = 'NO.'
    row8.getCell(2).value = 'PROBLEM DESCRIPTION:'
    row8.getCell(1).font = headerFont
    row8.getCell(2).font = headerFont
    worksheet.mergeCells(`B${row8.number}:D${row8.number}`)

    const row9 = worksheet.getRow(rowIndex++)
    row9.height = 16.5
    worksheet.mergeCells(`A${row9.number}:A${row9.number + 2}`)
    worksheet.mergeCells(`B${row9.number}:D${row9.number + 2}`)
    row9.getCell(2).value = maintenance.problem || 'No problem description provided'
    row9.getCell(2).font = defaultFont
    row9.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      
    const row10 = worksheet.getRow(rowIndex++)
    row10.height = 16.5
    const row11 = worksheet.getRow(rowIndex++)
    row11.height = 16.5
      
    const row12 = worksheet.getRow(rowIndex++)
    row12.height = 16.5
    row12.getCell(1).value = 'ATTENDED BY:'
    row12.getCell(3).value = 'DATE / TIME:'
    row12.getCell(1).font = headerFont
    row12.getCell(3).font = headerFont
    worksheet.mergeCells(`A${row12.number}:B${row12.number}`)
    worksheet.mergeCells(`C${row12.number}:D${row12.number}`)
      
    const row13 = worksheet.getRow(rowIndex++)
    row13.height = 16.5
    row13.getCell(1).value = maintenance.supplier || 'N/A'
    row13.getCell(1).font = defaultFont
    row13.getCell(3).value = formatDateTimeForMRF(maintenance.completiondate) || 'N/A'
    row13.getCell(3).font = defaultFont
    worksheet.mergeCells(`A${row13.number}:B${row13.number}`)
    worksheet.mergeCells(`C${row13.number}:D${row13.number}`)
      
    const row14 = worksheet.getRow(rowIndex++)
    row14.height = 16.5
    row14.getCell(1).value = 'NO.'
    row14.getCell(2).value = 'ROOT CAUSE:'
    row14.getCell(3).value = 'CORRECTIVE ACTION:'
    row14.getCell(1).font = headerFont
    row14.getCell(2).font = headerFont
    row14.getCell(3).font = headerFont
    worksheet.mergeCells(`C${row14.number}:D${row14.number}`)

    const row15 = worksheet.getRow(rowIndex++)
    row15.height = 16.5
    worksheet.mergeCells(`A${row15.number}:A${row15.number + 2}`)
    worksheet.mergeCells(`B${row15.number}:B${row15.number + 2}`)
    worksheet.mergeCells(`C${row15.number}:D${row15.number + 2}`)

    row15.getCell(2).value = maintenance.rootcause || 'N/A'
    row15.getCell(2).font = defaultFont
    row15.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    row15.getCell(3).value = maintenance.jobdetail || 'N/A'
    row15.getCell(3).font = defaultFont
    row15.getCell(3).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    const row16 = worksheet.getRow(rowIndex++)
    row16.height = 16.5
    const row17 = worksheet.getRow(rowIndex++)
    row17.height = 16.5
      
    const row18 = worksheet.getRow(rowIndex++)
    row18.height = 16.5
    row18.getCell(1).value = 'COMMENT ON PREVENTIVE ACTION (IF ANY)'
    row18.getCell(1).font = headerFont
    worksheet.mergeCells(`A${row18.number}:D${row18.number}`)

    const row19 = worksheet.getRow(rowIndex++)
    row19.height = 16.5
    worksheet.mergeCells(`A${row19.number}:D${row19.number + 2}`)
    row19.getCell(1).value = maintenance.commentPreventive || ''
    row19.getCell(1).font = defaultFont
    row19.getCell(1).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      
    const row20 = worksheet.getRow(rowIndex++)
    row20.height = 16.5
    const row21 = worksheet.getRow(rowIndex++)
    row21.height = 16.5
      
    const row22 = worksheet.getRow(rowIndex++)
    row22.height = 16.5
    row22.getCell(1).value = 'CHECKED BY REQUESTOR:'
    row22.getCell(3).value = 'VERIFIED BY HOD:'
    row22.getCell(1).font = headerFont
    row22.getCell(3).font = headerFont
    worksheet.mergeCells(`A${row22.number}:B${row22.number}`)
    worksheet.mergeCells(`C${row22.number}:D${row22.number}`)
      
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex + 1}`)
    worksheet.mergeCells(`C${rowIndex}:D${rowIndex + 1}`)

    for (let i = 0; i < 2; i++) {
      const row = worksheet.getRow(rowIndex++)
      row.height = 16.5
    }

    worksheet.getCell(`A${row22.number + 1}`).value = maintenance.checkedrequestorby || maintenance.requestby || ''
    worksheet.getCell(`A${row22.number + 1}`).font = defaultFont
    worksheet.getCell(`A${row22.number + 1}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

    worksheet.getCell(`C${row22.number + 1}`).value = maintenance.verifiedbyhod || ''
    worksheet.getCell(`C${row22.number + 1}`).font = defaultFont
    worksheet.getCell(`C${row22.number + 1}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      
    const row25 = worksheet.getRow(rowIndex++)
    row25.height = 16.5
    row25.getCell(1).value = 'STATUS'
    row25.getCell(3).value = 'COMMENT:'
    row25.getCell(1).font = headerFont
    row25.getCell(3).font = headerFont
    worksheet.mergeCells(`A${row25.number}:B${row25.number}`)
    worksheet.mergeCells(`C${row25.number}:D${row25.number}`)
    
    const checkMark = '  X  '
    const centerStyle = { horizontal: 'center', vertical: 'middle' }

    const row26 = worksheet.getRow(rowIndex++)
    row26.height = 16.5
    row26.getCell(2).value = 'Job completed satisfactory'
    row26.getCell(2).font = defaultFont
    
    if (maintenance.status && maintenance.status.toLowerCase().includes('satisfactory')) {
        row26.getCell(1).value = checkMark
        row26.getCell(1).alignment = centerStyle
        row26.getCell(1).font = { ...defaultFont, bold: true }
    }

    row26.getCell(1).border = borderStyle
    row26.getCell(2).border = borderStyle
    row26.getCell(3).border = borderStyle
    row26.getCell(4).border = borderStyle
      
    const row27 = worksheet.getRow(rowIndex++)
    row27.height = 16.5
    row27.getCell(2).value = 'Job completed and need follow-up'
    row27.getCell(2).font = defaultFont

    if (maintenance.status && maintenance.status.toLowerCase().includes('follow-up')) {
        row27.getCell(1).value = checkMark
        row27.getCell(1).alignment = centerStyle
        row27.getCell(1).font = { ...defaultFont, bold: true }
    }

    row27.getCell(1).border = borderStyle
    row27.getCell(2).border = borderStyle
    row27.getCell(3).border = borderStyle
    row27.getCell(4).border = borderStyle
      
    const row28 = worksheet.getRow(rowIndex++)
    row28.height = 16.5
    row28.getCell(2).value = 'Job not completed'
    row28.getCell(2).font = defaultFont

    if (maintenance.status && maintenance.status.toLowerCase().includes('incomplete')) {
        row28.getCell(1).value = checkMark
        row28.getCell(1).alignment = centerStyle
        row28.getCell(1).font = { ...defaultFont, bold: true }
    }

    row28.getCell(1).border = borderStyle
    row28.getCell(2).border = borderStyle
    row28.getCell(3).border = borderStyle
    row28.getCell(4).border = borderStyle
      
    const row29 = worksheet.getRow(rowIndex++)
    row29.height = 16.5
    worksheet.mergeCells(`A${row29.number}:B${row29.number}`)

    worksheet.mergeCells(`C${row26.number}:D${row29.number}`)
    row26.getCell(3).value = maintenance.comment || ''
    row26.getCell(3).font = defaultFont
    row26.getCell(3).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      
    const row30 = worksheet.getRow(rowIndex++)
    row30.height = 16.5
    row30.getCell(1).value = 'Retention Period: 2 years'
    row30.getCell(3).value = 'Disposition Method: Recycle or dispose it into dustbin'
    row30.getCell(1).font = smallFont
    row30.getCell(3).font = smallFont
    row30.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
    worksheet.mergeCells(`A${row30.number}:B${row30.number}`)
    worksheet.mergeCells(`C${row30.number}:D${row30.number}`)

    for (let i = 1; i <= rowIndex; i++) {
      if (i === 1 || i === 2 || i === 30) {
        continue
      }
      
      const row = worksheet.getRow(i)
      for (let j = 1; j <= 4; j++) {
        const cell = row.getCell(j)
        if (cell.value !== undefined || worksheet.getCell(cell.address).isMerged) {
          cell.border = borderStyle
          if (!cell.alignment) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
      
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '_')
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')
      
    const fileName = `Maintenance_Request_Form_${maintenance.code}_${dateStr}_${timeStr}.xlsx`
      
    if (returnBlob) {
      return { blob, fileName }
    } else {
      saveAs(blob, fileName)
      return null
    }
  }

  const generateExcelReport = async (returnBlob = false) => {
    try {
      const workbook = new ExcelJS.Workbook()
      
      const reportDate = new Date();
      const dateStr = reportDate.toISOString().split('T')[0];
      const timeStr = reportDate.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
      
      const worksheet = workbook.addWorksheet(`Maintenance Jobs Report ${dateStr}`)
      
      setupWorksheetPrint(worksheet, {
        paperSize: 9,
        orientation: 'landscape',
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        },
        horizontalCentered: true,
        verticalCentered: false,
        fitToPage: true,
        fitToHeight: 1,
        fitToWidth: 1,
        scale: 100
      })
      
      worksheet.columns = [
        { width: 5 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 25 },
        { width: 25 },
        { width: 20 },
        { width: 20 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 25 },
        { width: 25 },
        { width: 35 },
        { width: 20 },
        { width: 20 }
      ]

      const headerFont = { name: 'Calibri', size: 11, bold: true }
      const titleFont = { name: 'Arial Black', size: 16, bold: true }
      const defaultFont = { name: 'Calibri', size: 11 }
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      const centerAlignment = { horizontal: 'center', vertical: 'middle' }
      const leftAlignment = { horizontal: 'left', vertical: 'middle' }
      const rightAlignment = { horizontal: 'right', vertical: 'middle' }

      const titleRow = worksheet.getRow(1)
      titleRow.height = 30
      titleRow.getCell(1).value = 'MAINTENANCE JOBS REPORT'
      titleRow.getCell(1).font = titleFont
      titleRow.getCell(1).alignment = centerAlignment
      worksheet.mergeCells('A1:S1')

      const generatedRow = worksheet.getRow(2)
      generatedRow.height = 20
      generatedRow.getCell(1).value = `Generated on: ${reportDate.toLocaleString()}`
      generatedRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true }
      generatedRow.getCell(1).alignment = leftAlignment
      worksheet.mergeCells('A2:S2')

      const filterRow = worksheet.getRow(3)
      filterRow.height = 20
      
      if (searchTerm) {
        filterRow.getCell(1).value = `Filter: "${searchTerm}"`
        worksheet.mergeCells('A3:S3')
        filterRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true }
        filterRow.getCell(1).alignment = leftAlignment
        filterRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCC' }
        }
        filterRow.getCell(1).border = {
          bottom: { style: 'thin' }
        }
      }

      const headerRowNum = searchTerm ? 4 : 3
      
      const headerRow = worksheet.getRow(headerRowNum)
      headerRow.height = 25
      const headers = [
        'No.', 'Job Date', 'Job Type', 'Item Code', 'Problem', 
        'Job Detail', 'Root Cause', 'Supplier', 'Cost', 'Completion Date',
        'Job Time', 'Request By', 'Checked By Requestor', 'Verified By HOD',
        'Comment Preventive', 'Comment', 'Status', 'Created At', 'Updated At'
      ]
      
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = headerFont
        cell.alignment = centerAlignment
        cell.border = borderStyle
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
      })

      const formatDateTimeForExcel = (dateTimeString) => {
        if (!dateTimeString) return '';
        
        try {
          const date = new Date(dateTimeString);
          if (isNaN(date.getTime())) return dateTimeString;
          
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
          return dateTimeString;
        }
      };

      const excelData = maintenances.map(maintenance => ({
        'Job Date': formatDateTimeForExcel(maintenance.jobdate),
        'Job Type': maintenance.jobtype,
        'Item Code': maintenance.code,
        'Problem': maintenance.problem,
        'Job Detail': maintenance.jobdetail,
        'Root Cause': maintenance.rootcause,
        'Supplier': maintenance.supplier,
        'Cost': Number(maintenance.cost) || 0,
        'Completion Date': formatDateTimeForExcel(maintenance.completiondate),
        'Job Time': formatDurationForExcel(maintenance.jobtime),
        'Request By': maintenance.requestby || '',
        'Checked By Requestor': maintenance.checkedrequestorby || maintenance.requestby || '',
        'Verified By HOD': maintenance.verifiedbyhod || '',
        'Comment Preventive': maintenance.commentPreventive || '',
        'Comment': maintenance.comment || '',
        'Status': maintenance.status,
        'Created At': new Date(maintenance.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', ''),
        'Updated At': new Date(maintenance.updatedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', '')
      }))

      let rowIndex = headerRowNum + 1
      let totalCost = 0
      let totalJobTime = 0
      
      excelData.forEach((maintenance, index) => {
        const row = worksheet.getRow(rowIndex)
        row.height = 20
        
        totalCost += maintenance.Cost
        totalJobTime += (maintenances[index].jobtime || 0)
        
        const rowData = [
          index + 1,
          maintenance['Job Date'],
          maintenance['Job Type'],
          maintenance['Item Code'],
          maintenance.Problem,
          maintenance['Job Detail'],
          maintenance['Root Cause'],
          maintenance.Supplier,
          maintenance.Cost,
          maintenance['Completion Date'],
          maintenance['Job Time'],
          maintenance['Request By'],
          maintenance['Checked By Requestor'],
          maintenance['Verified By HOD'],
          maintenance['Comment Preventive'],
          maintenance['Comment'],
          maintenance.Status,
          maintenance['Created At'],
          maintenance['Updated At']
        ]

        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1)
          cell.value = value
          cell.font = defaultFont
          cell.border = borderStyle
          
          if (colIndex === 0 || colIndex === 8) {
            cell.alignment = rightAlignment
          } else if (colIndex === 16) {
            cell.alignment = centerAlignment
          } else if (colIndex === 4 || colIndex === 5 || colIndex === 6 || colIndex === 14 || colIndex === 15) {
            cell.alignment = leftAlignment
          } else {
            cell.alignment = centerAlignment
          }
          
          if (colIndex === 8) {
            cell.numFmt = '#,##0.00'
          }

          if (colIndex === 10) {
            const rawMinutes = maintenances[index].jobtime || 0;
            if (rawMinutes > 360) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FFFF0000' } };
            } else {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF0891B2' } };
            }
          }
          
          if (colIndex === 16) {
            const statusStr = value ? value.toString().toLowerCase() : '';
            
            if (statusStr.includes('satisfactory') || statusStr === 'complete') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC6EFCE' }
              }
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF006100' } }
            } else if (statusStr.includes('follow-up')) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEB9C' }
              }
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } }
            } else if (statusStr.includes('incomplete')) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC7CE' }
              }
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }
            }
          }
          
          if (colIndex === 8) {
            const cost = Number(value) || 0
            if (cost > 10000) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C0006' } }
            } else if (cost > 5000) {
              cell.font = { ...defaultFont, bold: true, color: { argb: 'FF9C5700' } }
            }
          }
          
          if (rowIndex % 2 === 0) {
            if (colIndex !== 16 && colIndex !== 8) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F8F8' }
              }
            }
          }
        })

        rowIndex++
      })

      const summaryRow = worksheet.getRow(rowIndex)
      summaryRow.height = 25
      
      summaryRow.getCell(1).value = 'Total'
      summaryRow.getCell(1).font = { ...defaultFont, bold: true }
      summaryRow.getCell(1).alignment = rightAlignment
      
      summaryRow.getCell(8).value = totalCost
      summaryRow.getCell(8).font = { ...defaultFont, bold: true }
      summaryRow.getCell(8).alignment = rightAlignment
      summaryRow.getCell(8).numFmt = '#,##0.00'
      summaryRow.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      }
      
      summaryRow.getCell(10).value = formatDurationForExcel(totalJobTime)
      summaryRow.getCell(10).font = { ...defaultFont, bold: true }
      summaryRow.getCell(10).alignment = centerAlignment
      summaryRow.getCell(10).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      }
      
      worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`)
      
      rowIndex++

      if (excelData.length === 0) {
        const row = worksheet.getRow(rowIndex)
        row.getCell(1).value = 'No maintenance job data available'
        worksheet.mergeCells(`A${rowIndex}:S${rowIndex}`)
        row.getCell(1).alignment = centerAlignment
        row.getCell(1).font = { ...defaultFont, italic: true, color: { argb: 'FFFF0000' } }
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' }
        }
        row.getCell(1).border = borderStyle
        rowIndex++
      }

      if (excelData.length > 0) {
        const filterRange = `A${headerRowNum}:S${rowIndex - 1}`
        worksheet.autoFilter = filterRange
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const fileName = `Maintenance_Jobs_Report_${dateStr}_${timeStr}.xlsx`
      
      if (returnBlob) {
        return { blob, fileName }
      } else {
        saveAs(blob, fileName)
        return null
      }

    } catch (error) {
      console.error('Error generating Excel report:', error)
      if (!returnBlob) {
        alert('Failed to generate Excel report. Please try again.')
      }
      throw error
    }
  }

  const saveToFileServer = async () => {
    try {
      setShowSaveModal(true)
      setSaveStatus('saving')
      setSaveMessage('Generating.')
      setSaveDetails({ fileName: '', path: '' })

      const result = await generateExcelReport(true)
      const { blob, fileName } = result

      setSaveMessage('Saving.')
      setSaveDetails(prev => ({ ...prev, fileName }))

      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('fileServerPath', 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)')

      const response = await fetch('/api/file/save-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSaveStatus('success')
        setSaveMessage('Success！')
        setSaveDetails({
          fileName,
          path: data.path || 'Z:\\Document\\FACTORY DEPT\\Maintenance Department (MAINT)'
        })

      } else {
        setSaveStatus('error')
        setSaveMessage(`Failed: ${data.message || 'Error'}`)
        setSaveDetails({
          fileName,
          path: 'Failed'
        })
      }

    } catch (error) {
      console.error('Error saving to file server:', error)
      setSaveStatus('error')
      setSaveMessage('error')
      setSaveDetails({
        fileName: 'unknown',
        path: 'error'
      })
    }
  }

  const handleDownloadReport = async () => {
    try {
      await generateExcelReport(false)
    } catch (error) {
      console.error('Error downloading report:', error)
      setErrorMessage('Failed to download report. Please try again.')
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
    setCurrentPage(1)
  }

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return new Date(0)
    
    if (dateTimeStr.includes('T') && dateTimeStr.includes('Z')) {
        return new Date(dateTimeStr)
    }
    
    return new Date(dateTimeStr.replace(' ', 'T'))
  }

  const filteredMaintenances = maintenances
    .filter(maintenance => 
      (maintenance.supplier || '').toLowerCase().includes(searchTerm) || 
      String(maintenance.cost || '').toLowerCase().includes(searchTerm) ||
      (maintenance.problem || '').toLowerCase().includes(searchTerm) ||
      (maintenance.jobdetail || '').toLowerCase().includes(searchTerm) ||
      (maintenance.jobtype || '').toLowerCase().includes(searchTerm) ||
      (maintenance.jobdate || '').toLowerCase().includes(searchTerm) ||
      (maintenance.rootcause || '').toLowerCase().includes(searchTerm) ||
      (maintenance.status || '').toLowerCase().includes(searchTerm) ||
      (maintenance.completiondate || '').toLowerCase().includes(searchTerm) ||
      (maintenance.requestby || '').toLowerCase().includes(searchTerm) ||
      (maintenance.checkedrequestorby || '').toLowerCase().includes(searchTerm) ||
      (maintenance.verifiedbyhod || '').toLowerCase().includes(searchTerm) ||
      (maintenance.commentPreventive || '').toLowerCase().includes(searchTerm) ||
      (maintenance.comment || '').toLowerCase().includes(searchTerm) ||
      ((maintenance.code || '').toLowerCase().includes(searchTerm) && String(maintenance.code || '').toLowerCase() === searchTerm)
    )
    .sort((a, b) => {
        if (sortBy === 'cost') {
             const costA = Number(a.cost) || 0;
             const costB = Number(b.cost) || 0;
             if (sortOrder === 'asc') return costA - costB;
             return costB - costA;
        }

        const dateA = sortBy === 'updatedAt' ? new Date(a.updatedAt) : parseDateTime(a[sortBy])
        const dateB = sortBy === 'updatedAt' ? new Date(b.updatedAt) : parseDateTime(b[sortBy])

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
  const currentMaintenances = filteredMaintenances.slice(indexOfFirstItem, indexOfLastItem)
  const totalEntries = filteredMaintenances.length
  const showingFrom = totalEntries === 0 ? 0 : indexOfFirstItem + 1
  const showingTo = Math.min(indexOfLastItem, totalEntries)
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPage))

  const MobileSimplePagination = () => (
    <div className="flex items-center justify-center space-x-4">
      <Button
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </Button>
      <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
        {currentPage} / {totalPages}
      </span>
      <Button
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )

  const MaintenanceCard = ({ maintenance }) => (
    <div className={`rounded-lg border p-4 shadow-sm ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Job Date</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{formatDateTimeForDisplay(maintenance.jobdate)}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Job Type</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.jobtype}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Item</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.code}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Supplier</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.supplier}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Completion date</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{formatDateTimeForDisplay(maintenance.completiondate)}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Job Time</p>
        <p className={`font-bold ${(maintenance.jobtime || 0) > 360 ? 'text-red-500' : 'text-green-500'}`}>{formatDuration(maintenance.jobtime)}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Status</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.status}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Request By</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.requestby || '-'}</p>
      </div>

      <div className="flex gap-2">
        <Button outline className='cursor-pointer flex-1 py-1 px-1 text-sm h-8' onClick={() => {handleUpdate(maintenance)}}>Edit</Button>
        <Button color='blue' outline className='cursor-pointer flex-1 py-1 px-1 text-sm h-8' onClick={() => handleMRFClick(maintenance)}>MRF</Button>
        <Button color='red' outline className='cursor-pointer flex-1 py-1 px-1 text-sm h-8' onClick={() => {setMaintenanceIdToDelete(maintenance._id);setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)}}>Delete</Button>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4'>
        <h1 className='text-2xl font-semibold'>Machine Maintenance History Record</h1>
        
        <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
           <div className='flex gap-2'>
                <Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className='w-full sm:w-40'
                >
                    <option value="jobdate">Job Date</option>
                    <option value="completiondate">Completion Date</option>
                    <option value="cost">Cost</option>
                    <option value="updatedAt">Updated Date</option>
                </Select>
                
                <Select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    className='w-full sm:w-32'
                >
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                </Select>
           </div>

           <TextInput
              type='text'
              placeholder='Search'
              value={searchTerm}
              onChange={handleSearch}
              className='w-full sm:w-52'
           />

           <div className='flex gap-2'>
                <Button 
                    className='cursor-pointer flex-1 sm:flex-none' 
                    onClick={handleCreateJob}
                    color='blue'
                >
                    Create
                </Button>
                <Button 
                    className='cursor-pointer flex-1 sm:flex-none' 
                    onClick={handleDownloadReport}
                    color='green'
                >
                    Report
                </Button>
                <Button 
                    className='cursor-pointer flex-1 sm:flex-none' 
                    onClick={confirmSaveToServer}
                    color='blue'
                >
                    Save
                </Button>
           </div>
        </div>
      </div>

      {!isMobile && (
        <Table hoverable className="[&_td]:py-1 [&_th]:py-2">
          <TableHead>
            <TableRow>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job date</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job type</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Completion date</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job Time</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>MRF</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentMaintenances.map((maintenance) => (
              <TableRow key={maintenance._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <TableCell className="align-middle">{formatDateTimeForDisplay(maintenance.jobdate)}</TableCell>
                <TableCell className="align-middle">
                  <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    content={
                      <div className="p-3 max-w-xs">
                        <p className="font-semibold text-sm">Job detail:</p>
                        <p className="text-xs mb-2">{maintenance.jobdetail}</p>
                      </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                  >
                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                      {maintenance.jobtype}
                    </span>
                  </Popover>
                </TableCell>
                <TableCell className="align-middle">
                  <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    content={
                      <div className="p-3 max-w-xs">
                        <p className="font-semibold text-sm">Problem:</p>
                        <p className="text-xs mb-2">{maintenance.problem}</p>
                        <p className="font-semibold text-sm">Root cause:</p>
                        <p className="text-xs mb-2">{maintenance.rootcause}</p>
                        <p className="font-semibold text-sm">Request By:</p>
                        <p className="text-xs mb-2">{maintenance.requestby || '-'}</p>
                        <p className="font-semibold text-sm">Verified By HOD:</p>
                        <p className="text-xs mb-2">{maintenance.verifiedbyhod || '-'}</p>
                        <p className="font-semibold text-sm">Preventive Comment:</p>
                        <p className="text-xs">{maintenance.commentPreventive || '-'}</p>
                      </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                  >
                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                      {maintenance.code}
                    </span>
                  </Popover>
                </TableCell>
                <TableCell className="align-middle">
                  <Popover className={`${theme === 'light' ? ' text-gray-900 bg-gray-200 hover:bg-gray-100' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    content={
                      <div className="p-3 max-w-xs">
                        <p className="font-semibold text-sm">Cost:</p>
                        <p className="text-xs mb-2">{maintenance.cost}</p>
                      </div>
                    }
                    trigger='hover'
                    placement="top"
                    arrow={false}
                  >
                    <span className="cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center h-full">
                      {maintenance.supplier}
                    </span>
                  </Popover>
                </TableCell>
                <TableCell className="align-middle">{formatDateTimeForDisplay(maintenance.completiondate)}</TableCell>
                <TableCell className={`align-middle font-bold ${(maintenance.jobtime || 0) > 360 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatDuration(maintenance.jobtime)}
                </TableCell>
                <TableCell className="align-middle">{maintenance.status}</TableCell>
                <TableCell className="align-middle">
                  <Button outline className='cursor-pointer py-1 px-1 text-sm h-8'  onClick={() => {handleUpdate(maintenance)}}>Edit</Button>
                </TableCell>
                <TableCell className="align-middle">
                  <Button color='blue' outline className='cursor-pointer py-1 px-1 text-sm h-8'
                    onClick={() => handleMRFClick(maintenance)}
                  >
                    MRF
                  </Button>
                </TableCell>
                <TableCell className="align-middle">
                  <Button color='red' outline className='cursor-pointer py-1 px-1 text-sm h-8'
                    onClick={() => {setMaintenanceIdToDelete(maintenance._id);setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)}}
                  >
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
          {currentMaintenances.map((maintenance) => (
            <MaintenanceCard key={maintenance._id} maintenance={maintenance} />
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

      <Modal show={openModalCreateJob} onClose={handleCreateJob} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Job</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job type</Label>
                <Select id="jobtype" className='mb-4' onChange={handleChange} onFocus={handleFocus} required value={formData.jobtype}>
                  <option></option>
                  <option>Breakdown</option>
                  <option>Kaizen</option>
                  <option>Inspect</option>
                  <option>Maintenance</option>
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required value={formData.code}>
                  <option></option>
                  {extruders.map((extruder) => (
                    <option key={extruder._id} value={extruder.code}>{`EXTRUDER ${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                  ))}
                  {items.map((item) => (
                    <option key={item._id} value={item.code}>{`ITEM ${item.code} --- ${item.type} --- ${item.status}`}</option>
                  ))}
                  {spareparts.map((s) => (
                    <option key={s._id} value={s.code}>{`SPAREPART ${s.code} --- ${s.type} --- ${s.status}`}</option>
                  ))}
                  {others.map((o) => (
                    <option key={o._id} value={o.code}>{`OTHER ${o.code} --- ${o.type} --- ${o.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                <TextInput type='datetime-local' id="jobdate" value={formData.jobdate} onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                <Textarea id="problem" value={formData.problem} placeholder='Enter problem' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                <Textarea id="jobdetail" value={formData.jobdetail} placeholder='Enter job detail' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                <Textarea id="rootcause" value={formData.rootcause} placeholder='Enter root cause' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                <Select id="supplier" className='mb-4' onChange={handleChange} onFocus={handleFocus} required value={formData.supplier}>
                  <option></option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost</Label>
                <TextInput id="cost" value={formData.cost} type='number' min='0' placeholder='Enter cost' step='0.01' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Completion date</Label>
                <TextInput type='datetime-local' id="completiondate" value={formData.completiondate} onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Request By</Label>
                <TextInput
                  type='text'
                  id='requestby'
                  className='mb-4'
                  value={formData.requestby}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  required
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Verified By HOD</Label>
                <TextInput
                  type='text'
                  id='verifiedbyhod'
                  className='mb-4'
                  value={formData.verifiedbyhod}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  required
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Comment on Preventive Action</Label>
                <Textarea
                  id='commentPreventive'
                  className='mb-4'
                  rows={3}
                  value={formData.commentPreventive}
                  onChange={handleChange}
                  onFocus={handleFocus}
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Comment</Label>
                <Textarea
                  id='comment'
                  className='mb-4'
                  rows={3}
                  value={formData.comment}
                  onChange={handleChange}
                  onFocus={handleFocus}
                />
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required value={formData.status}>
                  <option></option>
                  <option>Minor Complete - Satisfactory</option>
                  <option>Minor Complete - Need Follow-up</option>
                  <option>Major Complete - Satisfactory</option>
                  <option>Major Complete - Need Follow-up</option>
                  <option>Minor Incomplete</option>
                  <option>Major Incomplete</option>
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

      <Modal show={openModalDeleteMaintenance} size="md" onClose={() => setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this maintenance job?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="red" onClick={handleDelete}>
                Yes, I'm sure
              </Button>
              <Button color="alternative" onClick={() => setOpenModalDeleteMaintenance(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={openModalUpdateMaintenance} onClose={() => setOpenModalUpdateMaintenance(false)} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}/>
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job type</Label>
                <Select value={updateFormData.jobtype} id="jobtype" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  <option>Breakdown</option>
                  <option>Kaizen</option>
                  <option>Inspect</option>
                  <option>Maintenance</option>
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                <Select value={updateFormData.code} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  {items.map((item) => (
                    <option key={item._id} value={item.code}>{`ITEM ${item.code} --- ${item.type} --- ${item.status}`}</option>
                  ))}
                  {spareparts.map((s) => (
                    <option key={s._id} value={s.code}>{`SPAREPART ${s.code} --- ${s.type} --- ${s.status}`}</option>
                  ))}
                  {extruders.map((extruder) => (
                    <option key={extruder._id} value={extruder.code}>{`EXTRUDER ${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                  ))}
                  {others.map((o) => (
                    <option key={o._id} value={o.code}>{`OTHER ${o.code} --- ${o.type} --- ${o.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                <TextInput value={updateFormData.jobdate} type='datetime-local' id="jobdate" onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                <Textarea value={updateFormData.problem} id="problem" placeholder='Enter problem' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                <Textarea value={updateFormData.jobdetail} id="jobdetail" placeholder='Enter job detail' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                <Textarea value={updateFormData.rootcause} id="rootcause" placeholder='Enter root cause' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                <Select value={updateFormData.supplier} id="supplier" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost</Label>
                <TextInput value={updateFormData.cost} id="cost" type='number' min='0' step='0.01' placeholder='Enter cost' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Completion date</Label>
                <TextInput value={updateFormData.completiondate} type='datetime-local' id="completiondate" onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Request By</Label>
                <TextInput
                  type='text'
                  id='requestby'
                  className='mb-4'
                  value={updateFormData.requestby}
                  onChange={handleUpdateChange}
                  onFocus={handleFocus}
                  required
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Verified By HOD</Label>
                <TextInput
                  type='text'
                  id='verifiedbyhod'
                  className='mb-4'
                  value={updateFormData.verifiedbyhod}
                  onChange={handleUpdateChange}
                  onFocus={handleFocus}
                  required
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Comment on Preventive Action</Label>
                <Textarea
                  id='commentPreventive'
                  className='mb-4'
                  rows={3}
                  value={updateFormData.commentPreventive}
                  onChange={handleUpdateChange}
                  onFocus={handleFocus}
                />
              </div>

              <div className='mb-4 block'>
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Comment</Label>
                <Textarea
                  id='comment'
                  className='mb-4'
                  rows={3}
                  value={updateFormData.comment}
                  onChange={handleUpdateChange}
                  onFocus={handleFocus}
                />
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                <Select value={updateFormData.status} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  <option>Minor Complete - Satisfactory</option>
                  <option>Minor Complete - Need Follow-up</option>
                  <option>Major Complete - Satisfactory</option>
                  <option>Major Complete - Need Follow-up</option>
                  <option>Minor Incomplete</option>
                  <option>Major Incomplete</option>
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

      <Modal show={openModalMFR} onClose={() => setOpenModalMFR(false)} size="md">
        <ModalHeader>Maintenance Request Form</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              How would you like to generate the Maintenance Request Form?
            </p>
            
            {selectedMaintenanceForMFR && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-semibold">Selected Job:</p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Code:</span> {selectedMaintenanceForMFR.code}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Job Type:</span> {selectedMaintenanceForMFR.jobtype}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Problem:</span> {(selectedMaintenanceForMFR.problem || '').substring(0, 50)}...
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Job Date:</span> {formatDateTimeForDisplay(selectedMaintenanceForMFR.jobdate)}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Job Time:</span> {formatDuration(selectedMaintenanceForMFR.jobtime)}
                </p>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-semibold mb-2">Save Location:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)\MRF Forms
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className='cursor-pointer' color="blue" onClick={saveMFRToServer}>
            Save to Server
          </Button>
          <Button className='cursor-pointer' color="green" onClick={handleManualMFRDownload}>
            Download Manual
          </Button>
        </ModalFooter>
      </Modal>

      <Modal show={showMfrSaveModal} onClose={closeMfrSaveModal} popup size="md">
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              {mfrSaveStatus === 'saving' && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              )}
              {mfrSaveStatus === 'success' && (
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              {mfrSaveStatus === 'error' && (
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
            </div>
            
            <p className="text-center text-gray-700 dark:text-gray-300">
              {mfrSaveMessage}
            </p>
            
            {mfrSaveDetails.fileName && (
              <div className={`p-3 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'
              }`}>
                <p className="text-sm font-semibold mb-2">Document information:</p>
                
                <div className="mb-2">
                  <span className="text-sm font-medium">File name:</span>
                  <div className="text-sm mt-0.5 break-all break-words overflow-hidden">
                    {mfrSaveDetails.fileName}
                  </div>
                </div>
                
                {mfrSaveDetails.path && (
                  <div>
                    <span className="text-sm font-medium">File path:</span>
                    <div className="text-sm mt-0.5 break-all break-words overflow-hidden">
                      {mfrSaveDetails.path}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {mfrSaveStatus === 'error' && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Failed to save into server, Please save as manual into server
                </p>
                <div className="space-y-2">
                  <Button 
                    className='cursor-pointer'
                    fullSized 
                    color="blue" 
                    onClick={handleManualMFRDownload}
                  >
                    Download manual
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    File path: Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)\MRF Forms
                  </p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {mfrSaveStatus === 'saving' ? (
            <Button color="gray" disabled>
              Please wait...
            </Button>
          ) : (
            <Button 
              className='cursor-pointer'
              color='gray' 
              onClick={closeMfrSaveModal}
            >
              Cancel
            </Button>
          )}
        </ModalFooter>
      </Modal>

      <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} popup size="md">
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Save maintenance report to server?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="blue" onClick={executeSaveToServer}>
                Yes, save
              </Button>
              <Button color="alternative" onClick={() => setShowConfirmModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={showSaveModal} onClose={closeSaveModal} popup size="md">
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              {saveStatus === 'saving' && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              )}
              {saveStatus === 'success' && (
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
            </div>
            
            <p className="text-center text-gray-700 dark:text-gray-300">
              {saveMessage}
            </p>
            
            {saveDetails.fileName && (
              <div className={`p-3 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'
              }`}>
                <p className="text-sm font-semibold mb-2">Document information:</p>
                
                <div className="mb-2">
                  <span className="text-sm font-medium">File name:</span>
                  <div className="text-sm mt-0.5 break-all break-words overflow-hidden">
                    {saveDetails.fileName}
                  </div>
                </div>
                
                {saveDetails.path && (
                  <div>
                    <span className="text-sm font-medium">File path:</span>
                    <div className="text-sm mt-0.5 break-all break-words overflow-hidden">
                      {saveDetails.path}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Failed to save into server, Please save as manual into server
                </p>
                <div className="space-y-2">
                  <Button 
                    className='cursor-pointer'
                    fullSized 
                    color="blue" 
                    onClick={handleManualDownload}
                  >
                    Download manual
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    File path: Z:\Document\FACTORY DEPT\Maintenance Department (MAINT)
                  </p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {saveStatus === 'saving' ? (
            <Button color="gray" disabled>
              Please wait...
            </Button>
          ) : (
            <Button 
              className='cursor-pointer'
              color='gray' 
              onClick={closeSaveModal}
            >
              Cancel
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Maintenance