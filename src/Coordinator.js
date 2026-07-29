import { SimpleVideoPlayer} from './videoPlayer.ts';
import { GetIsMicRecording}  from './main.ts';





//音量柱 效果
const soundcanvas = document.getElementById('waveform');
const ctx = soundcanvas.getContext('2d');
const WIDTH = soundcanvas.width;
const HEIGHT = soundcanvas.height;





class PrecisionTimer {
    /**
     * @param {string} name - 計時器名稱 (Debug用)
     * @param {HTMLElement} displayElement - 要顯示文字的 HTML 元素 (例如 div 或 span)
     */
    constructor(name, displayElement) {
        this.name = name;
        this.displayElement = displayElement; // 存入 HTML 元素
        this.elapsedTime = 0;
        this.startTime = 0;
        this.timerPtr = null;
    }

    start() {
        if (this.timerPtr) return;
        this.startTime = Date.now() - this.elapsedTime;
        
        this.timerPtr = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateUI(); // 每次數值變動就更新畫面
        }, 10); // 10ms 更新一次，畫面會看起來非常流暢
    }

    // 內部方法：直接修改 HTML 內容
    updateUI() {
        if (this.displayElement) {
            // 顯示格式：秒.毫秒 (例如 0.00)
            this.displayElement.innerText = (this.elapsedTime / 1000).toFixed(2);
        }
    }

    stop() {
        clearInterval(this.timerPtr);
        
    }

    reset() {
        this.stop();
        this.timerPtr = null;
        this.elapsedTime = 0;
        this.updateUI(); // 重置畫面
    }
}


//#region 變數宣告

export class ShareData
{


  //STT


  //音訊 audioContext 多用途
  static audioContext;

  //STT Abort
  static STTAbortController = new AbortController(); // 建立全局的 AbortController

  //Azure SDK 是否載入完成
  static IsAzureSTTSDKSetupDone = false;

  //Azure STT變數
  static AzureRecognizer;

  //Azure 辨識出來的文字
  static STTString = "";

  //Azure STT 是否在處理中
  static IsSTTProcessing = false;

  //Token 時間戳記
  static TokenTimestamp = 0;


  //TTS


  //撥放音訊Class
  static audioElement = new Audio();   

  //HTTP 中斷Controller
  static TTSAbortController = new AbortController(); // 建立全局的 AbortController

  //等待送至TTS 文字Queue
  static TTSTextQueue = [];

  //是否等待TTS回傳
  static TTSIsWaitRequest = false;





  //LLM

  //LLM回傳文字
  static LLMResponseTemp = "";

  //目前 LLM 回傳的是"情緒"還是"實際回復"
  static IsLLMContent = false;

  //GPT 正確格式回應次數
  static HasLLMReplyContent = false;

  //前次回應是否為第一識別符號
  static IsPreSectionSign = false;

  //GPT 中斷 Controller
  static GPTAbortController = new AbortController(); // 建立全局的 AbortController

  //GPT 對話 Session id
  static conversationid = "";

  //問題主要內容英文或中文
  static bIsEnglish = true;

  //GPT 心跳包 
  static DifyGPTheartbeatInterval;

  //語音辨識 回應綴字 中文
  static DifyReplyList_ch = ["speak chinese", "use chinese", "respond in chinese"];

  //語音辨識 回應綴字 中文
  static DifyReplyList_en = ["說英文", "請說英文", "用英文回應", "講英文", "用英文回答","英文回答"];




  


  //Chat Bubble

  //是否為新AI的泡泡框
  static IsNewAIBubble = true;

  //AI泡泡框
  static AIBubble;

  //是否為新使用者的泡泡框
  static IsNewUserBubble = true;

  //使用者泡泡框
  static UserBubble;

  //等待撥放音檔資料Queue
  static AudioQueue = [];

  //是否正在撥放
  static isPlaying = false;

  //AI 打字效果 TextQueue
  static AIBubbleTextQueue = [];

  //AI 打字效果 計時器
  static AIBubbleInterval;

};











  //#endregion





export class Coordinator
{
 
  videoPlayer = null;

  stttimer = null;
  llmtimer = null;
  ttstimer = null;

  asrWs = null;
  asrAudioCtx = null;
  asrStream = null;
  asrProcessor = null;
  asrSource = null;
  asrSessionReady = false;

