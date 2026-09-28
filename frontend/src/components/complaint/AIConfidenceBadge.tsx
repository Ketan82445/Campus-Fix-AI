import React from 'react';
import { AIPrediction } from '../../types';
import { Sparkles, Brain, CheckCircle, AlertTriangle } from 'lucide-react';

export const AIConfidenceBadge: React.FC<{ prediction?: AIPrediction; confidence?: number | null }> = ({
  prediction,
  confidence
}) => {
  const confValue = prediction ? prediction.confidence : (confidence || 0);
  const percentage = Math.round(confValue * 100);

  let indicators: string[] = [];
  if (prediction?.predictionIndicators) {
    try {
      indicators = JSON.parse(prediction.predictionIndicators);
    } catch {}
  }

  const isHighConfidence = confValue >= 0.75;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 p-3.5 rounded-xl text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
          <Brain className="w-4 h-4 text-indigo-600" />
          <span>AI Categorization Analysis</span>
        </div>
        <div
          className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
            isHighConfidence
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {isHighConfidence ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          <span>{percentage}% Confidence</span>
        </div>
      </div>

      {prediction && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60 text-[11px]">
          <div>
            <span className="text-slate-500">Predicted Category:</span>
            <p className="font-semibold text-slate-800">{prediction.predictedCategory}</p>
          </div>
          <div>
            <span className="text-slate-500">Recommended Dept:</span>
            <p className="font-semibold text-slate-800">{prediction.predictedDepartment || 'N/A'}</p>
          </div>
        </div>
      )}

      {indicators.length > 0 && (
        <div className="pt-1">
          <span className="text-[10px] text-slate-500 font-medium">Detected Key Indicators:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {indicators.map((kw, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-white text-indigo-700 rounded border border-indigo-200 text-[10px] font-mono shadow-2xs"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
