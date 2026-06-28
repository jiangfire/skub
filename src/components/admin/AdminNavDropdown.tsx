"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/skills", label: "技能管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/audit-logs", label: "审计日志" },
  { href: "/admin/stats", label: "平台概览" },
];

export default function AdminNavDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isAdminPath = pathname?.startsWith("/admin");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
      setActiveIndex(-1);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setActiveIndex(-1);
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
    if (open && activeIndex >= 0) {
      const element = panelRef.current?.querySelectorAll("a")[activeIndex];
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      setActiveIndex(next ? 0 : -1);
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % ITEMS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + ITEMS.length) % ITEMS.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(ITEMS.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          e.preventDefault();
          const href = ITEMS[activeIndex].href;
          setOpen(false);
          setActiveIndex(-1);
          window.location.href = href;
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
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="admin-nav-menu"
        className={`nav-link flex items-center gap-1 text-sm ${isAdminPath ? "active" : ""}`}
      >
        管理后台
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
      </button>

      {open && (
        <div
          ref={panelRef}
          id="admin-nav-menu"
          role="menu"
          onMouseLeave={() => {
            setOpen(false);
            setActiveIndex(-1);
          }}
          className="absolute left-0 top-full z-50 min-w-[10rem] pt-1"
        >
          <div className="rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            {ITEMS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`block px-4 py-2 text-sm transition-colors ${
                  activeIndex === index || pathname === item.href
                    ? "bg-neutral-50 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
