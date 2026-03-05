import React from "react";
import { FileText } from "lucide-react";
import { FormTemplate } from "../../types";

interface Props {
  templates: FormTemplate[];
  onSelect: (template: FormTemplate) => void;
}

export const TemplateSelector: React.FC<Props> = ({
  templates,
  onSelect
}) => {
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm uppercase tracking-widest font-semibold">
        No Active Templates Available For This Department
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between"
        >
          {/* Top Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 rounded-xl">
                <FileText size={18} className="text-slate-600" />
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  {template.template_name}
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {template.total_pages || 1} Page(s)
                </p>
              </div>
            </div>

            {template.description && (
              <p className="text-xs text-slate-500 line-clamp-3 mb-4">
                {template.description}
              </p>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {template.updatedAt
                ? `Updated ${new Date(template.updatedAt).toLocaleDateString()}`
                : "Ready"}
            </span>

            <button
              onClick={() => onSelect(template)}
              className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-black transition"
            >
              Use Template
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};