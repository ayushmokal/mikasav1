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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Webhook, 
  Mail, 
  MessageSquare, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { ForwardingDestination, EmailFilterRule } from "@/lib/types";

interface ForwardingDestinationsProps {
  destinations: ForwardingDestination[];
  onDestinationsChange: (destinations: ForwardingDestination[]) => void;
  dailyLimit: number;
  dailyCount: number;
  premiumEnabled: boolean;
}

export const ForwardingDestinations = ({
  destinations,
  onDestinationsChange,
  dailyLimit,
  dailyCount,
  premiumEnabled
}: ForwardingDestinationsProps) => {
  const [editingDestination, setEditingDestination] = useState<ForwardingDestination | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddDestination = () => {
    const newDestination: ForwardingDestination = {
      id: crypto.randomUUID(),
      type: 'email',
      name: 'New Destination',
      enabled: true,
      webhookMethod: 'POST',
      webhookFormat: 'json',
      webhookHeaders: {},
      webhookParams: {},
      filterRules: []
    };
    setEditingDestination(newDestination);
    setDialogOpen(true);
  };

  const handleEditDestination = (destination: ForwardingDestination) => {
    setEditingDestination({ ...destination });
    setDialogOpen(true);
  };

  const handleSaveDestination = () => {
    if (!editingDestination) return;

    const existingIndex = destinations.findIndex(d => d.id === editingDestination.id);
    if (existingIndex >= 0) {
      const updated = [...destinations];
      updated[existingIndex] = editingDestination;
      onDestinationsChange(updated);
    } else {
      onDestinationsChange([...destinations, editingDestination]);
    }
    
    setDialogOpen(false);
    setEditingDestination(null);
    toast.success('Forwarding destination saved');
  };

  const handleDeleteDestination = (id: string) => {
    onDestinationsChange(destinations.filter(d => d.id !== id));
    toast.success('Forwarding destination removed');
  };

  const handleToggleDestination = (id: string, enabled: boolean) => {
    const updated = destinations.map(d => 
      d.id === id ? { ...d, enabled } : d
    );
    onDestinationsChange(updated);
  };

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'discord': return <MessageSquare className="h-4 w-4" />;
      case 'ifttt': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getDestinationTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'webhook': return 'bg-green-100 text-green-800';
      case 'discord': return 'bg-purple-100 text-purple-800';
      case 'ifttt': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const predefinedTemplates = {
    discord: `📧 **New Email Received**
**From:** {{fromEmail}}
**Subject:** {{subject}}
**Time:** {{receivedAt}}

{{textBody}}`,
    ifttt: `New email from {{fromEmail}} - {{subject}}`,
    webhook: `{
  "from": "{{fromEmail}}",
  "subject": "{{subject}}",
  "body": "{{textBody}}",
  "receivedAt": "{{receivedAt}}"
}`
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forwarding Destinations</h3>
          <p className="text-sm text-muted-foreground">
            Configure multiple destinations for email forwarding
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">
              {dailyCount}/{dailyLimit} forwards today
            </div>
            <div className="text-xs text-muted-foreground">
              {dailyLimit - dailyCount} remaining
            </div>
          </div>
          {!premiumEnabled && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Premium Required
            </Badge>
          )}
        </div>
      </div>

      {/* Daily Limit Warning */}
      {dailyCount >= dailyLimit * 0.8 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching your daily forwarding limit of {dailyLimit} emails.
            {dailyCount >= dailyLimit && " Forwarding is currently disabled."}
          </AlertDescription>
        </Alert>
      )}

      {/* Destinations List */}
      <div className="space-y-2">
        {destinations.map((destination) => (
          <Card key={destination.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getDestinationIcon(destination.type)}
                    <span className="font-medium">{destination.name}</span>
                  </div>
                  <Badge className={getDestinationTypeColor(destination.type)}>
                    {destination.type.toUpperCase()}
                  </Badge>
                  {destination.enabled ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={destination.enabled}
                    onCheckedChange={(enabled) => handleToggleDestination(destination.id, enabled)}
                    disabled={!premiumEnabled}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditDestination(destination)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteDestination(destination.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Destination Details */}
              <div className="mt-2 text-sm text-muted-foreground">
                {destination.type === 'email' && destination.email && (
                  <div>Forward to: {destination.email}</div>
                )}
                {destination.type === 'webhook' && destination.webhookUrl && (
                  <div>Webhook: {destination.webhookUrl}</div>
                )}
                {destination.type === 'discord' && destination.discordWebhookUrl && (
                  <div>Discord Channel</div>
                )}
                {destination.type === 'ifttt' && destination.iftttEvent && (
                  <div>IFTTT Event: {destination.iftttEvent}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {destinations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mb-2 opacity-50" />
              <p>No forwarding destinations configured</p>
              <p className="text-sm">Add a destination to start forwarding emails</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Button */}
      <Button
        onClick={handleAddDestination}
        className="w-full"
        variant="outline"
        disabled={!premiumEnabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Forwarding Destination
      </Button>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDestination?.name === 'New Destination' ? 'Add' : 'Edit'} Forwarding Destination
            </DialogTitle>
          </DialogHeader>
          
          {editingDestination && (
            <div className="space-y-4 py-4">
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destination Name</Label>
                  <Input
                    value={editingDestination.name}
                    onChange={(e) => setEditingDestination({
                      ...editingDestination,
                      name: e.target.value
                    })}
                    placeholder="My Discord Channel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingDestination.type}
                    onValueChange={(value: any) => setEditingDestination({
                      ...editingDestination,
                      type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Forward</SelectItem>
                      <SelectItem value="webhook">Custom Webhook</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="ifttt">IFTTT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Type-specific Configuration */}
              {editingDestination.type === 'email' && (
                <div className="space-y-2">
                  <Label>Forward to Email</Label>
                  <Input
                    type="email"
                    value={editingDestination.email || ''}
                    onChange={(e) => setEditingDestination({
                      ...editingDestination,
                      email: e.target.value
                    })}
                    placeholder="user@example.com"
                  />
                </div>
              )}

              {editingDestination.type === 'webhook' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={editingDestination.webhookUrl || ''}
                      onChange={(e) => setEditingDestination({
                        ...editingDestination,
                        webhookUrl: e.target.value
                      })}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select
                        value={editingDestination.webhookMethod}
                        onValueChange={(value: any) => setEditingDestination({
                          ...editingDestination,
                          webhookMethod: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={editingDestination.webhookFormat}
                        onValueChange={(value: any) => setEditingDestination({
                          ...editingDestination,
                          webhookFormat: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="form">Form Data</SelectItem>
                          <SelectItem value="plaintext">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {editingDestination.type === 'discord' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Discord Webhook URL</Label>
                    <Input
                      value={editingDestination.discordWebhookUrl || ''}
                      onChange={(e) => setEditingDestination({
                        ...editingDestination,
                        discordWebhookUrl: e.target.value
                      })}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bot Username (Optional)</Label>
                    <Input
                      value={editingDestination.discordUsername || ''}
                      onChange={(e) => setEditingDestination({
                        ...editingDestination,
                        discordUsername: e.target.value
                      })}
                      placeholder="Email Bot"
                    />
                  </div>
                </div>
              )}

              {editingDestination.type === 'ifttt' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>IFTTT Webhook Key</Label>
                    <Input
                      value={editingDestination.iftttKey || ''}
                      onChange={(e) => setEditingDestination({
                        ...editingDestination,
                        iftttKey: e.target.value
                      })}
                      placeholder="Your IFTTT webhook key"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input
                      value={editingDestination.iftttEvent || ''}
                      onChange={(e) => setEditingDestination({
                        ...editingDestination,
                        iftttEvent: e.target.value
                      })}
                      placeholder="email_received"
                    />
                  </div>
                </div>
              )}

              {/* Custom Template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Message Template</Label>
                  {editingDestination.type in predefinedTemplates && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDestination({
                        ...editingDestination,
                        template: predefinedTemplates[editingDestination.type as keyof typeof predefinedTemplates]
                      })}
                    >
                      Use Template
                    </Button>
                  )}
                </div>
                <Textarea
                  value={editingDestination.template || ''}
                  onChange={(e) => setEditingDestination({
                    ...editingDestination,
                    template: e.target.value
                  })}
                  placeholder="Custom message format using {{variables}}"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{'}fromEmail{'}'}, {'{'}fromName{'}'}, {'{'}subject{'}'}, {'{'}textBody{'}'}, {'{'}receivedAt{'}'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDestination}>
                  Save Destination
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};