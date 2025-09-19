# Respondr-AI

## Features

- Clean, minimalist UI with an orange theme
- Real time chat interactions with Respondr AI
- Local storage of API key (client-side only)
- Fully responsive design for all screen sizes
- 911 dispatcher mode for emergencies

## Setup

### Method 1: Direct File Access
1. Clone or download this repository
2. Open `index.html` directly in your web browser
3. Enter your Google Gemini API key

### Method 2: Using Local Server (Recommended)
1. Clone or download this repository
2. Make sure you have Node.js installed
3. Open a terminal in the project directory
4. Run `npm start` to start the local server
5. Open your browser and navigate to `http://localhost:3000`
6. Enter your Google Gemini API key

Get an API key from [Google AI Studio](https://aistudio.google.com/).
Once registered, go to API Keys section to create a new key

## How to Use

1. Enter your Gemini API key in the field at the top of the page and click "Save"
2. Type your message in the text area at the bottom
3. Press Enter or click the send button

## API Key Security

This application stores your API key in your browser's localStorage. The API key is never sent to any server other than Google's API endpoints.

## Requirements

- A modern web browser with JavaScript enabled
- A valid Google Gemini API key

## Technical Details

This application is built with:
- HTML5
- CSS3 with CSS Variables
- Vanilla JavaScript (ES6+)

The app makes requests to Google's Generative Language API:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash
```

## License

MIT License

## Acknowledgements

- Uses [Inter](https://fonts.google.com/specimen/Inter) font from Google Fonts
- Icons designed to resemble Google's Material Design icons 
