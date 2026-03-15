function toggleSendButton(w) { isWaiting = w; sendBtnIcon.innerText = w ? 'stop' : 'send'; sendBtn.className = w ? "p-2.5 sm:p-3 shrink-0 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md flex items-center justify-center" : "p-2.5 sm:p-3 shrink-0 bg-white text-black rounded-xl hover:bg-gray-200 transition-all shadow-md flex items-center justify-center"; sendBtn.onclick = w ? stopGeneration : sendMessage; }
function stopGeneration() { if (abortController) { abortController.abort(); abortController = null; } }

async function sendEditAndRegenerate(oldText, newText) {
    if (isWaiting) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    
    let agp = null, agm = null;
    const gs = document.getElementById('gem-selector');
    const ms = document.getElementById('model-selector');
    
    if (gs.value !== "") { agp = currentGemsList[parseInt(gs.value)].prompt; agm = currentGemsList[parseInt(gs.value)].model; }

    let dMsg = newText;
    if (agp) dMsg = `【使用角色：${currentGemsList[parseInt(gs.value)].name}${agm ? ` (${agm})` : ''}】\n${newText}`;

    appendMessage('user', dMsg, null);
    
    const payload = { 
        mode: 'edit_and_regenerate',
        old_text: oldText,
        message: newText,
        session_id: currentSessionId, 
        file_data: null, mime_type: null, 
        web_search: document.getElementById('web-search-toggle').checked, 
        auto_image: document.getElementById('auto-image-toggle').checked, 
        draw_mode: document.getElementById('draw-mode-toggle').checked, 
        youtube_id: null, 
        gem_prompt: agp, 
        gem_model: agm,
        selected_model: ms.value 
    };
    
    toggleSendButton(true); const lid = appendLoading(); abortController = new AbortController(); 

    try {
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload), signal: abortController.signal });
        const data = await res.json(); removeLoading(lid);
        if (data.status === "error") throw new Error(data.error || "伺服器錯誤");
        if (data.reply) { appendMessage('ai', data.reply, data.image ? `data:${data.mime};base64,${data.image}` : null, data.model); if (!speakText(data.reply, true) && document.getElementById('continuous-mode-toggle').checked) setTimeout(startRecording, 500); }
        loadSessions(); 
    } catch (err) { removeLoading(lid); appendMessage('ai', err.name === 'AbortError' ? `🛑 **生成已中止。**` : `❌ 執行失敗：\n\`\`\`text\n${err.message}\n\`\`\``); } 
    finally { toggleSendButton(false); abortController = null; }
}

async function sendMessage() {
    clearTimeout(silenceTimer); stopRecording(); 
    const text = userInput.value.trim();
    if (!text && !currentImageData && !currentDocumentText && !currentYouTubeId) return;
    if (isWaiting) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 

    let agp = null, agm = null;
    const gs = document.getElementById('gem-selector');
    const ms = document.getElementById('model-selector');
    
    if (gs.value !== "") { agp = currentGemsList[parseInt(gs.value)].prompt; agm = currentGemsList[parseInt(gs.value)].model; }

    let dMsg = text;
    if (currentDocumentName) dMsg = `📎 [文件: ${currentDocumentName}]\n${text}`;
    if (currentYouTubeId) dMsg = `📺 [YouTube 影片]\n${text}`;
    if (agp && !currentDocumentName && !currentYouTubeId) dMsg = `【使用角色：${currentGemsList[parseInt(gs.value)].name}${agm ? ` (${agm})` : ''}】\n${text}`;

    appendMessage('user', dMsg, currentImageData);
    
    let pText = text || "請分析此內容";
    if (currentDocumentText) pText = `【系統強制附加解析好的檔案內容：${currentDocumentName}】\n${currentDocumentText}\n\n---\n使用者的指令：${pText}`;
    else if (currentYouTubeId) pText = `【影片】：https://www.youtube.com/watch?v=${currentYouTubeId}\n\n指令：${pText}`;

    userInput.value = ''; userInput.style.height = 'auto'; finalTranscript = ''; 
    
    const payload = { 
        message: pText, 
        session_id: currentSessionId, 
        file_data: currentImageData ? currentImageData.split(',')[1] : null, 
        mime_type: currentMimeType, 
        web_search: document.getElementById('web-search-toggle').checked, 
        auto_image: document.getElementById('auto-image-toggle').checked, 
        draw_mode: document.getElementById('draw-mode-toggle').checked, 
        youtube_id: currentYouTubeId, 
        gem_prompt: agp, 
        gem_model: agm,
        selected_model: ms.value 
    };
    
    clearUpload(); toggleSendButton(true); const lid = appendLoading(); abortController = new AbortController(); 

    try {
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload), signal: abortController.signal });
        const data = await res.json(); removeLoading(lid);
        if (data.status === "error") throw new Error(data.error || "伺服器錯誤");
        if (data.reply) { appendMessage('ai', data.reply, data.image ? `data:${data.mime};base64,${data.image}` : null, data.model); if (!speakText(data.reply, true) && document.getElementById('continuous-mode-toggle').checked) setTimeout(startRecording, 500); }
        loadSessions(); 
    } catch (err) { removeLoading(lid); appendMessage('ai', err.name === 'AbortError' ? `🛑 **生成已中止。**` : `❌ 執行失敗：\n\`\`\`text\n${err.message}\n\`\`\``); } 
    finally { toggleSendButton(false); abortController = null; }
}

