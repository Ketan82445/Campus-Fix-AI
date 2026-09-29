import React, { useState } from 'react';
import { ComplaintAttachment } from '../../types';
import { Paperclip, Eye, Download, Trash2, X, FileText } from 'lucide-react';

interface AttachmentGalleryProps {
  attachments?: ComplaintAttachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => void;
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  attachments,
  canDelete = false,
  onDelete
}) => {
  const [selectedImage, setSelectedImage] = useState<ComplaintAttachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <Paperclip className="w-4 h-4 text-brand-600" />
        <span>Attached Photos & Files ({attachments.length})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {attachments.map((att) => {
          const isImage = att.mimeType.startsWith('image/');

          return (
            <div
              key={att.id}
              className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition p-2 flex flex-col justify-between"
            >
              {/* Media Preview / Icon */}
              <div
                className="w-full h-28 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer relative"
                onClick={() => (isImage ? setSelectedImage(att) : window.open(att.fileUrl, '_blank'))}
              >
                {isImage ? (
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <FileText className="w-8 h-8 text-brand-500" />
                    <span className="text-3xs font-semibold uppercase">{att.fileName.split('.').pop()}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              {/* File Info & Actions */}
              <div className="pt-2 flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold text-slate-800 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-3xs text-slate-400">
                    {(att.fileSize / 1024).toFixed(1)} KB • {new Date(att.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${att.fileName}?`)) {
                        onDelete(att.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition shrink-0"
                    title="Delete attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-800 truncate">{selectedImage.fileName}</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.fileUrl}
                  download={selectedImage.fileName}
                  className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg transition text-xs flex items-center gap-1"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-slate-900">
              <img
                src={selectedImage.fileUrl}
                alt={selectedImage.fileName}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
