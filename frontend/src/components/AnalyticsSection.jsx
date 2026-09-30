import React from 'react';
import {
  Activity,
  Zap,
  TrendingUp,
  Users,
  AlertTriangle,
  Utensils,
  CheckCircle2,
  Flame,
  ShieldAlert
} from 'lucide-react';

export default function AnalyticsSection({
  profile,
  fisResult,
  behaviorResult,
  predictionResult,
  cohortResult,
  anomalyResult,
  nutritionData,
  interpretationResult,
  streakDays
}) {
  // Safe defaults based on data
  const fisScore = fisResult?.score || 0;
  const fisRange = fisResult?.category || 'Unknown';
  
  // E2 Behaviors
  const personalPatterns = behaviorResult?.patterns || [];
  
  // E3 Prediction
  const goalTarget = profile?.goal || 'Maintain Fitness';
  const targetDate = predictionResult?.estimated_goal_date || 'N/A';
  const dropoutRisk = predictionResult?.dropout_probability || 0;
  const goalProbability = predictionResult?.goal_probability || 0;
  
  // E4 Cohort
  const cohortRank = cohortResult?.rank || '-';
  const cohortTotal = cohortResult?.cohort_size || '-';
  
  // E5 Anomaly
  const activePlateau = anomalyResult?.is_plateau || false;
  const plateauDays = anomalyResult?.plateau_duration || 0;
  const slope = anomalyResult?.slope || 0;
  
  // E6 Nutrition
  const tdee = nutritionData?.tdee || 0;
  const bmr = nutritionData?.bmr || 0;
  const targetCalories = nutritionData?.targetCalories || 0;
  const protein = nutritionData?.macros?.protein || 0;
  const carbs = nutritionData?.macros?.carbs || 0;
  const fats = nutritionData?.macros?.fats || 0;
  
  // E7 LLM Interpretations
  const um = interpretationResult?.user_mode || {};

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-slate-800 p-4 md:p-8 font-sans">
      {/* SECTION HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#ca5238] font-semibold text-sm tracking-wide uppercase">
              <Activity className="w-4 h-4" /> Comprehensive Analytics Hub
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Your Health Intelligence & Analytics
            </h1>
            <p className="text-slate-600 mt-1 text-sm md:text-base">
              FitIQ processes your behavioral and daily health metrics across 7 dedicated analytical engines to explain your progress and prioritize actions.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-orange-50 text-[#ca5238] rounded-lg">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Micro-Action Streak</div>
              <div className="text-lg font-bold text-slate-900">{streakDays || 0} Days Consecutive</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 ENGINES GRID */}
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ==========================================
            ENGINE 1 — FIS SCORE SYSTEM
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Engine 1</span>
                <h2 className="text-xl font-bold text-slate-900">Overall Fitness Score (FIS)</h2>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              Adaptive Weights Active
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Representation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#ca5238]"
                    strokeDasharray={`${fisScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-4xl font-extrabold text-slate-900">{fisScore}</span>
                  <span className="text-sm font-semibold text-slate-400 block">/ 100</span>
                  <span className="mt-1 inline-block px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                    {fisRange}
                  </span>
                </div>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("FIS") || k.engine.includes("Engine 1"))?.finding || 
                   `Your overall health intelligence score is currently at ${fisScore} / 100 (${fisRange}).`}
                </p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("FIS") || k.engine.includes("Engine 1"))?.explanation || 
                   "Your FIS formula is dynamically weighted based on your recent behaviors."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 2 — BEHAVIORAL PATTERN MINING
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Engine 2</span>
                <h2 className="text-xl font-bold text-slate-900">Behavioral Pattern Mining (Habit Connections)</h2>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
              Pearson Correlations Validated
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Correlation Cards */}
            <div className="md:col-span-5 grid grid-cols-1 gap-3">
              {personalPatterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">{pattern.relationship.replace("_", " vs. ")}</div>
                    <div className="text-sm font-bold text-slate-900">r = {pattern.correlation || 'N/A'} ({pattern.strength})</div>
                  </div>
                </div>
              ))}
              {personalPatterns.length === 0 && (
                <div className="text-sm text-slate-500">Need more daily tracking data for personalized correlations.</div>
              )}
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Behavior") || k.engine.includes("Engine 2"))?.finding || 
                   "We are tracking your daily habits to find statistical correlations."}
                </p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Behavior") || k.engine.includes("Engine 2"))?.explanation || 
                   "Keep tracking daily to unlock hidden relationships between your habits."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 3 — PREDICTIVE ANALYTICS SUITE
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Engine 3</span>
                <h2 className="text-xl font-bold text-slate-900">Predictive Analytics Suite (Forecast & Risk)</h2>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Forecast Timeline & Risk Gauges */}
            <div className="md:col-span-5 space-y-3">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase">Goal Target</span>
                  <span className="text-xs font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                    {goalTarget}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-slate-900">Est. Date: {targetDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">Dropout Risk</span>
                  <span className="text-xl font-bold text-emerald-600">{dropoutRisk}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Gradient Boosting</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium block">Goal Probability</span>
                  <span className="text-xl font-bold text-indigo-600">{goalProbability}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Probability Modeling</span>
                </div>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Predict") || k.engine.includes("Engine 3"))?.finding || 
                   "Your consistency data is being analyzed to forecast your progress."}
                </p>
              </div>

              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Predict") || k.engine.includes("Engine 3"))?.explanation || 
                   "Maintain your tracking streak to lower dropout risk."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 4 — COHORT INTELLIGENCE
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Engine 4</span>
                <h2 className="text-xl font-bold text-slate-900">Cohort Intelligence (Peer Comparison)</h2>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Cohort Positioning */}
            <div className="md:col-span-5 bg-amber-50/50 p-5 rounded-2xl border border-amber-100 text-center space-y-3">
              <span className="text-xs font-bold uppercase text-amber-900 tracking-wide">
                Peer Group Similarity Match
              </span>
              <div className="text-3xl font-extrabold text-slate-900">
                Rank #{cohortRank} <span className="text-sm font-normal text-slate-500">of {cohortTotal}</span>
              </div>

              <div className="pt-3 border-t border-amber-200/60 text-left space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Group Goal:</span>
                  <span className="font-semibold">{goalTarget}</span>
                </div>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Cohort") || k.engine.includes("Engine 4"))?.finding || 
                   "You have been matched with anonymous users who have similar baselines."}
                </p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Cohort") || k.engine.includes("Engine 4"))?.explanation || 
                   "Comparing your habits against top performers in your cohort can identify areas for improvement."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 5 — ANOMALY & PLATEAU DETECTION
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">Engine 5</span>
                <h2 className="text-xl font-bold text-slate-900">Anomaly & Plateau Detection</h2>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Anomaly / Plateau Warning Card */}
            <div className="md:col-span-5 bg-red-50/60 p-5 rounded-2xl border border-red-200 space-y-3">
              {activePlateau ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white font-bold text-xs rounded-lg">
                      <ShieldAlert className="w-3.5 h-3.5" /> Active Plateau Alert
                    </span>
                    <span className="text-xs text-red-700 font-semibold">{plateauDays} Days Flat</span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    Weight slope: <span className="font-mono text-red-700">{slope} kg/day</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> No active plateaus detected!
                </div>
              )}
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Anomaly") || k.engine.includes("Engine 5"))?.finding || 
                   "Monitoring your weight slope for metabolic adaptation."}
                </p>
              </div>

              <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Anomaly") || k.engine.includes("Engine 5"))?.explanation || 
                   "Plateaus are a normal physiological adaptation."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 6 — NUTRITIONAL INTELLIGENCE
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Engine 6</span>
                <h2 className="text-xl font-bold text-slate-900">Nutritional Intelligence (Mifflin-St Jeor & Macros)</h2>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Nutritional Target Breakdown */}
            <div className="md:col-span-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex justify-between items-baseline border-b border-emerald-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-emerald-900 uppercase">Daily Target</span>
                  <div className="text-2xl font-extrabold text-slate-900">{targetCalories} kcal</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">BMR: {bmr} kcal</span>
                  <span className="text-xs text-slate-500 block">TDEE: {tdee} kcal</span>
                </div>
              </div>

              {/* Macro Bar */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Protein: {protein}g</span>
                  <span>Carbs: {carbs}g</span>
                  <span>Fat: {fats}g</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full flex overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[30%]" />
                  <div className="bg-amber-400 h-full w-[45%]" />
                  <div className="bg-rose-400 h-full w-[25%]" />
                </div>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 What the Data Tells Us</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Nutrition") || k.engine.includes("Engine 6"))?.finding || 
                   "Your daily caloric needs and macronutrient distribution."}
                </p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.key_findings?.find(k => k.engine.includes("Nutrition") || k.engine.includes("Engine 6"))?.explanation || 
                   "Consistently hitting your protein target preserves muscle mass."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ENGINE 7 — DASHBOARD & MICRO-ACTIONS
           ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-[#ca5238] rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#ca5238]">Engine 7</span>
                <h2 className="text-xl font-bold text-slate-900">Dashboard & Micro-Action Engine</h2>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Micro-Action Tasks */}
            <div className="md:col-span-5 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Targeted Micro-Actions
              </div>
              
              {um.priority_actions?.map((action, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <input type="checkbox" className="w-4 h-4 mt-1 accent-[#ca5238] rounded" />
                  <span className="text-sm text-slate-800 font-medium">{action.title || action.action}</span>
                </div>
              ))}
            </div>

            {/* Plain English Explanation */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">📊 Overall Summary</span>
                <p className="text-slate-700 text-sm">
                  {um.overall_summary || "Engine 7 evaluates all your sub-scores to generate these targeted micro-actions."}
                </p>
              </div>

              <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-100">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wide block mb-1">💡 FitIQ Insight</span>
                <p className="text-slate-700 text-sm">
                  {um.why_these_recommendations || "Completing at least 1 micro-action daily protects your streak, which habit research proves is the #1 predictor of long-term success."}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
