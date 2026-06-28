"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/account", label: "个人中心" },
  { href: "/account/favorites", label: "我的收藏" },
  { href: "/account/likes", label: "我点赞的" },
];

export default function UserNavDropdown({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
    setActiveIndex(open ? 0 : -1);
  }, [open]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  function navigate(href: string) {
    setOpen(false);
    setActiveIndex(-1);
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
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          e.preventDefault();
          navigate(ITEMS[activeIndex].href);
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
        aria-controls="user-nav-menu"
        aria-label={`${userName} 用户菜单`}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium sm:inline-block">{userName}</span>
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
          id="user-nav-menu"
          role="menu"
          className="absolute right-0 top-full z-50 min-w-[10rem] pt-1"
        >
          <div className="rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            {ITEMS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                onClick={() => navigate(item.href)}
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
            <div className="my-1 border-t border-neutral-100" />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                退出
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
