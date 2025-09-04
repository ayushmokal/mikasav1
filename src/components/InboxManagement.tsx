import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Forward, 
  Settings, 
  Eye, 
  EyeOff, 
  Copy, 
  Webhook, 
  Shield,
  AlertCircle,
  CheckCircle,
  Inbox,
  Crown,
  Filter,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateInboxSettings, getUserEmails, getUnreadEmailCount } from "@/lib/firestore";
import { InboxSettings, ForwardingDestination } from "@/lib/types";
import { EmailInbox } from "@/components/EmailInbox";
import { ForwardingDestinations } from "@/components/ForwardingDestinations";
import { EmailTestUtils } from "@/components/EmailTestUtils";

export const InboxManagement = () => {
  const { userProfile, loading } = useAuth();
  const [inboxSettingsOpen, setInboxSettingsOpen] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState<InboxSettings>({
    forwardingEnabled: false,
    forwardingMethod: 'webhook',
    webhookUrl: '',
    forwardingEmail: '',
    receivingAddress: '',
    autoMarkAsRead: false,
    retentionDays: 30,
    // InstAddr-style features
    forwardingDestinations: [],
    dailyForwardingLimit: 50,
    dailyForwardingCount: 0,
    preventForwardedEmails: true,
    premiumFeaturesEnabled: false,
  });

  // Initialize settings from user profile
  useEffect(() => {
    if (userProfile) {
      if (userProfile.inboxSettings) {
        setSettings(userProfile.inboxSettings);
      } else {
        // Set default settings with user's account email as receiving address
        setSettings(prev => ({
          ...prev,
          receivingAddress: userProfile.accountEmail,
          webhookUrl: `${window.location.origin}/api/webhook/email?address=${encodeURIComponent(userProfile.accountEmail)}`,
          // InstAddr-style defaults
          forwardingDestinations: [],
          dailyForwardingLimit: userProfile.plan.name.toLowerCase().includes('premium') ? 200 : 50,
          dailyForwardingCount: 0,
          preventForwardedEmails: true,
          premiumFeaturesEnabled: userProfile.plan.name.toLowerCase().includes('premium'),
        }));
      }
      
      // Load unread count
      if (userProfile.id) {
        getUnreadEmailCount(userProfile.id).then(setUnreadCount);
      }
    }
  }, [userProfile]);

  const handleSaveSettings = async () => {
    if (!userProfile?.id) return;
    
    setIsLoading(true);
    try {
      await updateInboxSettings(userProfile.id, settings);
      toast.success('Inbox settings updated successfully');
      setInboxSettingsOpen(false);
    } catch (error) {
      console.error('Error updating inbox settings:', error);
      toast.error('Failed to update inbox settings');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const generateWebhookUrl = () => {
    if (userProfile?.accountEmail) {
      // Create unique webhook URL based on receiving address (account email)
      const encodedAddress = encodeURIComponent(userProfile.accountEmail);
      const url = `${window.location.origin}/api/webhook/email?address=${encodedAddress}`;
      setSettings(prev => ({ ...prev, webhookUrl: url }));
    }
  };

  const generateWebhookQueries = () => {
    if (userProfile?.accountEmail) {
      // Generate InstAddr-style webhook queries for the receiving address
      const queries = {
        "content": "#subject#\n#textbody#",
        "username": "#from#",
        "receivingAddress": userProfile.accountEmail
      };
      return JSON.stringify(queries, null, 2);
    }
    return '';
  };

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading inbox settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="destinations" className="flex items-center gap-2">
            <Forward className="h-4 w-4" />
            Destinations
            {!settings.premiumFeaturesEnabled && (
              <Crown className="h-3 w-3 ml-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="mt-6">
          <EmailInbox />
        </TabsContent>
        
        <TabsContent value="destinations" className="mt-6">
          <ForwardingDestinations
            destinations={settings.forwardingDestinations}
            onDestinationsChange={(destinations) => setSettings(prev => ({ ...prev, forwardingDestinations: destinations }))}
            dailyLimit={settings.dailyForwardingLimit}
            dailyCount={settings.dailyForwardingCount}
            premiumEnabled={settings.premiumFeaturesEnabled}
          />
        </TabsContent>
        
        <TabsContent value="filters" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Email Filters
                {!settings.premiumFeaturesEnabled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!settings.premiumFeaturesEnabled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
                  <p>Email filtering is available with premium plans</p>
                  <Button className="mt-4" variant="outline">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure rules to automatically filter emails before forwarding. 
                      Filtered emails will not count towards your daily limit.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Prevent forwarding already forwarded emails</Label>
                      <Switch
                        checked={settings.preventForwardedEmails}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, preventForwardedEmails: checked }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Skip emails with "Fw:" or "Fwd:" in the subject line
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <div className="space-y-6">
            {/* Daily Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emails forwarded today</span>
                    <span className="text-2xl font-bold">
                      {settings.dailyForwardingCount}/{settings.dailyForwardingLimit}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((settings.dailyForwardingCount / settings.dailyForwardingLimit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Limit resets at midnight UTC. 
                    {settings.premiumFeaturesEnabled ? 'Premium users get 200 forwards per day.' : 'Upgrade to premium for 200 forwards per day.'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Test Utils */}
            <EmailTestUtils />
          </div>
          {/* Inbox Overview */}
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Forwarding Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Receiving Address Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">Receiving Address</h3>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-blue-100 px-2 py-1 rounded">
                        {settings.receivingAddress || userProfile.accountEmail}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(
                          settings.receivingAddress || userProfile.accountEmail, 
                          'Receiving address'
                        )}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Emails sent to this address will be forwarded to your inbox
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.forwardingEnabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <Badge variant={settings.forwardingEnabled ? "default" : "secondary"}>
                      {settings.forwardingEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Settings Button */}
              <div className="flex gap-2">
                <Dialog open={inboxSettingsOpen} onOpenChange={setInboxSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Forwarding
                    </Button>
                  </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Email Forwarding Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Enable/Disable Forwarding */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Enable Email Forwarding</Label>
                      <p className="text-sm text-muted-foreground">
                        Forward emails sent to your subscription account to this inbox
                      </p>
                    </div>
                    <Switch
                      checked={settings.forwardingEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, forwardingEnabled: checked }))
                      }
                    />
                  </div>

                  {settings.forwardingEnabled && (
                    <>
                      {/* Receiving Address */}
                      <div className="space-y-2">
                        <Label htmlFor="receivingAddress">Receiving Email Address</Label>
                        <Input
                          id="receivingAddress"
                          type="email"
                          value={settings.receivingAddress}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            receivingAddress: e.target.value 
                          }))}
                          placeholder="Enter the email address that receives forwards"
                        />
                        <p className="text-xs text-muted-foreground">
                          This is typically your subscription service email address
                        </p>
                      </div>

                      {/* Forwarding Method */}
                      <div className="space-y-2">
                        <Label>Forwarding Method</Label>
                        <Select
                          value={settings.forwardingMethod}
                          onValueChange={(value: 'webhook' | 'email') => 
                            setSettings(prev => ({ ...prev, forwardingMethod: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="webhook">Webhook (Recommended)</SelectItem>
                            <SelectItem value="email">Email Forward</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Webhook Configuration */}
                      {settings.forwardingMethod === 'webhook' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="webhookUrl">Webhook URL</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={generateWebhookUrl}
                            >
                              Generate URL
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              id="webhookUrl"
                              type={showWebhookUrl ? "text" : "password"}
                              value={settings.webhookUrl}
                              onChange={(e) => setSettings(prev => ({ 
                                ...prev, 
                                webhookUrl: e.target.value 
                              }))}
                              placeholder="https://your-domain.vercel.app/api/webhook/email"
                              readOnly
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                            >
                              {showWebhookUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(settings.webhookUrl, 'Webhook URL')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Webhook Queries */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Webhook Queries</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(generateWebhookQueries(), 'Webhook queries')}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <div className="p-3 bg-muted rounded border font-mono text-sm">
                              <pre>{generateWebhookQueries()}</pre>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Use these query parameters when setting up email forwarding from services like InstAddr
                            </p>
                          </div>
                          
                          <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                              This webhook URL is unique to your receiving address: <strong>{settings.receivingAddress}</strong>
                              <br />Deploy this project to Vercel for free webhook hosting.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {/* Email Forward Configuration */}
                      {settings.forwardingMethod === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="forwardingEmail">Forward to Email</Label>
                          <Input
                            id="forwardingEmail"
                            type="email"
                            value={settings.forwardingEmail}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              forwardingEmail: e.target.value 
                            }))}
                            placeholder="Enter email address to forward to"
                          />
                        </div>
                      )}

                      {/* Additional Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="retentionDays">Email Retention (Days)</Label>
                          <Input
                            id="retentionDays"
                            type="number"
                            min={1}
                            max={365}
                            value={settings.retentionDays}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              retentionDays: parseInt(e.target.value) || 30 
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm">Auto Mark as Read</Label>
                            <p className="text-xs text-muted-foreground">
                              Automatically mark forwarded emails as read
                            </p>
                          </div>
                          <Switch
                            checked={settings.autoMarkAsRead}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, autoMarkAsRead: checked }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setInboxSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSettings} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};