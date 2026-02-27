import { AuthModal } from "../AuthModal";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { TransactionOverlay, TransactionStatus } from "../TransactionOverlay";
import { useFacility } from "../../context/FacilityContext";
import { useAuth } from "../../context/AuthContext";

interface Props {
  onBack: () => void;
}

interface FacilityForm {
  FacilityName: string;
  FacilityCode: string;
  PhilhealthAccreditationNumber: string;
  DOHNumber: string;
  Website: string;
  Email: string;
  Owner: string;
  BedCapacity: string;
  ImplementingBedCapacity: string;
  Country: string;
  Province: string;
  City: string;
  Barangay: string;
  StreetAddress: string;
  ZipCode: string;
  LogoPath: string;
}

export const FacilityInformationManagement: React.FC<Props> = ({ onBack }) => {
const [showAuthModal, setShowAuthModal] = useState(false);
const [logoFile, setLogoFile] = useState<File | null>(null);
const { user } = useAuth();
const { loadFacility } = useFacility();
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
  
    };
  };

  const [formData, setFormData] = useState<FacilityForm>({
    FacilityName: "",
    FacilityCode: "",
    PhilhealthAccreditationNumber: "",
    DOHNumber: "",
    Website: "",
    Email: "",
    Owner: "",
    BedCapacity: "",
    ImplementingBedCapacity: "",
    Country: "",
    Province: "",
    City: "",
    Barangay: "",
    StreetAddress: "",
    ZipCode: "",
    LogoPath: ""
  });

  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txMsg, setTxMsg] = useState("");
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

const [errors, setErrors] = useState({
  FacilityName: false,
  FacilityCode: false,
  message: ""
});

const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const file = e.target.files[0];

  setLogoFile(file); // ✅ store actual file
  setLogoPreview(URL.createObjectURL(file));

  // ❌ REMOVE this old logic:
  // LogoPath: file.name
};
  const inputStyle =
    "w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold";
  const labelStyle =
    "text-[10px] font-black uppercase text-slate-500 tracking-wider";
	
	
const handleVerified = async (verifiedUser: { id: number; username: string }) => {
  setShowAuthModal(false);
  await handleConfirmSave(verifiedUser.username);
};

  /* ================= FETCH ================= */

