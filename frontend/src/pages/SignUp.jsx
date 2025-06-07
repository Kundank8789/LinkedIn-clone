import React, {useContext, useState} from 'react';
import logo from '../assets/logo.svg';
// We're using window.location.href for navigation instead of useNavigate
import { AuthDataContext } from '../context/AuthContext'

function SignUp  ()  {
  const [show, setShow] = useState(false)
  const {signup} = useContext(AuthDataContext)

  // We'll handle navigation manually
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

   const handleSignUP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      // Use the signup function from AuthContext
      const result = await signup({
        firstName,
        lastName,
        userName,
        email,
        password
      })

      if (result.success) {
        console.log("Signup successful!");
        // Show success message and navigate to login page
        alert('Signup successful! Please login with your credentials.')
        // Navigate immediately
        // Use lowercase path for consistency
        window.location.href = '/login'
        setErr("")
        setLoading(false)
        setFirstName("")
        setLastName("")
        setUserName("")
        setEmail("")
        setPassword("")
      } else {
        throw new Error(result.message || 'Signup failed')
      }

    } catch(error){
      console.error("Signup error:", error)
      // Show a more detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        setErr(error.response.data.message)
      } else if (error.message) {
        setErr(error.message)
      } else {
        setErr("Signup failed. Please try again.")
      }
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]'>
        <div className='p-[30px] lg:p-[30px] w-full h-[80px] flex items-center'>
            <img src={logo} alt="" />
        </div>
        <form className='w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center  gap-[10px] p-[15px] ' onSubmit={handleSignUP}>
          <h1 className='text-gray-800 text-[30px] font-semibold mb-[30px]'>Sign Up</h1>
          <input type="text" placeholder='first name' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-[md]' value={firstName} onChange={(e)=>setFirstName(e.target.value)}/>
          <input type="text" placeholder='last name' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px]  px-[20px] py-[10px] rounded-[md]'  value={lastName} onChange={(e)=>setLastName(e.target.value)}/>
          <input type="text" placeholder='username' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-[md]'  value={userName} onChange={(e)=>setUserName(e.target.value)}/>
          <input type="email" placeholder='email' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px]  px-[20px] py-[10px] rounded-[md]' value={email} onChange={(e)=>setEmail(e.target.value)} />
          <div className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative'>
          <input type={show?"text":"password"} placeholder='password' required className='w-full h-full border-none  text-gray-800 text-[18px] px-[20px] py-[10px] rounded-[md]' value={password} onChange={(e)=>setPassword(e.target.value)}/>
          <span className='absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold' onClick={()=>setShow(prev=>!prev)}>{show?"hidden":"show"}</span>
          </div>
          {err && <p className='text-center text-red-500'>
          *{err}
          </p>}
          <button type="submit" className='w-[100%] h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white' disabled={loading}>{loading?"Loading...":"Sign Up"}</button>
          <p className='text-center cursor-pointer' onClick={() => window.location.href = '/login'}>Already have an account? <span className='text-[#2a9bd8]'>Sign In</span></p>
        </form>
    </div>
  )
}

export default SignUp