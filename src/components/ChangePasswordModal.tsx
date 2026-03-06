import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

interface Props {
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({
  username,
  onClose,
  onSuccess
}) => {

  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");


  const [show1,setShow1] = useState(false);
  const [show2,setShow2] = useState(false);
  const [show3,setShow3] = useState(false);

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const [success,setSuccess] = useState(false);
const [processing,setProcessing] = useState(false);



const validate = () => {

  const passRegex =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if(newPassword === currentPassword){
    setError("New password cannot be the same as your current password.");
    return false;
  }

  if(!passRegex.test(newPassword)){
    setError("Password must contain uppercase, lowercase, number and special character.");
    return false;
  }

  if(newPassword !== confirmPassword){
    setError("Passwords do not match.");
    return false;
  }

  return true;
}

const handleSave = async () => {

  if(!validate()) return;

  setLoading(true);
  setProcessing(true);

  const res = await fetch("/api/auth/change-password",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      username,
      currentPassword,
      newPassword
    })
  });

  const data = await res.json();

  if(!res.ok){
    setError(data.message);
    setLoading(false);
    setProcessing(false);
    return;
  }

  setLoading(false);

  // show processing message longer
  setTimeout(()=>{
    setProcessing(false);
    setSuccess(true);

    setTimeout(()=>{
      onSuccess();
    },2200);

  },1800);
}

/* PROCESSING OVERLAY */
if(processing){
  return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[20000]">

      <div className="bg-[#0b1626] border border-white/10 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl">

        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"/>

        <p className="text-sm text-white/80 tracking-wide">
          Password Update Processing
        </p>

      </div>

    </div>
  )
}

/* SUCCESS OVERLAY */
if(success){
  return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[20000]">

      <div className="bg-[#0b1626] border border-white/10 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl">

        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <p className="text-sm text-emerald-400 tracking-wide">
          Password Successfully Changed
        </p>

      </div>

    </div>
  )
}

return(
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[15000]">

<div className="w-[420px] rounded-[28px] bg-gradient-to-br from-[#0f1c2f] to-[#0b1626] p-8 shadow-2xl border border-white/10">

<p className="text-[11px] tracking-[0.35em] text-white/40 font-semibold text-center mb-6">
CHANGE PASSWORD
</p>

{/* USERNAME */}
<input
value={username}
disabled
className="w-full mb-4 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white"
/>

{/* CURRENT PASSWORD */}
<div className="relative mb-4">

<input
type={show1?"text":"password"}
placeholder="Current Password"
value={currentPassword}
onChange={(e)=>setCurrentPassword(e.target.value)}
className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white pr-10"
/>

<button
type="button"
tabIndex={-1}
onClick={()=>setShow1(!show1)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
>
{show1 ? <EyeOff size={18}/> : <Eye size={18}/>}
</button>

</div>

{/* NEW PASSWORD */}
<div className="relative mb-4">

<input
type={show2?"text":"password"}
placeholder="New Password"
value={newPassword}
onChange={(e)=>setNewPassword(e.target.value)}
className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white pr-10"
/>

<button
type="button"
tabIndex={-1}
onClick={()=>setShow2(!show2)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
>
{show2 ? <EyeOff size={18}/> : <Eye size={18}/>}
</button>

</div>

{/* CONFIRM PASSWORD */}
<div className="relative mb-4">

<input
type={show3?"text":"password"}
placeholder="Confirm Password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white pr-10"
/>

<button
type="button"
tabIndex={-1}
onClick={()=>setShow3(!show3)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
>
{show3 ? <EyeOff size={18}/> : <Eye size={18}/>}
</button>

</div>

{error && (
<p className="text-red-400 text-xs mb-4">{error}</p>
)}

<div className="flex gap-4">

<button
onClick={onClose}
className="flex-1 py-3 rounded-full text-xs text-white/50 border border-white/10"
>
Cancel
</button>

<button
onClick={handleSave}
disabled={loading}
className="flex-1 py-3 rounded-full text-xs bg-sky-500 text-white disabled:opacity-50"
>
{loading ? "Saving..." : "Save"}
</button>

</div>

</div>
</div>
)
}