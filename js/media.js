let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'cmn-Hant-TW'; 
    recognition.onstart = function() { 
        isRecording = true; 
        document.getElementById('mic-btn').classList.add('recording-pulse', 'text-white'); 
        document.getElementById('mic-btn').classList.remove('text-gray-400'); 
        finalTranscript = userInput.value; 
        if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    };
    recognition.onresult = function(event) {
        if (!isRecording) return; let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) event.results[i].isFinal ? finalTranscript += event.results[i][0].transcript : interim += event.results[i][0].transcript;
        userInput.value = finalTranscript + interim; userInput.style.height = 'auto'; userInput.style.height = (userInput.scrollHeight > 240 ? 240 : userInput.scrollHeight) + 'px';
        if (document.getElementById('continuous-mode-toggle').checked) { clearTimeout(silenceTimer); silenceTimer = setTimeout(() => { if (isRecording && userInput.value.trim() !== '') { stopRecording(); sendMessage(); } }, 1500); }
    };
    recognition.onerror = () => stopRecording(); recognition.onend = () => stopRecording();
}

function startRecording() { if (!recognition) return; if (!isRecording) { isRecording = true; finalTranscript = userInput.value; try { recognition.start(); } catch(e) { isRecording = false; } } }
function toggleRecording() { if (!recognition) { alert('瀏覽器不支援語音輸入。'); return; } isRecording ? stopRecording() : startRecording(); }
function stopRecording() { isRecording = false; clearTimeout(silenceTimer); document.getElementById('mic-btn').classList.remove('recording-pulse', 'text-white'); document.getElementById('mic-btn').classList.add('text-gray-400'); if (recognition) try { recognition.stop(); } catch(e) {} }

function speakText(text, isAutoPlay = false) {
    if (isAutoPlay && !document.getElementById('voice-output-toggle').checked) return false;
    if (!window.speechSynthesis) return false; window.speechSynthesis.cancel(); 
    const bt = String.fromCharCode(96, 96, 96);
    let cleanText = text.replace(new RegExp(bt + '[\\s\\S]*?' + bt, 'g'), '').replace(new RegExp('https?:\\/\\/[^\\s]+', 'g'), '網址').replace(new RegExp('[*_#~|]', 'g'), '').trim();
    if (!cleanText) return false;
    let utterance = new SpeechSynthesisUtterance(cleanText);
    let v = window.speechSynthesis.getVoices(), sv = null;
    if (new RegExp('[\\u4e00-\\u9fa5]').test(cleanText)) { utterance.lang = 'zh-TW'; utterance.rate = 0.95; utterance.pitch = 0.95; sv = v.find(x => x.name.includes('Xiaoxiao') || x.name.includes('Yating') || (x.lang === 'zh-TW' && x.name.includes('Google'))) || v.find(x => x.lang === 'zh-TW'); } 
    else { utterance.lang = 'en-US'; utterance.rate = 0.9; utterance.pitch = 0.95; sv = v.find(x => x.name.includes('Samantha') || (x.lang === 'en-US' && x.name.includes('Google'))) || v.find(x => x.lang === 'en-US'); }
    if (sv) utterance.voice = sv;
    if (isAutoPlay) utterance.onend = () => { if (document.getElementById('continuous-mode-toggle').checked && !isWaiting) startRecording(); };
    window.speechSynthesis.speak(utterance); return true;
}
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();


6. js/parser.js (檔案與簡報解析)

延遲載入 (Lazy Load) 解析引擎並處理本機預處理。

let pdfjsLibLoaded = false, mammothLoaded = false, xlsxLoaded = false, jszipLoaded = false;
async function loadPdfJs() { if(pdfjsLibLoaded) return; return new Promise((r, j) => { let s = document.createElement('script'); s.src = "[https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js)"; s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = '[https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js)'; pdfjsLibLoaded = true; r(); }; s.onerror = j; document.head.appendChild(s); }); }
async function loadMammoth() { if(mammothLoaded) return; return new Promise((r, j) => { let s = document.createElement('script'); s.src = "[https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js](https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js)"; s.onload = () => { mammothLoaded = true; r(); }; s.onerror = j; document.head.appendChild(s); }); }
async function loadXlsx() { if(xlsxLoaded) return; return new Promise((r, j) => { let s = document.createElement('script'); s.src = "[https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js](https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js)"; s.onload = () => { xlsxLoaded = true; r(); }; s.onerror = j; document.head.appendChild(s); }); }
async function loadJszip() { if(jszipLoaded) return; return new Promise((r, j) => { let s = document.createElement('script'); s.src = "[https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js)"; s.onload = () => { jszipLoaded = true; r(); }; s.onerror = j; document.head.appendChild(s); }); }

