// Import configuration
import AUTH_CONFIG from './config.js';

// DOM Elements
const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const loginForm = document.getElementById('loginForm');
const chatInput = document.getElementById('chatInput');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const loginError = document.getElementById('loginError');

// API Configuration
const API_BASE_URL = 'https://ats-chatbot-rajgoaj.replit.app/; // Change this to your API URL
let authToken = null;

// Event Listeners
chatBubble.addEventListener('click', handleChatBubbleClick);
closeChat.addEventListener('click', toggleChatWindow);
sendMessage.addEventListener('click', sendUserMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendUserMessage();
    }
});

// Functions
async function handleChatBubbleClick() {
    toggleChatWindow();
    
    // If the chat window is now active and we don't have an auth token, authenticate
    if (chatWindow.classList.contains('active') && !authToken) {
        await autoAuthenticate();
    }
}

function toggleChatWindow() {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
        chatWindow.style.display = 'flex';
    } else {
        chatWindow.style.display = 'none';
    }
}

async function autoAuthenticate() {
    // Hide login form and show loading message
    loginForm.style.display = 'none';
    
    // Add system message
    addBotMessage('Connecting to the server...');
    
    try {
        await handleLogin(AUTH_CONFIG.username, AUTH_CONFIG.password);
    } catch (error) {
        // If auto-authentication fails, show the error and the login form
        addBotMessage(`Authentication failed: ${error.message}. Please contact support.`);
    }
}

async function handleLogin(user, pass) {
    if (!user || !pass) {
        throw new Error('Username and password are required');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                password: pass
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Authentication failed');
        }
        
        // Store the token
        authToken = data.access_token;
        
        // Hide login form and show chat input
        loginForm.style.display = 'none';
        chatInput.style.display = 'flex';
        
        // Add system message
        addBotMessage('Connected! You can now send messages.');
        
    } catch (error) {
        throw new Error(error.message || 'Login failed. Please try again.');
    }
}

function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    messageElement.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot';
    messageElement.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicator;
}

async function sendUserMessage() {
    const message = messageInput.value.trim();
    
    if (!message || !authToken) {
        return;
    }
    
    // Add user message to chat
    addUserMessage(message);
    
    // Clear input
    messageInput.value = '';
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                query: message
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to get response');
        }
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add bot response
        addBotMessage(data.results || 'I received your message, but I\'m not sure how to respond.');
        
    } catch (error) {
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add error message
        addBotMessage(`Error: ${error.message || 'Something went wrong. Please try again.'}`);
    }
}

// Initialize - make sure chat window is hidden on load
window.addEventListener('DOMContentLoaded', () => {
    chatWindow.style.display = 'none';
    
    // Hide login form by default since we're using auto-authentication
    loginForm.style.display = 'none';
});
