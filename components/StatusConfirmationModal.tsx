import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface StatusConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  targetName: string;
  action: "activate" | "deactivate" | null;
}

export const StatusConfirmationModal: React.FC<
  StatusConfirmationModalProps
> = ({
  isOpen,
  onConfirm,
  onCancel,
  targetName,
  action
}) => {
  if (!isOpen || !action) return null;

  const isActivating = action === "activate";

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full relative">

        <button
          onClick={onCancel}
          className="absolute right-8 top-8 text-slate-300 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8 ${
          isActivating
            ? "bg-emerald-50 text-emerald-500"
            : "bg-amber-50 text-amber-500"
        }`}>
          <AlertTriangle size={36} />
        </div>

        <div className="text-center space-y-3 mb-10">
          <h4 className="text-2xl font-black uppercase">
            {isActivating
              ? "Confirm Activation"
              : "Confirm Deactivation"}
          </h4>

          <p className="text-sm">
            Are you sure you want to{" "}
            <strong>
              {isActivating ? "ACTIVATE" : "DEACTIVATE"}
            </strong>{" "}
            <strong>{targetName}</strong>?
            {isActivating
              ? " This will restore access."
              : " This will restrict system access."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 text-white font-bold rounded-xl ${
              isActivating
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isActivating
              ? "Proceed with Activation"
              : "Proceed with Deactivation"}
          </button>

          <button
            onClick={onCancel}
            className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
