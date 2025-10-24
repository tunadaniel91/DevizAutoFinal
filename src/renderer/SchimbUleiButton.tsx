import React from 'react'
import { Bell } from 'lucide-react'

interface SchimbUleiButtonProps {
  isChecked?: boolean;
  onChange: (checked: boolean) => void;
  readOnly: boolean;
}

export default function SchimbUleiButton({ isChecked = false, onChange, readOnly }: SchimbUleiButtonProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!readOnly) {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      className={`inline-flex items-center justify-between gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
        readOnly ? 'opacity-70' : ''
      } ${
        isChecked
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-green-100 text-green-800 hover:bg-green-200'
      } ${readOnly ? 'cursor-default' : 'cursor-pointer'} w-full max-w-xs`}
    >
      <span className="flex items-center gap-2">
        <Bell className="h-5 w-5" aria-hidden="true" />
        <span>Schimb ulei</span>
      </span>
      <input
        type="checkbox"
        className="form-checkbox h-5 w-5 text-green-600 border-green-300 rounded focus:ring-green-500"
        checked={isChecked}
        onChange={handleChange}
        disabled={readOnly}
        aria-checked={isChecked}
      />
    </label>
  )
}