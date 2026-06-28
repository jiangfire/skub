import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import NotificationBell from "@/components/NotificationBell";
import AdminNavDropdown from "@/components/admin/AdminNavDropdown";
import UserNavDropdown from "@/components/UserNavDropdown";

export default async function Navbar() {
  const user = await getSessionUser();

  const isContributorOrAbove =
    user && (user.role === "Contributor" || user.role === "Reviewer" || user.role === "Owner");
  const isReviewerOrAbove = user && (user.role === "Reviewer" || user.role === "Owner");
  const isOwner = user && user.role === "Owner";

  return (
    <nav className="border-neutral-200/80 sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* --- Left: Brand + Main Nav --- */}
        <div className="flex items-center gap-1 sm:gap-5">
          {/* Brand */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-bold text-neutral-900"
          >
            <span className="shadow-brand-600/20 flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className="hidden tracking-tight sm:inline-block">Skills Hub</span>
          </Link>

          {/* Main Nav Links */}
          <div className="ml-2 hidden items-center gap-4 sm:flex">
            <NavLink href="/skills">技能市场</NavLink>

            {isContributorOrAbove && <NavLink href="/studio">工作台</NavLink>}

            {isReviewerOrAbove && <NavLink href="/review">审核台</NavLink>}

            {isOwner && <AdminNavDropdown />}
          </div>

          {/* Mobile admin link */}
          {isOwner && (
            <div className="flex items-center sm:hidden">
              <NavLink href="/admin">管理</NavLink>
            </div>
          )}
        </div>

        {/* --- Right: User Area --- */}
        <div className="flex items-center gap-1 sm:gap-3">
          {user ? (
            <>
              <NotificationBell />
              <UserNavDropdown userName={user.name} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                登录
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* --- NavLink Sub-Component --- */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-link text-sm">
      {children}
    </Link>
  );
}
