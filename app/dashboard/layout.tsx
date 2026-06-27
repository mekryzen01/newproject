'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  DollarSign,
  Calendar,
  Package,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  Compass,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  Archive,
  Settings,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { db, MenuItem, TempleSettings } from '@/lib/db';
import { usePermission } from '@/lib/usePermission';
import { ADMIN_ONLY_PATHS, EDITOR_PLUS_PATHS, ADMIN_MENU_PATHS } from '@/lib/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, permissions, roleLabel, roleBadgeClass, role, loaded } = usePermission();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Settings & Menus
  const [settings, setSettings] = useState<TempleSettings>({
    templeName: 'วัดศรีสว่างธรรมาราม',
    abbr: 'TEMPLE OS',
    logoIcon: 'Compass',
    themeColor: 'amber'
  });
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([]);
  const [subMenuMap, setSubMenuMap] = useState<Record<string, MenuItem[]>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Function to map string to Lucide icon component
  const getIconComponent = (name: string) => {
    switch (name) {
      case 'Home': return Home;
      case 'Users': return Users;
      case 'DollarSign': return DollarSign;
      case 'Calendar': return Calendar;
      case 'Package': return Package;
      case 'Archive': return Archive;
      case 'Settings': return Settings;
      case 'Compass': return Compass;
      case 'Activity': return Activity;
      case 'Award': return Award;
      case 'BookOpen': return BookOpen;
      case 'User': return UserIcon;
      default: return Settings;
    }
  };

  // Helper to dynamically get class tokens based on active theme color
  const getThemeClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          activeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10',
          hoverBg: 'hover:bg-emerald-600/10 hover:text-emerald-950 dark:hover:text-emerald-250',
          iconColor: 'text-emerald-650 dark:text-emerald-500',
          logoBg: 'bg-gradient-to-tr from-emerald-500 to-emerald-600',
          dotBg: 'bg-emerald-500'
        };
      case 'indigo':
        return {
          activeBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10',
          hoverBg: 'hover:bg-indigo-600/10 hover:text-indigo-950 dark:hover:text-indigo-250',
          iconColor: 'text-indigo-650 dark:text-indigo-500',
          logoBg: 'bg-gradient-to-tr from-indigo-500 to-indigo-600',
          dotBg: 'bg-indigo-500'
        };
      case 'rose':
        return {
          activeBg: 'bg-rose-600 text-white shadow-lg shadow-rose-600/10',
          hoverBg: 'hover:bg-rose-600/10 hover:text-rose-950 dark:hover:text-rose-250',
          iconColor: 'text-rose-650 dark:text-rose-500',
          logoBg: 'bg-gradient-to-tr from-rose-500 to-rose-600',
          dotBg: 'bg-rose-500'
        };
      case 'slate':
        return {
          activeBg: 'bg-slate-700 text-white shadow-lg shadow-slate-700/10',
          hoverBg: 'hover:bg-slate-600/10 hover:text-slate-950 dark:hover:text-slate-250',
          iconColor: 'text-slate-650 dark:text-slate-500',
          logoBg: 'bg-gradient-to-tr from-slate-650 to-slate-750',
          dotBg: 'bg-slate-500'
        };
      case 'amber':
      default:
        return {
          activeBg: 'bg-amber-500 text-white shadow-lg shadow-amber-500/10',
          hoverBg: 'hover:bg-amber-500/10 hover:text-amber-950 dark:hover:text-amber-250',
          iconColor: 'text-amber-700/60 dark:text-amber-500/50',
          logoBg: 'bg-gradient-to-tr from-amber-500 to-amber-600',
          dotBg: 'bg-amber-500'
        };
    }
  };

  const themeTokens = getThemeClasses(settings.themeColor);

  // Helper to check path permission based on user role
  const isPathAllowed = (href: string) => {
    if (href === '#' || href === '') return true;
    if (ADMIN_ONLY_PATHS.includes(href) && role !== 'admin') return false;
    if (ADMIN_MENU_PATHS.includes(href) && role !== 'admin') return false;
    if (EDITOR_PLUS_PATHS.includes(href) && role === 'staff') return false;
    return true;
  };

  const isAuthorized = () => {
    if (!loaded) return false;
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('temple_session') : null;
    if (!sessionStr) return false;
    return isPathAllowed(pathname);
  };

  const loadMenusAndSettings = async () => {
    try {
      const [list, config] = await Promise.all([
        db.menus.list(),
        db.settings.get()
      ]);
      
      setSettings(config);

      const activeItems = list.filter(m => m.isActive);
      
      // Separate parents and submenus
      const parents = activeItems
        .filter(m => !m.parentId)
        .sort((a, b) => a.order - b.order);
        
      const subs = activeItems.filter(m => m.parentId);
      
      // Group subs by parentId
      const map: Record<string, MenuItem[]> = {};
      subs.forEach(sub => {
        const pid = sub.parentId!;
        if (!map[pid]) map[pid] = [];
        map[pid].push(sub);
      });
      
      // Sort submenus under each parent
      Object.keys(map).forEach(pid => {
        map[pid].sort((a, b) => a.order - b.order);
      });

      setParentMenus(parents);
      setSubMenuMap(map);

      // Auto-expand parent menu if currently active route matches a submenu
      const activeSub = subs.find(s => pathname === s.href);
      if (activeSub) {
        setExpandedMenus(prev => ({ ...prev, [activeSub.parentId!]: true }));
      }
    } catch (err) {
      console.error('Failed to load menu list', err);
    }
  };

  // Load session, theme, and menus
  useEffect(() => {
    setMounted(true);
    const sessionStr = localStorage.getItem('temple_session');
    if (!sessionStr) {
      router.push('/login');
      return;
    }

    // Route guard: enforce role-based access reactively
    if (loaded) {
      if (ADMIN_ONLY_PATHS.includes(pathname) && role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      if (ADMIN_MENU_PATHS.includes(pathname) && role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      if (EDITOR_PLUS_PATHS.includes(pathname) && role === 'staff') {
        router.replace('/dashboard');
        return;
      }
    }

    // Theme initialization
    const localTheme = localStorage.getItem('temple_theme') as 'light' | 'dark';
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    loadMenusAndSettings();

    // Custom event listeners
    const handleMenuChange = () => {
      loadMenusAndSettings();
    };
    window.addEventListener('temple_menu_changed', handleMenuChange);
    window.addEventListener('temple_settings_changed', handleMenuChange);

    return () => {
      window.removeEventListener('temple_menu_changed', handleMenuChange);
      window.removeEventListener('temple_settings_changed', handleMenuChange);
    };
  }, [router, pathname, role, loaded]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('temple_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('temple_session');
    router.push('/login');
  };

  const toggleExpand = (id: string) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!mounted) {
    return null;
  }

  // Find page title for breadcrumb dynamically (checks parent or submenu)
  const getPageTitle = () => {
    for (const pid of Object.keys(subMenuMap)) {
      const matchedSub = subMenuMap[pid].find(sub => sub.href === pathname);
      if (matchedSub) return matchedSub.name;
    }
    const matchedParent = parentMenus.find(p => p.href === pathname);
    return matchedParent ? matchedParent.name : 'แดชบอร์ด';
  };

  // Sidebar brand rendering
  const BrandIcon = getIconComponent(settings.logoIcon);

  // Navigation render helper
  // Filter submenus based on role
  const filteredSubMenuMap: Record<string, MenuItem[]> = {};
  Object.keys(subMenuMap).forEach(parentId => {
    const subs = subMenuMap[parentId] || [];
    const allowedSubs = subs.filter(sub => isPathAllowed(sub.href));
    if (allowedSubs.length > 0) {
      filteredSubMenuMap[parentId] = allowedSubs;
    }
  });

  // Filter parent menus based on role and submenu visibility
  const visibleMenus = parentMenus.filter(parent => {
    if (!isPathAllowed(parent.href)) return false;

    const subs = subMenuMap[parent.id] || [];
    const hasSubs = subs.length > 0;
    
    if (hasSubs) {
      const allowedSubs = filteredSubMenuMap[parent.id] || [];
      return allowedSubs.length > 0;
    }
    return true;
  });

  const renderNavItems = (mobile: boolean = false) => {
    return visibleMenus.map(parent => {
      const subs = filteredSubMenuMap[parent.id] || [];
      const hasSubs = subs.length > 0;
      const isExpanded = !!expandedMenus[parent.id];
      const Icon = getIconComponent(parent.iconName);
      
      if (hasSubs) {
        return (
          <div key={parent.id} className="space-y-1">
            <button
              onClick={() => toggleExpand(parent.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group cursor-pointer text-amber-800/80 dark:text-amber-400/80",
                themeTokens.hoverBg
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={cn("size-4.5 shrink-0", themeTokens.iconColor)} />
                <span>{parent.name}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="size-4 text-amber-700/50 dark:text-amber-500/40" />
              ) : (
                <ChevronRight className="size-4 text-amber-700/50 dark:text-amber-500/40" />
              )}
            </button>
            
            {/* Submenu items */}
            {isExpanded && (
              <div className="pl-6 space-y-1 py-1 border-l-2 border-amber-200/30 dark:border-amber-950/20 ml-6 animate-slide-down">
                {subs.map(sub => {
                  const isSubActive = pathname === sub.href;
                  const SubIcon = getIconComponent(sub.iconName);
                  return (
                    <Link
                      key={sub.id}
                      href={sub.href}
                      onClick={() => mobile && setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group",
                        isSubActive
                          ? themeTokens.activeBg
                          : cn("text-amber-800/70 dark:text-amber-400/70 hover:bg-amber-500/5 hover:text-amber-950 dark:hover:text-amber-250")
                      )}
                    >
                      <SubIcon className={cn("size-3.5 shrink-0", isSubActive ? "text-white" : "text-amber-700/50 dark:text-amber-500/40")} />
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      } else {
        const isActive = pathname === parent.href;
        return (
          <Link
            key={parent.id}
            href={parent.href}
            onClick={() => mobile && setIsSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group",
              isActive
                ? themeTokens.activeBg
                : cn("text-amber-800/80 dark:text-amber-400/80 hover:text-amber-950 dark:hover:text-amber-250", themeTokens.hoverBg)
            )}
          >
            <Icon className={cn("size-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : themeTokens.iconColor)} />
            {parent.name}
          </Link>
        );
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-amber-50/20 dark:bg-[#0c0906] text-amber-950 dark:text-amber-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-[#15110a] border-r border-amber-200/50 dark:border-amber-950/40 relative z-20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        
        {/* Brand header */}
        <div className="p-6 border-b border-amber-200/40 dark:border-amber-950/30 flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-amber-200/50 dark:border-amber-950/40 shadow-sm" alt="logo" />
          ) : (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10", themeTokens.logoBg)}>
              <BrandIcon className="size-5" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm text-amber-900 dark:text-amber-200 font-heading truncate max-w-[170px]" title={settings.templeName}>
              {settings.templeName}
            </h1>
            <p className="text-[10px] text-amber-700/60 dark:text-amber-400/50 tracking-wider">
              {settings.abbr}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {renderNavItems()}
        </nav>

        {/* User Card & Log out */}
        <div className="p-4 border-t border-amber-200/40 dark:border-amber-950/30 bg-amber-50/20 dark:bg-[#110e08]/20 m-4 rounded-xl">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <UserIcon className="size-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                {user?.name || 'ผู้ดูแลระบบ'}
              </h4>
              <p className="text-[10px] text-amber-700/50 dark:text-amber-400/50 truncate">
                {user?.email || 'admin@temple.or.th'}
              </p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="size-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-[#15110a] border-r border-amber-200/50 dark:border-amber-950/40 z-40 lg:hidden flex flex-col transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        
        {/* Brand header */}
        <div className="p-6 border-b border-amber-200/40 dark:border-amber-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-9 h-9 rounded-xl object-cover border border-amber-200/50 dark:border-amber-950/40 shadow-sm" alt="logo" />
            ) : (
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", themeTokens.logoBg)}>
                <BrandIcon className="size-4.5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-xs text-amber-900 dark:text-amber-200 font-heading truncate max-w-[150px]">
                {settings.templeName}
              </h1>
              <p className="text-[9px] text-amber-700/60 dark:text-amber-400/50 tracking-wider">
                {settings.abbr}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {renderNavItems(true)}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-amber-200/40 dark:border-amber-950/30 bg-amber-50/20 dark:bg-[#110e08]/20 m-4 rounded-xl">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <UserIcon className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                {user?.name || 'ผู้ดูแลระบบ'}
              </h4>
              <p className="text-[9px] text-amber-700/50 dark:text-amber-400/50 truncate">
                {user?.email || 'admin@temple.or.th'}
              </p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="size-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#15110a] border-b border-amber-200/50 dark:border-amber-950/40 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 lg:hidden cursor-pointer"
            >
              <Menu className="size-5.5" />
            </button>
            
            {/* Breadcrumb / Title display */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-800/40 dark:text-amber-500/40">
              <span className="truncate max-w-[130px]">{settings.templeName}</span>
              <ChevronRight className="size-3.5" />
              <span className="text-amber-800 dark:text-amber-300">
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
              title={theme === 'light' ? 'สลับเป็นโหมดกลางคืน' : 'สลับเป็นโหมดกลางวัน'}
            >
              {theme === 'light' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
            </button>

            <button className="p-2.5 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-all relative cursor-pointer">
              <Bell className="size-4.5" />
              <span className={cn("absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#15110a]", themeTokens.dotBg)} />
            </button>

            <span className="hidden print:inline text-xs text-amber-800/40">ระบบการพิมพ์ทางการวัด</span>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto print:p-0">
          {!loaded ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !isAuthorized() ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
              <p className="text-sm font-semibold text-amber-700/60 dark:text-amber-500/60">
                ไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับไปยังแดชบอร์ด...
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
