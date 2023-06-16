import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export default function Button({ isLoading, children, ...otherProps }: ButtonProps) {
  return (
    <button
      {...otherProps}
      className={`flex flex-row justify-center items-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-blue-500 font-bold px-3 py-1 text-sm rounded-lg whitespace-nowrap ${isLoading ? ' pointer-events-none opacity-70' : 'cursor-pointer'}`}
    >
      {isLoading? 'Loading...' : children}
    </button>
  );
}
