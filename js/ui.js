function toggleSettingsMenu() {
    const dropdown = document.getElementById('settings-dropdown');
    const chevron = document.getElementById('settings-menu-chevron');
    dropdown.classList.toggle('hidden');
    chevron.style.transform = dropdown.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

function toggleSidebar() { 
    document.getElementById('sidebar').classList.toggle('-translate-x-full'); 
    document.getElementById('sidebar-overlay').classList.toggle('hidden'); 
}

function toggleBookmarks() { 
    const l = document.getElementById('bookmark-list'), c = document.getElementById('bookmark-chevron'); 
    l.classList.toggle('hidden'); 
    c.style.transform = l.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)'; 
}

function appendLoading(customMsg) { 
    const id = 'loader-' + Date.now(), d = document.createElement('div'); 
    d.id = id; d.className = "flex gap-3 sm:gap-4 max-w-4xl mx-auto w-full"; 
    let msg = customMsg || "代理人正忙碌中";
    d.innerHTML = `<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 animate-pulse"><span class="material-symbols-rounded text-white text-[18px] sm:text-xl">hourglass_empty</span></div><div class="pt-1.5 sm:pt-3 flex gap-2 items-center text-gray-500 text-sm sm:text-base italic typing-indicator">${msg}<span></span><span></span><span></span></div>`; 
    chatContainer.appendChild(d); scrollToBottom(); return id; 
}

function removeLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }
function scrollToBottom() { chatContainer.scrollTop = chatContainer.scrollHeight; }

function appendMessage(role, text, imageSrc = null, model = null) {
    const isAI = role === 'ai', w = document.createElement('div'); 
    w.className = `flex gap-3 sm:gap-4 max-w-4xl mx-auto w-full group ${!isAI ? 'flex-row-reverse' : ''}`;
    let b = `<div class="flex-1 ${!isAI ? 'text-right' : ''} space-y-2 max-w-[90%] sm:max-w-[85%] relative min-w-0">`;
    
    if (model && isAI) b += `<div class="text-[10px] text-gray-500 mb-1 ml-1 select-none font-mono">Powered by ${model}</div>`;
    if (imageSrc) b += `<img src="${imageSrc}" class="rounded-xl border border-[#333] mb-2 max-w-full">`;
    if (text) b += `<div class="prose prose-invert text-gray-200 bg-[#1e1f22] p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-sm text-base sm:text-lg leading-relaxed text-left">${isAI ? marked.parse(text) : text.replace(new RegExp('\\n', 'g'), '<br>')}</div>`;
    
    b += `<div class="flex items-center gap-2 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${!isAI ? 'justify-end' : ''}">`;
    if (isAI && text) {
        b += `<button class="copy-btn p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-md" title="複製"><span class="material-symbols-rounded text-[16px] sm:text-[18px]">content_copy</span></button>`;
        b += `<button class="speak-btn p-1.5 text-gray-400 hover:text-green-400 hover:bg-[#333] rounded-md" title="朗讀此訊息"><span class="material-symbols-rounded text-[16px] sm:text-[18px]">volume_up</span></button>`;
    } 
    if (!isAI && text) {
        b += `<button class="edit-btn p-1.5 text-gray-400 hover:text-blue-400 hover:bg-[#333] rounded-md transition-colors" title="編輯並重新生成"><span class="material-symbols-rounded text-[16px] sm:text-[18px]">edit</span></button>`;
    }
    if (text || imageSrc) {
        b += `<button class="delete-btn p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#333] rounded-md transition-colors" title="刪除此訊息"><span class="material-symbols-rounded text-[16px] sm:text-[18px]">delete</span></button>`;
    }
    b += `</div></div>`; 
    
    w.innerHTML = `<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${isAI ? 'bg-blue-600' : 'bg-gray-700'}"><span class="material-symbols-rounded text-white text-[18px] sm:text-xl">${isAI ? 'smart_toy' : 'person'}</span></div>` + b;
    chatContainer.appendChild(w);

    if (isAI) { 
        w.querySelectorAll('pre code').forEach(c => { 
            if (c.className.includes('language-html') || c.className.includes('language-jsx') || c.className.includes('language-javascript')) { 
                let btn = document.createElement('button'); 
                btn.className = "absolute top-2 sm:top-3 right-2 sm:right-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 shadow-lg"; 
                btn.innerHTML = '<span class="material-symbols-rounded text-[12px] sm:text-sm">play_circle</span> 預覽'; 
                btn.onclick = () => openPreview(c.innerText); 
                c.parentElement.appendChild(btn); 
            } 
        }); 
    }
    
    if (isAI && text) { 
        w.querySelector('.copy-btn').onclick = () => navigator.clipboard.writeText(text).then(() => { let ic = w.querySelector('.copy-btn .material-symbols-rounded'); ic.innerText = 'check'; ic.classList.add('text-green-400'); setTimeout(() => { ic.innerText = 'content_copy'; ic.classList.remove('text-green-400'); }, 2000); }); 
        w.querySelector('.speak-btn').onclick = () => speakText(text, false); 
    } 
    
    if (!isAI && text) {
        w.querySelector('.edit-btn').onclick = () => {
            const contentDiv = w.querySelector('.prose');
            const actionsDiv = w.querySelector('.flex.items-center.gap-2.mt-2');
            contentDiv.classList.add('hidden'); actionsDiv.classList.add('hidden');
            
            const editContainer = document.createElement('div');
            editContainer.className = "w-full mt-2 flex flex-col gap-2 text-left";
            let cleanEditText = text.replace(new RegExp('^【使用角色：.*?】\\n'), '').replace(new RegExp('^📎 \\[(?:文件|檔案): .*?\\]\\n'), '').replace(new RegExp('^📺 \\[YouTube 影片\\]\\n'), '');

            editContainer.innerHTML = `
                <textarea class="w-full bg-[#2a2b2f] text-white p-3 rounded-xl border border-blue-500 outline-none resize-y min-h-[100px] text-base leading-relaxed">${cleanEditText}</textarea>
                <div class="flex justify-end gap-2">
                    <button class="cancel-edit-btn px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#333] transition-colors">取消</button>
                    <button class="save-edit-btn px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors shadow-md"><span class="material-symbols-rounded text-[16px]">send</span> 重新發送</button>
                </div>
            `;
            w.querySelector('.flex-1').appendChild(editContainer);
            
            editContainer.querySelector('.cancel-edit-btn').onclick = () => { editContainer.remove(); contentDiv.classList.remove('hidden'); actionsDiv.classList.remove('hidden'); };
            editContainer.querySelector('.save-edit-btn').onclick = () => {
                const newText = editContainer.querySelector('textarea').value.trim();
                if (!newText) return;
                let curr = w;
                while(curr) { let next = curr.nextElementSibling; curr.remove(); curr = next; }
                sendEditAndRegenerate(text, newText); 
            };
        };
    }

    if (w.querySelector('.delete-btn')) {
        w.querySelector('.delete-btn').onclick = () => {
            if (confirm("確定要刪除這則訊息嗎？\n(刪除後系統將徹底忘記這段對話)")) {
                w.remove();
                fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'delete_message', session_id: currentSessionId, target_text: text, target_role: role }) });
            }
        };
    }
    scrollToBottom();
}

