import { useState, useEffect } from "react";
import { Sidebar, SidebarCollapse, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react";
import { HiArrowSmRight, HiChartPie, HiMenu, HiX } from "react-icons/hi";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";
import { GrDocumentUser } from "react-icons/gr";
import { MdOutlineInventory } from "react-icons/md";
import { GrDocumentStore, GrHostMaintenance, GrDocumentVerified} from "react-icons/gr";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useUserstore from "../store";
import useThemeStore from "../themeStore";

const DashSidebar = () => {
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false); // 统一控制侧边栏状态
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
    // 发送登出请求，但不关心响应结果
    await fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(() => {
      // 忽略所有错误，继续执行登出
    })
    
    // 无论如何都执行登出逻辑
    navigate('/login')
    signOutSuccess({})
    
  } catch (error) {
    console.log(error)
    // 即使出错也执行登出
    navigate('/login')
    signOutSuccess({})
  }
}

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
      {/* 菜单按钮 - 在所有屏幕尺寸都显示 */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-3 left-4 z-50 p-2 rounded-md transition-colors ${currentTheme.button}`}
      >
        {sidebarOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
      </button>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:bg-transparent"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* 侧边栏 */}
      <div className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out
        w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}`}
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
                  onClick={() => setSidebarOpen(false)}
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
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Jobs'} 
                    as='div'
                    className={tab === 'Jobs' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Jobs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Productivity'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Productivity'} 
                    as='div'
                    className={tab === 'Productivity' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Productivities
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Planning'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Planning'} 
                    as='div'
                    className={tab === 'Planning' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Plannings
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Oee'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Oee'} 
                    as='div'
                    className={tab === 'Oee' ? currentTheme.itemActive : currentTheme.item}
                  >
                    OEEs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Outputs'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Outputs'} 
                    as='div'
                    className={tab === 'Outputs' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Outputs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Statistics'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Statistics'} 
                    as='div'
                    className={tab === 'Statistics' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Statistics
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
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Suppliers'} 
                    as='div'
                    className={tab === 'Suppliers' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Suppliers
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Orders'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Orders'} 
                    as='div'
                    className={tab === 'Orders' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Orders
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Costs'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
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
                <Link to='/?tab=Extruders'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Extruders'} 
                    as='div'
                    className={tab === 'Extruders' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Extruders
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Items'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Items'} 
                    as='div'
                    className={tab === 'Items' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Items
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Spareparts'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Spareparts'} 
                    as='div'
                    className={tab === 'Spareparts' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Spareparts
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Others'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Others'} 
                    as='div'
                    className={tab === 'Others' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Others
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Transactions'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
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
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Maintenances'} 
                    as='div'
                    className={tab === 'Maintenances' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Jobs
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Cases'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Cases'} 
                    as='div'
                    className={tab === 'Cases' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Cases
                  </SidebarItem>
                </Link>
              </SidebarCollapse>

              <SidebarCollapse 
                icon={RiCalendarScheduleLine}
                label="Preventive"
                className={currentTheme.collapse}
                renderChevronIcon={() => <span className="ml-auto">▼</span>}
              >
                <Link to='/?tab=ToDoListPreventive'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'ToDoListPreventive'} 
                    as='div'
                    className={tab === 'ToDoListPreventive' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Todo List
                  </SidebarItem>
                </Link>
                <Link to='/?tab=Schedule'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Schedule'} 
                    as='div'
                    className={tab === 'Schedule' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Schedule
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
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Products'} 
                    as='div'
                    className={tab === 'Products' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Products
                  </SidebarItem>
                </Link>

                <Link to='/?tab=Materials'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
                    active={tab === 'Materials'} 
                    as='div'
                    className={tab === 'Materials' ? currentTheme.itemActive : currentTheme.item}
                  >
                    Materials
                  </SidebarItem>
                </Link>

                <Link to='/?tab=Movements'>
                  <SidebarItem 
                    onClick={() => setSidebarOpen(false)} 
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
                      onClick={() => setSidebarOpen(false)} 
                      active={tab === 'Users'} 
                      as='div'
                      className={tab === 'Users' ? currentTheme.itemActive : currentTheme.item}
                    >
                      Setting
                    </SidebarItem>
                  </Link>
                  <Link to='/?tab=Logs'>
                    <SidebarItem 
                      onClick={() => setSidebarOpen(false)} 
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