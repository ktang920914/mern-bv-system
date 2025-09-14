
import useUserstore from '../store'
import { Outlet, Navigate } from 'react-router-dom'

const LoginRoute = () => {
    const {currentUser} = useUserstore()
  return (
    currentUser ? <Navigate to='/?tab=Dashboard'/> : <Outlet/> 
  )
}

export default LoginRoute