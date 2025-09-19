// DOM Elements
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatHistory = document.getElementById('chat-history');
const newChatButton = document.getElementById('new-chat');

// State variables
let apiKey = localStorage.getItem('respondr_api_key') || '';
let isProcessingMessage = false;
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('respondr_chats') || '[]');
let isEmergencyMode = false;
let isDarkTheme = localStorage.getItem('respondr_theme') !== 'light';

// Initialize the application
function init() {
    // Check if we have a saved API key
    if (apiKey) {
        apiKeyInput.value = '••••••••••••••••••';
        sendButton.disabled = false;
    }

    // Apply saved theme
    applyTheme();

    // Add theme toggle to header
    addThemeToggle();

    // Add ripple effect to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // Set up event listeners
    saveApiKeyButton.addEventListener('click', saveApiKey);
    userInput.addEventListener('keydown', handleInputKeydown);
    sendButton.addEventListener('click', sendMessage);
    newChatButton.addEventListener('click', createNewChat);
    
    // Create toggle sidebar button for mobile
    createToggleSidebarButton();
    
    // Load chat history
    loadChatHistory();
    
    // Reset any fade-out classes on welcome elements to ensure animations always run
    setTimeout(() => {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.classList.remove('fade-out');
            const stars = document.querySelectorAll('.welcome-star');
            stars.forEach(star => {
                star.style.display = '';
                star.style.opacity = '';
            });
            
            // If this is a new session with no messages yet, show the greeting
            if (currentChatId) {
                const currentChat = chats.find(chat => chat.id === currentChatId);
                if (currentChat && currentChat.messages.length === 0) {
                    // Add greeting message from AI
                    setTimeout(() => {
                        const greetingMessage = "Hi there! I'm Respondr, your AI assistant. How can I help you today?";
                        addMessageToChat('ai', greetingMessage);
                    }, 1000);
                }
            }
        }
    }, 100);
    
    // Auto-expand textarea as user types
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        // Limit max height
        if (this.scrollHeight > 120) {
            this.style.height = '120px';
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
}

// Create toggle sidebar button for mobile
function createToggleSidebarButton() {
    const toggleButton = document.createElement('div');
    toggleButton.classList.add('toggle-sidebar');
    toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    `;
    document.body.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });
}

// Create ripple effect
function createRipple(event) {
    if (this.disabled) return;
    
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`;
    circle.classList.add("ripple");
    
    const ripple = button.querySelector(".ripple");
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
}

