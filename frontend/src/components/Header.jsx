import React from 'react'
import { Button, Label, Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle, TextInput } from "flowbite-react";
import useUserstore from '../store';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../themeStore';
import { FaMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa";

const Header = () => {

  const {theme, toggleTheme} = useThemeStore()
  const {currentUser, signOutSuccess} = useUserstore()
  const navigate = useNavigate()

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

  return (
    <div>
         <Navbar fluid rounded className={`max-w-full ${theme === 'light' ? ' text-gray-900 border-b border-gray-900' : 'bg-gray-900 text-gray-300 border-b border-gray-50'}`}>
      <NavbarBrand href="https://www.boldvision.com.my/index.php" target="_blank" className='ml-14'>
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSihAmxl1XSIBFJQ3a3P8qyUwlXkvdtKI6OjQ&s" className="mr-3 h-6 sm:h-9 hidden sm:block" alt="Bold Vision Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Bold Vision</span>
      </NavbarBrand>
      <div className="flex md:order-2 gap-2">
        <Button className={`sm:block cursor-pointer ${theme === 'light' ? 'bg-white text-orange-500' : 'bg-gray-900 text-yellow-200'}`} color='white' pill onClick={toggleTheme}>
          {theme === 'light' ? <FaSun /> : <FaMoon />}
        </Button>
        <TextInput value={currentUser.username} className='hidden sm:block' disabled/>
        <Button className='cursor-pointer' onClick={handleLogout} color='light'>LOGOUT</Button>
        {/*<NavbarToggle/>*/}
      </div>
      {/*<NavbarCollapse className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}>
        <NavbarLink href="#" active>
          Home
        </NavbarLink>
        <NavbarLink href="#" className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}>About</NavbarLink>
        <NavbarLink href="#" className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Services</NavbarLink>
        <NavbarLink href="#" className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Profile</NavbarLink>
        <NavbarLink href="#" className={`${theme === 'light' ? ' text-gray-900' : 'bg-gray-900 text-gray-300'}`}>Contact</NavbarLink>
      </NavbarCollapse>*/}
    </Navbar>
    </div>
  )
}

export default Header