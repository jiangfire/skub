"use client";

import { usePathname } from "next/navigation";
import NavDropdown from "@/components/common/NavDropdown";

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
  const isAdminPath = pathname?.startsWith("/admin");

  return (
    <NavDropdown
      ariaLabel="管理后台菜单"
      items={ITEMS}
      align="left"
      triggerClassName={`nav-link text-sm ${isAdminPath ? "active" : ""}`}
      trigger={<>管理后台</>}
    />
  );
}
