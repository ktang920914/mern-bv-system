import { Button, Label, TextInput, Alert, Spinner } from 'flowbite-react'
import { useNavigate } from 'react-router-dom'
import useUserstore from '../store'
import { useEffect, useState } from 'react'

const Login = () => {

    const navigate = useNavigate()
    const [formData,setFormData] = useState({})
    const [errorMessage,setErrorMessage] = useState(null)
    const [loading,setLoading] = useState(false)
    const {signInSuccess} = useUserstore()

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]:e.target.value.trim()})
    }

    const handleFocus = () => {
        setErrorMessage(null)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if(!formData.username || !formData.password){
            setErrorMessage('Login Failed')
            return
        }
        try {
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

                <div className='mt-4'>
                    <Label value='Password'/>
                    <TextInput type='password' id='password' placeholder='Enter password' onChange={handleChange} onFocus={handleFocus}/>
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