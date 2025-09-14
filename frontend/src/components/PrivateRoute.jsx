
import useUserstore from '../store'
import { Outlet, Navigate } from 'react-router-dom'

const PrivateRoute = () => {
    const {currentUser} = useUserstore()
  return (
    currentUser ? <Outlet/> : <Navigate to='/login'/>
  )
}

export default PrivateRoute