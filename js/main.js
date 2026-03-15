// 初始化系統
window.onload = () => { 
    loadSessions(); 
    loadGems(); 
    loadModels(); 
};

// 綁定輸入框自適應高度
userInput.addEventListener('input', function() { 
    this.style.height = 'auto'; 
    this.style.height = (this.scrollHeight > 240 ? 240 : this.scrollHeight) + 'px'; 
});

// 綁定傳送按鈕
sendBtn.onclick = sendMessage;

// 綁定剪貼簿貼上事件 (支援圖片與 YouTube 連結)
userInput.addEventListener('paste', function(e) {
    const pt = (e.clipboardData || window.clipboardData).getData('text');
    const ytMatch = pt.match(new RegExp('(?:youtube\\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\\.be/)([^"&?/\\s]{11})', 'i'));
    if (ytMatch && ytMatch[1]) { e.preventDefault(); currentYouTubeId = ytMatch[1]; document.getElementById('yt-thumbnail').src = `https://img.youtube.com/vi/${currentYouTubeId}/mqdefault.jpg`; document.getElementById('youtube-preview').classList.remove('hidden'); document.getElementById('image-preview').classList.add('hidden'); document.getElementById('doc-preview').classList.add('hidden'); document.getElementById('upload-preview-container').classList.remove('hidden'); document.getElementById('web-search-toggle').checked = true; return; }
    if (e.clipboardData && e.clipboardData.items) { for (let i = 0; i < e.clipboardData.items.length; i++) { if (e.clipboardData.items[i].type.indexOf('image') !== -1) { e.preventDefault(); const file = e.clipboardData.items[i].getAsFile(), reader = new FileReader(); reader.onload = (ev) => { currentImageData = ev.target.result; currentMimeType = file.type; document.getElementById('image-preview').src = currentImageData; document.getElementById('image-preview').classList.remove('hidden'); document.getElementById('doc-preview').classList.add('hidden'); document.getElementById('youtube-preview').classList.add('hidden'); document.getElementById('upload-preview-container').classList.remove('hidden'); }; reader.readAsDataURL(file); return; } } }
    if (pt && pt.startsWith('data:image/')) { e.preventDefault(); currentImageData = pt; const m = pt.match(new RegExp('data:(.*?);')); currentMimeType = m ? m[1] : 'image/png'; document.getElementById('image-preview').src = currentImageData; document.getElementById('image-preview').classList.remove('hidden'); document.getElementById('doc-preview').classList.add('hidden'); document.getElementById('youtube-preview').classList.add('hidden'); document.getElementById('upload-preview-container').classList.remove('hidden'); }
    setTimeout(() => { userInput.style.height = 'auto'; userInput.style.height = (userInput.scrollHeight > 240 ? 240 : userInput.scrollHeight) + 'px'; }, 0);
});

// 綁定鍵盤送出事件
userInput.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
        if (window.innerWidth < 768) return; 
        e.preventDefault(); 
        isWaiting ? stopGeneration() : sendMessage(); 
    } 
});

// 點擊空白處關閉選單
document.addEventListener('click', (e) => {
    const btn = document.getElementById('settings-menu-btn'), dropdown = document.getElementById('settings-dropdown');
    if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) { 
        dropdown.classList.add('hidden'); 
        document.getElementById('settings-menu-chevron').style.transform = 'rotate(0deg)'; 
    }
});

// 側邊欄拖曳調整大小 (Resizer)
const sidebarDom = document.getElementById('sidebar');
const resizerDom = document.getElementById('sidebar-resizer');
window.isResizing = false;
if (resizerDom) resizerDom.addEventListener('mousedown', () => { window.isResizing = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
document.addEventListener('mousemove', (e) => { if (!window.isResizing || window.innerWidth < 768) return; let nw = Math.max(200, Math.min(e.clientX, window.innerWidth * 0.5)); if (sidebarDom) sidebarDom.style.width = nw + 'px'; });
document.addEventListener('mouseup', () => { if(window.isResizing){ window.isResizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; } });
window.addEventListener('resize', () => { if (window.innerWidth < 768) { if (sidebarDom) sidebarDom.style.width = ''; } });
