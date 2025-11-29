// WebSocket client for real-time task updates
class TaskWebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.userId = null;
    this.groups = [];
    this.eventHandlers = new Map();
  }

  // Initialize WebSocket connection
  connect(userId, groups = []) {
    this.userId = userId;
    this.groups = groups;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Identify client to server
        this.send({
          type: 'identify',
          userId: this.userId,
          groups: this.groups
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('📤 WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('📨 Received WebSocket message:', data);
    
    switch (data.type) {
      case 'identified':
        console.log('✅ Client identified successfully');
        break;
        
      case 'task_event':
        this.handleTaskEvent(data.data);
        break;
        
      case 'direct_message':
        this.handleDirectMessage(data.data);
        break;
        
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  // Handle task events (claim/unclaim)
  handleTaskEvent(eventData) {
    console.log('📋 Task event received:', eventData);
    
    // Trigger registered event handlers
    const handlers = this.eventHandlers.get('task_event') || [];
    handlers.forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        console.error('❌ Error in task event handler:', error);
      }
    });

    // Show notification if relevant to current user
    if (eventData.userId === this.userId || this.groups.includes(eventData.taskDefinitionKey)) {
      this.showTaskNotification(eventData);
    }
  }

  // Handle direct messages
  handleDirectMessage(messageData) {
    console.log('📧 Direct message received:', messageData);
    
    const handlers = this.eventHandlers.get('direct_message') || [];
    handlers.forEach(handler => {
      try {
        handler(messageData);
      } catch (error) {
        console.error('❌ Error in direct message handler:', error);
      }
    });
  }

  // Show browser notification for task events
  showTaskNotification(eventData) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = eventData.type === 'CLAIMED' ? 'Task Claimed' : 'Task Unclaimed';
      const body = `${eventData.taskName} ${eventData.type.toLowerCase()} by ${eventData.userId}`;
      
      new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: eventData.taskId
      });
    }
  }

  // Send message to server
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  // Register event handler
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  // Remove event handler
  off(eventType, handler) {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.userId, this.groups);
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  // Get connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export for use in Svelte components
export default TaskWebSocketClient;