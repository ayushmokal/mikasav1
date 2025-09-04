import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Bug, User, Database, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DebugLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

export const DebugConsole = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const { currentUser, userProfile, loading, isAdmin } = useAuth();

  // Mock some debug logs for demonstration
  const mockLogs: DebugLogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'AUTH',
      message: 'User authentication successful',
      data: { uid: currentUser?.uid, email: currentUser?.email }
    },
    {
      timestamp: new Date(Date.now() - 5000).toISOString(),
      level: 'debug',
      category: 'FIRESTORE',
      message: 'User profile loaded from Firestore',
      data: { role: userProfile?.role, profileId: userProfile?.id }
    },
    {
      timestamp: new Date(Date.now() - 10000).toISOString(),
      level: 'info',
      category: 'APP',
      message: 'Application initialized successfully'
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTH': return <Shield className="h-3 w-3" />;
      case 'FIRESTORE': return <Database className="h-3 w-3" />;
      case 'USER': return <User className="h-3 w-3" />;
      default: return <Bug className="h-3 w-3" />;
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Console
          <ChevronUp className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96">
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Console
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* System Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">System Status</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Auth Status:</span>
                <Badge variant={currentUser ? "default" : "secondary"} className="text-xs">
                  {currentUser ? "Authenticated" : "Anonymous"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile:</span>
                <Badge variant={userProfile ? "default" : "secondary"} className="text-xs">
                  {loading ? "Loading..." : userProfile ? "Loaded" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Role:</span>
                <Badge variant={isAdmin ? "destructive" : "outline"} className="text-xs">
                  {userProfile?.role || "Unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Firebase:</span>
                <Badge variant="default" className="text-xs">
                  Connected
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current User Info */}
          {currentUser && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Current User</h4>
              <div className="text-xs space-y-1">
                <div><strong>UID:</strong> {currentUser.uid}</div>
                <div><strong>Email:</strong> {currentUser.email}</div>
                {userProfile && (
                  <>
                    <div><strong>Role:</strong> {userProfile.role}</div>
                    <div><strong>Profile ID:</strong> {userProfile.id}</div>
                  </>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Debug Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Logs</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {mockLogs.map((log, index) => (
                <div key={index} className="text-xs p-2 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(log.category)}
                      <Badge variant="outline" className={`text-xs ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{log.category}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{log.message}</div>
                  {log.data && (
                    <div className="mt-1 text-xs font-mono bg-muted p-1 rounded">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environment Info */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            <div><strong>Environment:</strong> Development</div>
            <div><strong>Version:</strong> 1.0.0</div>
            <div><strong>Last Updated:</strong> {format(new Date(), 'PPP')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};