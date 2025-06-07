import React, {useContext, useState} from 'react';
import logo from '../assets/logo.svg';
// We're using window.location.href for navigation instead of useNavigate
import { AuthDataContext } from '../context/AuthContext'

const Login = () => {
  const [show, setShow] = useState(false)
  const {login} = useContext(AuthDataContext)
  // Using window.location.href for navigation
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  // We'll let the user navigate manually

   const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      // Use the login function from AuthContext
      const result = await login({
        email,
        password
      })

      if (result.success) {
        // Login successful
        // No need to manually set user data, it will be handled by the AuthContext
        // Show success message and navigate to home page
        alert('Login successful!')
        // Navigate immediately using window.location
        window.location.href = '/'
        setErr("")
        setLoading(false)
        setEmail("")
        setPassword("")
      } else {
        throw new Error(result.message || 'Login failed')
      }

    } catch(error){
      console.error("Login error:", error)
      // Show a more detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        setErr(error.response.data.message)
      } else if (error.message) {
        setErr(error.message)
      } else {
        setErr("Login failed. Please try again.")
      }
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]'>
        <div className='p-[30px] lg:p-[30px] w-full h-[80px] flex items-center'>
            <img src={logo} alt="" />
        </div>
        <form className='w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center  gap-[10px] p-[15px] ' onSubmit={handleSignIn}>
          <h1 className='text-gray-800 text-[30px] font-semibold mb-[30px]'>Sign In</h1>

          <input type="email" placeholder='email' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px]  px-[20px] py-[10px] rounded-[md]' value={email} onChange={(e)=>setEmail(e.target.value)} />
          <div className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative'>
          <input type={show?"text":"password"} placeholder='password' required className='w-full h-full border-none  text-gray-800 text-[18px] px-[20px] py-[10px] rounded-[md]' value={password} onChange={(e)=>setPassword(e.target.value)}/>
          <span className='absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold' onClick={()=>setShow(prev=>!prev)}>{show?"hidden":"show"}</span>
          </div>
          {err && <p className='text-center text-red-500'>
          *{err}
          </p>}
          <button type="submit" className='w-[100%] h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white' disabled={loading}>{loading?"Loading...":"Sign In"}</button>
          <p className='text-center cursor-pointer' onClick={() => window.location.href = '/signup'}>Want to create an account? <span className='text-[#2a9bd8]'>Sign Up</span></p>
        </form>
    </div>
  )
}


export default Login