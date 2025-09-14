import { useState, useEffect } from "react";
import { Sidebar, SidebarCollapse, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react";
import { HiArrowSmRight, HiChartPie, HiShoppingBag, HiUser, HiMenu, HiX } from "react-icons/hi";
import { MdOutlineInventory } from "react-icons/md";
import { GrDocumentStore, GrHostMaintenance } from "react-icons/gr";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useUserstore from "../store";

const DashSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab,setTab] = useState('')
  const navigate = useNavigate();
  const location = useLocation()
  const {signOutSuccess} = useUserstore()
  const {currentUser} = useUserstore()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      const data = res.json()
      if (data.success === false) {
        console.log(data.message)
      }
      if (data.success !== false) {
        navigate('/login')
        signOutSuccess(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
      >
        {mobileOpen ? <HiX className="w-6 h-6 text-white" /> : <HiMenu className="w-6 h-6 text-white" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      <div className={`fixed lg:sticky top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out
        w-64 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <Sidebar aria-label="Sidebar with multi-level dropdown example" 
          className="h-full w-64"
        >

          <SidebarItems className="px-4">
            <SidebarItemGroup>
              <Link to='/?tab=Dashboard'>
                <SidebarItem  
                  icon={HiChartPie}
                  active={tab === 'Dashboard'} as='div'>
                  Dashboard
                </SidebarItem>
              </Link>
              
              <SidebarCollapse 
                icon={GrDocumentStore} 
                label="Analysis"
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Jobs'>
                  <SidebarItem active={tab === 'Jobs'} as='div'>Jobs</SidebarItem>
                </Link>
                <Link to='/?tab=Productivity'>
                  <SidebarItem active={tab === 'Productivity'} as='div'>Productivities</SidebarItem>
                </Link>
                <Link to='/?tab=Planning'>
                  <SidebarItem active={tab === 'Planning'} as='div'>Plannings</SidebarItem>
                </Link>
                <Link to='/?tab=Oee'>
                  <SidebarItem active={tab === 'Oee'} as='div'>OEEs</SidebarItem>
                </Link>
                <SidebarItem href="#">Outputs</SidebarItem>
              </SidebarCollapse>
              
              <SidebarCollapse 
                icon={HiShoppingBag} 
                label="Purchase"
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Suppliers'>
                  <SidebarItem active={tab === 'Suppliers'} as='div'>Suppliers</SidebarItem>
                </Link>
                <Link to='/?tab=Orders'>
                  <SidebarItem active={tab === 'Orders'} as='div'>Orders</SidebarItem>
                </Link>
                <Link to='/?tab=Costs'>
                  <SidebarItem active={tab === 'Costs'} as='div' >Costs</SidebarItem>
                </Link>
              </SidebarCollapse>
              
              <SidebarCollapse 
                icon={MdOutlineInventory} 
                label="Inventory"
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Items'>
                  <SidebarItem active={tab === 'Items'} as='div'>Items</SidebarItem>
                </Link>
                <Link to='/?tab=Transactions'>
                  <SidebarItem active={tab === 'Transactions'} as='div'>Transaction</SidebarItem>
                </Link>
              </SidebarCollapse>
              
              <SidebarItem 
                href="#" 
                icon={GrHostMaintenance}
              >
                Maintenance
              </SidebarItem>

              {currentUser.role === 'Admin' && (
              <SidebarCollapse 
                icon={HiUser} 
                label="Users"
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Users'>
                  <SidebarItem active={tab === 'Users'} as='div'>Setting</SidebarItem>
                </Link>
                <Link to='/?tab=Logs'>
                <SidebarItem active={tab === 'Logs'} as='div'>Activities Logs</SidebarItem>
                </Link>
              </SidebarCollapse>
              )}
              
              <SidebarItem className="cursor-pointer"
                onClick={handleLogout} 
                icon={HiArrowSmRight}
              >
                Logout
              </SidebarItem>
            </SidebarItemGroup>
          </SidebarItems>
        </Sidebar>
      </div>
    </>
  )
}

export default DashSidebar