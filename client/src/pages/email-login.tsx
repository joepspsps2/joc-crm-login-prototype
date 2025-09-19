import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';

const emailLoginSchema = z.object({
  email: z.string().email('請輸入有效的 Email 地址'),
  password: z.string().min(6, '密碼至少需要 6 個字符'),
});

type EmailLoginForm = z.infer<typeof emailLoginSchema>;

export default function EmailLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const form = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: EmailLoginForm) => {
    setIsLoading(true);
    try {
      if (isRegisterMode) {
        await signUpWithEmail(data.email, data.password);
        toast({
          title: '註冊成功',
          description: '歡迎加入！',
        });
        // Navigation will happen automatically via useEffect when user state changes
      } else {
        await signInWithEmail(data.email, data.password);
        toast({
          title: '登入成功',
          description: '歡迎回來！',
        });
        // Navigation will happen automatically via useEffect when user state changes
      }
    } catch (error: any) {
      toast({
        title: isRegisterMode ? '註冊失敗' : '登入失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-8 pb-4 border-b border-border">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/auth-selection')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            {isRegisterMode ? 'Email 註冊' : 'Email 登入'}
          </h1>
        </div>
      </header>

      <div className="px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email 地址</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="請輸入您的 Email" 
                      data-testid="input-email"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Password Input */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密碼</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="請輸入您的密碼"
                        className="pr-12"
                        data-testid="input-password"
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Remember & Forgot */}
            {!isRegisterMode && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-primary focus:ring-primary" 
                    data-testid="checkbox-remember"
                  />
                  <span className="ml-2 text-foreground">記住我</span>
                </label>
                <a href="#" className="text-primary hover:underline">忘記密碼？</a>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              size="lg"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {isRegisterMode ? '註冊' : '登入'}
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-muted-foreground">
              {isRegisterMode ? '已經有帳號？' : '還沒有帳號？'}
              <Button
                type="button"
                variant="link"
                className="p-0 ml-1 font-medium"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                data-testid="button-toggle-mode"
              >
                {isRegisterMode ? '立即登入' : '立即註冊'}
              </Button>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
