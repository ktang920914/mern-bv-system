import { Button, Label, TextInput, Alert, Spinner } from 'flowbite-react'
import { useNavigate } from 'react-router-dom'
import useUserstore from '../store'
import { useEffect, useState } from 'react'
// 1. 引入图标 (这里使用 HeroIcons，风格和 Flowbite 很搭)
import { HiEye, HiEyeOff } from 'react-icons/hi' 

const Login = () => {

    const navigate = useNavigate()
    const [formData,setFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    // 2. 添加控制密码显示的 state
    const [showPassword, setShowPassword] = useState(false) 
    const {signInSuccess} = useUserstore()

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]:e.target.value.trim()})
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    // 3. 切换密码显示的函数
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if(!formData.username || !formData.password){
            setErrorMessage('Login Failed')
            return
        }
        try {
            // ... (保持原有的 fetch 逻辑不变)
            const res = await fetch('/api/auth/login',{
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if(data.success === false){
                setErrorMessage(data.message)
                setLoading(true)
            }
            if(data.success !== false){
                navigate('/?tab=Dashboard')
                signInSuccess(data)
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

  return (
    <div className='min-h-screen flex items-center justify-center'>
        <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-lg'>
            <h1 className='text-2xl text-gray-500 font-semibold text-center'>BV SYSTEM</h1>

            <form onSubmit={handleSubmit}>
                <div className='mt-4'>
                    <Label value='Username'/>
                    <TextInput type='text' id='username' placeholder='Enter username' onChange={handleChange} onFocus={handleFocus}/>
                </div>

                {/* 4. 修改 Password 部分 */}
                <div className='mt-4'>
                    <Label value='Password'/>
                    <div className='relative'>
                        <TextInput 
                            // 动态切换 type
                            type={showPassword ? 'text' : 'password'} 
                            id='password' 
                            placeholder='Enter password' 
                            onChange={handleChange} 
                            onFocus={handleFocus}
                        />
                        {/* 绝对定位的图标按钮 */}
                        <button
                            type="button" // 必须加上 type="button"，防止触发表单提交
                            onClick={togglePasswordVisibility}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                        >
                            {showPassword ? (
                                <HiEye size={20} /> // 如果显示密码，显示"闭眼"图标
                            ) : (
                                <HiEyeOff size={20} />    // 如果隐藏密码，显示"睁眼"图标
                            )}
                        </button>
                    </div>
                </div>
                
                <Button className='w-full mt-4 cursor-pointer' type='submit' disabled={loading}>
                    {
                        loading ? <Spinner size='md' color='failure'/> : 'L O G I N'
                    }
                </Button>
            </form>

            {
                errorMessage && (
                    <Alert color='failure' className='mt-4 font-semibold'>
                        {errorMessage}
                    </Alert>
                )
            }
        </div>
    </div>
  )
}

export default Login