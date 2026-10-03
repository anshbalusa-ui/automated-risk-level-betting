"use client";

import * as React from "react";
import { Slottable, Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "./liquid-glass-button.module.css";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-sky-500 text-slate-950 shadow-sm hover:bg-sky-400",
        destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-500",
        cool: "bg-cyan-600 text-white shadow-sm hover:bg-cyan-500",
        outline: "border border-white/20 bg-transparent text-slate-100 hover:bg-white/10",
        secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600",
        ghost: "text-slate-100 hover:bg-white/10",
        link: "text-sky-300 underline-offset-4 hover:underline",
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
  `${styles.glass} relative isolate inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-medium text-white transition-[transform,background-color,box-shadow,border-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none aria-disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
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
    const filterId = `glass-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
        <svg
          className={styles.filterDefinition}
          style={{ width: 0, height: 0 }}
          aria-hidden="true"
          focusable="false"
        >
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.04"
              numOctaves="2"
              seed="4"
              result="texture"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="texture"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <span className={styles.lens} style={{ filter: `url(#${filterId})` }} aria-hidden="true" />
        <span className={styles.highlight} aria-hidden="true" />
        {asChild ? <Slottable>{props.children}</Slottable> : <span className={styles.content}>{props.children}</span>}
      </Comp>
    );
  },
);
LiquidButton.displayName = "LiquidButton";

const metalButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold shadow-lg transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-px hover:shadow-xl active:translate-y-px active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "border-white/20 bg-gradient-to-b from-slate-300 to-slate-500 text-slate-950",
        primary: "border-sky-300/30 bg-gradient-to-b from-sky-400 to-sky-700 text-white",
        success: "border-emerald-300/30 bg-gradient-to-b from-emerald-400 to-emerald-700 text-white",
        error: "border-rose-300/30 bg-gradient-to-b from-rose-400 to-rose-700 text-white",
        gold: "border-amber-200/40 bg-gradient-to-b from-amber-300 to-amber-600 text-slate-950",
        bronze: "border-orange-200/30 bg-gradient-to-b from-orange-400 to-orange-800 text-white",
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
