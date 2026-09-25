import { useState } from "react";

function Input({ label, type, placeholder, value, onChange, error, disabled = false, className = "", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 font-medium text-textPrimary text-sm">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={
            isPassword && showPassword
              ? "text"
              : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full border ${
            error 
              ? "border-red-500 focus:ring-red-400 bg-red-50/20" 
              : "border-gray-200 focus:ring-primary bg-white"
          } rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 [&::-ms-reveal]:hidden transition-all duration-200 text-textPrimary ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            tabIndex="-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

export default Input;