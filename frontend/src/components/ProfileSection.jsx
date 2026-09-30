import { useState, useMemo } from "react";
import { auth } from "../firebase/firebase";
import { updateProfile } from "firebase/auth";
import { updateUserProfile } from "../services/firestoreService";

/**
 * Extracts the user's real name from profile or auth data.
 * Returns empty string if missing or invalid (never "undefined" or "null").
 */
export const getUserDisplayName = (profile, user) => {
  const authUser = user || auth.currentUser;
  const candidate =
    profile?.fullName ||
    profile?.name ||
    profile?.displayName ||
    profile?.userName ||
    profile?.username ||
    authUser?.displayName;

  if (
    typeof candidate === "string" &&
    candidate.trim().length > 0 &&
    candidate.trim().toLowerCase() !== "undefined" &&
    candidate.trim().toLowerCase() !== "null"
  ) {
    return candidate.trim();
  }
  return "";
};

/**
 * Generates up to 2 uppercase initials from a name string.
 */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "👤";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "👤";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Calculates BMI and returns numerical string and classification.
 */
export const computeBMI = (weight, height, fallbackBmi) => {
  const w = Number(weight);
  const h = Number(height);
  if (w > 0 && h > 0) {
    const calculated = w / Math.pow(h / 100, 2);
    if (!isNaN(calculated) && isFinite(calculated)) {
      return {
        value: calculated.toFixed(1),
        category: getBMICategory(calculated),
      };
    }
  }
  if (fallbackBmi != null && !isNaN(Number(fallbackBmi))) {
    const val = Number(fallbackBmi);
    return {
      value: val.toFixed(1),
      category: getBMICategory(val),
    };
  }
  return null;
};

const getBMICategory = (bmi) => {
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal Weight",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    label: "Obese",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  };
};

