'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Users,
  FileText,
  Camera,
  Users as Groups,
  BarChart3,
  Settings,
  Home,
  Menu,
  Shield,
  MessageSquare,
  AlertTriangle,
  Activity,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/admin', icon: Home },
  { name: '사용자 관리', href: '/admin/users', icon: Users },
  { name: '게시글 관리', href: '/admin/posts', icon: FileText },
  { name: '스토리 관리', href: '/admin/stories', icon: Camera },
  { name: '그룹 관리', href: '/admin/groups', icon: Groups },
  { name: '신고 관리', href: '/admin/reports', icon: Shield },
  { name: '채팅 모니터링', href: '/admin/chat', icon: MessageSquare },
  { name: '시스템 모니터', href: '/admin/monitor', icon: Activity },
  { name: '분석 대시보드', href: '/admin/analytics', icon: BarChart3 },
  { name: '설정', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const NavLink = ({ item, mobile = false }: { item: typeof navigation[0]; mobile?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          mobile && 'text-base'
        )}
        onClick={() => mobile && setSidebarOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-card border-r">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <span className="text-lg font-semibold">Glimpse Admin</span>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
          
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                관리자 패널
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                <span className="text-lg font-semibold">Glimpse Admin</span>
              </div>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} mobile />
              ))}
            </nav>
            
            <div className="flex-shrink-0 p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  관리자 패널
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </SheetContent>
        
        {/* Main Content */}
        <div className="flex flex-col flex-1 lg:pl-64">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center h-16 px-4 border-b bg-card">
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">사이드바 열기</span>
              </Button>
            </SheetTrigger>
          
          <div className="flex items-center gap-2 ml-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">G</span>
            </div>
            <span className="font-semibold">Glimpse Admin</span>
          </div>
          
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        
          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </Sheet>
    </div>
  );
}