async function handleFileUpload(e) {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader(), ext = f.name.split('.').pop().toLowerCase();
    
    if (f.type.startsWith('image/')) { r.onload = (ev) => { currentImageData = ev.target.result; currentMimeType = f.type; document.getElementById('image-preview').src = currentImageData; document.getElementById('image-preview').classList.remove('hidden'); document.getElementById('doc-preview').classList.add('hidden'); document.getElementById('youtube-preview').classList.add('hidden'); document.getElementById('upload-preview-container').classList.remove('hidden'); }; r.readAsDataURL(f); } 
    else if (f.type === 'application/pdf' || ext === 'pdf') { const lid = appendLoading(); try { await loadPdfJs(); r.onload = async (ev) => { try { const pdf = await pdfjsLib.getDocument(new Uint8Array(ev.target.result)).promise; let t = ""; for (let i=1; i<=pdf.numPages; i++) t += (await (await pdf.getPage(i)).getTextContent()).items.map(s => s.str).join(' ') + "\n"; setDocPayload(f.name, t); } catch (err) { alert("PDF 解析失敗"); } finally { removeLoading(lid); } }; r.readAsArrayBuffer(f); } catch (err) { removeLoading(lid); alert("載入 PDF 引擎失敗"); } } 
    else if (ext === 'docx') { const lid = appendLoading(); try { await loadMammoth(); r.onload = async (ev) => { try { setDocPayload(f.name, (await mammoth.extractRawText({ arrayBuffer: ev.target.result })).value); } catch(err) { alert("Word 解析失敗"); } finally { removeLoading(lid); } }; r.readAsArrayBuffer(f); } catch (err) { removeLoading(lid); alert("載入 Word 引擎失敗"); } } 
    else if (ext === 'xlsx' || ext === 'csv') { const lid = appendLoading(); try { await loadXlsx(); r.onload = (ev) => { try { const wb = XLSX.read(ev.target.result, { type: 'array' }); let t = ""; wb.SheetNames.forEach(n => { t += `\n--- 表單: ${n} ---\n`; let c = XLSX.utils.sheet_to_csv(wb.Sheets[n]); t += c.length > 500000 ? c.substring(0, 500000) + "\n...[截斷]..." : c; }); setDocPayload(f.name, t); } catch(err) { alert("Excel 解析失敗"); } finally { removeLoading(lid); } }; r.readAsArrayBuffer(f); } catch (err) { removeLoading(lid); alert("載入 Excel 引擎失敗"); } } 
    else if (ext === 'pptx') { 
        const lid = appendLoading("正在解析簡報檔..."); 
        if (f.size < 5 * 1024 * 1024) { 
            try {
                r.onload = async (ev) => {
                    try {
                        const base64Data = ev.target.result.split(',')[1];
                        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ mode: 'system', action: 'parse_pptx', file_name: f.name, file_data: base64Data }) });
                        const data = await res.json();
                        if (data.status === 'success') { setDocPayload(f.name, data.text); } else { throw new Error(data.message || "雲端轉檔失敗"); }
                    } catch (err) {
                        console.warn("雲端 PPTX 解析失敗，啟動備用引擎...", err);
                        fallbackJSZipParse(f, ev.target.result.split(',')[1], true, lid);
                    } finally { removeLoading(lid); }
                };
                r.readAsDataURL(f);
            } catch (err) { removeLoading(lid); }
        } else {
            try { r.onload = (ev) => fallbackJSZipParse(f, ev.target.result, false, lid); r.readAsArrayBuffer(f); } catch (err) { removeLoading(lid); }
        }
    } 
    else { r.onload = (ev) => setDocPayload(f.name, ev.target.result); r.readAsText(f); }
}

async function fallbackJSZipParse(fileObj, fileData, isBase64, loaderId) {
    try { 
        await loadJszip(); 
        const zip = await (new JSZip()).loadAsync(fileData, isBase64 ? { base64: true } : {}); 
        let t = `【系統解析：簡報檔名 ${fileObj.name} (啟動本機輕量模式)】\n\n`; 
        const sFiles = Object.keys(zip.files).filter(n => n.match(/^ppt\/slides\/slide\d+\.xml$/)).sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1]) - parseInt(b.match(/(\d+)\.xml$/)[1]));
        const nFiles = Object.keys(zip.files).filter(n => n.match(/^ppt\/notesSlides\/notesSlide\d+\.xml$/));
        const parser = new DOMParser(); 
        
        for (const p of sFiles) { 
            const sn = p.match(/(\d+)\.xml$/)[1]; 
            t += `--- 第 ${sn} 頁 ---\n`; 
            const sx = await zip.file(p).async("string"); 
            if (sx) { 
                const xmlDoc = parser.parseFromString(sx, "text/xml"); 
                const textNodes = Array.from(xmlDoc.getElementsByTagName("a:t")); 
                let extText = textNodes.map(n => n.textContent).join(" ");
                t += `[投影片內容]:\n${extText.trim()}\n`; 
            } 
            const np = `ppt/notesSlides/notesSlide${sn}.xml`; 
            if (nFiles.includes(np)) { 
                const nx = await zip.file(np).async("string"); 
                if (nx) { 
                    const xmlDoc = parser.parseFromString(nx, "text/xml"); 
                    const textNodes = Array.from(xmlDoc.getElementsByTagName("a:t")); 
                    let extText = textNodes.map(n => n.textContent).join(" ");
                    if (extText.trim()) t += `[講者備忘錄]:\n${extText.trim()}\n`; 
                } 
            } 
            t += `\n`; 
        } 
        setDocPayload(fileObj.name, t); 
    } catch (err) { alert("PPTX 本機備用解析失敗"); } finally { removeLoading(loaderId); }
}

function setDocPayload(n, t) { currentDocumentName = n; currentDocumentText = t; document.getElementById('doc-filename').innerText = n; document.getElementById('doc-preview').classList.remove('hidden'); document.getElementById('image-preview').classList.add('hidden'); document.getElementById('youtube-preview').classList.add('hidden'); document.getElementById('upload-preview-container').classList.remove('hidden'); }
function clearUpload() { currentImageData = currentDocumentText = currentDocumentName = currentYouTubeId = null; document.getElementById('upload-preview-container').classList.add('hidden'); document.getElementById('file-upload').value = ''; }