  Initialize()
  {
    
    console.log("Coordinator Init");



    // 建立三個獨立的計時器，並把對應的 Element 傳進去
    this.stttimer = new PrecisionTimer("stt", document.getElementById('stt-time'));
    this.llmtimer = new PrecisionTimer("llm", document.getElementById('llm-time'));
    this.ttstimer = new PrecisionTimer("tts", document.getElementById('tts-time'));
    

    this.videoPlayer = new SimpleVideoPlayer();
    this.videoPlayer.Initialize();

    // window onload 
    this.DifyKeepAlive();
    this.ResetDifyGPTInterval();
  
    
    
  }

  //#region 按鍵功能
  toggleFullScreen(IsEnterFullScreen) 
  {
      if (!document.fullscreenElement &&    // 檢查是否進入全螢幕模式
          !document.mozFullScreenElement && 
          !document.webkitFullscreenElement && 
          !document.msFullscreenElement && IsEnterFullScreen) {
          // 進入全螢幕模式
          if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) { // Firefox
              document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari 和 Opera
              document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
              document.documentElement.msRequestFullscreen();
          }
      } else {
          // 退出全螢幕模式
          if (document.exitFullscreen) {
              document.exitFullscreen();
          } else if (document.mozCancelFullScreen) { // Firefox
              document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) { // Chrome, Safari 和 Opera
              document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { // IE/Edge
              document.msExitFullscreen();
          }
      }
  }

//#endregion



//#region STT 



async startRecognition() 
{



    this.connectASR();



}


stopRecognition() 
{

    this.stopASR();
    
}





async startMicrophone() {
  // 共用現有的 AudioContext（通常 48kHz），在 Worklet 裡降採樣到 16kHz
  const ctx = ShareData.audioContext;
  if (!ctx) { console.error('AudioContext 尚未建立'); return; }

  const nativeSR = ctx.sampleRate;
  const targetSR = 16000;

  const CHUNK_SIZE = 1600; // 1600 samples = 0.1 秒 @ 16kHz = 3200 bytes PCM
  const processorCode = `
    class PCMProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.ratio = ${nativeSR} / ${targetSR};
        this.buffer = new Int16Array(${CHUNK_SIZE});
        this.bufferOffset = 0;
      }
      process(inputs) {
        const input = inputs[0][0];
        if (!input) return true;

        const ratio = this.ratio;
        const outputLen = Math.floor(input.length / ratio);
        for (let i = 0; i < outputLen; i++) {
          const idx = Math.floor(i * ratio);
          this.buffer[this.bufferOffset++] = Math.max(-32768, Math.min(32767, input[idx] * 32768));
          if (this.bufferOffset >= ${CHUNK_SIZE}) {
            this.port.postMessage(new Int16Array(this.buffer));
            this.bufferOffset = 0;
          }
        }
        return true;
      }
    }
    registerProcessor('pcm-processor', PCMProcessor);
  `;
  if (!this._pcmProcessorRegistered) {
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    await ctx.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);
    this._pcmProcessorRegistered = true;
  }

  const processor = new AudioWorkletNode(ctx, 'pcm-processor');

  let audioSendCount = 0;
  processor.port.onmessage = (e) => {
    if (!this.asrWs || this.asrWs.readyState !== WebSocket.OPEN) return;
    const base64 = this.arrayBufferToBase64(e.data.buffer);

    audioSendCount++;
    this.asrWs.send(JSON.stringify({
      event_id: 'evt_' + Date.now(),
      type: 'input_audio_buffer.append',
      audio: base64
    }));
  };

  // 直接用 OnGetMedaiStream 存的 stream，不重新開麥克風
  if (!this.asrStream) { console.error('麥克風 stream 尚未建立'); return; }
  const source = ctx.createMediaStreamSource(this.asrStream);
  source.connect(processor);
  const silence = ctx.createGain();
  silence.gain.value = 0;
  processor.connect(silence);
  silence.connect(ctx.destination);

  this.asrProcessor = processor;
  this.asrSource = source;
}

arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