function openPreview(code) {
    let rc = code;
    if ((code.includes('export default') || code.includes('import React') || code.includes('className=')) && !(code.trim().toLowerCase().startsWith('<!doctype html') || code.trim().toLowerCase().startsWith('<html'))) {
        let cc = code.replace(new RegExp('import\\s+.*?from\\s+[\'"].*?[\'"];?', 'g'), '').replace(new RegExp('export\\s+default\\s+function', 'g'), 'function');
        let cm = code.replace(new RegExp('import\\s+.*?from\\s+[\'"].*?[\'"];?', 'g'), '').match(new RegExp('export\\s+default\\s+function\\s+([A-Za-z0-9_]+)'));
        rc = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">` + 
             `<script src="https://unpkg.com/react@18/umd/react.production.min.js">\x3C/script>` + 
             `<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js">\x3C/script>` + 
             `<script src="https://unpkg.com/@babel/standalone/babel.min.js">\x3C/script>` + 
             `<script src="https://cdn.tailwindcss.com">\x3C/script>` + 
             `<script src="https://unpkg.com/lucide@latest">\x3C/script>` + 
             `</head><body class="bg-gray-50"><div id="root"></div><script type="text/babel">const { useState, useEffect, useRef, useMemo, useCallback } = React; try { ${cc} const root = ReactDOM.createRoot(document.getElementById('root')); root.render(<${cm ? cm[1] : 'App'} />); setTimeout(() => { if(window.lucide) window.lucide.createIcons(); }, 100); } catch(err) { document.getElementById('root').innerHTML = '<div class="p-4 text-red-700">渲染錯誤:<br>' + err.message + '</div>'; } \x3C/script></body></html>`;
    }
    currentRenderCode = rc; document.getElementById('preview-modal').classList.remove('hidden'); document.getElementById('preview-modal').classList.add('flex'); document.getElementById('preview-iframe').srcdoc = rc;
}

function closePreview() { document.getElementById('preview-modal').classList.add('hidden'); document.getElementById('preview-modal').classList.remove('flex'); document.getElementById('preview-iframe').srcdoc = ''; }
function refreshPreview() { if (currentRenderCode) document.getElementById('preview-iframe').srcdoc = currentRenderCode; }
