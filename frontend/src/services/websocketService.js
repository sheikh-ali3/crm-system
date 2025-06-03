class WebSocketService {
  constructor() {
    this.ws = null;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Use the API URL for WebSocket connection
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws?token=' + token;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);
        const handlers = this.eventHandlers.get(eventName) || [];
        handlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
        this.reconnectDelay *= 2; // Exponential backoff
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  unsubscribe(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

export default new WebSocketService(); 