stopASR() {

  if (this.asrWs && this.asrWs.readyState === WebSocket.OPEN) {
    
    console.log("Close Old WebSocket");

    if(this.asrSessionReady)
    {
        this.asrWs.send(JSON.stringify({
        event_id: 'evt_' + Date.now(),
        type: 'session.finish'
        }));
        
        this.asrSessionReady = false;
    }
    else
    {
        this.asrWs.close();
        this.asrWs = null;
    }


  }
  // 斷開 processor（不關 AudioContext，那是共用的）
  if (this.asrProcessor) {
    this.asrProcessor.disconnect();
    this.asrProcessor = null;
  }
  if (this.asrSource) {
    this.asrSource.disconnect();
    this.asrSource = null;
  }
}

connectASR() {

  // 如果已有連線，先完整關閉舊的
  if (this.asrWs) {
    this.stopASR();
  }

  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  this.asrWs = new WebSocket(`${wsProtocol}//${location.host}/asr`);

  this.asrWs.onopen = () => console.log('✅ connected');
  this.asrWs.onmessage = (e) => this.handleAsrMessage(e);
  this.asrWs.onclose = (e) => {
    console.log('❌ closed', e.code, e.reason);
    this.finishAsrSession();
  };
  this.asrWs.onerror = (e) => console.log('⚠️ error', e);

}

handleAsrMessage(e) {



  const msg = JSON.parse(e.data);

  switch (msg.type) {
    case 'session.created':
      // 跳過 session.update，直接用預設設定開始送音訊
      this.startMicrophone();
      this.videoPlayer.setVideoByKey("Listening");
      this.asrSessionReady = true;
      break;

    case 'session.updated':
      console.log('[ASR] ✅ session.updated 確認:', e.data);
      break;

    case 'error':
      console.error('[ASR] ⚠️ DashScope 回報錯誤:', e.data);
      break;

    case 'conversation.item.input_audio_transcription.text':
      console.log('辨識中:', msg.stash);
      this.addChatBubble(ShareData.STTString + msg.stash , true);
      break;

    case 'conversation.item.input_audio_transcription.completed':
      console.log('✅ 最終:', msg.transcript);
      ShareData.STTString += msg.transcript;
      this.addChatBubble(ShareData.STTString , true);
      break;

    case 'session.finished':
      console.log('[ASR]  session.finished:', e.data);
      this.finishAsrSession();
      break;
  }

}

// session.finished 與 onclose 共用：把累積的辨識結果送出並重置狀態
finishAsrSession() {
  if (ShareData.STTString != "") {
    this.addChatBubble(ShareData.STTString , true);
    this.Dify(ShareData.STTString);
  }

  ShareData.STTString = "";
  ShareData.IsSTTProcessing = false;
  this.videoPlayer.setVideoByKey("IdleStand");
}

//#endregion

//#region GPT

ResetForNewDifyRequest()
{
  ShareData.IsNewAIBubble = true;
  ShareData.IsNewUserBubble = true;
  ShareData.IsPreSectionSign = false;
  ShareData.LLMResponseTemp = "";
  ShareData.IsLLMContent = false;
  ShareData.audioElement.pause();
  ShareData.AudioQueue = [];
  ShareData.isPlaying = false;
  clearInterval(ShareData.AIBubbleInterval);
  ShareData.AIBubbleInterval = null;
  ShareData.AIBubbleTextQueue = [];
  ShareData.TTSTextQueue = [];
  ShareData.TTSIsWaitRequest = false;

  ShareData.HasLLMReplyContent = false;


  if(ShareData.GPTAbortController)
  {
    ShareData.GPTAbortController.abort();
  }

  if(ShareData.TTSAbortController)
  {
    ShareData.TTSAbortController.abort();
  }
  
  if(ShareData.STTAbortController)
  {
    ShareData.STTAbortController.abort();
  }

}

// text 是否包含 words 裡的任一字串
containsAny(text, words)
{
    return words.some((word) => text.includes(word));
}

IsEnglish(text)
{
    let chineseCount = 0;
    let englishCount = 0;

    // 遍歷字符串的每個字符
    for (const char of text) {
      // 判斷字符是否是中文
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chineseCount++;  // 中文字符
      }
      // 判斷字符是否是英文字母
      else if (/[a-zA-Z]/.test(char)) {
        englishCount++;  // 英文字母
      }
    }

    // 有中文：預設非英文，除非要求改說英文
    if (chineseCount > 0) {
      return this.containsAny(text, ShareData.DifyReplyList_en);
    }

    // 有英文：預設英文，除非要求改說中文
    if (englishCount > 0) {
      return !this.containsAny(text, ShareData.DifyReplyList_ch);
    }

    return false;
}



