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
  BookOpen,
  ClipboardList,
  History
} from 'lucide-react';
import { cn, formatThaiDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { db, MenuItem, TempleSettings } from '@/lib/db';
import { usePermission } from '@/lib/usePermission';
import { ADMIN_ONLY_PATHS, EDITOR_PLUS_PATHS, ADMIN_MENU_PATHS } from '@/lib/permissions';
import { TopLoadingBar } from '@/components/ui/progress-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [navLoading, setNavLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setNavLoading(true);
    const timer = setTimeout(() => setNavLoading(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, permissions, roleLabel, roleBadgeClass, role, loaded } = usePermission();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load sidebar collapsed state on mount
  useEffect(() => {
    const collapsed = localStorage.getItem('temple_sidebar_collapsed') === 'true';
    setIsSidebarCollapsed(collapsed);
  }, []);

  const toggleSidebarCollapse = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    localStorage.setItem('temple_sidebar_collapsed', String(nextVal));
  };
  
  // Settings & Menus
  const [settings, setSettings] = useState<TempleSettings>({
    templeName: 'วัด',
    abbr: 'TEMPLE OS',
    logoIcon: 'Compass',
    themeColor: 'amber'
  });
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([]);
  const [subMenuMap, setSubMenuMap] = useState<Record<string, MenuItem[]>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; href: string }>>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
      case 'ClipboardList': return ClipboardList;
      case 'User': return UserIcon;
      case 'History': return History;
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

  // Helper to check path permission based on user role and dynamic menu permissions
  const isPathAllowed = (href: string) => {
    if (href === '#' || href === '') return true;
    
    // If allMenus has been loaded, use dynamic permission check!
    if (allMenus.length > 0) {
      const matched = allMenus.find(m => m.href === href);
      if (matched) {
        const allowedRoles = matched.roleAccess ? matched.roleAccess.split(',') : ['admin', 'abbot', 'editor', 'staff', 'member'];
        return allowedRoles.includes(role);
      }
    }
    
    // Fallback static guards
    if (ADMIN_ONLY_PATHS.includes(href) && role !== 'admin' && role !== 'abbot') return false;
    if (ADMIN_MENU_PATHS.includes(href) && role !== 'admin' && role !== 'abbot') return false;
    if (EDITOR_PLUS_PATHS.includes(href) && (role === 'staff' || role === 'member')) return false;
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
      setAllMenus(list);

      // Filter active items that are allowed for the current role
      const activeItems = list.filter(m => {
        if (!m.isActive) return false;
        const allowedRoles = m.roleAccess ? m.roleAccess.split(',') : ['admin', 'abbot', 'editor', 'staff', 'member'];
        return allowedRoles.includes(role);
      });
      
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

  const loadNotifications = async () => {
    try {
      if (role === 'member') {
        const [eventsList, borrowList, ashesList, monksList] = await Promise.all([
          db.events.list(),
          db.borrow.list(),
          db.ashes.list(),
          db.monks.list()
        ]);

        const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('temple_session') : null;
        let sessionUser: any = null;
        if (sessionStr) {
          try {
            sessionUser = JSON.parse(sessionStr).user;
          } catch (e) {}
        }

        const alerts: Array<{ id: string; title: string; desc: string; href: string }> = [];
        const uName = sessionUser?.fullName || sessionUser?.name || user?.name || '';
        const cleanUser = uName.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');

        // 1. ตารางกิจนิมนต์ (Upcoming assigned monk events)
        let matchedMonkId = sessionUser?.monk_id || '';
        if (!matchedMonkId && uName) {
          const matched = monksList.find(m => {
            const cleanMonk = m.name.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
            return cleanUser.includes(cleanMonk) || cleanMonk.includes(cleanUser) || (sessionUser?.phone && m.phone && sessionUser.phone === m.phone);
          });
          if (matched) {
            matchedMonkId = matched.id;
          } else if (monksList.length > 0) {
            matchedMonkId = monksList[0].id;
          }
        }

        if (matchedMonkId) {
          const myUpcomingEvents = eventsList.filter(e => 
            e.assigned_monks && 
            e.assigned_monks.includes(matchedMonkId) && 
            e.status === 'upcoming'
          );
          myUpcomingEvents.forEach(e => {
            alerts.push({
              id: `alert-evt-${e.id}`,
              title: 'มีกิจนิมนต์ใหม่',
              desc: `คุณมีงานนิมนต์ "${e.title}" วันที่ ${formatThaiDate(e.date)} เวลา ${e.time}`,
              href: '/dashboard/personal-schedule'
            });
          });
        }

        // 2. การยืม-ส่ง ครุภัณฑ์
        if (uName) {
          const myBorrows = borrowList.filter(b => {
            if (b.status === 'returned') return false;
            const cleanBorrower = b.borrower_name.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '');
            const isNameMatch = cleanUser.includes(cleanBorrower) || cleanBorrower.includes(cleanUser);
            const isPhoneMatch = sessionUser?.phone && b.borrower_phone && sessionUser.phone === b.borrower_phone;
            return isNameMatch || isPhoneMatch;
          });

          myBorrows.forEach(b => {
            const isOverdue = b.status === 'overdue' || new Date(b.due_date) < new Date();
            alerts.push({
              id: `alert-borrow-${b.id}`,
              title: isOverdue ? 'ครุภัณฑ์เกินกำหนดส่งคืน ⚠️' : 'รายการยืมครุภัณฑ์',
              desc: `คุณได้ยืม "${b.item_name}" จำนวน ${b.borrow_qty} ชิ้น กำหนดส่งคืน ${formatThaiDate(b.due_date)}`,
              href: '/dashboard/inventory'
            });
          });
        }

        // 3. การฝากอัฐิ
        ashesList.forEach(a => {
          const cleanDepositer = a.deposited_by ? a.deposited_by.replace(/\s+/g, '').replace(/(พระ|สามเณร|นาย)/g, '') : '';
          const isDepositerMatch = cleanDepositer && uName && (cleanUser.includes(cleanDepositer) || cleanDepositer.includes(cleanUser));
          
          if (isDepositerMatch) {
            alerts.push({
              id: `alert-ashes-${a.id}`,
              title: 'รายการรับฝากอัฐิของคุณ',
              desc: `รับฝากอัฐิของ "${a.deceased_name}" ณ ช่องประดิษฐาน ${a.niche_code}`,
              href: '/dashboard/ashes'
            });
          } else if (a.deposit_date) {
            const depDate = new Date(a.deposit_date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - depDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
              alerts.push({
                id: `alert-ashes-new-${a.id}`,
                title: 'มีการฝากอัฐิใหม่ในวัด',
                desc: `อัฐิคุณ "${a.deceased_name}" ประดิษฐาน ณ ช่อง ${a.niche_code} (โดย ${a.deposited_by || 'ไม่ระบุ'})`,
                href: '/dashboard/ashes'
              });
            }
          }
        });

        setNotifications(alerts);
        return;
      }

      const [bookingsList, arrangementsList] = await Promise.all([
        db.salaBookings.list(),
        db.funeralArrangements.list()
      ]);
      
      const funeralBookings = bookingsList.filter(b => b.event_type === 'funeral' && b.status !== 'cancelled');
      const alerts: Array<{ id: string; title: string; desc: string; href: string }> = [];
      
      funeralBookings.forEach(b => {
        const hasDetail = arrangementsList.some(a => a.booking_id === b.id);
        if (!hasDetail) {
          alerts.push({
            id: `alert-fn-${b.id}`,
            title: 'ข้อมูลจัดตั้งศพยังไม่ครบถ้วน',
            desc: `งานศพ "${b.event_title}" ยังไม่ได้ลงทะเบียนข้อมูลจัดตั้งศพ`,
            href: '/dashboard/sala/funerals'
          });
        }
      });
      
      setNotifications(alerts);
    } catch (err) {
      console.error('Failed to load layout notifications:', err);
    }
  };

  useEffect(() => {
    if (!loaded) return;
    
    loadNotifications();

    // Poll every 3 minutes (180,000 ms) to keep notifications updated in background
    const interval = setInterval(() => {
      loadNotifications();
    }, 180000);

    return () => clearInterval(interval);
  }, [loaded, role, isNotificationsOpen]);

  // 30-Minute Inactivity Session Timeout Tracker
  useEffect(() => {
    if (!loaded) return;

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const checkInactivity = () => {
      const sessionStr = localStorage.getItem('temple_session');
      if (!sessionStr) return;

      const lastActiveStr = localStorage.getItem('temple_last_active');
      const now = Date.now();

      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && now - lastActive >= INACTIVITY_LIMIT_MS) {
          // Exceeded 30 minutes of no user activity!
          localStorage.removeItem('temple_session');
          localStorage.removeItem('temple_last_active');
          router.push('/login?reason=timeout');
          return;
        }
      } else {
        localStorage.setItem('temple_last_active', String(now));
      }
    };

    let lastUpdate = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle updating localStorage to once every 5 seconds
      if (now - lastUpdate > 5000) {
        lastUpdate = now;
        localStorage.setItem('temple_last_active', String(now));
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Run check immediately and then every 10 seconds
    checkInactivity();
    const intervalId = setInterval(checkInactivity, 10000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
    };
  }, [loaded, router]);

  // Route guard: enforce role-based access reactively on path transition
  useEffect(() => {
    if (!loaded) return;
    const sessionStr = localStorage.getItem('temple_session');
    if (!sessionStr) {
      router.push('/login');
      return;
    }
    if (!isPathAllowed(pathname)) {
      router.replace('/dashboard');
    }
  }, [pathname, loaded, role, allMenus]);

  // Load session, theme, and menus
  useEffect(() => {
    setMounted(true);
    const sessionStr = localStorage.getItem('temple_session');
    if (!sessionStr) {
      router.push('/login');
      return;
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
  }, []);

  // Fetch / filter menus whenever the user role updates
  useEffect(() => {
    const sessionStr = localStorage.getItem('temple_session');
    if (sessionStr) {
      loadMenusAndSettings();
    }
  }, [role]);

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

  const renderNavItems = (mobile: boolean = false, collapsed: boolean = false) => {
    return visibleMenus.map(parent => {
      const subs = filteredSubMenuMap[parent.id] || [];
      const hasSubs = subs.length > 0;
      const isExpanded = !!expandedMenus[parent.id];
      const Icon = getIconComponent(parent.iconName);
      
      if (hasSubs) {
        if (role === 'member') {
          // For member role, flatten submenus and bring them out as primary top-level menu items!
          return subs.map(sub => {
            const isActive = pathname === sub.href;
            const SubIcon = getIconComponent(sub.iconName);
            const displayName = sub.href === '/dashboard/monks'
              ? 'ข้อมูลส่วนตัวศาสนบุคลากร'
              : sub.name;

            return (
              <Link
                key={sub.id}
                href={sub.href}
                onClick={() => mobile && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group",
                  collapsed ? "justify-center" : "gap-3.5",
                  isActive
                    ? themeTokens.activeBg
                    : cn("text-amber-800/80 dark:text-amber-400/80 hover:text-amber-950 dark:hover:text-amber-250", themeTokens.hoverBg)
                )}
                title={collapsed ? displayName : undefined}
              >
                <SubIcon className={cn("size-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : themeTokens.iconColor)} />
                {!collapsed && <span className="animate-fade-in truncate">{displayName}</span>}
              </Link>
            );
          });
        }

        return (
          <div key={parent.id} className="space-y-1">
            <button
              onClick={() => {
                if (collapsed) {
                  setIsSidebarCollapsed(false);
                  localStorage.setItem('temple_sidebar_collapsed', 'false');
                  toggleExpand(parent.id);
                } else {
                  toggleExpand(parent.id);
                }
              }}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group cursor-pointer text-amber-800/80 dark:text-amber-400/80",
                collapsed ? "justify-center" : "justify-between",
                themeTokens.hoverBg
              )}
              title={collapsed ? parent.name : undefined}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={cn("size-4.5 shrink-0", themeTokens.iconColor)} />
                {!collapsed && <span className="animate-fade-in truncate">{parent.name}</span>}
              </div>
              {!collapsed && (
                isExpanded ? (
                  <ChevronDown className="size-4 text-amber-700/50 dark:text-amber-500/40" />
                ) : (
                  <ChevronRight className="size-4 text-amber-700/50 dark:text-amber-500/40" />
                )
              )}
            </button>
            
            {/* Submenu items */}
            {isExpanded && !collapsed && (
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
              "flex items-center px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group",
              collapsed ? "justify-center" : "gap-3.5",
              isActive
                ? themeTokens.activeBg
                : cn("text-amber-800/80 dark:text-amber-400/80 hover:text-amber-950 dark:hover:text-amber-250", themeTokens.hoverBg)
            )}
            title={collapsed ? parent.name : undefined}
          >
            <Icon className={cn("size-4.5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : themeTokens.iconColor)} />
            {!collapsed && <span className="animate-fade-in truncate">{parent.name}</span>}
          </Link>
        );
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-amber-50/20 dark:bg-[#0c0906] text-amber-950 dark:text-amber-100 font-sans">
      <TopLoadingBar isLoading={navLoading || !loaded} />
      {/* Sidebar for Desktop */}
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white dark:bg-[#15110a] border-r border-amber-200/50 dark:border-amber-950/40 relative z-10 transition-all duration-300 print:hidden print-none",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        
        {/* Brand header */}
        <div className={cn(
          "p-6 border-b border-amber-200/40 dark:border-amber-950/30 flex items-center gap-3 transition-all duration-300",
          isSidebarCollapsed ? "justify-center p-5" : "flex-row"
        )}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-amber-200/50 dark:border-amber-950/40 shadow-sm shrink-0" alt="logo" />
          ) : (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10 shrink-0", themeTokens.logoBg)}>
              <BrandIcon className="size-5" />
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="animate-fade-in truncate">
              <h1 className="font-bold text-sm text-amber-900 dark:text-amber-200 font-heading truncate max-w-[170px]" title={settings.templeName}>
                {settings.templeName}
              </h1>
              <p className="text-[10px] text-amber-700/60 dark:text-amber-400/50 tracking-wider">
                {settings.abbr}
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {renderNavItems(false, isSidebarCollapsed)}
        </nav>

        {/* User Card & Log out */}
        <div className={cn(
          "border-t border-amber-200/40 dark:border-amber-950/30 bg-amber-50/20 dark:bg-[#110e08]/20 rounded-xl transition-all duration-300",
          isSidebarCollapsed ? "p-2 m-2" : "p-4 m-4"
        )}>
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isSidebarCollapsed ? "justify-center mb-0" : "mb-3.5"
          )}>
            <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0" title={`${user?.name || 'ผู้ดูแลระบบ'} (${roleLabel})`}>
              <UserIcon className="size-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate animate-fade-in">
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
            )}
          </div>
          {!isSidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="size-3.5" />
              ออกจากระบบ
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 px-2 mt-3 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="size-4 shrink-0" />
            </button>
          )}
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
          "fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-[#15110a] border-r border-amber-200/50 dark:border-amber-950/40 z-40 lg:hidden flex flex-col transition-transform duration-300 ease-in-out print:hidden print-none",
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
        <header className="h-16 bg-white dark:bg-[#15110a] border-b border-amber-200/50 dark:border-amber-950/40 px-6 flex items-center justify-between sticky top-0 z-10 print:hidden print-none">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 lg:hidden cursor-pointer"
            >
              <Menu className="size-5.5" />
            </button>

            {/* Desktop Collapsible Sidebar Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 hidden lg:flex cursor-pointer transition-transform duration-250 active:scale-95"
              title={isSidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
            >
              <Menu className="size-5" />
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

             <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-all relative cursor-pointer"
                title="การแจ้งเตือน"
              >
                <Bell className="size-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#15110a] shadow-sm animate-pulse-subtle">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#15110a] border border-amber-200/50 dark:border-amber-950/40 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="bg-amber-500 text-white px-4 py-3 font-bold text-xs flex justify-between items-center">
                    <span>การแจ้งเตือน ({notifications.length})</span>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-white hover:text-amber-100 cursor-pointer">
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-amber-100/50 dark:divide-amber-950/20">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-amber-700/60 dark:text-amber-500/40">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    ) : (
                      notifications.map(n => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="block p-3.5 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors text-left"
                        >
                          <div className="text-xs font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5">
                            <span className="text-[10px]">⚠️</span> {n.title}
                          </div>
                          <div className="text-[10px] text-amber-900/70 dark:text-amber-400/70 mt-1 font-medium leading-relaxed">
                            {n.desc}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
