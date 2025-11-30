import { Alert, Button, Label, Modal, ModalBody, ModalHeader, Pagination, Popover, Select, Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiOutlineExclamationCircle } from "react-icons/hi";
import useUserstore from '../store'
import useThemeStore from '../themeStore';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const Maintenance = () => {

  const {theme} = useThemeStore()
  const {currentUser} = useUserstore()
  const [errorMessage,setErrorMessage] = useState(null)
  const [loading,setLoading] = useState(false)
  const [openModalCreateJob,setOpenModalCreateJob] = useState(false)
  const [openModalDeleteMaintenance,setOpenModalDeleteMaintenance] = useState(false)
  const [openModalUpdateMaintenance,setOpenModalUpdateMaintenance] = useState(false)
  const [formData,setFormData] = useState({})
  const [updateFormData,setUpdateFormData] = useState({})
  const [extruders,setExtruders] = useState([])
  const [items,setItems] = useState([])
  const [suppliers,setSuppliers] = useState([])
  const [maintenances,setMaintenances] = useState([])
  const [maintenanceIdToDelete,setMaintenanceIdToDelete] = useState('')
  const [maintenanceIdToUpdate,setMaintenanceIdToUpdate] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
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
          setMaintenances(data)
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
  }

  const handleFocus = () => {
    setErrorMessage(null)
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.id]:e.target.value.trim()})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/maintenance/job',{
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
        setOpenModalCreateJob(false)
        const fetchMaintenances = async () => {
          try {
            const res = await fetch('/api/maintenance/getmaintenances')
            const data = await res.json()
            if(data.success === false){
              console.log(data.message)
            }
            if(res.ok){
              setMaintenances(data)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchMaintenances()
      }
    } catch (error) {
      console.log(error.message)
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
    setUpdateFormData({jobdate: maintenance.jobdate, code: maintenance.code, problem:maintenance.problem,
      jobdetail:maintenance.jobdetail, rootcause: maintenance.rootcause, supplier:maintenance.supplier, status:maintenance.status,
      cost:maintenance.cost, completiondate:maintenance.completiondate, jobtype:maintenance.jobtype
    })
    setOpenModalUpdateMaintenance(!openModalUpdateMaintenance)
    setErrorMessage(null)
    setLoading(false)
  }

  const handleUpdateChange = (e) => {
    if(e.target.id === 'supplier' ||e.target.id === 'problem'||e.target.id === 'jobdetail' || e.target.id === 'rootcause'){
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value})
    }else{
      setUpdateFormData({...updateFormData, [e.target.id]: e.target.value.trim()})
    }
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/maintenance/update/${maintenanceIdToUpdate}`,{
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
        setOpenModalUpdateMaintenance(false)
        const fetchMaintenances = async () => {
          try {
            const res = await fetch('/api/maintenance/getmaintenances')
            const data = await res.json()
            if(res.ok){
              setMaintenances(data)
            }
          } catch (error) {
            console.log(error.message)
          }
        }
        fetchMaintenances()
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
    setCurrentPage(1)
  }

  const filteredMaintenances = maintenances.filter(maintenance => 
    maintenance.supplier.toLowerCase().includes(searchTerm) || 
    maintenance.cost.toString().toLowerCase().includes(searchTerm) ||
    maintenance.problem.toLowerCase().includes(searchTerm) ||
    maintenance.jobdetail.toLowerCase().includes(searchTerm) ||
    maintenance.jobtype.toLowerCase().includes(searchTerm) ||
    maintenance.jobdate.toLowerCase().includes(searchTerm) ||
    maintenance.rootcause.toLowerCase().includes(searchTerm) ||
    maintenance.status.toLowerCase().includes(searchTerm) ||
    maintenance.completiondate.toLowerCase().includes(searchTerm) ||
    maintenance.code.toLowerCase().includes(searchTerm) && maintenance.code.toString().toLowerCase() === searchTerm
  )

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

  // 生成维护请求表格Excel文件 - 使用exceljs
const generateMaintenanceRequestForm = async (maintenance) => {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook()
  
  // 创建工作表
  const worksheet = workbook.addWorksheet('Maintenance Request Form')
  
  // 设置列宽 - 根据您提供的精确列宽
  worksheet.columns = [
    { width: 4.45 },  // A列
    { width: 40.67 }, // B列  
    { width: 19.34 }, // C列
    { width: 30 }  // D列
  ]

  // 定义边框样式
  const borderStyle = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }

  // 定义字体样式
  const smallFont = { name: 'Arial', size: 8 }
  const defaultFont = { name: 'Arial', size: 10 }
  const boldFont = { name: 'Arial', size: 10, bold: true }
  const titleFont = { name: 'Arial', size: 18, bold: true }
  const headerFont = { name: 'Arial', size: 10, bold: true }

  // 创建第一张表格（有数据）
  let rowIndex = 1
  
  // 第1行: 公司名称和文档编号 - 字体大小8，行高18
  const row1 = worksheet.getRow(rowIndex++)
  row1.height = 16.5
  row1.getCell(1).value = 'Bold Vision Sdn Bhd'
  row1.getCell(4).value = 'BV-F09-01'
  row1.getCell(1).font = { ...defaultFont, bold: true }
  row1.getCell(4).font = { ...smallFont, bold: true }
  row1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  row1.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
  worksheet.mergeCells(`A${row1.number}:C${row1.number}`)
  
  // 第2行: 空行和修订号 - 字体大小8，行高19
  const row2 = worksheet.getRow(rowIndex++)
  row2.height = 17.3
  row2.getCell(4).value = 'Rev.20170612'
  row2.getCell(4).font = smallFont
  row2.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
  
  // 第3行: 标题 - 字体大小18，行高18
  const row3 = worksheet.getRow(rowIndex++)
  row3.height = 29.3
  row3.getCell(1).value = 'MAINTENANCE REQUEST FORM'
  row3.getCell(1).font = titleFont
  row3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.mergeCells(`A${row3.number}:D${row3.number}`)
  
  // 第4行: 请求人和日期/时间 - 字体大小10
  const row4 = worksheet.getRow(rowIndex++)
  row4.height = 16.5
  row4.getCell(1).value = 'REQUESTED BY:'
  row4.getCell(3).value = 'DATE / TIME:'
  row4.getCell(1).font = headerFont
  row4.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row4.number}:B${row4.number}`)
  worksheet.mergeCells(`C${row4.number}:D${row4.number}`)
  
  // 第5行: 填写请求人和日期/时间 - 字体大小10
  const row5 = worksheet.getRow(rowIndex++)
  row5.height = 16.5
  // A5-B5: 当前用户名
  row5.getCell(1).value = currentUser.username || 'N/A'
  row5.getCell(1).font = defaultFont
  // C5-D5: 作业日期
  row5.getCell(3).value = maintenance.jobdate || 'N/A'
  row5.getCell(3).font = defaultFont
  worksheet.mergeCells(`A${row5.number}:B${row5.number}`)
  worksheet.mergeCells(`C${row5.number}:D${row5.number}`)
  
  // 第6行: 机器/项目 - 字体大小10
  const row6 = worksheet.getRow(rowIndex++)
  row6.height = 16.5
  row6.getCell(1).value = 'MACHINE / ITEM:'
  row6.getCell(1).font = headerFont
  worksheet.mergeCells(`A${row6.number}:D${row6.number}`)
  
  // 第7行: 填写机器/项目 - 字体大小10
  const row7 = worksheet.getRow(rowIndex++)
  row7.height = 16.5
  // A7-D7: 项目代码和类型
  const itemInfo = `${maintenance.code} - ${maintenance.jobtype || 'Maintenance Item'}`
  row7.getCell(1).value = itemInfo
  row7.getCell(1).font = defaultFont
  worksheet.mergeCells(`A${row7.number}:D${row7.number}`)
  
  // 第8行: 编号和问题描述 - 字体大小10
  const row8 = worksheet.getRow(rowIndex++)
  row8.height = 16.5
  row8.getCell(1).value = 'NO.'
  row8.getCell(2).value = 'PROBLEM DESCRIPTION:'
  row8.getCell(1).font = headerFont
  row8.getCell(2).font = headerFont
  worksheet.mergeCells(`B${row8.number}:D${row8.number}`)

  // 第9-11行: 填写问题描述 - 字体大小10，合并单元格
  const row9 = worksheet.getRow(rowIndex++)
  row9.height = 16.5
  worksheet.mergeCells(`A${row9.number}:A${row9.number + 2}`)
  worksheet.mergeCells(`B${row9.number}:D${row9.number + 2}`)
  
  // 在B9单元格填写问题描述
  row9.getCell(2).value = maintenance.problem || 'No problem description provided'
  row9.getCell(2).font = defaultFont
  row9.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  
  // 设置第10-11行的行高
  const row10 = worksheet.getRow(rowIndex++)
  row10.height = 16.5
  const row11 = worksheet.getRow(rowIndex++)
  row11.height = 16.5
  
  // 第12行: 处理人和日期/时间 - 字体大小10
  const row12 = worksheet.getRow(rowIndex++)
  row12.height = 16.5
  row12.getCell(1).value = 'ATTENDED BY:'
  row12.getCell(3).value = 'DATE / TIME:'
  row12.getCell(1).font = headerFont
  row12.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row12.number}:B${row12.number}`)
  worksheet.mergeCells(`C${row12.number}:D${row12.number}`)
  
  // 第13行: 填写处理人和完成日期 - 字体大小10
  const row13 = worksheet.getRow(rowIndex++)
  row13.height = 16.5
  // A13-B13: 供应商
  row13.getCell(1).value = maintenance.supplier || 'N/A'
  row13.getCell(1).font = defaultFont
  // C13-D13: 完成日期
  row13.getCell(3).value = maintenance.completiondate || 'N/A'
  row13.getCell(3).font = defaultFont
  worksheet.mergeCells(`A${row13.number}:B${row13.number}`)
  worksheet.mergeCells(`C${row13.number}:D${row13.number}`)
  
  // 第14行: 编号、根本原因和纠正措施 - 字体大小10
  const row14 = worksheet.getRow(rowIndex++)
  row14.height = 16.5
  row14.getCell(1).value = 'NO.'
  row14.getCell(2).value = 'ROOT CAUSE:'
  row14.getCell(3).value = 'CORRECTIVE ACTION:'
  row14.getCell(1).font = headerFont
  row14.getCell(2).font = headerFont
  row14.getCell(3).font = headerFont
  worksheet.mergeCells(`C${row14.number}:D${row14.number}`)

  // 第15-17行: 填写根本原因和纠正措施 - 字体大小10，合并单元格
  const row15 = worksheet.getRow(rowIndex++)
  row15.height = 16.5
  worksheet.mergeCells(`A${row15.number}:A${row15.number + 2}`)
  worksheet.mergeCells(`B${row15.number}:B${row15.number + 2}`)
  worksheet.mergeCells(`C${row15.number}:D${row15.number + 2}`)

  // 在B15单元格填写根本原因
  row15.getCell(2).value = maintenance.rootcause || 'N/A'
  row15.getCell(2).font = defaultFont
  row15.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

  // 在C15单元格填写纠正措施
  row15.getCell(3).value = maintenance.jobdetail || 'N/A'
  row15.getCell(3).font = defaultFont
  row15.getCell(3).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

  // 设置第16-17行的行高
  const row16 = worksheet.getRow(rowIndex++)
  row16.height = 16.5
  const row17 = worksheet.getRow(rowIndex++)
  row17.height = 16.5
  
  // 第18行: 预防措施评论 - 字体大小10
  const row18 = worksheet.getRow(rowIndex++)
  row18.height = 16.5
  row18.getCell(1).value = 'COMMENT ON PREVENTIVE ACTION (IF ANY)'
  row18.getCell(1).font = headerFont
  worksheet.mergeCells(`A${row18.number}:D${row18.number}`)

  // 第19-21行: 空行用于填写预防措施评论 - 字体大小10，合并单元格
  const row19 = worksheet.getRow(rowIndex++)
  row19.height = 16.5
  worksheet.mergeCells(`A${row19.number}:D${row19.number + 2}`)
  
  // 设置第20-21行的行高
  const row20 = worksheet.getRow(rowIndex++)
  row20.height = 16.5
  const row21 = worksheet.getRow(rowIndex++)
  row21.height = 16.5
  
  // 第22行: 检查人和验证人 - 字体大小10
  const row22 = worksheet.getRow(rowIndex++)
  row22.height = 16.5
  row22.getCell(1).value = 'CHECKED BY REQUESTOR:'
  row22.getCell(3).value = 'VERIFIED BY HOD:'
  row22.getCell(1).font = headerFont
  row22.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row22.number}:B${row22.number}`)
  worksheet.mergeCells(`C${row22.number}:D${row22.number}`)
  
  // 第23-24行: 空行 - 字体大小10
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex + 1}`)
  worksheet.mergeCells(`C${rowIndex}:D${rowIndex + 1}`)

  for (let i = 0; i < 2; i++) {
    const row = worksheet.getRow(rowIndex++)
    row.height = 16.5
  }
  
  // 第25行: 状态和评论 - 字体大小10
  const row25 = worksheet.getRow(rowIndex++)
  row25.height = 16.5
  row25.getCell(1).value = 'STATUS'
  row25.getCell(3).value = 'COMMENT:'
  row25.getCell(1).font = headerFont
  row25.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row25.number}:B${row25.number}`)
  worksheet.mergeCells(`C${row25.number}:D${row25.number}`)
  
  // 第26-28行: 状态选项 - 字体大小10
  const row26 = worksheet.getRow(rowIndex++)
  row26.height = 16.5
  row26.getCell(2).value = 'Job completed satisfactory'
  row26.getCell(2).font = defaultFont
  row26.getCell(1).border = borderStyle
  row26.getCell(2).border = borderStyle
  row26.getCell(3).border = borderStyle
  row26.getCell(4).border = borderStyle
  
  const row27 = worksheet.getRow(rowIndex++)
  row27.height = 16.5
  row27.getCell(2).value = 'Job completed and need follow-up'
  row27.getCell(2).font = defaultFont
  row27.getCell(1).border = borderStyle
  row27.getCell(2).border = borderStyle
  row27.getCell(3).border = borderStyle
  row27.getCell(4).border = borderStyle
  
  const row28 = worksheet.getRow(rowIndex++)
  row28.height = 16.5
  row28.getCell(2).value = 'Job not completed'
  row28.getCell(2).font = defaultFont
  row28.getCell(1).border = borderStyle
  row28.getCell(2).border = borderStyle
  row28.getCell(3).border = borderStyle
  row28.getCell(4).border = borderStyle
  
  // 第29行: 空行 - 字体大小10
  const row29 = worksheet.getRow(rowIndex++)
  row29.height = 16.5
  worksheet.mergeCells(`A${row29.number}:B${row29.number}`)

  worksheet.mergeCells(`C${row26.number}:D${row29.number}`)
  
  // 第30行: 保留期限和处理方法 - 字体大小8
  const row30 = worksheet.getRow(rowIndex++)
  row30.height = 16.5
  row30.getCell(1).value = 'Retention Period: 2 years'
  row30.getCell(3).value = 'Disposition Method: Recycle or dispose it into dustbin'
  row30.getCell(1).font = smallFont
  row30.getCell(3).font = smallFont
  row30.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
  worksheet.mergeCells(`A${row30.number}:B${row30.number}`)
  worksheet.mergeCells(`C${row30.number}:D${row30.number}`)
  
  // 第31行: 空行 - 字体大小10
  const row31 = worksheet.getRow(rowIndex++)
  row31.height = 18

  // 创建第二张表格 (空白表格)
  // 第32行: 公司名称和文档编号 - 字体大小8，行高18
  const row32 = worksheet.getRow(rowIndex++)
  row32.height = 16.5
  row32.getCell(1).value = 'Bold Vision Sdn Bhd'
  row32.getCell(4).value = 'BV-F09-01'
  row32.getCell(1).font = { ...defaultFont, bold: true }
  row32.getCell(4).font = { ...smallFont, bold: true }
  row32.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  row32.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
  worksheet.mergeCells(`A${row32.number}:C${row32.number}`)
  
  // 第33行: 空行和修订号 - 字体大小8，行高19
  const row33 = worksheet.getRow(rowIndex++)
  row33.height = 17.3
  row33.getCell(4).value = 'Rev.20170612'
  row33.getCell(4).font = smallFont
  row33.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
  
  // 第34行: 标题 - 字体大小18，行高18
  const row34 = worksheet.getRow(rowIndex++)
  row34.height = 29.3
  row34.getCell(1).value = 'MAINTENANCE REQUEST FORM'
  row34.getCell(1).font = titleFont
  row34.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.mergeCells(`A${row34.number}:D${row34.number}`)
  
  // 第35行: 请求人和日期/时间 - 字体大小10
  const row35 = worksheet.getRow(rowIndex++)
  row35.height = 16.5
  row35.getCell(1).value = 'REQUESTED BY:'
  row35.getCell(3).value = 'DATE / TIME:'
  row35.getCell(1).font = headerFont
  row35.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row35.number}:B${row35.number}`)
  worksheet.mergeCells(`C${row35.number}:D${row35.number}`)
  
  // 第36行: 填写请求人和日期/时间 - 字体大小10（空白）
  const row36 = worksheet.getRow(rowIndex++)
  row36.height = 16.5
  // A36-B36: 当前用户名（空白）
  row36.getCell(1).value = ''
  row36.getCell(1).font = defaultFont
  // C36-D36: 作业日期（空白）
  row36.getCell(3).value = ''
  row36.getCell(3).font = defaultFont
  worksheet.mergeCells(`A${row36.number}:B${row36.number}`)
  worksheet.mergeCells(`C${row36.number}:D${row36.number}`)
  
  // 第37行: 机器/项目 - 字体大小10
  const row37 = worksheet.getRow(rowIndex++)
  row37.height = 16.5
  row37.getCell(1).value = 'MACHINE / ITEM:'
  row37.getCell(1).font = headerFont
  worksheet.mergeCells(`A${row37.number}:D${row37.number}`)
  
  // 第38行: 填写机器/项目 - 字体大小10（空白）
  const row38 = worksheet.getRow(rowIndex++)
  row38.height = 16.5
  // A38-D38: 项目代码和类型（空白）
  row38.getCell(1).value = ''
  row38.getCell(1).font = defaultFont
  worksheet.mergeCells(`A${row38.number}:D${row38.number}`)
  
  // 第39行: 编号和问题描述 - 字体大小10
  const row39 = worksheet.getRow(rowIndex++)
  row39.height = 16.5
  row39.getCell(1).value = 'NO.'
  row39.getCell(2).value = 'PROBLEM DESCRIPTION:'
  row39.getCell(1).font = headerFont
  row39.getCell(2).font = headerFont
  worksheet.mergeCells(`B${row39.number}:D${row39.number}`)

  // 第40-42行: 填写问题描述 - 字体大小10，合并单元格（空白）
  const row40 = worksheet.getRow(rowIndex++)
  row40.height = 16.5
  worksheet.mergeCells(`A${row40.number}:A${row40.number + 2}`)
  worksheet.mergeCells(`B${row40.number}:D${row40.number + 2}`)
  
  // 在B40单元格填写问题描述（空白）
  row40.getCell(2).value = ''
  row40.getCell(2).font = defaultFont
  row40.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  
  // 设置第41-42行的行高
  const row41 = worksheet.getRow(rowIndex++)
  row41.height = 16.5
  const row42 = worksheet.getRow(rowIndex++)
  row42.height = 16.5
  
  // 第43行: 处理人和日期/时间 - 字体大小10
  const row43 = worksheet.getRow(rowIndex++)
  row43.height = 16.5
  row43.getCell(1).value = 'ATTENDED BY:'
  row43.getCell(3).value = 'DATE / TIME:'
  row43.getCell(1).font = headerFont
  row43.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row43.number}:B${row43.number}`)
  worksheet.mergeCells(`C${row43.number}:D${row43.number}`)
  
  // 第44行: 填写处理人和完成日期 - 字体大小10（空白）
  const row44 = worksheet.getRow(rowIndex++)
  row44.height = 16.5
  // A44-B44: 供应商（空白）
  row44.getCell(1).value = ''
  row44.getCell(1).font = defaultFont
  // C44-D44: 完成日期（空白）
  row44.getCell(3).value = ''
  row44.getCell(3).font = defaultFont
  worksheet.mergeCells(`A${row44.number}:B${row44.number}`)
  worksheet.mergeCells(`C${row44.number}:D${row44.number}`)
  
  // 第45行: 编号、根本原因和纠正措施 - 字体大小10
  const row45 = worksheet.getRow(rowIndex++)
  row45.height = 16.5
  row45.getCell(1).value = 'NO.'
  row45.getCell(2).value = 'ROOT CAUSE:'
  row45.getCell(3).value = 'CORRECTIVE ACTION:'
  row45.getCell(1).font = headerFont
  row45.getCell(2).font = headerFont
  row45.getCell(3).font = headerFont
  worksheet.mergeCells(`C${row45.number}:D${row45.number}`)

  // 第46-48行: 填写根本原因和纠正措施 - 字体大小10，合并单元格（空白）
  const row46 = worksheet.getRow(rowIndex++)
  row46.height = 16.5
  worksheet.mergeCells(`A${row46.number}:A${row46.number + 2}`)
  worksheet.mergeCells(`B${row46.number}:B${row46.number + 2}`)
  worksheet.mergeCells(`C${row46.number}:D${row46.number + 2}`)

  // 在B46单元格填写根本原因（空白）
  row46.getCell(2).value = ''
  row46.getCell(2).font = defaultFont
  row46.getCell(2).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

  // 在C46单元格填写纠正措施（空白）
  row46.getCell(3).value = ''
  row46.getCell(3).font = defaultFont
  row46.getCell(3).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

  // 设置第47-48行的行高
  const row47 = worksheet.getRow(rowIndex++)
  row47.height = 16.5
  const row48 = worksheet.getRow(rowIndex++)
  row48.height = 16.5
  
  // 第49行: 预防措施评论 - 字体大小10
  const row49 = worksheet.getRow(rowIndex++)
  row49.height = 16.5
  row49.getCell(1).value = 'COMMENT ON PREVENTIVE ACTION (IF ANY)'
  row49.getCell(1).font = headerFont
  worksheet.mergeCells(`A${row49.number}:D${row49.number}`)

  // 第50-52行: 空行用于填写预防措施评论 - 字体大小10，合并单元格（空白）
  const row50 = worksheet.getRow(rowIndex++)
  row50.height = 16.5
  worksheet.mergeCells(`A${row50.number}:D${row50.number + 2}`)
  
  // 设置第51-52行的行高
  const row51 = worksheet.getRow(rowIndex++)
  row51.height = 16.5
  const row52 = worksheet.getRow(rowIndex++)
  row52.height = 16.5
  
  // 第53行: 检查人和验证人 - 字体大小10
  const row53 = worksheet.getRow(rowIndex++)
  row53.height = 16.5
  row53.getCell(1).value = 'CHECKED BY REQUESTOR:'
  row53.getCell(3).value = 'VERIFIED BY HOD:'
  row53.getCell(1).font = headerFont
  row53.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row53.number}:B${row53.number}`)
  worksheet.mergeCells(`C${row53.number}:D${row53.number}`)
  
  // 第54-55行: 空行 - 字体大小10
  worksheet.mergeCells(`A${rowIndex}:B${rowIndex + 1}`)
  worksheet.mergeCells(`C${rowIndex}:D${rowIndex + 1}`)

  for (let i = 0; i < 2; i++) {
    const row = worksheet.getRow(rowIndex++)
    row.height = 16.5
  }
  
  // 第56行: 状态和评论 - 字体大小10
  const row56 = worksheet.getRow(rowIndex++)
  row56.height = 16.5
  row56.getCell(1).value = 'STATUS'
  row56.getCell(3).value = 'COMMENT:'
  row56.getCell(1).font = headerFont
  row56.getCell(3).font = headerFont
  worksheet.mergeCells(`A${row56.number}:B${row56.number}`)
  worksheet.mergeCells(`C${row56.number}:D${row56.number}`)
  
  // 第57-59行: 状态选项 - 字体大小10
  const row57 = worksheet.getRow(rowIndex++)
  row57.height = 16.5
  row57.getCell(2).value = 'Job completed satisfactory'
  row57.getCell(2).font = defaultFont
  row57.getCell(1).border = borderStyle
  row57.getCell(2).border = borderStyle
  row57.getCell(3).border = borderStyle
  row57.getCell(4).border = borderStyle
  
  const row58 = worksheet.getRow(rowIndex++)
  row58.height = 16.5
  row58.getCell(2).value = 'Job completed and need follow-up'
  row58.getCell(2).font = defaultFont
  row58.getCell(1).border = borderStyle
  row58.getCell(2).border = borderStyle
  row58.getCell(3).border = borderStyle
  row58.getCell(4).border = borderStyle
  
  const row59 = worksheet.getRow(rowIndex++)
  row59.height = 16.5
  row59.getCell(2).value = 'Job not completed'
  row59.getCell(2).font = defaultFont
  row59.getCell(1).border = borderStyle
  row59.getCell(2).border = borderStyle
  row59.getCell(3).border = borderStyle
  row59.getCell(4).border = borderStyle
  
  // 第60行: 空行 - 字体大小10
  const row60 = worksheet.getRow(rowIndex++)
  row60.height = 16.5
  worksheet.mergeCells(`A${row60.number}:B${row60.number}`)

  worksheet.mergeCells(`C${row57.number}:D${row60.number}`)
  
  // 第61行: 保留期限和处理方法 - 字体大小8
  const row61 = worksheet.getRow(rowIndex++)
  row61.height = 16.5
  row61.getCell(1).value = 'Retention Period: 2 years'
  row61.getCell(3).value = 'Disposition Method: Recycle or dispose it into dustbin'
  row61.getCell(1).font = smallFont
  row61.getCell(3).font = smallFont
  row61.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
  worksheet.mergeCells(`A${row61.number}:B${row61.number}`)
  worksheet.mergeCells(`C${row61.number}:D${row61.number}`)

  // 为所有有内容的单元格添加边框，但跳过指定的行
  for (let i = 1; i <= rowIndex; i++) {
    if (i === 1 || i === 2 || i === 30 || i === 32 || i === 33 || i === 61) {
      continue
    }
    
    const row = worksheet.getRow(i)
    for (let j = 1; j <= 4; j++) {
      const cell = row.getCell(j)
      if (cell.value || worksheet.getCell(cell.address).isMerged) {
        cell.border = borderStyle
        cell.alignment = cell.alignment || { vertical: 'middle', horizontal: 'left', wrapText: true }
      }
    }
  }

  // 生成Excel文件并下载
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // 使用作业编号和日期作为文件名
  const date = new Date().toISOString().split('T')[0]
  saveAs(blob, `Maintenance_Request_Form_${maintenance.code}_${date}.xlsx`)
}

  // 生成Excel报告的函数
  const generateExcelReport = () => {
    // 准备Excel数据 - 包含所有维护作业字段
    const excelData = maintenances.map(maintenance => ({
      'Job Date': maintenance.jobdate,
      'Job Type': maintenance.jobtype,
      'Item Code': maintenance.code,
      'Problem': maintenance.problem,
      'Job Detail': maintenance.jobdetail,
      'Root Cause': maintenance.rootcause,
      'Supplier': maintenance.supplier,
      'Cost': maintenance.cost,
      'Completion Date': maintenance.completiondate,
      'Status': maintenance.status,
      'Created At': new Date(maintenance.createdAt).toLocaleString(),
      'Updated At': new Date(maintenance.updatedAt).toLocaleString()
    }))

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 12 }, // Job Date
      { wch: 15 }, // Job Type
      { wch: 15 }, // Item Code
      { wch: 25 }, // Problem
      { wch: 30 }, // Job Detail
      { wch: 25 }, // Root Cause
      { wch: 20 }, // Supplier
      { wch: 10 }, // Cost
      { wch: 15 }, // Completion Date
      { wch: 15 }, // Status
      { wch: 20 }, // Created At
      { wch: 20 }  // Updated At
    ]
    worksheet['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Jobs Report')
    
    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `Maintenance_Jobs_Report_${date}.xlsx`)
  }

  // 移动端简洁分页组件 - 只显示 Previous/Next
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
  const MaintenanceCard = ({ maintenance }) => (
    <div className={`p-4 mb-4 rounded-lg shadow transition-all duration-200 ${
      theme === 'light' 
        ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md' 
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md'
    }`}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">Job Date</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.jobdate}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Completion Date</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.completiondate}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Status</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.status}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">Cost</p>
          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.cost}</p>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Job Type</p>
        <Popover 
          className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
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
          <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
          }`}>
            {maintenance.jobtype}
          </span>
        </Popover>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Item Code</p>
        <Popover 
          className={`${theme === 'light' ? 'text-gray-900 bg-gray-200' : 'bg-gray-800 text-gray-300'}`}
          content={
            <div className="p-3 max-w-xs">
              <p className="font-semibold text-sm">Problem:</p>
              <p className="text-xs mb-2">{maintenance.problem}</p>
              <p className="font-semibold text-sm">Root cause:</p>
              <p className="text-xs mb-2">{maintenance.rootcause}</p>
            </div>
          }
          trigger='hover'
          placement="top"
          arrow={false}
        >
          <span className={`cursor-pointer hover:text-blue-600 transition-colors border-b border-dashed inline-flex items-center ${
            theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
          }`}>
            {maintenance.code}
          </span>
        </Popover>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-500">Supplier</p>
        <p className={`${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>{maintenance.supplier}</p>
      </div>

      <div className="flex gap-2">
        <Button 
          outline 
          className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
          onClick={() => handleUpdate(maintenance)}
        >
          Edit
        </Button>
        <Button 
          color='blue'
          outline 
          className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
          onClick={() => generateMaintenanceRequestForm(maintenance)}
        >
          MRF
        </Button>
        <Button 
          color='red' 
          outline 
          className='cursor-pointer flex-1 py-2 text-sm transition-all hover:scale-105' 
          onClick={() => {
            setMaintenanceIdToDelete(maintenance._id)
            setOpenModalDeleteMaintenance(!openModalDeleteMaintenance)
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
        <h1 className='text-2xl font-semibold'>Jobs</h1>
        <div className='w-full sm:w-auto'>
          <TextInput 
            placeholder='Enter searching' 
            value={searchTerm} 
            onChange={handleSearch}
            className='w-full'
          />
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Button className='cursor-pointer flex-1 sm:flex-none' onClick={handleCreateJob}>
            Create job
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
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job date</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Job type</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Item</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Supplier</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Completion date</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Status</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Edit</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>MRF</TableHeadCell>
              <TableHeadCell className={`${theme === 'light' ? 'bg-gray-400 text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Delete</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentMaintenances.map((maintenance) => (
              <TableRow key={maintenance._id} className={`${theme === 'light' ? ' text-gray-900 hover:bg-gray-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <TableCell className="align-middle">{maintenance.jobdate}</TableCell>
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
                <TableCell className="align-middle">{maintenance.completiondate}</TableCell>
                <TableCell className="align-middle">{maintenance.status}</TableCell>
                <TableCell className="align-middle">
                  <Button outline className='cursor-pointer py-1 px-1 text-sm h-8'  onClick={() => {handleUpdate(maintenance)}}>Edit</Button>
                </TableCell>
                <TableCell className="align-middle">
                  <Button color='blue' outline className='cursor-pointer py-1 px-1 text-sm h-8'
                    onClick={() => generateMaintenanceRequestForm(maintenance)}
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

      {/* 移动端卡片视图 */}
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

      {/* 模态框保持不变 */}
      <Modal show={openModalCreateJob} onClose={handleCreateJob} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`} />
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Create Job</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job type</Label>
                <Select id="jobtype" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option></option>
                  <option>Breakdown</option>
                  <option>Kaizen</option>
                  <option>Inspect</option>
                  <option>Maintenance</option>
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Item</Label>
                <Select id="code" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
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
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                <TextInput  type='date' id="jobdate"  onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                <TextInput id="problem" placeholder='Enter problem' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                <TextInput id="jobdetail" placeholder='Enter job detail' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                <TextInput id="rootcause" placeholder='Enter root cause' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Supplier</Label>
                <Select id="supplier" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option></option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.supplier}>{`${supplier.supplier} --- ${supplier.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Cost</Label>
                <TextInput id="cost" type='number' min='0' placeholder='Enter cost' step='0.01' onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Completion date</Label>
                <TextInput  type='date' id="completiondate"  onChange={handleChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                <Select id="status" className='mb-4' onChange={handleChange} onFocus={handleFocus} required>
                  <option></option>
                  <option>Minor Complete</option>
                  <option>Minor Incomplete</option>
                  <option>Major Complete</option>
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

      <Modal show={openModalUpdateMaintenance} onClose={handleUpdate} popup>
        <ModalHeader className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}/>
        <ModalBody className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>
          <div className="space-y-6">
            <h3 className={`font-medium text-xl ${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Update Job</h3>
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
                <Select  value={updateFormData.code} id="code" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  {items.map((item) => (
                    <option key={item._id} value={item.code}>{`${item.code} --- ${item.type} --- ${item.status}`}</option>
                  ))}
                  {extruders.map((extruder) => (
                    <option key={extruder._id} value={extruder.code}>{`${extruder.code} --- ${extruder.type} --- ${extruder.status}`}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job date</Label>
                <TextInput value={updateFormData.jobdate} type='date' id="jobdate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Problem</Label>
                <TextInput value={updateFormData.problem} id="problem" placeholder='Enter problem' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Job detail</Label>
                <TextInput value={updateFormData.jobdetail} id="jobdetail" placeholder='Enter job detail' onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Root cause</Label>
                <TextInput value={updateFormData.rootcause} id="rootcause" placeholder='Enter root cause' onChange={handleUpdateChange} onFocus={handleFocus} required/>
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
                <TextInput value={updateFormData.completiondate}  type='date' id="completiondate"  onChange={handleUpdateChange} onFocus={handleFocus} required/>
              </div>

              <div className="mb-4 block">
                <Label className={`${theme === 'light' ? '' : 'bg-gray-900 text-gray-50'}`}>Status</Label>
                <Select value={updateFormData.status} id="status" className='mb-4' onChange={handleUpdateChange} onFocus={handleFocus} required>
                  <option></option>
                  <option>Minor Complete</option>
                  <option>Minor Incomplete</option>
                  <option>Major Complete</option>
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
    </div>
  )
}

export default Maintenance