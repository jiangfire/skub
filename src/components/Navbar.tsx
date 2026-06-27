import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import NotificationBell from "@/components/NotificationBell";

export default async function Navbar() {
  const user = await getSessionUser();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Skills Hub
          </Link>
          <Link href="/skills" className="text-sm text-gray-600 hover:text-gray-900">
            技能市场
          </Link>
          {user &&
            (user.role === "Contributor" || user.role === "Reviewer" || user.role === "Owner") && (
              <Link href="/studio" className="text-sm text-gray-600 hover:text-gray-900">
                工作台
              </Link>
            )}
          {user && (user.role === "Reviewer" || user.role === "Owner") && (
            <Link href="/review" className="text-sm text-gray-600 hover:text-gray-900">
              审核台
            </Link>
          )}
          {user && user.role === "Owner" && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              管理后台
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NotificationBell />
              <Link href="/account" className="text-sm text-gray-600 hover:text-gray-900">
                个人中心
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
