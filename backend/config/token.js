import jwt from 'jsonwebtoken';


const genToken = async(userId)=> {
   try{
    // Fix: Use 'id' as the key to match auth.controllers.js
    let token = await jwt.sign({id: userId},process.env.JWT_SECRET,{expiresIn:"7d"})
    return token
   } catch(error){
      console.log("Token generation error:", error);
      throw error;
   }
}

export default genToken