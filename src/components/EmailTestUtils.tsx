import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Send, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const EmailTestUtils = () => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  const [testEmail, setTestEmail] = useState({
    from: 'test@example.com',
    fromName: 'Test Sender',
    subject: 'Test Email from SubVault',
    textBody: 'This is a test email to verify your inbox forwarding setup is working correctly.',
    htmlBody: '<p>This is a <strong>test email</strong> to verify your inbox forwarding setup is working correctly.</p>'
  });

  const sendTestEmail = async () => {
    if (!userProfile?.id) {
      toast.error('User not found');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Get the webhook URL for the receiving address
      const receivingAddress = userProfile.accountEmail;
      const webhookUrl = userProfile.inboxSettings?.webhookUrl || 
                        `${window.location.origin}/api/webhook/email?address=${encodeURIComponent(receivingAddress)}`;

      // Send test email to webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Generic format that should work with the parser
          from: testEmail.from,
          fromName: testEmail.fromName,
          subject: testEmail.subject,
          text: testEmail.textBody,
          html: testEmail.htmlBody,
          receivingAddress: receivingAddress,
          // InstAddr format
          content: `#subject#${testEmail.subject}\n#textbody#${testEmail.textBody}`,
          username: `#from#${testEmail.from}`,
          // SendGrid format fallback
          envelope: { from: testEmail.from },
          // Mailgun format fallback  
          sender: testEmail.from,
          From: testEmail.fromName,
          Subject: testEmail.subject,
          'body-plain': testEmail.textBody,
          'body-html': testEmail.htmlBody
        })
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        const errorText = await response.text();
        setTestResult('error');
        toast.error(`Test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      setTestResult('error');
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Email Forwarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool sends a test email to your webhook endpoint to verify that your email forwarding setup is working correctly.
          </AlertDescription>
        </Alert>

        {/* Test Email Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testFrom">From Email</Label>
            <Input
              id="testFrom"
              value={testEmail.from}
              onChange={(e) => setTestEmail(prev => ({ ...prev, from: e.target.value }))}
              placeholder="test@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="testFromName">From Name</Label>
            <Input
              id="testFromName"
              value={testEmail.fromName}
              onChange={(e) => setTestEmail(prev => ({ ...prev, fromName: e.target.value }))}
              placeholder="Test Sender"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="testSubject">Subject</Label>
          <Input
            id="testSubject"
            value={testEmail.subject}
            onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Test Email Subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testBody">Email Body</Label>
          <Textarea
            id="testBody"
            value={testEmail.textBody}
            onChange={(e) => setTestEmail(prev => ({ ...prev, textBody: e.target.value }))}
            placeholder="Test email content..."
            rows={4}
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult === 'success' ? 'text-green-800' : 'text-red-800'}>
              {testResult === 'success' 
                ? 'Test email sent successfully! The email should appear in your inbox shortly.'
                : 'Test failed. Please check your webhook configuration and try again.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Webhook URL Display */}
        <div className="space-y-2">
          <Label>Current Webhook URL</Label>
          <div className="p-2 bg-muted rounded border font-mono text-sm break-all">
            {userProfile.inboxSettings?.webhookUrl || 
             `${window.location.origin}/api/webhook/email?address=${encodeURIComponent(userProfile.accountEmail)}`}
          </div>
          <p className="text-xs text-muted-foreground">
            This URL is unique to your receiving address: <strong>{userProfile.accountEmail}</strong>
          </p>
        </div>

        {/* Send Test Button */}
        <Button 
          onClick={sendTestEmail} 
          disabled={isLoading || !userProfile.inboxSettings?.forwardingEnabled}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>

        {!userProfile.inboxSettings?.forwardingEnabled && (
          <p className="text-sm text-muted-foreground text-center">
            Email forwarding must be enabled to send test emails
          </p>
        )}
      </CardContent>
    </Card>
  );
};