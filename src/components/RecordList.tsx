
import React, { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Search, Eye, Edit3, ClipboardList, Filter } from "lucide-react";
import { StandardDateInput } from "./StandardDateInput";

interface RecordListProps {
  user: any;
  onEdit: (id: number) => void;
  onPrint: (id: number) => void;
}
interface RepositoryRecord {
  patient_form_id: number;
  template_name: string;

  mrn: string;
  first_name: string;
  last_name: string;
  middle_name: string;

  patient_type: string;
  patient_status: string;

  date_admitted: string;

  author_name: string;

  created_at: string;

  status: "DRAFT" | "FINALIZED";
}

export const RecordList: React.FC<RecordListProps> = ({ user, onEdit, onPrint }) => {

  const [records, setRecords] = useState<RepositoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RepositoryRecord[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Manila"
});
const [patientStatusFilter, setPatientStatusFilter] = useState("Active");
const [typeFilter, setTypeFilter] = useState("Inpatient");
const [statusFilter, setStatusFilter] = useState("All");

const [fromDate, setFromDate] = useState(today);
const [toDate, setToDate] = useState(today);


  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

  /* ================= LOAD RECORDS ================= */

  useEffect(() => {

    const loadRecords = async () => {

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/custom-forms/repository`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      setRecords(data);
      setFilteredRecords(data);

    };
	

    loadRecords();

  }, []);

  /* ================= FILTERING ================= */

  useEffect(() => {

    let result = records;

    if (searchTerm) {

      result = result.filter(r => {

        const name = `${r.last_name} ${r.first_name}`.toLowerCase();

        return (
          name.includes(searchTerm.toLowerCase()) ||
          r.mrn.toLowerCase().includes(searchTerm.toLowerCase())
        );

      });

    }

    if (typeFilter !== "All") {
      result = result.filter(r => r.patient_type === typeFilter);
    }
if (patientStatusFilter !== "All") {
  result = result.filter(r => r.patient_status === patientStatusFilter);
}
    if (statusFilter !== "All") {
      result = result.filter(r => r.status === statusFilter);
    }

if (fromDate) {
  const start = new Date(fromDate + "T00:00:00");

  result = result.filter(r => {
    const created = new Date(r.created_at);
    return created >= start;
  });
}

if (toDate) {
  const end = new Date(toDate + "T23:59:59");

  result = result.filter(r => {
    const created = new Date(r.created_at);
    return created <= end;
  });
}

    setFilteredRecords(result);

  }, [searchTerm, typeFilter, patientStatusFilter, statusFilter, fromDate, toDate, records]);

  /* ================= DATE FORMAT ================= */

  const formatDate = (dateStr: string) => {

    if (!dateStr) return "-";

    const clean = dateStr.replace("Z", "");
    const date = new Date(clean);

    return date.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

  };

  /* ================= UI ================= */

  return (

    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}

      <div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
          EHR Repository
        </h2>
      </div>

      {/* FILTERS */}

      <div className="bg-slate-100/80 p-6 rounded-[32px] border border-slate-200">

        <div className="flex flex-wrap items-end gap-3 mb-6">

          {/* SEARCH */}

          <div className="flex-1 min-w-[220px]">

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Patient Name / MRN
            </label>

            <div className="relative">

              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search Patient Name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-slate-300 transition-all"
              />

            </div>

          </div>

          {/* TYPE */}

          <div className="w-36">

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Type
            </label>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm font-black text-slate-800"
            >
              <option value="All">All Types</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Emergency">Emergency</option>
            </select>

          </div>

{/* PATIENT STATUS */}

<div className="w-36">

<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
Patient Status
</label>

<select
value={patientStatusFilter}
onChange={(e) => setPatientStatusFilter(e.target.value)}
className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm font-black text-slate-800"
>

<option value="Active">Active</option>
<option value="Discharge">Discharge</option>
<option value="All">All</option>

</select>

</div>

          {/*FORM STATUS */}

          <div className="w-36">

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Form Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm font-black text-slate-800"
            >
              <option value="All">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="FINALIZED">Finalized</option>
            </select>

          </div>

          {/* DATE RANGE */}

          <StandardDateInput
            label="From"
            name="fromDate"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
          />

          <StandardDateInput
            label="To"
            name="toDate"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
          />

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 border-t-4 border-t-blue-500 px-6 py-3">

          <table className="w-full text-left border-collapse table-fixed">

            <thead>

              <tr className="bg-slate-50 border-b border-slate-200">

                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Document
                </th>

                <th className="w-[260px] px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Patient
                </th>

<th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
Patient Status
</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Admission
                </th>


                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Author
                </th>

                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Created
                </th>

                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Type
                </th>

                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Form Status
                </th>

<th className="w-[140px] px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
Actions
</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredRecords.length > 0 ? (

                filteredRecords.map((record) => (

                  <tr
                    key={record.patient_form_id}
                    className="hover:bg-blue-50 transition-colors"
                  >

                    <td className="px-3 py-4 text-xs font-black text-slate-800 text-center">
                      {record.template_name}
                    </td>

                    <td className="px-3 py-4 text-xs font-black text-slate-800 uppercase">

                      {record.last_name}, {record.first_name}  {record.middle_name}

                      <div className="text-[10px] text-slate-400 font-bold">
                        {record.mrn}
                      </div>

                    </td>
<td className="px-3 py-4 text-center">

<span
className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
record.patient_status?.toLowerCase() === "active"
? "bg-emerald-500 text-white"
: "bg-slate-300 text-slate-700"
}`}
>
{record.patient_status?.toLowerCase() === "active" ? "A" : "D"}
</span>

</td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                      {formatDate(record.date_admitted)}
                    </td>

                    <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                      {record.author_name}
                    </td>

                    <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                      {formatDate(record.created_at)}
                    </td>

                    <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                      {record.patient_type}
                    </td>

                    <td className="px-3 py-4 text-center">

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        record.status === "FINALIZED"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {record.status}
                      </span>

                    </td>

             <td className="px-6 py-4 text-center">

<div className="flex justify-center gap-2">

<button
  onClick={() => {
    console.log("PRINT CLICKED:", record.patient_form_id);
    onPrint(record.patient_form_id);
  }}
  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100"
>
  <Printer size={16}/>
</button>

{record.status === "DRAFT" && (
<button
onClick={() => onEdit(record.patient_form_id)}
className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100"
>
<Edit3 size={16}/>
</button>
)}

</div>

</td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td colSpan={8} className="py-16 text-center text-slate-300">

                    <ClipboardList size={48} className="mx-auto mb-3 opacity-20"/>

                    <p className="font-black uppercase text-xs">
                      Repository Empty
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}

        <div className="mt-4 flex items-center justify-between">

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14}/>
            Repository Records
          </p>

          <p className="text-xs font-black text-slate-300 uppercase tracking-tight">
            Displaying {filteredRecords.length} records
          </p>

        </div>

      </div>

    </div>

  );

};