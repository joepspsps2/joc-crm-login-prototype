import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Image, FileArchive, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface OrderFile {
  id: string;
  name: string;
  size: number;
  path: string;
  type: string;
}

interface Order {
  id: string;
  orderId: string;
  description: string;
  status: string;
  files: OrderFile[];
}

export default function FilePortal() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Extract order ID from URL params
  const urlParams = new URLSearchParams(search);
  const orderFromUrl = urlParams.get('order');

  const { data: completedOrders = [] } = useQuery<Order[]>({
    queryKey: ['/api/users/orders/completed'],
    enabled: !!user,
  });

  const { data: selectedOrderFiles = [] } = useQuery<OrderFile[]>({
    queryKey: ['/api/orders', selectedOrderId, 'files'],
    enabled: !!selectedOrderId,
  });

  useEffect(() => {
    if (orderFromUrl && completedOrders.length > 0) {
      const order = completedOrders.find(o => o.id === orderFromUrl);
      if (order) {
        setSelectedOrderId(order.id);
      }
    }
  }, [orderFromUrl, completedOrders]);

  const handleDownloadFile = async (file: OrderFile) => {
    try {
      const response = await fetch(`/api/files/${file.path}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = async () => {
    if (!selectedOrderId) return;
    
    try {
      const response = await fetch(`/api/orders/${selectedOrderId}/files/download-all`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${selectedOrderId}-files.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download all failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-muted-foreground" />;
    }
    return <FileArchive className="h-6 w-6 text-muted-foreground" />;
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
          <h1 className="text-xl font-semibold text-foreground">檔案下載</h1>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Order Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">選擇訂單</label>
          <Select
            value={selectedOrderId}
            onValueChange={setSelectedOrderId}
            data-testid="select-order"
          >
            <SelectTrigger>
              <SelectValue placeholder="請選擇訂單..." />
            </SelectTrigger>
            <SelectContent>
              {completedOrders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  #{order.orderId} - {order.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">可用檔案</h3>
          
          {selectedOrderFiles.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {selectedOrderId ? '此訂單暫無可下載檔案' : '請先選擇訂單'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {selectedOrderFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mr-4">
                        {getFileIcon(file.type)}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground" data-testid={`text-file-name-${file.id}`}>
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-file-size-${file.id}`}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadFile(file)}
                      className="px-4 py-2"
                      data-testid={`button-download-file-${file.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下載
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Download All Button */}
              <div className="pt-4">
                <Button
                  variant="secondary"
                  onClick={handleDownloadAll}
                  className="w-full"
                  size="lg"
                  data-testid="button-download-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下載全部檔案
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Download Instructions */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-primary" />
              下載說明
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• 檔案下載有效期限為 30 天</li>
              <li>• 建議使用 WiFi 環境下載大型檔案</li>
              <li>• 如有下載問題，請聯繫客服支援</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
