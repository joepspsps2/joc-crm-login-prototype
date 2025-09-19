import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, ShoppingBag, Download, FileDown, Link2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OrderStats {
  total: number;
  pending: number;
}

interface RecentOrder {
  id: string;
  orderId: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: orderStats } = useQuery<OrderStats>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const { data: recentOrders = [] } = useQuery<RecentOrder[]>({
    queryKey: ['/api/users/orders/recent'],
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <i className="fas fa-user text-primary-foreground"></i>
            </div>
            <div className="ml-3">
              <p className="font-semibold text-card-foreground" data-testid="text-display-name">
                {user.displayName || '使用者'}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-email">
                {user.email}
              </p>
            </div>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserMenu(!showUserMenu)}
              data-testid="button-user-menu"
            >
              <Settings className="h-5 w-5" />
            </Button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2"
                    onClick={() => {
                      setShowUserMenu(false);
                      setLocation('/account-settings');
                    }}
                    data-testid="button-account-settings"
                  >
                    帳號設定
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-destructive"
                    onClick={handleSignOut}
                    data-testid="button-sign-out"
                  >
                    登出
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-total-orders">
                    {orderStats?.total || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">總訂單</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-card-foreground" data-testid="text-pending-downloads">
                    {orderStats?.pending || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">待下載</p>
                </div>
                <div className="w-12 h-12 bg-accent/50 rounded-full flex items-center justify-center">
                  <Download className="text-accent-foreground h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">快速操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation('/file-portal')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              data-testid="button-file-portal"
            >
              <FileDown className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">檔案下載</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setLocation('/account-settings')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              data-testid="button-account-linking"
            >
              <Link2 className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">帳號綁定</span>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">最近訂單</h2>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">暫無訂單記錄</p>
                </CardContent>
              </Card>
            ) : (
              recentOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-card-foreground" data-testid={`text-order-id-${order.id}`}>
                        #{order.orderId}
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        order.status === 'completed' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        {order.status === 'completed' ? '已完成' : '處理中'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`text-order-description-${order.id}`}>
                      {order.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                        {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                      </span>
                      {order.status === 'completed' ? (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setLocation(`/file-portal?order=${order.id}`)}
                          data-testid={`button-download-files-${order.id}`}
                        >
                          下載檔案
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">處理中...</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
