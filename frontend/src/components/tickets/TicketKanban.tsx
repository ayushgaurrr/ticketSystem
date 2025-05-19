import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../../types';
import { useTickets } from '../../context/TicketsContext';
import TicketCard from './TicketCard';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AlertCircle, Clock, CheckCircle, PauseCircle, XCircle } from 'lucide-react';

interface TicketKanbanProps {
  tickets: Ticket[];
  className?: string;
}

const TicketKanban: React.FC<TicketKanbanProps> = ({
  tickets,
  className = '',
}) => {
  const { updateTicketStatus } = useTickets();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
  
  const columns: {
    id: TicketStatus;
    title: string;
    color: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: 'new',
      title: 'New',
      color: 'bg-blue-500',
      icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
      description: 'Newly created tickets',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-amber-500',
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      description: 'Tickets being worked on',
    },
    {
      id: 'on-hold',
      title: 'On Hold',
      color: 'bg-purple-500',
      icon: <PauseCircle className="h-5 w-5 text-purple-600" />,
      description: 'Temporarily paused tickets',
    },
    {
      id: 'resolved',
      title: 'Resolved',
      color: 'bg-green-500',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      description: 'Completed tickets',
    },
    {
      id: 'closed',
      title: 'Closed',
      color: 'bg-gray-500',
      icon: <XCircle className="h-5 w-5 text-gray-600" />,
      description: 'Archived tickets',
    },
  ];
  
  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };
  
  const handleDragStart = (start: any) => {
    setIsDragging(true);
    setDraggedTicket(start.draggableId);
    // Add dragging class to body for global styling
    document.body.classList.add('is-dragging');
  };
  
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    setDraggedTicket(null);
    document.body.classList.remove('is-dragging');
    
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) {
      return;
    }
    
    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // If moved to a different column (status change)
    if (destination.droppableId !== source.droppableId) {
      const ticketId = draggableId;
      const newStatus = destination.droppableId as TicketStatus;
      
      try {
        // Update ticket status
        await updateTicketStatus(ticketId, newStatus);
      } catch (error) {
        console.error('Failed to update ticket status:', error);
        // Could add toast notification here for error feedback
      }
    }
  };
  
  return (
    <div 
      className={`h-[calc(100vh-200px)] ${className}`}
      role="region" 
      aria-label="Ticket Management Board"
    >
      <DragDropContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto h-full pb-4 gap-4">
          {columns.map(column => (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-80 flex flex-col h-full"
              role="list"
              aria-label={`${column.title} tickets`}
            >
              <div className={`${column.color} px-4 py-3 rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {column.icon}
                    <h3 className="font-semibold text-white ml-2">
                      {column.title}
                    </h3>
                  </div>
                  <span className="bg-white bg-opacity-30 text-white text-sm px-2 py-0.5 rounded-full">
                    {getTicketsByStatus(column.id).length}
                  </span>
                </div>
                <p className="text-white text-sm mt-1 opacity-80">
                  {column.description}
                </p>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      flex-1 overflow-y-auto p-2 rounded-b-lg
                      transition-colors duration-200
                      ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'}
                      ${isDragging ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
                    `}
                    style={{ minHeight: '100px' }}
                  >
                    {getTicketsByStatus(column.id).map((ticket, index) => (
                      <Draggable 
                        key={ticket.id} 
                        draggableId={ticket.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              mb-2 transition-transform duration-200
                              ${snapshot.isDragging ? 'rotate-1 scale-105' : ''}
                              ${draggedTicket === ticket.id ? 'opacity-50' : ''}
                            `}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <TicketCard 
                              ticket={ticket}
                              className={`
                                cursor-grab active:cursor-grabbing
                                hover:shadow-lg transition-shadow
                                ${snapshot.isDragging ? 'shadow-xl' : ''}
                              `}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Empty state */}
                    {getTicketsByStatus(column.id).length === 0 && !isDragging && (
                      <div className="text-center py-4 px-2">
                        <p className="text-sm text-gray-500">
                          No tickets in this column
                        </p>
                      </div>
                    )}
                    
                    {/* Drop indicator */}
                    {isDragging && getTicketsByStatus(column.id).length === 0 && (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-500">
                          Drop ticket here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Mobile view instructions */}
      <div className="md:hidden mt-4 text-center text-sm text-gray-500">
        <p>Scroll horizontally to view all columns</p>
        <p>Tap and hold tickets to drag them between columns</p>
      </div>
    </div>
  );
};

export default TicketKanban;