async Dify(InputText) {

  if (InputText == "") {
    return;
  }

  this.llmtimer.reset();
  this.llmtimer.start();

  this.ResetDifyGPTInterval();
  this.addChatBubble(InputText, true);
  this.ResetForNewDifyRequest();

  console.log("Dify 送出文字 : " + InputText);
  ShareData.bIsEnglish = this.IsEnglish(InputText);

  const query = InputText + (ShareData.bIsEnglish ? " (按照格式用英文回答)" : " (按照格式用繁體中文回答)");

  // 重新建立 AbortController
  ShareData.GPTAbortController = new AbortController();
  const signal = ShareData.GPTAbortController.signal;

  const requestBody = {
    inputs: { PersonDescription: "" },
    query: query,
    response_mode: "streaming",
    conversation_id: ShareData.conversationid,
    user: "abc-123",
  };

  try {
    const response = await fetch('/dify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: signal,
    });

    if (!response.ok) {
      alert("request error" + response.status);
      throw new Error('請求失敗，狀態碼：' + response.status);
    }

    await this.streamDifyResponse(response);
  }
  catch (error) {
    if (error.name === 'AbortError') {
      console.log("TTS 請求已中斷，但不顯示錯誤訊息");
      return; // 靜默處理，不執行 alert
    }
    alert("request error " + error.message); // 其他錯誤才顯示
  }
}

// 讀取 Dify 的 streaming 回應，逐行處理 SSE
async streamDifyResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    buffer += decoder.decode(value, { stream: true });

    const NL = String.fromCharCode(10); // "\n"
    while (buffer.includes(NL)) {
      const newlineIndex = buffer.indexOf(NL);
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      this.handleDifyLine(line);
    }
  }
}

// 處理單行 SSE（格式為 data: {...}）
handleDifyLine(line) {
  if (!line.startsWith("data: ")) return;

  const jsonStr = line.slice(6).trim();
  try {
    const parsedData = JSON.parse(jsonStr);
    ShareData.conversationid = parsedData.conversation_id;
    this.handleDifyEvent(parsedData);
  }
  catch (e) {
    console.log(e.message);
  }
}

// 依事件類型分派（ping / message_replace 不需處理）
handleDifyEvent(parsedData) {
  switch (parsedData.event) {
    case "message":
      this.GPTParser(parsedData.answer);
      break;
    case "message_end":
      console.log("結束回應");
      this.handleDifyMessageEnd();
      break;
  }
}

// message_end：補送殘留文字或做預設回覆
handleDifyMessageEnd() {
  // 沒有解析到情緒：用累積文字或預設句回覆
  if (!ShareData.IsLLMContent) {
    let text;
    if (ShareData.LLMResponseTemp == "") {
      this.videoPlayer.setVideoByKey("Talking");
      text = this.fallbackReply();
    } else {
      this.videoPlayer.setVideoByKey("Waving");
      text = ShareData.LLMResponseTemp + '。';
    }
    ShareData.IsNewAIBubble = true;
    this.addChatBubble(text, false);
    this.SendToElevenlabs(text);
    return;
  }

  // 有情緒；有回應文字：把結尾未送出的最後一句補送 TTS
  if (ShareData.LLMResponseTemp != "") {
    this.EmitValue(true, "", true);
  }
  // 有情緒；無回應文字：做回應補償
  else if (!ShareData.HasLLMReplyContent) {
    const text = this.fallbackReply();
    ShareData.IsNewAIBubble = true;
    this.addChatBubble(text, false);
    this.SendToElevenlabs(text);
  }
}

// 聽不懂時的預設回覆句
fallbackReply() {
  return ShareData.bIsEnglish
    ? "Sorry, i cant understand, could you say again?"
    : "不好意思，我不太清楚，你可以再說一遍嗎？";
}


