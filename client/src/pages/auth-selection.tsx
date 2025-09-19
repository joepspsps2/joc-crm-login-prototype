import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { signInWithGoogle, signInWithApple } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AuthSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'apple':
          await signInWithApple();
          break;
      }
    } catch (error: any) {
      toast({
        title: '登入失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 border-b border-border">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">選擇登入方式</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* Social Login Options */}
        <div className="space-y-4 mb-8">
          {/* Google Login */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSocialLogin('google')}
            className="w-full justify-start py-4"
            data-testid="button-google-login"
          >
            <i className="fab fa-google text-xl mr-4 text-red-500"></i>
            <span className="font-medium">使用 Google 帳號登入</span>
          </Button>

          {/* Apple Login */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSocialLogin('apple')}
            className="w-full justify-start py-4"
            data-testid="button-apple-login"
          >
            <i className="fab fa-apple text-xl mr-4 text-gray-800"></i>
            <span className="font-medium">使用 Apple ID 登入</span>
          </Button>

        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="px-4 text-muted-foreground text-sm">或</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Email Options */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setLocation('/email-login')}
            className="w-full justify-start"
            data-testid="button-email-login"
          >
            <i className="fas fa-envelope text-lg mr-3"></i>
            <span className="font-medium">使用 Email 登入</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
