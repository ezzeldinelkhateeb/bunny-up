import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function TestSheetsConnection() {
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Get the base URL depending on environment
      const apiBase = import.meta.env.PROD ? '/.netlify/functions' : 'http://localhost:3001/api';
      const response = await fetch(`${apiBase}/test-sheets-connection`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Connected to sheet: ${data.data.sheetName}${data.data.serviceAccount ? ` using account: ${data.data.serviceAccount}` : ''}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
          duration: 5000,
        });
      }
      
      console.log('Test connection response:', data);
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to server",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={testConnection} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        'Test Sheets Connection'
      )}
    </Button>
  );
}