ResetDifyGPTInterval()
{
  clearInterval(ShareData.DifyGPTheartbeatInterval);

  ShareData.DifyGPTheartbeatInterval = setInterval(() => {
        
    this.DifyKeepAlive();
    console.log("發送心跳訊號");
      
     }, 120000); // 每2分鐘發送一次
}

async DifyKeepAlive() {
  console.log("Dify發送心跳訊號");

  const controller = new AbortController();
  const signal = controller.signal;

  const requestBody = {
    inputs: { PersonDescription: "" },
    query: " ",
    response_mode: "streaming",
    conversation_id: ShareData.conversationid,
    user: "abc-123",
  };

  try {
    const response = await fetch('/dify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: signal,
    });

    if (response.ok) {
      await this.readKeepAliveResponse(response, signal);
    }
  }
  catch (error) {
    console.log("request error " + error.message); // 其他錯誤才顯示
  }
}

// 讀取心跳回應；解析到第一個有效封包即結束
async readKeepAliveResponse(response, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (this.handleKeepAliveChunk(chunk, signal)) return;
  }
}

// 處理一段 chunk；回傳 true 代表已成功解析心跳、可結束
handleKeepAliveChunk(chunk, signal) {
  const SEP = String.fromCharCode(10, 10); // 連續兩個換行字元
  for (const part of chunk.split(SEP)) {
    if (part.length <= 5) continue;
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (this.tryParseKeepAlivePart(part)) return true;
  }
  return false;
}

// 嘗試解析單一封包；成功回 true
tryParseKeepAlivePart(part) {
  try {
    const parsed = JSON.parse(part.substring(5));
    console.log("心跳包發送成功");
    if (ShareData.conversationid === "") {
      ShareData.conversationid = parsed.conversation_id;
    }
    return true;
  }
  catch (e) {
    // 可能還沒解析完
    return false;
  }
}

GPTParser(Response)
{

    // "情緒" 和 "回應" 會用 §¶ 兩個關鍵字 隔開
    // EX : Happy§¶你好啊!§¶ 
    // "情緒" 完成判斷會在這裡，"回應"完成判斷會在 API message_end 事件

    //循環取字元判斷
    for(let c of Response)
    {
  
        //字元為空的而且目前是 "情緒" 回應就跳過
        if(c == "" && !ShareData.IsLLMContent)
        {
            continue;
        }

        //字元為第一關鍵字
        if(c == "§")
        {
          ShareData.IsPreSectionSign = true;
          continue;
        }
          
        //字元為第二關鍵字
        if(c == "¶")
        {
            //若前一個字元為第一關鍵字
            if(ShareData.IsPreSectionSign)
            {
              
                //目前回應為 "情緒" 狀態
                if(!ShareData.IsLLMContent)
                {
                    this.EmitValue(ShareData.IsLLMContent, "", true);
                    ShareData.IsLLMContent = true; 
                }

                
                ShareData.IsPreSectionSign = false;
                continue;

            }
        }


      //字元為關鍵字以外的字，將字元加到結果
      this.EmitValue(ShareData.IsLLMContent, c , false);

    }

}


EmitValue(IsReplyContent, text, IsComplete)
{
  // 將字元累加至聊天氣泡的字串
  ShareData.LLMResponseTemp = ShareData.LLMResponseTemp + text;

  if (IsReplyContent) {
    this.handleReplyContent(text, IsComplete);
  } else {
    this.handleEmotion(IsComplete);
  }
}

// LLM 實際「回應」
handleReplyContent(text, IsComplete)
{
  this.llmtimer.stop();
  this.addChatBubble(text, false);

  // 結尾補句號（純空白/換行不補）
  if (IsComplete && ShareData.LLMResponseTemp.trim() !== "") {
    ShareData.LLMResponseTemp += '。';
  }

  this.flushIfPunctuated();
}

// LLM 「情緒」
handleEmotion(IsComplete)
{
  // 段落完成才處理
  if (!IsComplete) return;

  console.log("情緒 : " + ShareData.LLMResponseTemp);
  const cleaned = ShareData.LLMResponseTemp.replace(/\s/g, '');

  // 已知情緒：切換動畫
  if (this.videoPlayer.animationList.hasOwnProperty(cleaned)) {
    console.log("回應情緒存在 : " + cleaned);
    this.videoPlayer.setVideoByKey(cleaned);
    ShareData.LLMResponseTemp = "";
    return;
  }

  // 不是情緒關鍵字：當成一般回應處理
  console.log("回應情緒不存在 : " + cleaned);
  this.videoPlayer.setVideoByKey("Waving");
  this.addChatBubble(ShareData.LLMResponseTemp, false);
  this.flushIfPunctuated();
}

