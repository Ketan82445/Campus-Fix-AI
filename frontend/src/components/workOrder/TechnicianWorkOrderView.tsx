import React, { useState } from 'react';
import { WorkOrder } from '../../types';
import { workOrderApi } from '../../services/workOrderApi';
import { Wrench, CheckCircle, Upload, Clock, Plus } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  workOrder: WorkOrder;
  onUpdate: () => void;
}

export const TechnicianWorkOrderView: React.FC<Props> = ({ workOrder, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      
      // Convert file to base64 to send to backend (which streams it to Supabase)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await workOrderApi.addAttachment(workOrder.id, {
          fileName: selectedFile.name,
          fileData: base64Data,
          mimeType: selectedFile.type,
          category: 'EVIDENCE'
        });
        
        setSelectedFile(null);
        alert('Evidence uploaded securely to storage!');
        onUpdate();
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const toggleChecklistItem = async (key: string, currentValue: boolean) => {
    try {
      setIsUpdating(true);
      const newChecklist = {
        ...workOrder.checklist,
        [key]: !currentValue
      };
      await workOrderApi.updateChecklist(workOrder.id, newChecklist);
      onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold">Work Order Execution</h2>
        </div>
        <span className="px-2.5 py-1 bg-white/20 rounded font-mono text-xs">
          {workOrder.workOrderNumber}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Instructions */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {workOrder.description}
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Safety & Execution Checklist</h3>
            <div className="space-y-2">
              {Object.entries(workOrder.checklist || {
                "Area Secured": false,
                "Tools Prepared": false,
                "Work Completed": false,
                "Area Cleaned": false
              }).map(([item, isDone]) => (
                <label key={item} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleChecklistItem(item, isDone)}
                    disabled={isUpdating}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-600"
                  />
                  <span className={`text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Evidence Upload */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Photographic Evidence</h3>
            
            <form onSubmit={handleFileUpload} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="flex-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={!selectedFile || uploadingFile}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-slate-800 transition flex items-center gap-1 shrink-0"
                >
                  {uploadingFile ? 'Uploading...' : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-2 gap-2">
              {workOrder.attachments?.map(att => (
                <a 
                  key={att.id}
                  href={att.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">Document</div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold drop-shadow-md">View File</span>
                  </div>
                </a>
              ))}
              {(!workOrder.attachments || workOrder.attachments.length === 0) && (
                <div className="col-span-2 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                  No evidence uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
