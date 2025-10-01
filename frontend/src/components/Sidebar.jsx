import { useState, useEffect } from "react";
import { Sidebar, SidebarCollapse, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react";
import { HiArrowSmRight, HiChartPie, HiMenu, HiX } from "react-icons/hi";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";
import { GrDocumentUser } from "react-icons/gr";
import { MdOutlineInventory } from "react-icons/md";
import { GrDocumentStore, GrHostMaintenance, GrDocumentVerified} from "react-icons/gr";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useUserstore from "../store";
import useThemeStore from "../themeStore";

const DashSidebar = () => {
  const { theme } = useThemeStore(); // 修正调用方式
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { signOutSuccess, currentUser } = useUserstore();

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
      });
      const data = await res.json(); // 添加 await
      if (data.success === false) {
        console.log(data.message);
      } else {
        navigate('/login');
        signOutSuccess(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  // 主题样式配置
  const themeStyles = {
    light: {
      sidebar: 'bg-gray-50 text-gray-900',
      button: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      item: 'text-gray-700 hover:bg-gray-200',
      itemActive: 'bg-blue-100 text-blue-700',
      collapse: 'text-gray-700 hover:bg-gray-100'
    },
    dark: {
      sidebar: 'bg-gray-900 text-gray-200 hover:text-gray-200',
      button: 'bg-gray-700 text-white hover:bg-gray-600',
      item: 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-800',
      itemActive: 'bg-gray-500 text-gray-100 hover:text-gray-100 hover:bg-gray-500',
      collapse: 'bg-gray-700 text-gray-100 hover:bg-gray-700 hover:text-gray-200',
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles.light;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className={`lg:hidden fixed top-3 left-4 z-50 p-2 rounded-md transition-colors ${currentTheme.button}`}
      >
        {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
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
        <Sidebar 
          aria-label="Sidebar with multi-level dropdown example" 
          className={`dash-sidebar h-full w-64 border-r ${currentTheme.sidebar}`}
        >
          <SidebarItems className={`font-semibold ${theme === 'light' ? 'bg-gray-100' : ' bg-gray-900'}`}>
            <SidebarItemGroup>
              <Link to='/?tab=Dashboard'>
                <SidebarItem  
                  icon={HiChartPie}
                  active={tab === 'Dashboard'} 
                  as='div'
                  className={tab === 'Dashboard' ? currentTheme.itemActive : currentTheme.item}
                  onClick={toggleMobileSidebar}
                >
                  Dashboard
                </SidebarItem>
              </Link>
              
              <SidebarCollapse 
                icon={GrDocumentStore} 
                label="Analysis"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Jobs'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Jobs'} 
                    as='div'
                    className={tab === 'Jobs' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Jobs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Productivity'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Productivity'} 
                    as='div'
                    className={tab === 'Productivity' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Productivities
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Planning'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Planning'} 
                    as='div'
                    className={tab === 'Planning' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Plannings
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Oee'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Oee'} 
                    as='div'
                    className={tab === 'Oee' ? currentTheme.itemActive : currentTheme.item}
                  >
                    OEEs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Outputs'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Outputs'} 
                    as='div'
                    className={tab === 'Outputs' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Outputs
                  </SidebarItem>
                </Link>
              </SidebarCollapse>
              
              <SidebarCollapse 
                icon={HiOutlineDocumentCurrencyDollar} 
                label="Purchase"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Suppliers'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Suppliers'} 
                    as='div'
                    className={tab === 'Suppliers' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Suppliers
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Orders'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Orders'} 
                    as='div'
                    className={tab === 'Orders' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Orders
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Costs'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Costs'} 
                    as='div'
                    className={tab === 'Costs' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Costs
                  </SidebarItem>
                </Link>
              </SidebarCollapse>
              
              <SidebarCollapse 
                icon={MdOutlineInventory} 
                label="Inventory"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Items'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Items'} 
                    as='div'
                    className={tab === 'Items' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Items
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Transactions'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Transactions'} 
                    as='div'
                    className={tab === 'Transactions' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Transactions
                  </SidebarItem>
                </Link>
              </SidebarCollapse>
              
              <SidebarCollapse 
                icon={GrHostMaintenance}
                label="Maintenance"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Maintenances'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Maintenance'} 
                    as='div'
                    className={tab === 'Maintenance' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Jobs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Cases'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Cases'} 
                    as='div'
                    className={tab === 'Cases' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Cases
                  </SidebarItem>
                </Link>
              </SidebarCollapse>

              <SidebarCollapse 
                icon={GrDocumentVerified}
                label="Stock"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=Products'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Products'} 
                    as='div'
                    className={tab === 'Products' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Products
                  </SidebarItem>
                </Link>

                <Link to='/?tab=Materials'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Materials'} 
                    as='div'
                    className={tab === 'Materials' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Materials
                  </SidebarItem>
                </Link>

                <Link to='/?tab=Movements'>
                  <SidebarItem 
                    onClick={toggleMobileSidebar} 
                    active={tab === 'Movements'} 
                    as='div'
                    className={tab === 'Movements' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Movements
                  </SidebarItem>
                </Link>
              </SidebarCollapse>

              {currentUser.role === 'Admin' && (
                <SidebarCollapse 
                  icon={GrDocumentUser} 
                  label="Users"
                  className={currentTheme.collapse}
                  renderChevronIcon={() => <span className="ml-auto">▼</span>}
                >
                  <Link to='/?tab=Users'>
                    <SidebarItem 
                      onClick={toggleMobileSidebar} 
                      active={tab === 'Users'} 
                      as='div'
                      className={tab === 'Users' ? currentTheme.itemActive : currentTheme.item}
                    >
                      Setting
                    </SidebarItem>
                  </Link>
                  <Link to='/?tab=Logs'>
                    <SidebarItem 
                      onClick={toggleMobileSidebar} 
                      active={tab === 'Logs'} 
                      as='div'
                      className={tab === 'Logs' ? currentTheme.itemActive : currentTheme.item}
                    >
                      Activities Logs
                    </SidebarItem>
                  </Link>
                </SidebarCollapse>
              )}
              
              <SidebarItem 
                className={`cursor-pointer ${currentTheme.item}`}
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
  );
}

export default DashSidebar;