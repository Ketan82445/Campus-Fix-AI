import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';
import { Category, Priority, SimilarComplaint } from '../../types';
import { SimilarComplaintsBanner } from '../../components/complaint/SimilarComplaintsBanner';
import {
  Sparkles, MapPin, AlertCircle, ArrowRight, ArrowLeft, Upload, X, QrCode, Building, Mic, Search, CheckCircle, FileText, Image as ImageIcon
} from 'lucide-react';

// Common options
const COMMON_BUILDINGS = [
  'CS & IT Block', 'Main Academic Block', 'Mechanical Engineering Block',
  'Electronics & Electrical Block', 'Central Library', 'Boys Hostel (Block A)',
  'Girls Hostel (Block B)', 'Student Activity Center', 'Sports Complex', 'Campus Canteen'
];

const COMMON_FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', 'Basement'];

const CATEGORIES = [
  'IT_NETWORK', 'ELECTRICAL', 'PLUMBING', 'CLEANING', 'HOSTEL',
  'CLASSROOM', 'LABORATORY', 'LIBRARY', 'SECURITY', 'TRANSPORT', 'CANTEEN', 'INFRASTRUCTURE', 'OTHER'
];

interface LocalAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export const ComplaintWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State (which also serves as Draft)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // AI & Submission State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Similar Complaints
  const [similarComplaints, setSimilarComplaints] = useState<SimilarComplaint[]>([]);
  const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);

  // Load Draft from LocalStorage on mount
  useEffect(() => {
    const draftStr = localStorage.getItem('campusfix_complaint_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setBuilding(draft.building || '');
        setFloor(draft.floor || '');
        setRoom(draft.room || '');
        setLocation(draft.location || '');
        setCategory(draft.category || '');
        setPriority(draft.priority || '');
        if (draft.step) setStep(draft.step);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }

    // QR Prefill
    const qBuilding = searchParams.get('building');
    const qFloor = searchParams.get('floor');
    const qRoom = searchParams.get('room');
    const qLocation = searchParams.get('location');

    if (qBuilding || qFloor || qRoom || qLocation) {
      if (qBuilding) setBuilding(qBuilding);
      if (qFloor) setFloor(qFloor);
      if (qRoom) setRoom(qRoom);
      const computedLoc = qLocation || [qRoom, qFloor, qBuilding].filter(Boolean).join(', ');
      setLocation(computedLoc);
      setStep(2); // Jump to location step if QR scanned
    }
  }, [searchParams]);

  // Save Draft on change
  useEffect(() => {
    const draft = { title, description, building, floor, room, location, category, priority, step };
    localStorage.setItem('campusfix_complaint_draft', JSON.stringify(draft));
  }, [title, description, building, floor, room, location, category, priority, step]);

  // Similar Complaints Check (Debounced on Title)
  useEffect(() => {
    if (title.trim().length < 5 || step !== 1) {
      setSimilarComplaints([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsCheckingSimilar(true);
        const res = await complaintApi.checkSimilar({ title: title.trim(), description: description.trim() });
        if (res.success && res.data) setSimilarComplaints(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingSimilar(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, description, step]);


  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [showQualityWarning, setShowQualityWarning] = useState(false);

  const handleNext = async () => {
    setError('');
    
    // Validation & Quality Check
    if (step === 1) {
      if (title.length < 5) { setError('Title is too short. Please provide a brief summary.'); return; }
      if (description.length < 10) { setError('Description is too short. Please add more details.'); return; }
      
      // Quality Check
      if (description.length < 25 && !showQualityWarning) {
        setShowQualityWarning(true);
        return;
      }
    }
    
    if (step === 2) {
      const computedLoc = location || [room, floor, building].filter(Boolean).join(', ');
      if (computedLoc.length < 2) { setError('Please provide a location.'); return; }
      setLocation(computedLoc);
    }
    
    // AI Analysis Transition
    if (step === 3) {
      setStep(4);
      analyzeComplaint();
      return;
    }

    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input is not supported in your browser.');
      return;
    }
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setDescription(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please check your browser permissions.');
        } else if (event.error === 'no-speech') {
          setError('No speech was detected. Please try again.');
        } else if (event.error === 'network') {
          setError('Network error: Browsers like Brave or strict firewalls block Google Voice Recognition. Try using Chrome or Edge.');
        } else {
          setError(`Microphone error: ${event.error}`);
        }
      };
      
      recognition.onend = () => setIsRecording(false);
      
      recognition.start();
    } catch (err) {
      console.error(err);
      setError('Could not start voice recording.');
      setIsRecording(false);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const analyzeComplaint = async () => {
    setIsAnalyzing(true);
    try {
      const res = await complaintApi.analyze({ title, description, location });
      if (res.success && res.data) {
        setCategory(res.data.category);
        setPriority(res.data.priority);
        setAiConfidence(res.data.confidence);
        setAiReasoning(res.data.indicators || []);
      }
    } catch (err) {
      console.error(err);
      setError('AI Analysis failed. Please manually select category and priority.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [aiPhotoTags, setAiPhotoTags] = useState<string[]>([]);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSizeBytes = 5 * 1024 * 1024;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type) || file.size > maxSizeBytes) continue;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileUrl = event.target?.result as string;
        setAttachments(prev => [...prev, {
          fileName: file.name, fileUrl, fileSize: file.size, mimeType: file.type
        }]);

        if (file.type.startsWith('image/')) {
          try {
            setIsAnalyzingPhoto(true);
            const res = await complaintApi.analyzeImage({ fileData: fileUrl, mimeType: file.type });
            if (res.success && res.data?.tags) {
              setAiPhotoTags(prev => Array.from(new Set([...prev, ...res.data!.tags])));
            }
          } catch (err) {
            console.error('Failed to analyze photo', err);
          } finally {
            setIsAnalyzingPhoto(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await complaintApi.create({
        title, description, location, building, floor, room, language, category: category as Category, priority: priority as Priority, attachments
      });
      if (res.success) {
        localStorage.removeItem('campusfix_complaint_draft');
        navigate(`/student/complaints/${res.data?.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('campusfix_complaint_draft');
    setTitle(''); setDescription(''); setBuilding(''); setFloor(''); setRoom(''); setLocation('');
    setCategory(''); setPriority(''); setAttachments([]); setStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header & Progress */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
        <div className="flex items-center justify-between mt-4">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {s}
              </div>
              <div className={`text-xs mt-2 ${step >= s ? 'text-primary-400' : 'text-slate-500'}`}>
                {s === 1 && 'Details'}
                {s === 2 && 'Location'}
                {s === 3 && 'Evidence'}
                {s === 4 && 'AI Analysis'}
                {s === 5 && 'Review'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-end mb-2">
              <select value={language} onChange={e => setLanguage(e.target.value as any)} className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg p-2">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title (Brief Summary)</label>
              <input type="text" value={title} onChange={e => { setTitle(e.target.value); setShowQualityWarning(false); }} placeholder="e.g. AC not cooling" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500" />
            </div>
            
            {similarComplaints.length > 0 && (
              <SimilarComplaintsBanner 
                similarComplaints={similarComplaints} 
                onDismiss={() => setSimilarComplaints([])} 
                onConfirmExisting={(c) => navigate(`/student/complaints/${c.id}`)}
              />
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">Description <span className="text-slate-500 text-xs ml-2">(Be as detailed as possible)</span></label>
                <button type="button" onClick={startVoiceRecording} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}>
                  <Mic size={14} /> {isRecording ? 'Listening...' : 'Speak'}
                </button>
              </div>
              <textarea value={description} onChange={e => { setDescription(e.target.value); setShowQualityWarning(false); }} rows={5} placeholder={language === 'hi' ? 'समस्या का विस्तार से वर्णन करें...' : language === 'mr' ? 'समस्येचे सविस्तर वर्णन करा...' : 'Describe exactly what is wrong...'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500" />
            </div>

            {showQualityWarning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg text-amber-400 text-sm">
                <div className="font-semibold flex items-center gap-2 mb-1"><AlertCircle size={16} /> Needs More Detail</div>
                Your description is very brief. AI can help you better if you provide more information (e.g., exact location in the room, how long it's been happening). You can skip if you don't know.
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <button onClick={clearDraft} className="text-slate-400 hover:text-red-400 text-sm">Delete Draft</button>
              <div className="flex items-center gap-3">
                {showQualityWarning && <button onClick={() => { setShowQualityWarning(false); setStep(2); }} className="text-slate-400 hover:text-white px-4 py-2 font-medium">Skip</button>}
                <button onClick={handleNext} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">Next <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Building</label>
                <select value={building} onChange={e => setBuilding(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500">
                  <option value="">Select Building (Optional)</option>
                  {COMMON_BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Floor</label>
                <select value={floor} onChange={e => setFloor(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500">
                  <option value="">Select Floor (Optional)</option>
                  {COMMON_FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Room / Asset ID</label>
              <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 204 or PRJ-01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Exact Location Description (Required)</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Computer Lab 3, near the window" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary-500" />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <button onClick={handleBack} className="text-slate-400 hover:text-white px-4 py-2 font-medium flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
              <button onClick={handleNext} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center bg-slate-900/50">
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-300 mb-2">Upload photos or documents</p>
              <p className="text-xs text-slate-500 mb-4">JPG, PNG, PDF up to 5MB</p>
              <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm">Select Files</button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" />
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    {file.mimeType.startsWith('image') ? (
                      <img src={file.fileUrl} alt="preview" className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-slate-800"><FileText className="text-slate-500" /></div>
                    )}
                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            {isAnalyzingPhoto && <p className="text-xs text-indigo-400 animate-pulse flex items-center gap-1"><Sparkles size={12}/> AI analyzing image...</p>}

            {aiPhotoTags.length > 0 && (
              <div className="bg-slate-900/50 p-4 border border-slate-700 rounded-lg">
                <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><ImageIcon size={16}/> AI Image Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {aiPhotoTags.map(tag => (
                    <button 
                      key={tag} 
                      onClick={() => { setDescription(prev => prev + (prev ? ' - ' : '') + tag); setAiPhotoTags(prev => prev.filter(t => t !== tag)); }}
                      className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full hover:bg-indigo-500/40 transition"
                      title="Click to add to description"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <button onClick={handleBack} className="text-slate-400 hover:text-white px-4 py-2 font-medium flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
              <button onClick={handleNext} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">Analyze with AI <Sparkles size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 4: AI ANALYSIS */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                <h3 className="text-lg font-medium text-white">AI is structuring your complaint...</h3>
                <p className="text-slate-400 text-sm">Extracting category, priority, and location details.</p>
              </div>
            ) : (
              <div>
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-indigo-400" />
                    <h3 className="text-lg font-medium text-white">AI Suggestions</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  {aiReasoning.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700">
                      <span className="font-semibold text-indigo-300 block mb-1">Why these suggestions?</span>
                      Keywords detected: {aiReasoning.join(', ')}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-4 italic">Please review and edit these suggestions if they are incorrect before submitting.</p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                  <button onClick={handleBack} className="text-slate-400 hover:text-white px-4 py-2 font-medium flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
                  <button onClick={handleNext} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">Review Summary <ArrowRight size={18} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-semibold text-white mb-4">Final Review</h3>
            
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-sm text-slate-400 block">Problem</span>
                <p className="text-white font-medium">{title}</p>
                <p className="text-slate-300 text-sm mt-1">{description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-400 block">Location</span>
                  <p className="text-white flex items-center gap-2"><MapPin size={14}/> {location}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400 block">Category</span>
                  <p className="text-white">{category}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400 block">Priority</span>
                  <p className="text-white">{priority}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400 block">Attachments</span>
                  <p className="text-white">{attachments.length} files attached</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <button onClick={handleBack} disabled={isSubmitting} className="text-slate-400 hover:text-white px-4 py-2 font-medium flex items-center gap-2 disabled:opacity-50"><ArrowLeft size={18} /> Edit</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'} <CheckCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