function startNewSession() { currentSessionId = generateUUID(); chatContainer.innerHTML = ''; appendMessage('ai', "您好！已為您開啟新的對話。\n您可以透過下方的「💎 角色選單」切換專長，或使用「🧠 模型選單」自由升降級我的智商大腦！"); if (window.innerWidth < 768) toggleSidebar(); loadSessions(); }
async function switchSession(id, title) { if (id === currentSessionId && chatContainer.children.length > 1) return; currentSessionId = id; document.getElementById('mobile-title').innerText = title; chatContainer.innerHTML = ''; const lid = appendLoading(); if (window.innerWidth < 768) toggleSidebar(); try { const d = await (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'load_session', session_id: id }) })).json(); removeLoading(lid); if (Array.isArray(d.logs)) d.logs.forEach(l => appendMessage(l.role === 'ai' ? 'ai' : 'user', l.text)); loadSessions(); } catch (e) {} }
async function loadGems() { try { const d = await (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'get_gems' }) })).json(); if (d && d.gems) { currentGemsList = d.gems; const s = document.getElementById('gem-selector'); s.innerHTML = '<option value="">🤖 全能助理</option>'; currentGemsList.forEach((g, i) => s.innerHTML += `<option value="${i}">💎 ${g.name}</option>`); } } catch (e) {} }
async function loadModels() { try { const d = await (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'get_models' }) })).json(); const s = document.getElementById('model-selector'); s.innerHTML = '<option value="">🧠 預設模型 (自動)</option>'; if (d && d.models && d.models.length > 0) { d.models.forEach(m => s.innerHTML += `<option value="${m.id}">${m.name}</option>`); } else { s.innerHTML += `<option value="gemini-2.5-flash">⚡ 閃電 (2.5 Flash)</option><option value="gemini-2.5-pro">🧠 專家 (2.5 Pro)</option><option value="gemini-2.0-pro-exp-02-05">💡 實驗 (2.0 Pro Exp)</option>`; } } catch (e) {} }
async function loadSessions() { try { const d = await (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'get_session_list' }) })).json(); const l = document.getElementById('session-list'); l.innerHTML = ''; if (Array.isArray(d.sessions)) d.sessions.forEach(s => { const act = s.id === currentSessionId, pin = s.pinned, i = document.createElement('div'); i.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${act ? 'active-session' : 'text-gray-400 hover:bg-[#2a2b2f] hover:text-white'}`; i.innerHTML = `<div class="flex items-center gap-3 truncate flex-1 min-w-0"><span class="material-symbols-rounded text-lg shrink-0 ${pin ? 'pinned-icon' : ''}">${pin ? 'push_pin' : (act ? 'chat_bubble' : 'chat')}</span><span class="truncate text-sm font-medium tracking-wide">${s.title}</span></div><div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0 ml-2 transition-opacity"><button class="p-1 pin-btn ${pin ? 'text-blue-500' : ''} hover:bg-[#333] rounded-md transition-colors"><span class="material-symbols-rounded text-[16px]">push_pin</span></button><button class="p-1 edit-btn hover:text-blue-400 hover:bg-[#333] rounded-md transition-colors"><span class="material-symbols-rounded text-[16px]">edit</span></button><button class="p-1 del-btn hover:text-red-400 hover:bg-[#333] rounded-md transition-colors"><span class="material-symbols-rounded text-[16px]">delete</span></button></div>`; i.onclick = () => switchSession(s.id, s.title); i.querySelector('.pin-btn').onclick = (e) => { e.stopPropagation(); fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'pin_session', session_id: s.id, is_pinned: !pin }) }).then(loadSessions); }; i.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); const n = prompt("重命名：", s.title); if (n && n.trim()) fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'rename_session', session_id: s.id, new_title: n }) }).then(loadSessions); }; i.querySelector('.del-btn').onclick = (e) => { e.stopPropagation(); if (confirm("確定要刪除嗎？")) fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'delete_session', session_id: s.id }) }).then(() => s.id === currentSessionId ? startNewSession() : loadSessions()); }; l.appendChild(i); }); } catch (e) {} }
