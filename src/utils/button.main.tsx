import { forwardRef } from "react";
import { ButtonProps, ButtonSize, ButtonVariant, Ref } from "./button.types";
import clsx from "clsx";
import { useWallet } from "@solana/wallet-adapter-react";

const colorMap = {
  outline:
    "text-primary border border-gray-200 hover:bg-gray-200 hover:ring-2 ring-gray-300 hover:ring-offset-2",
  solid:
    "text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:bg-gradient-to-l hover:from-yellow-500 hover:to-yellow-400 ring-2 ring-yellow-300 hover:ring-offset-2",
  ghost: "text-primary",
  special: "text-black bg-gradient-to-b from-primaryLight to-primary",
  secondary:
    "text-primary bg-gray-100 rounded-xl hover:bg-gray-200 hover:ring-2 ring-gray-300 hover:ring-offset-2",
} as Record<ButtonVariant, string>;

const sizeMap = {
  small: "px-4 py-2 text-sm",
  medium: "h-10 px-6 text-base",
  large: "px-12 py-4 text-lg",
} as Record<ButtonSize, string>;

const Button = forwardRef<Ref, ButtonProps>((props, ref) => {
  const { connect } = useWallet();
  const {
    variant = "solid",
    className,
    children,
    size = "medium",
    showloading = false,
    ...rest
  } = props;

  const merged = clsx(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed",
    colorMap[variant],
    sizeMap[size],
    className
  );

  return (
    <button ref={ref} className={merged} onClick={connect} {...rest}>
      {showloading ? (
        <svg
          className="animate-spin h-6 w-6 text-yellow-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <>
          {props?.lefticon && props?.lefticon}
          {children}
          {props?.righticon && props?.righticon}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;
