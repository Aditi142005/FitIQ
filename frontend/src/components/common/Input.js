import { useState } from "react";

function Input({ label, type, placeholder, value, onChange}) {

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div>

      <label className="block mb-2 font-medium">
        {label}
      </label>

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
          className="w-full border rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary [&::-ms-reveal]:hidden"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500"
          >
            👁
          </button>
        )}

      </div>

    </div>
  );
}

export default Input;