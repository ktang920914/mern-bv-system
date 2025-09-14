import { BrowserRouter , Routes , Route } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import PrivateRoute from './components/PrivateRoute'
import LoginRoute from './components/LoginRoute'


const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<LoginRoute/>}>
        <Route path='/login' element={<Login/>}/>
        </Route>

        <Route element={<PrivateRoute/>}>
        <Route path='/' element={<Home/>}/>
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App