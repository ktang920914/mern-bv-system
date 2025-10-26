import { useEffect, useState } from "react"
import Header from "../components/Header"
import DashSidebar from "../components/Sidebar"
import { useLocation, useNavigate } from "react-router-dom"  // 添加 useNavigate
import Transactions from "../components/Transactions"
import Dashboard from "../components/Dashboard"
import Users from "../components/Users"
import Suppliers from "../components/Suppliers"
import Items from "../components/Items"
import ActivityLogs from "../components/ActivityLogs"
import Orders from "../components/Orders"
import Costs from "../components/Costs"
import Jobs from "../components/Jobs"
import Productivity from "../components/Productivity"
import useThemeStore from "../themeStore"
import Planning from "../components/Planning"
import Oee from "../components/Oee"
import Outputs from "../components/Outputs"
import Maintenance from "../components/Maintenance"
import Cases from "../components/Cases"
import Products from "../components/Products"
import Movement from "../components/Movement"
import Materials from "../components/Materials"
import Extruders from "../components/Extruders"
import ToDoListPreventive from "../components/ToDoListPreventive"
import Schedule from "../components/Schedule"

const Home = () => {
  const { theme } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()  // 添加 navigate
  const [tab, setTab] = useState('')

  // 添加重定向逻辑
  useEffect(() => {
    // 如果访问根路径 '/' 且没有 tab 参数，重定向到 Dashboard
    if (location.pathname === '/' && !location.search.includes('tab=')) {
      navigate('/?tab=Dashboard', { replace: true })
      return
    }
  }, [location, navigate])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabFromURL = urlParams.get('tab')
    if (tabFromURL) {
      setTab(tabFromURL)
    }
  }, [location.search])

  return (
    <div className="min-h-screen">
      <Header/>
      <div className="flex">
        <div className="hidden lg:block">
          <DashSidebar />
        </div>

        <div className="lg:hidden">
          <DashSidebar />
        </div>

        <div className={`flex-1 p-4 lg:ml-1 ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-600 text-gray-300'}`}>
          {tab === 'Dashboard' && <Dashboard/>}
          {tab === 'Jobs' && <Jobs/>}
          {tab === 'Productivity' && <Productivity/>}
          {tab === 'Planning' && <Planning/>}
          {tab === 'Oee' && <Oee/>}
          {tab === 'Outputs' && <Outputs/>}
          {tab === 'Suppliers' && <Suppliers/>}
          {tab === 'Orders' && <Orders/>}
          {tab === 'Costs' && <Costs/>}
          {tab === 'Extruders' && <Extruders/>}
          {tab === 'Items' && <Items/>}
          {tab === 'Transactions' && <Transactions/>}
          {tab === 'Maintenances' && <Maintenance/>}
          {tab === 'Cases' && <Cases/>}
          {tab === 'Schedule' && <Schedule/>}
          {tab === 'ToDoListPreventive' && <ToDoListPreventive/>}
          {tab === 'Products' && <Products/>}
          {tab === 'Materials' && <Materials/>}
          {tab === 'Movements' && <Movement/>}
          {tab === 'Users' && <Users/>}
          {tab === 'Logs' && <ActivityLogs/>}
        </div>
      </div>
    </div>
  )
}

export default Home