// 結尾是標點就送 TTS 並清空，準備累積下一段
flushIfPunctuated()
{
  const punctuationPattern = /[。．！？!?.~，,]$/;
  if (!punctuationPattern.test(ShareData.LLMResponseTemp)) return;

  console.log("執行 TTS => " + ShareData.LLMResponseTemp);
  ShareData.HasLLMReplyContent = true;
  this.sendOrQueueTTS(ShareData.LLMResponseTemp);
  ShareData.LLMResponseTemp = "";
}

// 送 TTS：忙線中先排隊，否則直接送
sendOrQueueTTS(content)
{
  if (ShareData.TTSIsWaitRequest) {
    ShareData.TTSTextQueue.push(content);
  } else {
    ShareData.TTSIsWaitRequest = true;
    this.SendToElevenlabs(content);
  }
}

DifyByInput()
{
  Dify(document.getElementById("myInput").value);
}


addChatBubble(text, isUser) {

  const chatContainer = document.getElementById("chat-container");


  if(isUser ? ShareData.IsNewUserBubble : ShareData.IsNewAIBubble)
  {
      let bubble;


      bubble = document.createElement("div");
 
      bubble.classList.add("chat-bubble", isUser ? "user" : "ai");
      bubble.textContent = text;
      chatContainer.insertBefore(bubble, chatContainer.firstChild);

      
      if(isUser)
      {
          ShareData.UserBubble = bubble;
          ShareData.IsNewUserBubble = false;
      }
      else
      {
          ShareData.AIBubble = bubble;
          ShareData.IsNewAIBubble = false;
      }
  }
  else
  {
      if(isUser)
      {
          ShareData.UserBubble.textContent = text;
      }
      else
      {
          this.AIBubbleStreamText(text);
      }

  }

  



  chatContainer.scrollTop = chatContainer.scrollHeight; 
 


    
  }


  async AIBubbleStreamText(text)
  {
    ShareData.AIBubbleTextQueue.push(text);

    if(ShareData.AIBubbleInterval == null)
    {
        ShareData.AIBubbleInterval = setInterval(() => {
            ShareData.AIBubble.textContent += ShareData.AIBubbleTextQueue.shift();

            if(ShareData.AIBubbleTextQueue.length == 0)
            {
                clearInterval(ShareData.AIBubbleInterval);
                ShareData.AIBubbleInterval = null;
         
            }
            document.getElementById("chat-container").scrollTop = document.getElementById("chat-container").scrollHeight; // 自動滾動到最底部

          }, 25); // 每 15 秒發送一次
    }


  }

clearChatBubbles() {
const chatContainer = document.getElementById("chat-container");

  while (chatContainer.firstChild) {
      chatContainer.removeChild(chatContainer.firstChild);
  }


  ShareData.IsNewAIBubble = true; // 重置 AI 氣泡狀態
}
//#endregion




//#region PlayAudio
playAudioQueue() {
      if (ShareData.isPlaying || ShareData.AudioQueue.length === 0) 
      {
        if(ShareData.TTSTextQueue.length === 0)
        {
          this.videoPlayer.setVideoByKey("IdleStand");

        }
        return;
      }

      ShareData.isPlaying = true;
      const audioURL = ShareData.AudioQueue.shift();  // 取出並移除第一個音檔
      ShareData.audioElement.src = audioURL;


      // 當前音檔播放結束後，繼續播放下一段
      ShareData.audioElement.onended = () => {

        ShareData.isPlaying = false;
        this.playAudioQueue();
          
      };


      // 開始播放
      ShareData.audioElement.play().then(() => {

          
          
      }).catch((err) => {
          
          ShareData.isPlaying = false;
          this.playAudioQueue();  // 播放下一段
      });
  }
  //#endregion
