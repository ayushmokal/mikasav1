import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Trash2, 
  Search, 
  Clock,
  Paperclip,
  RefreshCw,
  MailCheck
} from "lucide-react";
import { format } from "date-fns";
import { EmailMessage } from "@/lib/types";
import useInbox from "@/hooks/useInbox";

export const EmailInbox = () => {
  const {
    emails,
    unreadCount,
    emailsLoading,
    isDeleting,
    isMarkingAllRead,
    markAsRead,
    markAsUnread,
    toggleStar,
    deleteEmail,
    markAllAsRead
  } = useInbox();

  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  // Filter emails based on search and filter
  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchTerm || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fromEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !email.isRead) ||
      (filter === 'starred' && email.isStarred);

    return matchesSearch && matchesFilter;
  });

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id!);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, h:mm a');
  };

  if (emailsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading emails...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inbox Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Inbox</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                  disabled={isMarkingAllRead}
                >
                  {isMarkingAllRead ? (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <MailCheck className="mr-2 h-3 w-3" />
                  )}
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All ({emails.length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                size="sm"
                variant={filter === 'starred' ? 'default' : 'outline'}
                onClick={() => setFilter('starred')}
              >
                <Star className="mr-1 h-3 w-3" />
                Starred ({emails.filter(e => e.isStarred).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardContent className="p-0">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Mail className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchTerm || filter !== 'all' ? 'No emails found' : 'Your inbox is empty'}
              </p>
              <p className="text-sm">
                Emails will appear here when they are forwarded to your account
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !email.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {email.isRead ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="font-medium text-sm truncate">
                            {email.fromName || email.fromEmail}
                          </span>
                          {email.attachments && email.attachments.length > 0 && (
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        
                        <h3 className={`text-sm mb-1 truncate ${
                          !email.isRead ? 'font-semibold' : 'font-normal'
                        }`}>
                          {email.subject || 'No Subject'}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {email.textBody || 'No preview available'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(email.receivedAt)}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(email.id!, email.isStarred);
                          }}
                        >
                          {email.isStarred ? (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEmail(email.id!);
                          }}
                          disabled={isDeleting}
                          title="Delete email"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{selectedEmail?.subject || 'No Subject'}</DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Email Header */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedEmail.fromName || selectedEmail.fromEmail}
                    </p>
                    {selectedEmail.fromName && (
                      <p className="text-sm text-muted-foreground">
                        {selectedEmail.fromEmail}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedEmail.receivedAt)}
                  </p>
                </div>
              </div>
              
              {/* Email Content */}
              <ScrollArea className="flex-1 mt-4">
                <div className="space-y-4">
                  {selectedEmail.htmlBody ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">
                      {selectedEmail.textBody || 'No content available'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
