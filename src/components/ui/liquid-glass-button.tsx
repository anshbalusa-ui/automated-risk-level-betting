"use client";

import * as React from "react";
import { Slottable, Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "./liquid-glass-button.module.css";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-neutral-300 text-neutral-950 shadow-sm hover:bg-neutral-200",
        destructive: "bg-neutral-700 text-white shadow-sm hover:bg-neutral-600",
        cool: "bg-neutral-600 text-white shadow-sm hover:bg-neutral-500",
        outline: "border border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800",
        secondary: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        ghost: "text-neutral-100 hover:bg-neutral-800",
        link: "text-neutral-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export const liquidbuttonVariants = cva(
  `${styles.glass} relative isolate inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-medium text-white transition-[transform,background-color,box-shadow,border-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none aria-disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default: styles.variantDefault,
        destructive: styles.variantDestructive,
        outline: styles.variantOutline,
        secondary: styles.variantSecondary,
        ghost: styles.variantGhost,
        link: styles.variantLink,
      },
      size: {
        default: "h-10 rounded-xl px-5 text-sm",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-2xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-base",
        xxl: "h-16 rounded-3xl px-10 text-lg",
        icon: "size-10 rounded-xl p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type LiquidButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof liquidbuttonVariants> & { asChild?: boolean };

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      disabled,
      type,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const preventDisabledInteraction = (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const preventDisabledKey = (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") preventDisabledInteraction(event);
    };

    return (
      <Comp
        className={cn(liquidbuttonVariants({ variant, size }), className)}
        ref={ref}
        {...(!asChild ? { disabled, type: type ?? "button" } : {})}
        {...(asChild ? { "aria-disabled": disabled || undefined, tabIndex: disabled ? -1 : undefined } : {})}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onClickCapture={disabled && asChild ? preventDisabledInteraction : undefined}
        onKeyDownCapture={disabled && asChild ? preventDisabledKey : undefined}
        {...props}
      >
        <span className={styles.lens} aria-hidden="true" />
        <span className={styles.highlight} aria-hidden="true" />
        {asChild ? <Slottable>{props.children}</Slottable> : <span className={styles.content}>{props.children}</span>}
      </Comp>
    );
  },
);
LiquidButton.displayName = "LiquidButton";

const metalButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold shadow-lg transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px hover:shadow-xl active:translate-y-px active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "border-neutral-700 bg-gradient-to-b from-neutral-300 to-neutral-500 text-neutral-950",
        primary: "border-neutral-300/30 bg-gradient-to-b from-neutral-400 to-neutral-700 text-white",
        success: "border-neutral-300/30 bg-gradient-to-b from-neutral-400 to-neutral-700 text-white",
        error: "border-neutral-300/30 bg-gradient-to-b from-neutral-500 to-neutral-800 text-white",
        gold: "border-neutral-300/40 bg-gradient-to-b from-neutral-300 to-neutral-600 text-neutral-950",
        bronze: "border-neutral-300/30 bg-gradient-to-b from-neutral-400 to-neutral-800 text-white",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-2xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-base",
        xxl: "h-16 rounded-3xl px-10 text-lg",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type MetalButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof metalButtonVariants>;

export const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(metalButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
MetalButton.displayName = "MetalButton";
