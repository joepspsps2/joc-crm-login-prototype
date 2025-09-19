import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ArrowLeft, Key, History, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
  displayName: z.string().min(1, '顯示名稱不能為空'),
  phoneNumber: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface LinkedProvider {
  providerId: string;
  name: string;
  email?: string;
  icon: string;
}

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const { data: linkedProviders = [] } = useQuery<LinkedProvider[]>({
    queryKey: ['/api/users/linked-providers'],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const token = await user?.getIdToken();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('更新失敗');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '個人資料已更新',
      });
    },
    onError: () => {
      toast({
        title: '更新失敗',
        description: '請稍後再試',
        variant: 'destructive',
      });
    },
  });

  const linkAccountMutation = useMutation({
    mutationFn: async (provider: string) => {
      // This would trigger the linking flow
      const response = await fetch(`/api/users/link/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('連結失敗');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/linked-providers'] });
      toast({
        title: '連結成功',
        description: '帳號已成功連結',
      });
    },
    onError: () => {
      toast({
        title: '連結失敗',
        description: '請稍後再試',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleLinkAccount = (provider: string) => {
    linkAccountMutation.mutate(provider);
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const availableProviders = [
    { id: 'apple.com', name: 'Apple ID', icon: 'fab fa-apple', color: 'text-gray-800' },
  ];

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google.com': return 'text-red-500';
      case 'apple.com': return 'text-gray-800';
      default: return 'text-gray-600';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-8 pb-4 border-b border-border">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">帳號設定</h1>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">基本資料</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>顯示名稱</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="請輸入顯示名稱" 
                          data-testid="input-display-name"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input 
                    type="email" 
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>手機號碼</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="+886 912345678"
                          data-testid="input-phone"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-update-profile"
                >
                  更新資料
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Account Linking Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">已連結帳號</h2>
            <div className="space-y-3">
              {linkedProviders.map((provider) => (
                <div key={provider.providerId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <i className={`${provider.icon} text-xl ${getProviderColor(provider.providerId)} mr-3`}></i>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-provider-${provider.providerId}`}>
                        {provider.name}
                      </p>
                      {provider.email && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-provider-email-${provider.providerId}`}>
                          {provider.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    已連結
                  </span>
                </div>
              ))}

              {/* Available Providers to Link */}
              {availableProviders
                .filter(provider => !linkedProviders.some(linked => linked.providerId === provider.id))
                .map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center">
                      <i className={`${provider.icon} text-xl ${provider.color} mr-3`}></i>
                      <div>
                        <p className="font-medium text-foreground">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">未連結</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleLinkAccount(provider.id)}
                      disabled={linkAccountMutation.isPending}
                      data-testid={`button-link-${provider.id}`}
                    >
                      連結
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">安全設定</h2>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => {/* TODO: Implement password change */}}
                data-testid="button-change-password"
              >
                <div className="flex items-center">
                  <Key className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">變更密碼</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => {/* TODO: Implement activity log */}}
                data-testid="button-activity-log"
              >
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">登入記錄</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={handleSignOut}
                data-testid="button-logout-all"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="font-medium">登出所有裝置</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