const fetchFacility = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/facility`,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const data = await res.json();

    if (data) {
      setFormData(prev => ({ ...prev, ...data }));

      // 🔥 THIS IS WHAT YOU WERE MISSING
      if (data.LogoPath) {
        setLogoPreview(`${import.meta.env.VITE_API_URL}${data.LogoPath}`);
      }
    }

    setLoading(false);

  } catch {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchFacility();
  }, []);

  /* ================= INPUT ================= */

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  const upperCaseFields = [
    "FacilityName",
    "FacilityCode",
    "PhilhealthAccreditationNumber",
    "DOHNumber",
    "Owner",
    "Country",
    "Province",
    "City",
    "Barangay",
    "StreetAddress"
  ];

  setFormData({
    ...formData,
    [name]: upperCaseFields.includes(name)
      ? value.toUpperCase()
      : value
  });

  // Clear error when typing
  if (name === "FacilityName" || name === "FacilityCode") {
    setErrors({ ...errors, [name]: false, message: "" });
  }
};

  /* ================= SAVE ================= */

const handleConfirmSave = async (verifiedUsername: string) => {

  if (!formData.FacilityName.trim() || !formData.FacilityCode.trim()) {
    setErrors({
      FacilityName: !formData.FacilityName.trim(),
      FacilityCode: !formData.FacilityCode.trim(),
      message: "Facility Name and Facility Code are required."
    });
    return;
  }

  const token = localStorage.getItem("token");

  const formDataToSend = new FormData();

  // append text fields
  Object.entries(formData).forEach(([key, value]) => {
    formDataToSend.append(key, value as string);
  });

  // append verified user
  formDataToSend.append("updatedBy", verifiedUsername);

  // append file if exists
  if (logoFile) {
    formDataToSend.append("logo", logoFile);
  }

  try {

    // 🔥 START LOADING STATE
    const startTime = Date.now();
    setTxStatus("loading");
    setTxMsg("Syncing data...");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/facility/save`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}` // DO NOT add Content-Type
        },
        body: formDataToSend
      }
    );

    if (!res.ok) throw new Error();

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(800 - elapsed, 0);

    setTimeout(async () => {

      await loadFacility();

      setTxStatus("success");
      setTxMsg("Facility information saved successfully.");

      // auto close overlay
      setTimeout(() => {
        setTxStatus("idle");
      }, 900);

    }, remaining);

  } catch {
    setTxStatus("error");
    setTxMsg("Failed to save facility.");

    setTimeout(() => {
      setTxStatus("idle");
    }, 2000);
  }
};

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
          Facility Information
        </h2>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
          <h3 className="font-black text-slate-800 uppercase text-sm">
            Facility Profile
          </h3>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* BASIC INFORMATION */}
          <div>
            <label className={labelStyle}>
  Facility Name <span className="text-rose-500">*</span>
</label>
          <input
  name="FacilityName"
  value={formData.FacilityName}
  onChange={handleChange}
  className={`${inputStyle} ${
    errors.FacilityName ? "border-rose-500" : "border-slate-300"
  }`}
/>
          </div>

          <div>
            <label className={labelStyle}>
  Facility Code <span className="text-rose-500">*</span>
</label>
           <input
  name="FacilityCode"
  value={formData.FacilityCode}
  onChange={handleChange}
  className={`${inputStyle} ${
    errors.FacilityCode ? "border-rose-500" : "border-slate-300"
  }`}
/>
          </div>

          <div>
            <label className={labelStyle}>Philhealth Accreditation No.</label>
            <input
              name="PhilhealthAccreditationNumber"
              value={formData.PhilhealthAccreditationNumber}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>DOH Number</label>
            <input
              name="DOHNumber"
              value={formData.DOHNumber}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Website</label>
            <input
              name="Website"
              value={formData.Website}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Email</label>
            <input
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Owner</label>
            <input
              name="Owner"
              value={formData.Owner}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Bed Capacity</label>
            <input
              type="number"
              name="BedCapacity"
              value={formData.BedCapacity}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Implementing Bed Capacity</label>
            <input
              type="number"
              name="ImplementingBedCapacity"
              value={formData.ImplementingBedCapacity}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          {/* ADDRESS SECTION */}
          <div className="md:col-span-2 mt-4">
            <h4 className="text-sm font-black uppercase text-slate-600 tracking-wide">
              Address Information
            </h4>
          </div>

          <div>
            <label className={labelStyle}>Country</label>
            <input
              name="Country"
              value={formData.Country}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Province</label>
            <input
              name="Province"
              value={formData.Province}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>City</label>
            <input
              name="City"
              value={formData.City}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Barangay</label>
            <input
              name="Barangay"
              value={formData.Barangay}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelStyle}>Street Address</label>
            <input
              name="StreetAddress"
              value={formData.StreetAddress}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Zip Code</label>
            <input
              name="ZipCode"
              value={formData.ZipCode}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
		  
		  <div>
  <label className={labelStyle}>Facility Logo</label>
  <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-slate-400 transition">
    {logoPreview ? (
      <img src={logoPreview} className="h-16 object-contain" />
    ) : (
      <span className="text-[10px] text-slate-400 font-bold uppercase">
        Upload Logo
      </span>
    )}
    <input
      type="file"
      hidden
      accept="image/*"
      onChange={handleLogoUpload}
    />
  </label>
</div>

{/* ACTION ROW */}
<div className="md:col-span-2 flex justify-end items-center gap-6 pt-6">

  {/* ERROR MESSAGE */}
  {errors.message && (
    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
      <p className="text-rose-600 text-xs font-bold uppercase tracking-wide whitespace-nowrap">
        {errors.message}
      </p>
    </div>
  )}

  {/* SAVE BUTTON */}
  <button
  onClick={() => {
  if (!formData.FacilityName.trim() || !formData.FacilityCode.trim()) {
    setErrors({
      FacilityName: !formData.FacilityName.trim(),
      FacilityCode: !formData.FacilityCode.trim(),
      message: "Facility Name and Facility Code are required."
    });
    return;
  }

  setShowAuthModal(true); // only open modal
}}


    className="px-10 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2"
  >
    <Save size={16} />
    Save Facility
  </button>

</div>

</div>
</div>


{showAuthModal && (
  <AuthModal
    currentUsername={user?.username || ""}
    onVerified={handleVerified}
    onClose={() => setShowAuthModal(false)}
  />
)}

<TransactionOverlay
  status={txStatus}
  message={txMsg}
  onClose={() => setTxStatus("idle")}
/>
    </div>
  );
};