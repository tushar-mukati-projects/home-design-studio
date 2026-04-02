"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
});

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (open) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger = ({
  children,
  className,
  asChild,
  ...props
}: DropdownMenuTriggerProps) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        (
          children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
        ).props.onClick?.(e);
        setOpen(!open);
      },
    });
  }

  return (
    <button type="button" className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

const DropdownMenuContent = ({
  children,
  className,
  align = "start",
  ...props
}: DropdownMenuContentProps) => {
  const { open } = React.useContext(DropdownMenuContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        "animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--popover)] p-1 text-[var(--popover-foreground)] shadow-md duration-100",
        align === "end" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "start" && "left-0",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem = ({
  children,
  className,
  disabled,
  onSelect,
  ...props
}: DropdownMenuItemProps) => {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <div
      className={cn(
        "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] focus:bg-[var(--secondary)]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={() => {
        if (!disabled) {
          onSelect?.();
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("-mx-1 my-1 h-px bg-[var(--border)]", className)} {...props} />;
};

const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />;
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
