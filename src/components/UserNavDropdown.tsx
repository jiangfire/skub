"use client";
import NavDropdown from "@/components/common/NavDropdown";

const ITEMS = [
  { href: "/account", label: "个人中心" },
  { href: "/account/favorites", label: "我的收藏" },
  { href: "/account/likes", label: "我点赞的" },
];

export default function UserNavDropdown({ userName }: { userName: string }) {
  return (
    <NavDropdown
      ariaLabel={`${userName} 用户菜单`}
      items={ITEMS}
      align="right"
      triggerClassName="px-2 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      trigger={
        <>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium sm:inline-block">{userName}</span>
        </>
      }
      footer={
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            退出
          </button>
        </form>
      }
    />
  );
}
