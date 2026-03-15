// ⚠️ 部署後，請確認此處替換為您的 Apps Script Web App URL
const GAS_URL = "[https://script.google.com/macros/s/AKfycbwsng4RBCTX67my46U4fv7BhDYT0CIZt95dL7DNCFJTGUJLZFd_854vRGeUsQ1_BjG9/exec](https://script.google.com/macros/s/AKfycbwsng4RBCTX67my46U4fv7BhDYT0CIZt95dL7DNCFJTGUJLZFd_854vRGeUsQ1_BjG9/exec)";

// 輔助函式：產生 UUID
function generateUUID() { 
    return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, c => (c === 'x' ? (Math.random() * 16 | 0) : (Math.random() * 16 | 0 & 0x3 | 0x8)).toString(16)); 
}

// 系統核心狀態變數
let currentSessionId = generateUUID();
let currentImageData = null, currentMimeType = null, currentDocumentText = null, currentDocumentName = null, currentYouTubeId = null;
let isWaiting = false, currentRenderCode = "", abortController = null, silenceTimer = null, currentGemsList = []; 

// DOM 節點快取
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const sendBtnIcon = sendBtn.querySelector('.material-symbols-rounded');

// Marked.js 渲染器設定 (處理超連結另開視窗)
marked.use({
    renderer: {
        link(hrefOrToken, title, text) {
            let h = hrefOrToken.href || hrefOrToken, t = hrefOrToken.title || title, txt = hrefOrToken.text || text;
            return `<a href="${h}" ${t ? `title="${t}"` : ''} target="_blank" rel="noopener noreferrer">${txt}</a>`;
        }
    }
});