function ProfileSection({ profile, user, onProfileUpdated, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const rawName = getUserDisplayName(profile, user);
  const displayName = rawName || "Your Profile";
  const initials = getInitials(rawName);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: rawName,
    age: profile?.age ?? "",
    gender: profile?.gender ?? "",
    height: profile?.height ?? "",
    weight: profile?.weight ?? "",
    goal: profile?.goal || profile?.fitnessGoal || "",
    activityLevel: profile?.activityLevel ?? "",
    dietPreference: profile?.dietPreference ?? "",
  });

  const bmiData = useMemo(() => {
    return computeBMI(
      profile?.weight,
      profile?.height,
      profile?.bodyAnalysis?.bmi
    );
  }, [profile?.weight, profile?.height, profile?.bodyAnalysis?.bmi]);

  const handleStartEdit = () => {
    setFormData({
      name: getUserDisplayName(profile, user),
      age: profile?.age ?? "",
      gender: profile?.gender ?? "",
      height: profile?.height ?? "",
      weight: profile?.weight ?? "",
      goal: profile?.goal || profile?.fitnessGoal || "",
      activityLevel: profile?.activityLevel ?? "",
      dietPreference: profile?.dietPreference ?? "",
    });
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      setErrorMessage("No active authenticated session found.");
      return;
    }

    // Validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    const ageNum = Number(formData.age);
    if (formData.age !== "" && (isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
      setErrorMessage("Please enter a valid age between 1 and 120.");
      return;
    }

    const heightNum = Number(formData.height);
    if (formData.height !== "" && (isNaN(heightNum) || heightNum < 50 || heightNum > 250)) {
      setErrorMessage("Height must be between 50 and 250 cm.");
      return;
    }

    const weightNum = Number(formData.weight);
    if (formData.weight !== "" && (isNaN(weightNum) || weightNum < 20 || weightNum > 300)) {
      setErrorMessage("Weight must be between 20 and 300 kg.");
      return;
    }

    try {
      setSaving(true);

      const updatedPayload = {
        name: trimmedName,
        fullName: trimmedName,
        age: formData.age !== "" ? Number(formData.age) : profile?.age ?? null,
        gender: formData.gender || profile?.gender || "",
        height: formData.height !== "" ? Number(formData.height) : profile?.height ?? null,
        weight: formData.weight !== "" ? Number(formData.weight) : profile?.weight ?? null,
        goal: formData.goal || profile?.goal || "",
        fitnessGoal: formData.goal || profile?.goal || "",
        activityLevel: formData.activityLevel || profile?.activityLevel || "",
        dietPreference: formData.dietPreference || profile?.dietPreference || "",
      };

      // 1. Save to Firestore
      await updateUserProfile(currentUser.uid, updatedPayload);

      // 2. Update Firebase Auth displayName if possible
      if (currentUser.displayName !== trimmedName) {
        try {
          await updateProfile(currentUser, { displayName: trimmedName });
        } catch (authErr) {
          console.warn("Could not sync displayName with Firebase Auth:", authErr);
        }
      }

      // 3. Immediately propagate updated data to parent state
      if (onProfileUpdated) {
        onProfileUpdated(updatedPayload);
      }

      // 4. Dispatch global window event for cross-component sync
      window.dispatchEvent(
        new CustomEvent("profileUpdated", { detail: updatedPayload })
      );

      setSuccessMessage("Profile updated successfully! ✨");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMessage(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const emailDisplay = profile?.email || user?.email || "—";
  const goalDisplay = profile?.goal || profile?.fitnessGoal || "General Fitness";
  const activityDisplay = profile?.activityLevel || "Moderate";
  const dietDisplay = profile?.dietPreference || "Balanced";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-left">
      {/* Toast Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 font-medium text-sm">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-emerald-600 hover:text-emerald-900 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 font-medium text-sm">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-rose-600 hover:text-rose-900 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. PROFILE HEADER */}
      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 border border-orange-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-100/40 via-orange-50/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Profile Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 text-white font-bold text-2xl md:text-3xl flex items-center justify-center shadow-lg ring-4 ring-orange-100 flex-shrink-0 select-none">
              {initials}
            </div>

            {/* User Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-textPrimary tracking-tight">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Verified Member
                </span>
              </div>

              <p className="text-sm md:text-base text-textSecondary flex items-center gap-1.5 font-body">
                <span>✉️</span>
                <span>{emailDisplay}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-primary border border-orange-200">
                  🎯 {goalDisplay}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  ⚡ {activityDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3 self-start md:self-center">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition flex items-center gap-2 shadow-sm text-sm"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleCancelEdit}
                className="bg-gray-100 text-textSecondary px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
              >
                Cancel
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="border border-gray-200 text-textSecondary hover:text-rose-600 hover:border-rose-200 px-4 py-2.5 rounded-xl font-semibold transition text-sm flex items-center gap-1.5"
                title="Log out of FitIQ"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE FORM */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl shadow-card p-6 md:p-8 border border-primary/30 space-y-6 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-textPrimary">
                Edit Your Profile Information
              </h2>
              <p className="text-xs md:text-sm text-textSecondary mt-0.5">
                Update your registered details to personalize your fitness plan and greetings.
              </p>
            </div>
            <span className="text-xs bg-orange-50 text-primary font-semibold px-2.5 py-1 rounded-md border border-orange-200">
              Editing Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Varsha Mohan"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
              />
            </div>

            {/* Email (Read only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Registered Email
              </label>
              <input
                type="email"
                value={emailDisplay}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Age (years)
              </label>
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g. 24"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition bg-white"
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Height */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                min="50"
                max="250"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="e.g. 165"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                min="20"
                max="300"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="e.g. 58"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
              />
            </div>

            {/* Goal */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Fitness Goal
              </label>
              <select
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition bg-white"
              >
                <option value="">Select Primary Goal</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Building</option>
                <option value="maintenance">Maintenance</option>
                <option value="endurance">Endurance & Stamina</option>
                <option value="general-health">General Health & Wellness</option>
              </select>
            </div>

            {/* Activity Level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Activity Level
              </label>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition bg-white"
              >
                <option value="">Select Activity Level</option>
                <option value="sedentary">Sedentary (desk job, minimal movement)</option>
                <option value="light">Lightly Active (light exercise 1-3 days/week)</option>
                <option value="moderate">Moderately Active (moderate exercise 3-5 days/week)</option>
                <option value="very-active">Very Active (hard exercise 6-7 days/week)</option>
                <option value="extra-active">Athlete / Physical Job (intense daily training)</option>
              </select>
            </div>

            {/* Diet Preference */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-textSecondary">
                Dietary Preference
              </label>
              <select
                name="dietPreference"
                value={formData.dietPreference}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition bg-white"
              >
                <option value="">Select Dietary Preference</option>
                <option value="mixed">Balanced / Non-Vegetarian (Mixed)</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="high-protein">High Protein Focused</option>
                <option value="keto">Ketogenic / Low-Carb</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-textSecondary hover:bg-gray-50 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* CARDS GRID: PERSONAL INFO, BODY INFO, FITNESS GOAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 2. PERSONAL INFORMATION */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-orange-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold font-heading text-textPrimary flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 rounded-lg text-primary text-sm">👤</span>
                Personal Details
              </h3>
              <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">
                Identity
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-textSecondary font-medium">Full Name</p>
                <p className="text-base font-semibold text-textPrimary mt-0.5">
                  {displayName}
                </p>
              </div>

              <div>
                <p className="text-xs text-textSecondary font-medium">Email Address</p>
                <p className="text-sm font-medium text-textPrimary mt-0.5 break-all">
                  {emailDisplay}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-xs text-textSecondary font-medium">Age</p>
                  <p className="text-base font-semibold text-textPrimary mt-0.5">
                    {profile?.age ? `${profile.age} years` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary font-medium">Gender</p>
                  <p className="text-base font-semibold text-textPrimary mt-0.5 capitalize">
                    {profile?.gender || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs text-textSecondary">
            <span>Account Status</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>
        </div>

        {/* 3. BODY INFORMATION */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-orange-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold font-heading text-textPrimary flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 rounded-lg text-blue-700 text-sm">⚖️</span>
                Body Metrics
              </h3>
              <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">
                Vitals
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-textSecondary font-medium">Height</p>
                  <p className="text-lg font-bold text-textPrimary mt-0.5">
                    {profile?.height ? `${profile.height} cm` : "—"}
                  </p>
                </div>
                <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-textSecondary font-medium">Weight</p>
                  <p className="text-lg font-bold text-textPrimary mt-0.5">
                    {profile?.weight ? `${profile.weight} kg` : "—"}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
                    Body Mass Index (BMI)
                  </p>
                  {bmiData?.category && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${bmiData.category.badgeClass}`}
                    >
                      {bmiData.category.label}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-extrabold text-primary mt-1">
                  {bmiData ? bmiData.value : "—"}
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  Healthy benchmark range is typically 18.5 – 24.9.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs text-textSecondary">
            <span>Body Analysis</span>
            <span className="font-medium text-textPrimary">
              {profile?.bodyAnalysis?.healthScore
                ? `Health Score: ${profile.bodyAnalysis.healthScore}/100`
                : "Computed from metrics"}
            </span>
          </div>
        </div>

        {/* 4. FITNESS GOAL */}
        <div className="bg-white rounded-2xl shadow-card p-6 border border-orange-50 flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold font-heading text-textPrimary flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700 text-sm">🎯</span>
                Fitness & Lifestyle
              </h3>
              <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">
                Target
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-textSecondary font-medium">Current Goal</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <p className="text-base font-bold text-textPrimary capitalize">
                    {goalDisplay}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-textSecondary font-medium">Activity Frequency</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5 capitalize">
                  {activityDisplay}
                </p>
              </div>

              <div>
                <p className="text-xs text-textSecondary font-medium">Dietary Pattern</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5 capitalize">
                  {dietDisplay}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs text-textSecondary">
            <span>Customized Meal & Workout</span>
            <span className="text-primary font-semibold">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