// Load chat history from localStorage
function loadChatHistory() {
    if (chats.length === 0) {
        chatHistory.innerHTML = '<p class="no-history">No chat history yet</p>';
        createNewChat(); // Create a first chat automatically
        return;
    }
    
    chatHistory.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.dataset.id = chat.id;
        
        // Determine chat title from first message or use default
        let chatTitle = "New Chat";
        if (chat.messages.length > 0) {
            // Get first user message
            const firstUserMsg = chat.messages.find(msg => msg.sender === 'user');
            if (firstUserMsg) {
                chatTitle = firstUserMsg.text.substring(0, 25) + (firstUserMsg.text.length > 25 ? '...' : '');
            }
        }
        
        chatItem.innerHTML = `
            <div class="chat-item-content">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="chat-title">${chatTitle}</span>
            </div>
            <button class="delete-chat" data-id="${chat.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        
        // Add click handler for the chat item
        chatItem.querySelector('.chat-item-content').addEventListener('click', () => {
            loadChat(chat.id);
        });
        
        // Add click handler for the delete button
        chatItem.querySelector('.delete-chat').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering chat selection
            deleteChat(chat.id);
        });
        
        // Mark current chat as active
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatHistory.appendChild(chatItem);
    });
}

// Delete a chat
function deleteChat(chatId) {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this chat?')) {
        return;
    }
    
    // Remove the chat from the array
    chats = chats.filter(chat => chat.id !== chatId);
    
    // Save to localStorage
    localStorage.setItem('respondr_chats', JSON.stringify(chats));
    
    // If we deleted the current chat, create a new one
    if (chatId === currentChatId) {
        createNewChat();
    } else {
        // Otherwise just refresh the chat history
        loadChatHistory();
    }
}

// Create a new chat
function createNewChat() {
    const newChatId = Date.now().toString();
    const newChat = {
        id: newChatId,
        messages: []
    };
    
    chats.unshift(newChat); // Add to the beginning
    localStorage.setItem('respondr_chats', JSON.stringify(chats));
    currentChatId = newChatId;
    
    // Exit emergency mode if active
    if (isEmergencyMode) {
        toggleEmergencyMode(false);
    }
    
    loadChatHistory();
    
    // Clear the chat container
    chatContainer.innerHTML = `
        <div class="welcome-message">
            <h2>
                Welcome to <span class="animated-gradient">
                    Respondr
                    <div class="welcome-star star1"></div>
                    <div class="welcome-star star2"></div>
                    <div class="welcome-star star3"></div>
                    <div class="welcome-star star4"></div>
                    <div class="welcome-star star5"></div>
                    <div class="welcome-star star6"></div>
                    <div class="welcome-star star7"></div>
                    <div class="welcome-star star8"></div>
                </span>
            </h2>
        </div>
    `;
    
    // Ensure animations are always visible when creating a new chat
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.classList.remove('fade-out');
        const stars = document.querySelectorAll('.welcome-star');
        stars.forEach(star => {
            star.style.display = '';
            star.style.opacity = '';
        });
    }
    
    // Add greeting message from AI after a short delay
    setTimeout(() => {
        const greetingMessage = "Hi there! I'm Respondr, your AI assistant. How can I help you today?";
        addMessageToChat('ai', greetingMessage);
    }, 1000);
}

// Load a specific chat
function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    
    // Exit emergency mode if active
    if (isEmergencyMode) {
        toggleEmergencyMode(false);
    }
    
    // Update active state in sidebar
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === chatId) {
            item.classList.add('active');
        }
    });
    
    // Clear the chat container
    chatContainer.innerHTML = '';
    
    // If this chat has no messages, show welcome message
    if (chat.messages.length === 0) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.classList.add('welcome-message');
        welcomeMessage.innerHTML = `
            <h2>
                Welcome to <span class="animated-gradient">
                    Respondr
                    <div class="welcome-star star1"></div>
                    <div class="welcome-star star2"></div>
                    <div class="welcome-star star3"></div>
                    <div class="welcome-star star4"></div>
                    <div class="welcome-star star5"></div>
                    <div class="welcome-star star6"></div>
                    <div class="welcome-star star7"></div>
                    <div class="welcome-star star8"></div>
                </span>
            </h2>
        `;
        chatContainer.appendChild(welcomeMessage);
        
        // Ensure animations are visible for the welcome message
        welcomeMessage.classList.remove('fade-out');
        const stars = welcomeMessage.querySelectorAll('.welcome-star');
        stars.forEach(star => {
            star.style.display = '';
            star.style.opacity = '';
        });
        
        // Add greeting message from AI after a short delay
        setTimeout(() => {
            const greetingMessage = "Hi there! I'm Respondr, your AI assistant. How can I help you today?";
            addMessageToChat('ai', greetingMessage);
        }, 1000);
        
        return;
    }
    
    // Display all messages in this chat
    chat.messages.forEach(message => {
        addMessageToChat(message.sender, message.text, false); // Don't save to avoid duplication
    });
}

// Toggle emergency mode
function toggleEmergencyMode(active) {
    isEmergencyMode = active;
    document.body.classList.toggle('emergency-mode', active);
    
    // Update UI to reflect mode change
    const header = document.querySelector('header');
    if (active) {
        header.setAttribute('data-mode', 'emergency');
    } else {
        header.removeAttribute('data-mode');
        
        // Remove emergency phone icons from all AI messages
        document.querySelectorAll('.emergency-phone-icon').forEach(icon => {
            icon.remove();
        });
    }
}

// Get a realistic 911 dispatcher response
function getDispatcherResponse(userMessage) {
    // Convert message to lowercase for easier matching
    const message = userMessage.toLowerCase();
    
    // Track information mentioned in the message
    const mentionsLocation = message.includes('at') || message.includes('in') || message.includes('near') || message.includes('by') || message.includes('street') || message.includes('avenue') || message.includes('road');
    const mentionsInjury = message.includes('hurt') || message.includes('injured') || message.includes('bleeding') || message.includes('pain') || message.includes('fell') || message.includes('accident');
    const mentionsFire = message.includes('fire') || message.includes('burning') || message.includes('smoke') || message.includes('flames');
    const mentionsCrime = message.includes('robbery') || message.includes('stolen') || message.includes('theft') || message.includes('break in') || message.includes('broke into') || message.includes('attack') || message.includes('gun') || message.includes('weapon');
    const mentionsMedical = message.includes('heart') || message.includes('breathing') || message.includes('unconscious') || message.includes('passed out') || message.includes('not responding');
    
    // Check if this is the first response (general information gathering)
    if (!mentionsLocation) {
        return "I need to know your exact location. What's the address or cross streets where you need assistance?";
    }
    
    // Responses based on emergency type
    if (mentionsFire) {
        return "I understand there's a fire at your location. Is everyone safely out of the building? Are there any visible flames or just smoke? I'm dispatching fire services to your location now.";
    } else if (mentionsCrime) {
        return "I understand there's a crime situation. Are you in a safe location right now? Are there any weapons involved? I'm sending officers to your location immediately. Try to stay on the line if it's safe to do so.";
    } else if (mentionsMedical) {
        return "I'm sending medical assistance to your location right away. Is the person conscious? Are they breathing normally? Have they had any previous medical conditions that you're aware of?";
    } else if (mentionsInjury) {
        return "I understand someone is injured. Can you describe the injury? Is there severe bleeding? Is the person conscious and breathing? I'm sending medical assistance to your location now.";
    } else {
        // Generic follow-up questions if we can't determine the emergency type
        return "Thank you for that information. Can you tell me more about the emergency situation? Are there any injuries? Is anyone in immediate danger? Emergency services are being dispatched to your location.";
    }
}

// Save the API key
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    
    if (newApiKey === '') {
        alert('Please enter a valid API key');
        return;
    }
    
    // Test the API key with a simple request
    testApiKey(newApiKey).then(isValid => {
        if (isValid) {
            apiKey = newApiKey;
            localStorage.setItem('respondr_api_key', apiKey);
            apiKeyInput.value = '••••••••••••••••••';
            sendButton.disabled = false;
            
            // Clear welcome message if present
            if (document.querySelector('.welcome-message')) {
                chatContainer.innerHTML = '';
            }
            
            // Show success message
            showSystemMessage('API key saved successfully');
            
            // Make sure we have a current chat
            if (!currentChatId) {
                createNewChat();
            }
        } else {
            alert('Invalid API key. Please check and try again.');
        }
    });
}

// Test if API key is valid
async function testApiKey(key) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello" }]
                }]
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error testing API key:', error);
        return false;
    }
}

// Handle sending messages when Enter is pressed (without shift)
function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Handle 911 emergency mode
function handle911Emergency() {
    // Enter emergency mode UI with a smooth transition
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    
    // Create transition effect
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
    overlay.style.zIndex = '100';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.8s ease';
    document.body.appendChild(overlay);

    // Trigger the flash effect
    setTimeout(() => {
        overlay.style.opacity = '0.5';
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 800);
        }, 200);
    }, 10);
    
    // Enter emergency mode
    toggleEmergencyMode(true);
    
    // Show loading message
    const loadingMsg = 'Calling 911...';
    addSystemMessage(loadingMsg);
    
    // Wait 2 seconds to simulate a call connecting
    setTimeout(() => {
        // Remove loading message
        document.querySelector('.system-message')?.remove();
        
        // Add connection notification
        addSystemMessage('Connected to 911 emergency services. Type "end" to terminate the call.', true);
        
        // Add the emergency response with typing indicator
        setTimeout(() => {
            // Show typing indicator first
            const loadingIndicator = addLoadingIndicator();
            
            // Then display the message after a brief delay
                            setTimeout(() => {
                loadingIndicator.remove();
                const emergencyResponse = '911, what\'s your emergency? Please state your location and the nature of your emergency.';
                addMessageToChat('ai', emergencyResponse);
            }, 1000);
        }, 500);
    }, 2000);
}

// Show a system message differently than normal messages
function addSystemMessage(message, persistent = false) {
    const systemMsgDiv = document.createElement('div');
    systemMsgDiv.classList.add('system-message');
    if (persistent) {
        systemMsgDiv.classList.add('persistent');
    }
    systemMsgDiv.textContent = message;
    chatContainer.appendChild(systemMsgDiv);
    
    // Scroll to the new message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message to the Gemini API
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (message === '' || !apiKey || isProcessingMessage) {
        return;
    }
    
    // Make sure we have a current chat
    if (!currentChatId) {
        createNewChat();
    }
    
    isProcessingMessage = true;
    
    // Clear the input and reset its height
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Fade out welcome elements if this is the first message
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.classList.add('fade-out');
        // Optionally remove stars after animation completes
        setTimeout(() => {
            const stars = document.querySelectorAll('.welcome-star');
            stars.forEach(star => star.style.display = 'none');
        }, 500);
    }
    
    // Display user message in the chat
    addMessageToChat('user', message);
    
    // Check if user wants to exit emergency mode
    if (isEmergencyMode && message.toLowerCase().includes('end')) {
        // Create transition effect for ending the call
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        overlay.style.zIndex = '100';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.8s ease';
        document.body.appendChild(overlay);

        // Show loading indicator
        const loadingIndicator = addLoadingIndicator();
        
        // Trigger the transition effect
        setTimeout(() => {
            overlay.style.opacity = '0.5';
            setTimeout(() => {
                // Remove loading indicator
                loadingIndicator.remove();
                
                // Exit emergency mode
                toggleEmergencyMode(false);
                
                // Show end call message
                addSystemMessage('911 emergency call ended', true);
                
                // Fade out overlay
                overlay.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    
                    // Add a confirmation message from the AI
                    setTimeout(() => {
                        addMessageToChat('ai', 'The emergency call has been terminated. Emergency services have been notified of your situation. How can I assist you with anything else today?');
                    }, 300);
                }, 600);
            }, 800);
        }, 10);
        
        isProcessingMessage = false;
        return;
    }
    
    // Handle emergency mode conversation with realistic dispatcher responses
    if (isEmergencyMode) {
        // Show typing indicator
        const loadingIndicator = addLoadingIndicator();
        
        setTimeout(() => {
            loadingIndicator.remove();
            
            // Generate dispatcher-like response based on message content
            let dispatcherResponse = getDispatcherResponse(message);
            addMessageToChat('ai', dispatcherResponse);
        }, 1000);
        
        isProcessingMessage = false;
        return;
    }
    
    // Check if this is a 911 emergency message
    if (message.includes('911')) {
        handle911Emergency();
        isProcessingMessage = false;
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = addLoadingIndicator();
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });
        
        // Remove loading indicator
        loadingIndicator.remove();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Unknown error');
        }
        
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Respondr';
        
        // Display AI response with a slight delay for natural feel
        setTimeout(() => {
            addMessageToChat('ai', aiResponse);
            
            // Update chat history if it's the first message
            const chat = chats.find(c => c.id === currentChatId);
            if (chat && chat.messages.length <= 2) {
                loadChatHistory();
            }
        }, 300);
        
    } catch (error) {
        // Remove loading indicator
        loadingIndicator.remove();
        
        console.error('Error:', error);
        showSystemMessage(`Error: ${error.message}`);
    } finally {
        isProcessingMessage = false;
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Format message text with markdown-like syntax
function formatMessageText(text, isBotMessage) {
    let formattedText = text;
    
    // Replace code blocks with formatted HTML
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre>${code.trim()}</pre>`;
    });
    
    // Apply most formatting rules to both user and AI messages
    // Bold text (text between asterisks)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    // Italic text
    formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Additional formatting only for AI messages
    if (isBotMessage) {
        // Bullet points
        formattedText = formattedText.replace(/^- (.*)$/gm, '<li>$1</li>');
        formattedText = formattedText.replace(/<li>(.*?)<\/li>(\n|$)+/g, '<ul><li>$1</li>$2</ul>');
        
        // Headers
        formattedText = formattedText.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
        formattedText = formattedText.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
        formattedText = formattedText.replace(/^# (.*?)$/gm, '<h2>$1</h2>');
    }
    
    // Replace newlines with <br> tags
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
}

