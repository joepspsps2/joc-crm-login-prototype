import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function QRLanding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <i className="fas fa-qrcode text-primary-foreground text-xl"></i>
          </div>
          <h1 className="ml-3 text-2xl font-bold text-foreground">Unified ID</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* QR Scanner Visual */}
        <div className="relative mb-8">
          <div className="w-48 h-48 bg-card rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden">
            <div className="qr-scanner absolute inset-0 rounded-2xl"></div>
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
              <i className="fas fa-check text-4xl text-primary"></i>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">歡迎使用！</h2>
          <p className="text-muted-foreground leading-relaxed">
            QR Code 掃描成功！請選擇登入方式以繼續使用服務
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => setLocation('/auth-selection')}
          className="w-full max-w-sm py-4 px-6 text-lg font-semibold shadow-lg"
          size="lg"
          data-testid="button-continue"
        >
          開始登入
        </Button>

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-xs leading-relaxed">
          繼續使用即表示您同意我們的
          <a href="#" className="text-primary underline">服務條款</a> 和 
          <a href="#" className="text-primary underline">隱私政策</a>
        </p>
      </div>
    </div>
  );
}
