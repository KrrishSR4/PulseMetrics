import { useState } from 'react';
import { Search, Github, Globe, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { detectUrlType, getDisplayName } from '@/lib/url-detector';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  onSubmit: (url: string, type: 'github' | 'website', name: string) => void;
  isLoading?: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const detected = input.trim() ? detectUrlType(input) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!detected) {
      setError('Please enter a valid GitHub repository URL or website URL');
      return;
    }

    onSubmit(detected.normalizedUrl, detected.type, getDisplayName(detected));
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {detected?.type === 'github' ? (
            <Github className="h-5 w-5 text-foreground" />
          ) : detected?.type === 'website' ? (
            <Globe className="h-5 w-5 text-foreground" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          type="text"
          placeholder="Paste GitHub repo URL or website URL..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          className={cn(
            "h-14 pl-12 pr-32 text-base bg-card border-border shadow-sm",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "placeholder:text-muted-foreground",
            error && "border-destructive focus:ring-destructive/20 focus:border-destructive"
          )}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Track'
          )}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      
      {detected && !error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Detected:</span>
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
            detected.type === 'github' 
              ? "bg-foreground/10 text-foreground" 
              : "bg-primary/10 text-primary"
          )}>
            {detected.type === 'github' ? <Github className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {detected.type === 'github' ? 'GitHub Repository' : 'Website'}
          </span>
          <span className="font-mono text-xs truncate max-w-xs">{getDisplayName(detected)}</span>
        </div>
      )}
    </form>
  );
}
