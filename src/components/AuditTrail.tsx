import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  ShieldCheck,
  Monitor,
  Clock,
  User
} from "lucide-react";
import { StandardDateInput } from "./StandardDateInput";

interface AuditLog {
  audit_id: number;
  at_datetime: string;
  at_transaction: string;
  at_transaction_type: string;
  at_username: string;
  at_old_value: string;
  at_new_value: string;
  at_module: string;
  at_pc_name: string;
  at_field: string;
}

export const AuditTrail: React.FC = () => {

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`
    };
  };

  /* ==========================================
     FORMAT DATE
  ========================================== */
const formatDateTime = (value?: string) => {

  if (!value) return "—";

  try {

    const [datePart, timePart] = value.split(" ");

    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );

    return d.toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

  } catch {
    return value;
  }

};
  /* ==========================================
     FETCH LOGS
  ========================================== */

  const fetchLogs = async () => {
    try {

      const params = new URLSearchParams({
        search: searchTerm,
        module: moduleFilter,
        type: typeFilter,
        from: fromDate,
        to: toDate
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/audit-trail?${params}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) throw new Error("Failed to fetch logs");

      const data = await res.json();

      setLogs(data || []);

    } catch (err) {

      console.error("Audit fetch error:", err);
      setLogs([]);

    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, moduleFilter, typeFilter, fromDate, toDate]);

  /* ==========================================
     EXPORT CSV
  ========================================== */

  const exportCSV = () => {

    if (!logs.length) return;

    const rows = logs.map(l => ({
      Date: formatDateTime(l.at_datetime),
      Transaction: l.at_transaction,
      Type: l.at_transaction_type,
      Username: l.at_username,
      Module: l.at_module,
      OldValue: l.at_old_value,
      NewValue: l.at_new_value,
      PC: l.at_pc_name
    }));

    const csv =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(rows[0]).join(","),
        ...rows.map(r => Object.values(r).join(","))
      ].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "audit_trail.csv";
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
            Audit Trail
          </h2>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            System Governance • Transaction History
          </p>
        </div>


{/* HIDE FOR NOW
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl hover:bg-black transition-all shadow-lg"
        >
          <Download size={16} />
          Export CSV
        </button>
*/}
      </div>

{/* FILTERS */}

<div className="flex items-end justify-between w-full gap-4">

  {/* SEARCH */}
  <div className="relative w-[420px]">
    <Search
      size={16}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
    />

    <input
      type="text"
      placeholder="Search Username, Transaction..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
    />
  </div>

  {/* FILTERS RIGHT */}
  <div className="flex items-end gap-3">

    <select
      value={moduleFilter}
      onChange={(e) => setModuleFilter(e.target.value)}
      className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black uppercase"
    >
      <option value="All">All Modules</option>
      <option value="USER_MGMT">User Management</option>
      <option value="FACILITY_INFORMATION">Facility Info</option>
      <option value="CustomFormTemplates">Custom Forms</option>
      <option value="departments">Department</option>
      <option value="NoteTemplates">Note Templates</option>
	   <option value="NoteTemplates">Progress Notes</option>
    </select>

    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
      className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black uppercase"
    >
      <option value="All">All Types</option>
      <option value="ADD">Add</option>
      <option value="UPDATE">Update</option>
      <option value="DELETE">Delete</option>
    </select>

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

</div>

      {/* TABLE */}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-x-auto">

        <table className="w-full text-left">

          <thead>

            <tr className="bg-slate-50 border-b border-slate-200">

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Date & Time
              </th>

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Transaction
              </th>

              <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Type
              </th>

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Username
              </th>

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Old Value
              </th>

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                New Value
              </th>

              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PC Name
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {logs.map(log => (

              <tr
                key={log.audit_id}
                className="hover:bg-slate-50 transition-colors"
              >

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <Clock size={12} className="text-slate-300" />

                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.at_datetime)}
                    </span>

                  </div>

                </td>

                <td className="px-6 py-5">

                  <div className="flex flex-col">

                    <span className="text-[11px] font-black uppercase text-slate-900">
                      {log.at_transaction}
                    </span>

                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {log.at_module}
                    </span>

                  </div>

                </td>

                <td className="px-4 py-5 text-center">

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      log.at_transaction_type === "ADD"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : log.at_transaction_type === "UPDATE"
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}
                  >
                    {log.at_transaction_type}
                  </span>

                </td>

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <User size={12} className="text-slate-300" />

                    <span className="text-xs font-black text-slate-800 uppercase">
                      {log.at_username}
                    </span>

                  </div>

                </td>

                <td className="px-6 py-5">

                  <div
                    className="max-w-[160px] truncate text-[11px] italic text-slate-400"
                    title={log.at_old_value}
                  >
                    {log.at_old_value}
                  </div>

                </td>

                <td className="px-6 py-5">

                  <div
                    className="max-w-[160px] truncate text-[11px] font-black text-sky-700 uppercase"
                    title={log.at_new_value}
                  >
                    {log.at_new_value}
                  </div>

                </td>

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <Monitor size={12} className="text-slate-300" />

                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {log.at_pc_name || "UNKNOWN"}
                    </span>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between px-2">

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">

          <ShieldCheck size={14} className="text-emerald-500" />

          Tamper-evident system logs enabled

        </p>

        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">

          Logs archived for 10 years per hospital policy

        </p>

      </div>

    </div>
  );
};