//#region TTS


  async SendToElevenlabs(InputText) {

               
            this.ttstimer.start();
            let inputValue = InputText;
            inputValue = inputValue.replace(/ROG/g, "R O G");
            inputValue = inputValue.slice(0 , -1);
            if(inputValue == '嗨')
            {
              inputValue += '!';
            }
            else
            {
              inputValue += ' ';
            }
            
      // 重新建立 AbortController
      ShareData.TTSAbortController = new AbortController();
      const signal = ShareData.TTSAbortController.signal;


      const API_URL = '/tts';

      const request = {
              "model": "qwen3-tts-vc-2026-01-22",
             "input": {
                "text": inputValue,
                "voice": "qwen-tts-vc-bailian-voice-20260415163944459-a009"
            }
      };


      try {
          const response = await fetch(API_URL, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(request),
              signal: signal,
          });

          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

          


          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let text = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
          const result = JSON.parse(text);




          const audioUrl = result.output.audio.url.replace('http://', 'https://');
          ShareData.AudioQueue.push(audioUrl);

          

          this.ttstimer.stop();
          // 6. 如果目前沒有在播放，開始播放佇列中的音檔
          if (!ShareData.isPlaying) {
              this.playAudioQueue();
          }

          if (ShareData.TTSTextQueue.length > 0) {
                this.SendToElevenlabs(ShareData.TTSTextQueue.shift());
          }
          else
            ShareData.TTSIsWaitRequest = false;




      } catch (error) {
          if (error.name === 'AbortError') {
              console.log("FishAudio 請求已中斷，但不顯示錯誤訊息");
              return; // 靜默處理，不執行 alert
          }
          alert("request error " + error.message); // 其他錯誤才顯示
      }
      }


 
 //#endregion

//#region 監聽麥克風


OnGetMedaiStream(stream)
{



    if(!ShareData.audioContext)
    {
      ShareData.audioContext = new AudioContext();  
    }

    // 創建音訊源
    const source = ShareData.audioContext.createMediaStreamSource(stream);

    // 創建音訊分析器
    const analyser = ShareData.audioContext.createAnalyser();
    analyser.fftSize = 256;  // 設定 FFT 大小
    const bufferLength = analyser.frequencyBinCount; // 頻譜數量
    const dataArray = new Uint8Array(bufferLength);  // 用來存放頻譜數據

    
    const barCount = Math.floor(bufferLength / 3); // 只畫低頻
    const barWidth = 4; // 左右兩邊各一半
    const centerX = WIDTH / 2;
    const barGap = 3; 
    const displayHeights = new Array(barCount).fill(0);

    // 將音訊源連接到分析器
    source.connect(analyser);

    this.asrStream = stream;
    


    // 定時檢查音量
    function checkVolume() 
    {
     
      
        // 獲取頻譜數據
        analyser.getByteFrequencyData(dataArray);



        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        if(GetIsMicRecording())
        {




            for (let i = 0; i < barCount; i++) 
            {
                const barHeight = dataArray[i];
                const scaledHeight = barHeight * 0.7;
            

                ctx.fillStyle = 'rgba(240, 37, 37, 1)';

                // 左側對稱柱
                const xLeft = centerX - (i + 1) * (barWidth + barGap);
                ctx.fillRect(xLeft, HEIGHT / 2 - scaledHeight / 2, barWidth - 1, scaledHeight);

                // 右側對稱柱
                const xRight = centerX + i * (barWidth + barGap);
                ctx.fillRect(xRight, HEIGHT / 2 - scaledHeight / 2, barWidth - 1, scaledHeight);

            }
        }
        else
        {
            

            for (let i = 0; i < barCount; i++) 
            {
                


                // 緩慢跟隨目標高度
                displayHeights[i] -=  0.01;
              
                displayHeights[i] = Math.max(displayHeights[i], 5);
                const scaledHeight = displayHeights[i];

                ctx.fillStyle = 'rgba(240, 37, 37, 1)';

                const xLeft = centerX - (i + 1) * (barWidth + barGap);
                const xRight = centerX + i * (barWidth + barGap);

                ctx.fillRect(xLeft, HEIGHT / 2 - scaledHeight / 2, barWidth, 10);
                ctx.fillRect(xRight, HEIGHT / 2 - scaledHeight / 2, barWidth, 10);
            }

        }

        requestAnimationFrame(checkVolume); 
      }

      checkVolume();

}

     //#endregion












};