// Add a message to the chat
function addMessageToChat(sender, message, saveToHistory = true) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    // Format the message text differently based on sender
    const isBotMessage = sender === 'ai';
    const formattedMessage = formatMessageText(message, isBotMessage);
    
    // Create avatar element
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    
    // Add favicon logo for AI messages
    if (sender === 'ai') {
        avatarDiv.innerHTML = `<div class="r-logo">R</div>`;
    }
    
    // Create message content container
    const messageContentDiv = document.createElement('div');
    messageContentDiv.classList.add('message-content');
    
    // Add content to message
    messageContentDiv.innerHTML = formattedMessage;
    
    // Add phone icon for AI messages in emergency mode
    if (isEmergencyMode && isBotMessage) {
        const phoneIcon = document.createElement('div');
        phoneIcon.classList.add('emergency-phone-icon');
        phoneIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
        `;
        messageDiv.appendChild(phoneIcon);
    }
    
    // Append avatar and message content
    if (sender === 'ai') {
        messageDiv.appendChild(avatarDiv);
    }
    messageDiv.appendChild(messageContentDiv);
    
    // Add action buttons for AI messages - added after message content
    if (sender === 'ai') {
        // Create actions wrapper div
        const actionsWrapper = document.createElement('div');
        actionsWrapper.classList.add('message-actions');
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.title = "Copy message";
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        
        // Add click handler for copy button
        copyButton.addEventListener('click', () => {
            const textToCopy = message;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyButton.classList.add('copied');
                copyButton.title = "Copied!";
                
                setTimeout(() => {
                    copyButton.classList.remove('copied');
                    copyButton.title = "Copy message";
                }, 1500);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        });
        
        // Create thumbs up button (for visual completeness, non-functional)
        const thumbsUpButton = document.createElement('button');
        thumbsUpButton.classList.add('copy-button');
        thumbsUpButton.title = "Thumbs up";
        thumbsUpButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
        `;
        
        // Create thumbs down button (for visual completeness, non-functional)
        const thumbsDownButton = document.createElement('button');
        thumbsDownButton.classList.add('copy-button');
        thumbsDownButton.title = "Thumbs down";
        thumbsDownButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
            </svg>
        `;
        
        // Add all buttons to wrapper, then wrapper to message
        actionsWrapper.appendChild(copyButton);
        actionsWrapper.appendChild(thumbsUpButton);
        actionsWrapper.appendChild(thumbsDownButton);
        
        messageDiv.appendChild(actionsWrapper);
    }
    
    // Only add the message div to container once
    chatContainer.appendChild(messageDiv);
    
    // Add staggered animation delay based on message position
    const messages = document.querySelectorAll(`.${sender}-message`);
    const index = messages.length - 1;
    messageDiv.style.animationDelay = `${index * 0.1}s`;
    
    // Save to chat history if needed
    if (saveToHistory && currentChatId) {
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        if (chatIndex !== -1) {
            chats[chatIndex].messages.push({
                sender,
                text: message,
                timestamp: Date.now()
            });
            localStorage.setItem('respondr_chats', JSON.stringify(chats));
        }
    }
    
    // Scroll to the new message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show a system message
function showSystemMessage(message) {
    const systemMessage = document.createElement('div');
    systemMessage.classList.add('message', 'system-message');
    systemMessage.textContent = message;
    chatContainer.appendChild(systemMessage);
}

// Add loading indicator
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading-indicator');
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        loadingDiv.appendChild(dot);
    }
    
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return loadingDiv;
}

// Add theme toggle button
function addThemeToggle() {
    // Create the theme toggle button
    const themeToggle = document.createElement('div');
    themeToggle.classList.add('theme-toggle');
    themeToggle.innerHTML = isDarkTheme ? 
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>` : 
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
    
    // Add event listener for theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add the toggle button to the body
    document.body.appendChild(themeToggle);
}

// Apply the current theme
function applyTheme() {
    if (isDarkTheme) {
        document.documentElement.classList.remove('light-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.documentElement.classList.add('light-theme');
        document.body.classList.add('light-theme');
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    // Save theme preference
    localStorage.setItem('respondr_theme', isDarkTheme ? 'dark' : 'light');
    
    // Apply the theme
    applyTheme();
    
    // Update the theme toggle icon
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = isDarkTheme ? 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>` : 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>`;
        
        // Add a small animation effect to the toggle
        themeToggle.classList.add('toggling');
        setTimeout(() => {
            themeToggle.classList.remove('toggling');
        }, 300);
    }
    
    // Show a system message indicating theme change
    showSystemMessage(`Switched to ${isDarkTheme ? 'dark' : 'light'} theme`);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 