import { useState, useEffect } from 'react';
import { Mail, Check, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEmailAlerts } from '@/hooks/useEmailAlerts';

export function EmailAlertSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const { getStoredEmail, setStoredEmail, clearStoredEmail, testEmailAlert } = useEmailAlerts();

  useEffect(() => {
    const stored = getStoredEmail();
    if (stored) {
      setEmail(stored);
    }
  }, [getStoredEmail]);

  const handleSave = () => {
    if (email && email.includes('@')) {
      setStoredEmail(email);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setEmail('');
    clearStoredEmail();
  };

  const handleTest = async () => {
    if (!email || !email.includes('@')) return;
    setIsTesting(true);
    await testEmailAlert(email);
    setIsTesting(false);
  };

  const storedEmail = getStoredEmail();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4" />
          {storedEmail ? 'Email Alerts On' : 'Setup Email Alerts'}
          {storedEmail && <Check className="h-3 w-3 text-primary" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Alert Settings</DialogTitle>
          <DialogDescription>
            Receive critical alerts via email when websites go down, response times spike, or CI/CD pipelines fail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Alerts will be sent to this email address for all monitored resources.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!email || !email.includes('@')}>
              Save Email
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={!email || !email.includes('@') || isTesting}>
              <Send className="h-4 w-4 mr-2" />
              {isTesting ? 'Sending...' : 'Send Test'}
            </Button>
            {storedEmail && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {storedEmail && (
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <p className="font-medium text-primary flex items-center gap-2">
                <Check className="h-4 w-4" />
                Email alerts enabled
              </p>
              <p className="text-muted-foreground mt-1">
                Alerts will be sent to: {storedEmail}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Alert Types</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>🔴 Website Down - When a monitored site becomes unreachable</li>
              <li>⚠️ Response Time Spike - When response time exceeds thresholds</li>
              <li>❌ CI/CD Failure - When GitHub workflow runs fail</li>
              <li>✅ Recovery - When a site comes back online</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
