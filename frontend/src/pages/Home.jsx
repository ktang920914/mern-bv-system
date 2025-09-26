import { useEffect, useState } from "react"
import Header from "../components/Header"
import DashSidebar from "../components/Sidebar"
import { useLocation } from "react-router-dom"
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


const Home = () => {

  const {theme} = useThemeStore()
  const location = useLocation()
  const [tab,setTab] = useState('')

  useEffect(() =>{
    const urlParams = new URLSearchParams(location.search)
    const tabFromURL = urlParams.get('tab')
    if(tabFromURL){
      setTab(tabFromURL)
    }
  },[location.search])

  return (
    <div className="min-h-screen"/*className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}*/>
      <Header/>
      <div className="flex">
        <div className="hidden lg:block">
          <DashSidebar/>
        </div>

        <div className="lg:hidden">
          <DashSidebar />
        </div>

        <div className="flex-1 p-4 lg:ml-1">
          { tab === 'Dashboard' && <Dashboard/>}
          { tab === 'Jobs' && <Jobs/>}
          { tab === 'Productivity' && <Productivity/>}
          { tab === 'Planning' && <Planning/>}
          { tab === 'Oee' && <Oee/>}
          { tab === 'Outputs' && <Outputs/>}
          { tab === 'Suppliers' && <Suppliers/>}
          { tab === 'Orders' && <Orders/>}
          { tab === 'Costs' && <Costs/>}
          { tab === 'Items' && <Items/>}
          { tab === 'Transactions' && <Transactions/>}
          { tab === 'Maintenances' && <Maintenance/>}
          { tab === 'Cases' && <Cases/>}
          { tab === 'Products' && <Products/>}
          { tab === 'Materials' && <Materials/>}
          { tab === 'Movements' && <Movement/>}
          { tab === 'Users' && <Users/>}
          { tab === 'Logs' && <ActivityLogs/>}
        </div>
      </div>
    </div>
  )
}

export default Home