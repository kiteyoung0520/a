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
