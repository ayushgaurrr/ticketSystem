import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketType, Comment, Attachment, Notification } from '../types';
import { tickets as mockTickets, notifications as mockNotifications } from '../data/mockData';
import { useAuth } from './AuthContext';

interface TicketsContextType {
  tickets: Ticket[];
  notifications: Notification[];
  getTicketById: (id: string) => Ticket | undefined;
  getTicketsByUser: (userId: string) => Ticket[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  createTicket: (ticketData: Partial<Ticket>) => Promise<Ticket>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<Ticket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
  addComment: (ticketId: string, content: string, isInternal: boolean) => Promise<Comment>;
  addAttachment: (ticketId: string, file: File) => Promise<Attachment>;
  markNotificationAsRead: (id: string) => void;
  getUserNotifications: (userId: string) => Notification[];
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const useTickets = (): TicketsContextType => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
};

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  // const { currentUser } = useAuth();
  const { currentUser, authToken } = useAuth(); // Assuming authToken is available from useAuth

    const API_BASE_URL = '/api/tickets'; // Your backend API endpoint for tickets

    const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${authToken}`, // Include auth token if your API requires it
        },
      });
      if (!response.ok) {
        throw new Error(`Error fetching tickets: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Tickets fetched:=============', data);
      setTickets(data.tickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      // Handle error (e.g., show a toast notification)
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) { // Fetch tickets only if authenticated
      fetchTickets();
    }
  }, [fetchTickets, authToken]);

  const getTicketById = (id: string) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const getTicketsByUser = (userId: string) => {
    return tickets.filter(ticket => ticket.userId === userId);
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Simulate network delay
  // const createTicket = async (ticketData: Partial<Ticket>): Promise<Ticket> => {
  //   await new Promise(resolve => setTimeout(resolve, 1000));
    
  //   const newTicket: Ticket = {
  //     id: `ticket-${tickets.length + 1}`,
  //     userId: currentUser?.id || '',
  //     assignedTo: null,
  //     type: ticketData.type || 'other',
  //     priority: ticketData.priority || 'medium',
  //     status: 'new',
  //     subject: ticketData.subject || '',
  //     description: ticketData.description || '',
  //     attachments: ticketData.attachments || [],
  //     comments: [],
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   };
    
  //   setTickets(prev => [...prev, newTicket]);
    
  //   // Create notification for admins
  //   const newNotification: Notification = {
  //     id: `notification-${notifications.length + 1}`,
  //     userId: 'admin-1', // Notify admin about new ticket
  //     ticketId: newTicket.id,
  //     message: `New ticket submitted: "${newTicket.subject}"`,
  //     read: false,
  //     createdAt: new Date(),
  //   };
    
  //   setNotifications(prev => [...prev, newNotification]);
    
  //   return newTicket;
  // };

   const createTicket = async (ticketData: Partial<Ticket>): Promise<Ticket> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...ticketData,
          userId: currentUser?.id, // Ensure userId is sent with the ticket
        }),
      });

      if (!response.ok) {
        throw new Error(`Error creating ticket: ${response.statusText}`);
      }

      const newTicket = await response.json();
      await fetchTickets(); // Re-fetch all tickets to update the state
      
      // Create notification for admins
      const newNotification: Notification = {
        id: `notification-${notifications.length + 1}`,
        userId: 'admin-1', // Notify admin about new ticket
        ticketId: newTicket.id,
        message: `New ticket submitted: "${newTicket.subject}"`,
        read: false,
        createdAt: new Date(),
      };
      
      setNotifications(prev => [...prev, newNotification]);

      return newTicket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let updatedTicket: Ticket | undefined;
    
    setTickets(prev => {
      return prev.map(ticket => {
        if (ticket.id === id) {
          updatedTicket = {
            ...ticket,
            ...updates,
            updatedAt: new Date(),
          };
          return updatedTicket;
        }
        return ticket;
      });
    });
    
    if (!updatedTicket) {
      throw new Error('Ticket not found');
    }
    
    return updatedTicket;
  };

  const updateTicketStatus = async (id: string, status: TicketStatus): Promise<Ticket> => {
    const ticket = getTicketById(id);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const updatedTicket = await updateTicket(id, { status });
    
    // Create notification for ticket owner about status change
    const newNotification: Notification = {
      id: `notification-${notifications.length + 1}`,
      userId: ticket.userId,
      ticketId: ticket.id,
      message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
      read: false,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return updatedTicket;
  };

  const addComment = async (ticketId: string, content: string, isInternal: boolean): Promise<Comment> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ticket = getTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const newComment: Comment = {
      id: `comment-${new Date().getTime()}`,
      userId: currentUser?.id || '',
      content,
      isInternal,
      createdAt: new Date(),
    };
    
    await updateTicket(ticketId, {
      comments: [...ticket.comments, newComment],
    });
    
    // Create notification about new comment (if not internal)
    if (!isInternal) {
      // If user adds comment, notify assigned admin
      // If admin adds comment, notify ticket owner
      const recipientId = currentUser?.role === 'admin' ? ticket.userId : ticket.assignedTo || 'admin-1';
      
      const newNotification: Notification = {
        id: `notification-${notifications.length + 1}`,
        userId: recipientId,
        ticketId: ticket.id,
        message: `New comment on ticket "${ticket.subject}".`,
        read: false,
        createdAt: new Date(),
      };
      
      setNotifications(prev => [...prev, newNotification]);
    }
    
    return newComment;
  };

  const addAttachment = async (ticketId: string, file: File): Promise<Attachment> => {
    // In a real app, you would upload the file to a storage service
    // For demo purposes, we'll just create a mock attachment
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ticket = getTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const newAttachment: Attachment = {
      id: `attachment-${new Date().getTime()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // This will work for demo but isn't persistent
    };
    
    await updateTicket(ticketId, {
      attachments: [...ticket.attachments, newAttachment],
    });
    
    return newAttachment;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const getUserNotifications = (userId: string) => {
    return notifications.filter(notification => notification.userId === userId);
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        notifications,
        getTicketById,
        getTicketsByUser,
        getTicketsByStatus,
        createTicket,
        updateTicket,
        updateTicketStatus,
        addComment,
        addAttachment,
        markNotificationAsRead,
        getUserNotifications,
      }}
      
    >
      {children}
    </TicketsContext.Provider>
  );
};