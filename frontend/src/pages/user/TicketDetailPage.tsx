import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTickets } from '../../context/TicketsContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import TicketTypeBadge from '../../components/tickets/TicketTypeBadge';
import TextArea from '../../components/ui/TextArea';
import { ChevronLeft, Send, Paperclip, User, Clock, CalendarClock } from 'lucide-react';
import { Ticket, Comment } from '../../types';

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { getTicketById, addComment } = useTickets();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (ticketId) {
      const foundTicket = getTicketById(ticketId);
      setTicket(foundTicket);
      
      if (!foundTicket) {
        // Ticket not found
        navigate('/tickets');
      }
    }
  }, [ticketId, getTicketById, navigate]);
  
  if (!ticket || !currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const isUserTicket = currentUser.id === ticket.userId;
  
  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addComment(ticket.id, newComment, isInternal);
      setNewComment('');
      setIsInternal(false);
      
      // Refresh ticket
      const updatedTicket = getTicketById(ticket.id);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderUserInfo = (comment: Comment) => {
    const isAdmin = comment.userId.startsWith('admin');
    const userName = isAdmin ? 'Support Agent' : 'You';
    
    return (
      <div className="flex items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${isAdmin ? 'bg-blue-500' : 'bg-gray-500'}`}>
          <User className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <div className="font-medium">{userName}</div>
          <div className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </div>
        </div>
        {isAdmin && comment.isInternal && (
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            Internal
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="mb-4 inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Tickets
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-0">
            {ticket.subject}
          </h1>
          <div className="flex items-center space-x-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketTypeBadge type={ticket.type} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-500 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="font-medium">You</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{ticket.description}</p>
              </div>
              
              {ticket.attachments.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attachments ({ticket.attachments.length})
                  </h4>
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                    {ticket.attachments.map(attachment => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between py-2 px-3 text-sm"
                      >
                        <div className="flex items-center">
                          <Paperclip className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="truncate">{attachment.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({Math.round(attachment.size / 1024)} KB)
                          </span>
                        </div>
                        <a
                          href={attachment.url}
                          className="text-blue-600 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
          
          {ticket.comments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Conversation
              </h3>
              
              <div className="space-y-4">
                {ticket.comments
                  .filter(comment => !comment.isInternal || isAdmin)
                  .map(comment => (
                    <Card key={comment.id}>
                      <CardBody>
                        {renderUserInfo(comment)}
                        <div className="mt-2 whitespace-pre-line">
                          {comment.content}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
              </div>
            </div>
          )}
          
          <Card>
            <form onSubmit={handleSubmitComment}>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Add a Comment
                </h3>
                
                <TextArea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  rows={4}
                  required
                />
                
                {isAdmin && (
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="internal-note"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="internal-note"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Mark as internal note (only visible to staff)
                    </label>
                  </div>
                )}
              </CardBody>
              
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  rightIcon={<Send className="h-4 w-4" />}
                  isLoading={isSubmitting}
                >
                  Send
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-800">
                Ticket Information
              </h3>
            </CardHeader>
            
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Priority
                  </div>
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Type
                  </div>
                  <TicketTypeBadge type={ticket.type} />
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">
                      Submitted: {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                  
                  {ticket.updatedAt > ticket.createdAt && (
                    <div className="flex items-center mt-2">
                      <CalendarClock className="h-4 w-4 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-600">
                        Last Updated: {formatDate(ticket.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Assignment
                    </div>
                    <div>
                      {ticket.assignedTo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          
          <div className="mt-6">
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/tickets')}
            >
              Back to Tickets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;