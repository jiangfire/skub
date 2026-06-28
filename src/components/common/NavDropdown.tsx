"use client";

import { useState, useRef, useEffect, useId, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavDropdownItem {
  href: string;
  label: string;
}

interface NavDropdownProps {
  trigger: ReactNode;
  triggerClassName?: string;
  items: NavDropdownItem[];
  align?: "left" | "right";
  ariaLabel: string;
  footer?: ReactNode;
  showChevron?: boolean;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function NavDropdown({
  trigger,
  triggerClassName = "",
  items,
  align = "left",
  ariaLabel,
  footer,
  showChevron = true,
}: NavDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(open ? 0 : -1);
  }, [open]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          e.preventDefault();
          navigate(items[activeIndex].href);
        }
        break;
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${menuId}-item-${activeIndex}` : undefined
        }
        aria-label={ariaLabel}
        className={`flex items-center gap-1 ${triggerClassName}`}
      >
        {trigger}
        {showChevron && <Chevron open={open} />}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          className={`absolute top-full z-50 min-w-[10rem] pt-1 ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            {items.map((item, index) => (
              <Link
                key={item.href}
                id={`${menuId}-item-${index}`}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setActiveIndex(index)}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`block px-4 py-2 text-sm transition-colors ${
                  activeIndex === index || pathname === item.href
                    ? "bg-neutral-50 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {footer && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                {footer}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
