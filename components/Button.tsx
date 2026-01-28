import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'purple';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    // Primary: Elleo Dark (#273851)
    primary: "bg-elleo-dark text-white hover:bg-[#1a2639] focus:ring-elleo-dark",
    // Purple: Brand Purple (#A09FE2) - Use darker text or white depending on preference. White looks cleaner for primary actions.
    purple: "bg-elleo-purple text-white hover:bg-[#8f8ed3] focus:ring-elleo-purple",
    // Secondary: White with Elleo Dark border/text
    secondary: "bg-white text-elleo-dark border border-slate-300 hover:bg-slate-50 focus:ring-slate-400",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-500",
    ghost: "text-slate-500 hover:text-elleo-dark hover:bg-slate-100"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};