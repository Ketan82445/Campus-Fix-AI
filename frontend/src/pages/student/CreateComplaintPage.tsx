import React, { useState, useEffect, useRef } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Category, Priority, SimilarComplaint } from '../../types';
import { SimilarComplaintsBanner } from '../../components/complaint/SimilarComplaintsBanner';
import {
  Sparkles,
  MapPin,
  AlertCircle,
  ArrowRight,
  Upload,
  X,
  Image as ImageIcon,
  QrCode,
  Globe,
  Building,
  Layers,
  DoorOpen,
  FileText
} from 'lucide-react';

interface LocalAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

const COMMON_BUILDINGS = [
  'CS & IT Block',
  'Main Academic Block',
  'Mechanical Engineering Block',
  'Electronics & Electrical Block',
  'Central Library',
  'Boys Hostel (Block A)',
  'Girls Hostel (Block B)',
  'Student Activity Center',
  'Sports Complex',
  'Campus Canteen'
];

const COMMON_FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  'Basement'
];

const LOCALIZED_TEXT: Record<string, { titleHolder: string; descHolder: string; langLabel: string }> = {
  en: {
    titleHolder: 'e.g. Wi-Fi router flashing red, internet disconnected',
    descHolder:
      'Describe the issue in detail (e.g. "Wi-Fi stopped working in Computer Lab 3 around 9:30 AM. Approximately 35 students cannot access practical coursework. Router power LED is solid red.").',
    langLabel: 'English'
  },
  hi: {
    titleHolder: 'उदा. कंप्यूटर लैब 3 में वाई-फाई काम नहीं कर रहा है',
    descHolder:
      'कृपया समस्या का विस्तार से वर्णन करें (उदा. "सुबह 9:30 बजे से कंप्यूटर लैब में इंटरनेट बंद है। लगभग 35 छात्र असाइनमेंट नहीं कर पा रहे हैं।")',
    langLabel: 'हिंदी (Hindi)'
  },
  mr: {
    titleHolder: 'उदा. संगणक लॅब 3 मध्ये वाय-फाय सुरू नाही',
    descHolder:
      'समस्येचे सविस्तर वर्णन करा (उदा. "सकाळी 9:30 पासून लॅबमधील इंटरनेट बंद आहे. राऊटरचा दिवा बंद असून विद्यार्थी काम करू शकत नाहीत.")',
    langLabel: 'मराठी (Marathi)'
  }
};

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  // QR Modal and Status
  const [isQrPrefilled, setIsQrPrefilled] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate / Similarity State
  const [similarComplaints, setSimilarComplaints] = useState<SimilarComplaint[]>([]);
  const [dismissedSimilar, setDismissedSimilar] = useState(false);
  const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);
  const [upvotedComplaint, setUpvotedComplaint] = useState<SimilarComplaint | null>(null);

  // 1. Check for QR Code URL params on initial load
  useEffect(() => {
    const qBuilding = searchParams.get('building');
    const qFloor = searchParams.get('floor');
    const qRoom = searchParams.get('room');
    const qLocation = searchParams.get('location');

    if (qBuilding || qFloor || qRoom || qLocation) {
      if (qBuilding) setBuilding(qBuilding);
      if (qFloor) setFloor(qFloor);
      if (qRoom) setRoom(qRoom);

      const computedLoc =
        qLocation ||
        [qRoom, qFloor, qBuilding].filter(Boolean).join(', ');
      setLocation(computedLoc);
      setIsQrPrefilled(true);
    }
  }, [searchParams]);

  // Real-time debounce check for similar complaints (Cluster 3)
  useEffect(() => {
    if (dismissedSimilar || title.trim().length < 3) {
      setSimilarComplaints([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingSimilar(true);
        const res = await complaintApi.checkSimilar({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          building: building.trim() || undefined,
          floor: floor.trim() || undefined,
          room: room.trim() || undefined,
          category: category ? (category as Category) : undefined
        });

        if (res.success && res.data) {
          setSimilarComplaints(res.data);
        }
      } catch (err) {
        console.error('Similarity check error:', err);
      } finally {
        setIsCheckingSimilar(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, location, building, floor, room, category, dismissedSimilar]);

  // Sync composite location when structured fields change (if user hasn't typed custom location)
  const handleStructuredLocationChange = (newBuilding: string, newFloor: string, newRoom: string) => {
    setBuilding(newBuilding);
    setFloor(newFloor);
    setRoom(newRoom);
    const combined = [newRoom, newFloor, newBuilding].filter(Boolean).join(', ');
    setLocation(combined);
  };

  // 2. Handle File Uploads (image validation, size limits <= 5MB, base64 data conversion)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} is not supported. Please upload JPG, PNG, WEBP, or PDF.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} exceeds 5MB size limit.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type
          }
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 3. QR Code Quick Presets / Scanner Handler
  const handleApplyQrCode = (scannedCode: string) => {
    // Expected format: CAMPUSFIX:BUILDING|FLOOR|ROOM or standard query string
    try {
      if (scannedCode.includes('|')) {
        const parts = scannedCode.split('|');
        const b = parts[0]?.replace('CAMPUSFIX:', '').trim() || '';
        const f = parts[1]?.trim() || '';
        const r = parts[2]?.trim() || '';
        handleStructuredLocationChange(b, f, r);
        setIsQrPrefilled(true);
        setShowQrModal(false);
      } else {
        setLocation(scannedCode);
        setIsQrPrefilled(true);
        setShowQrModal(false);
      }
    } catch {
      setError('Invalid QR code format.');
    }
  };

  // 4. Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await complaintApi.create({
        title,
        description,
        location: location || [room, floor, building].filter(Boolean).join(', ') || 'Campus Grounds',
        building: building || undefined,
        floor: floor || undefined,
        room: room || undefined,
        language,
        category: category || undefined,
        priority: priority || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (res.success && res.data) {
        navigate(`/student/complaints/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Campus Issue</h1>
              <p className="text-xs text-slate-500">Smart complaint triage powered by AI</p>
            </div>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                language === 'en' ? 'bg-white text-brand-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                language === 'hi' ? 'bg-white text-brand-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                language === 'mr' ? 'bg-white text-brand-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* QR Prefill Alert Banner */}
        {isQrPrefilled && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>QR Location Tag Detected:</strong> {location}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsQrPrefilled(false);
                setBuilding('');
                setFloor('');
                setRoom('');
                setLocation('');
              }}
              className="text-emerald-700 hover:text-emerald-900 underline text-2xs"
            >
              Reset
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {upvotedComplaint && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-emerald-800">Community Issue Confirmed!</h4>
              <p className="text-xs text-emerald-700">
                You've been added as affected by #{upvotedComplaint.complaintNumber} ("{upvotedComplaint.title}"). You will receive notifications on resolution without filing a duplicate.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/student/complaints/${upvotedComplaint.id}`)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                Track Ticket
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/complaints')}
                className="px-3.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Real-time Similar Complaints Banner (Cluster 3) */}
        {!dismissedSimilar && similarComplaints.length > 0 && !upvotedComplaint && (
          <SimilarComplaintsBanner
            similarComplaints={similarComplaints}
            onDismiss={() => setDismissedSimilar(true)}
            onConfirmExisting={(comp) => setUpvotedComplaint(comp)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Issue Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">Issue Title *</label>
              {isCheckingSimilar && (
                <span className="text-[11px] text-amber-600 animate-pulse font-medium">
                  Checking campus reports...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (dismissedSimilar) setDismissedSimilar(false);
              }}
              placeholder={LOCALIZED_TEXT[language].titleHolder}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Section: Structured Campus Location & QR Scan */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-slate-800">Campus Location Details *</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-2xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition"
              >
                <QrCode className="w-3.5 h-3.5" /> Scan / Pick QR Tag
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" /> Building
                </label>
                <input
                  type="text"
                  list="building-presets"
                  value={building}
                  onChange={(e) => handleStructuredLocationChange(e.target.value, floor, room)}
                  placeholder="e.g. CS Block"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <datalist id="building-presets">
                  {COMMON_BUILDINGS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" /> Floor
                </label>
                <input
                  type="text"
                  list="floor-presets"
                  value={floor}
                  onChange={(e) => handleStructuredLocationChange(building, e.target.value, room)}
                  placeholder="e.g. 2nd Floor"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <datalist id="floor-presets">
                  {COMMON_FLOORS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <DoorOpen className="w-3 h-3 text-slate-400" /> Room / Lab
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => handleStructuredLocationChange(building, floor, e.target.value)}
                  placeholder="e.g. Lab 3 / Room 204"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            {/* Resolved Location String Display */}
            <div>
              <label className="block text-2xs font-medium text-slate-500 mb-0.5">Full Specific Location String</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Computer Lab 3, 2nd Floor, CS & IT Block"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white font-mono text-slate-700"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">Detailed Description *</label>
              <span className="text-2xs text-slate-400">Language: {LOCALIZED_TEXT[language].langLabel}</span>
            </div>
            <textarea
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={LOCALIZED_TEXT[language].descHolder}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Section: Image & File Attachments */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Attach Photos / Proof <span className="text-slate-400 font-normal">(Optional, max 5MB each)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/20 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-5 h-5 text-brand-600" />
              <p className="text-xs font-semibold text-slate-700">Click to upload photos or drag & drop</p>
              <p className="text-2xs text-slate-400">Supported formats: JPG, PNG, WEBP, PDF (Up to 5MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
            </div>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600 transition"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {att.mimeType.startsWith('image/') ? (
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="w-full h-20 object-cover rounded-lg mb-1.5 border border-slate-100"
                      />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-slate-100 rounded-lg mb-1.5 text-slate-400">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <span className="text-2xs font-medium text-slate-700 truncate max-w-full text-center" title={att.fileName}>
                      {att.fileName}
                    </span>
                    <span className="text-3xs text-slate-400">{(att.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Category & Priority Overrides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Override <span className="text-slate-400 font-normal">(Optional - AI detects)</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">✨ Let AI Auto-Classify</option>
                <option value="IT_NETWORK">IT & Network Services</option>
                <option value="ELECTRICAL">Electrical Maintenance</option>
                <option value="PLUMBING">Plumbing & Sanitation</option>
                <option value="CLEANING">Housekeeping & Cleaning</option>
                <option value="HOSTEL">Hostel Facilities</option>
                <option value="CLASSROOM">Classroom Infrastructure</option>
                <option value="LABORATORY">Laboratory Equipment</option>
                <option value="LIBRARY">Library Facilities</option>
                <option value="SECURITY">Campus Security</option>
                <option value="TRANSPORT">Campus Transport</option>
                <option value="CANTEEN">Canteen & Food Hygiene</option>
                <option value="INFRASTRUCTURE">Building Infrastructure</option>
                <option value="OTHER">Other Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">✨ Let AI Predict Priority</option>
                <option value="LOW">Low - Minor inconvenience</option>
                <option value="MEDIUM">Medium - Standard issue</option>
                <option value="HIGH">High - Affects multiple students</option>
                <option value="CRITICAL">Critical - Safety hazard / Outage</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? 'Analyzing & Submitting...' : 'Submit & Analyze with AI'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* QR Code Tag Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Campus Location QR Tag</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              In campus facilities, scan the physical QR tag posted in classrooms or labs, or choose a quick location tag below to auto-fill the complaint:
            </p>

            {/* Quick Demo Location QR Tags */}
            <div className="space-y-2">
              <p className="text-2xs font-bold text-slate-700 uppercase tracking-wider">Quick Sample QR Tags</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyQrCode('CAMPUSFIX:CS & IT Block|2nd Floor|Computer Lab 3')}
                  className="p-2.5 text-left text-xs bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-xl transition"
                >
                  <div className="font-semibold text-slate-800">🏷️ Computer Lab 3</div>
                  <div className="text-2xs text-slate-500">CS & IT Block • 2nd Floor</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyQrCode('CAMPUSFIX:Main Academic Block|3rd Floor|Room 305 (Seminar Hall)')}
                  className="p-2.5 text-left text-xs bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-xl transition"
                >
                  <div className="font-semibold text-slate-800">🏷️ Seminar Hall 305</div>
                  <div className="text-2xs text-slate-500">Main Academic Block • 3rd Floor</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyQrCode('CAMPUSFIX:Boys Hostel (Block A)|1st Floor|Washroom Wing B')}
                  className="p-2.5 text-left text-xs bg-slate-50 hover:bg-brand-50 hover:border-brand-300 border border-slate-200 rounded-xl transition"
                >
                  <div className="font-semibold text-slate-800">🏷️ Washroom Wing B</div>
                  <div className="text-2xs text-slate-500">Boys Hostel (Block A) • 1st Floor</div>
                </button>
              </div>
            </div>

            {/* Manual QR string / Raw code input */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-2xs font-semibold text-slate-600 mb-1">Enter QR Code Raw String</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder="CAMPUSFIX:Building|Floor|Room"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleApplyQrCode(qrCodeInput)}
                  disabled={!qrCodeInput.trim()}
                  className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
