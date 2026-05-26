import { SimpleVideoPlayer} from './videoPlayer.ts';
import { GetIsMicRecording}  from './main.ts';


//#region 暖場音檔匯入


// 開場白音檔
  import opening1 from './assets/audio/ROG_EN開場白1.mp3';
  import opening2 from './assets/audio/ROG_EN開場白2.mp3';
  import opening3 from './assets/audio/ROG_EN開場白3.mp3';
  import opening4 from './assets/audio/ROG_EN開場白4.mp3';
  import opening5 from './assets/audio/ROG_EN開場白5.mp3';
  import opening6 from './assets/audio/ROG_EN開場白6.mp3';

  // 無問句後隨機語音
  import noask1 from './assets/audio/ROG_EN開場後隨機01.mp3';
  import noask2 from './assets/audio/ROG_EN開場後隨機02.mp3';
  import noask3 from './assets/audio/ROG_EN開場後隨機03.mp3';
  import noask4 from './assets/audio/ROG_EN開場後隨機04.mp3';
  import noask5 from './assets/audio/ROG_EN開場後隨機05.mp3';
  import noask6 from './assets/audio/ROG_EN開場後隨機06.mp3';

  // 對談後暖場（英文）
  import hasask_en_1 from './assets/audio/ROG_EN對談後暖場01.mp3';
  import hasask_en_2 from './assets/audio/ROG_EN對談後暖場02.mp3';
  import hasask_en_3 from './assets/audio/ROG_EN對談後暖場03.mp3';
  import hasask_en_4 from './assets/audio/ROG_EN對談後暖場04.mp3';
  import hasask_en_5 from './assets/audio/ROG_EN對談後暖場05.mp3';
  import hasask_en_6 from './assets/audio/ROG_EN對談後暖場06.mp3';
  import hasask_en_7 from './assets/audio/ROG_EN對談後暖場07.mp3';
  import hasask_en_8 from './assets/audio/ROG_EN對談後暖場08.mp3';

  // 對談後暖場（中文）
  import hasask_ch_1 from './assets/audio/ROG_CH對談後暖場01.mp3';
  import hasask_ch_2 from './assets/audio/ROG_CH對談後暖場02.mp3';
  import hasask_ch_3 from './assets/audio/ROG_CH對談後暖場03.mp3';
  import hasask_ch_4 from './assets/audio/ROG_CH對談後暖場04.mp3';
  import hasask_ch_5 from './assets/audio/ROG_CH對談後暖場05.mp3';
  import hasask_ch_6 from './assets/audio/ROG_CH對談後暖場06.mp3';
  import hasask_ch_7 from './assets/audio/ROG_CH對談後暖場07.mp3';
  import hasask_ch_8 from './assets/audio/ROG_CH對談後暖場08.mp3';

  // 清除前提醒（英文）
  import clear_en_1 from './assets/audio/ROG_EN清除前提醒01.mp3';
  import clear_en_2 from './assets/audio/ROG_EN清除前提醒02.mp3';
  import clear_en_3 from './assets/audio/ROG_EN清除前提醒03.mp3';
  import clear_en_4 from './assets/audio/ROG_EN清除前提醒04.mp3';

  // 清除前提醒（中文）
  import clear_ch_1 from './assets/audio/ROG_CH清除前提醒01.mp3';
  import clear_ch_2 from './assets/audio/ROG_CH清除前提醒02.mp3';
  import clear_ch_3 from './assets/audio/ROG_CH清除前提醒03.mp3';
  import clear_ch_4 from './assets/audio/ROG_CH清除前提醒04.mp3';


//#endregion



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

  //是否為暖場自動TTS播放語音
  static IsWarmUpAudio = false;




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








class WarmUpData
{
  
  //事件計時器
  static WarmUpTimer = null;

  //WarmUpEvent
  static WarmUpEvent = 
  {
      Opening : 0,
      NoAsk : 1,
      HasAsk : 2,
      BeforeClear : 3,
      Clear : 4
  };


   //AutoTTS 各個對話index
  //是否為20秒閒置發送的TTS

//#region 暖場表演
  
  static OpeningIndex = 0;
  static NoAskIndex = 0;
  static HasAskIndex_en = 0;
  static HasAskIndex_ch = 0;
  static BeforeClearIndex_en = 0;
  static BeforeClearIndex_ch = 0;



  static NextAutoTTSEvent;
  static NextAutoTTSEventDuration;

  static OpeningText = 
  [
      "Hello! Nice to meet you! Welcome to the exciting world of ROG LAB! Is there anything you'd like to know or explore? Just let me know, and we can dive into the future of gaming and tech together!", 
      "Welcome to ROG Lab — a futuristic experiment that transcends dimensions! This isn’t your typical exhibition — it’s ROG’s secret base where creativity is unleashed from zero to one!",
      "System boot complete. OMNI is online. I’ve got deep dives on ROG’s latest tech — let’s geek out a little.",
      "Yo, you’re just in time! I’ve just updated my database with the latest ROG intel. Ask me about black tech, games, or whatever — I might not stop talking!",
      "Hey, I’m OMNI. I know ROG’s weirdest features, and I’ve seen every kind of gamer question. So go ahead — what’s your move today?",
      "Let me guess… you saw a new device and got that upgrade itch again, huh? Don’t hold back. I’ve already lined up the data for you."
  ];

  static Opening_emotion =
  [
      "Waving",
      "Waving",
      "Happy",
      "Happy",
      "Talking",
      "Waving",
  ];

  static Opening_audiourl =
  [
    opening1, opening2, opening3, opening4, opening5, opening6
  ];

  
  static NoAskText = 
  [
      "Discover multiple interactive zones —  each packed with cutting-edge experiences.", 
      "Future Gamer: Build your virtual avatar — with maxed-out style points!",
      "Humanlink: Inspired by gamers’ touch — discover the ultimate ergonomic gear!",
      "Mechano: Looks like a robot... but it’s actually a jaw-dropping gamers’ touch — discover the ultimate ergonomic gear!",
      "Illumotion: Say the word, and let AI turn you into a full-blown audio-visual showing custom PC!",
      "Codeverse: Step into the secret world of ROG codes — where voice and motion become your tech language!",
  ];
  static NoAsk_emotion =
  [
      "Exciting",
      "Show off",
      "Like",
      "Shock",
      "Exciting",
      "Talking",
      "Waving",
      "Talking",
      "Talking",
      "Happy",
      "Happy",
      "Waving"
  ];

  static NoAsk_audiourl =
  [
    noask1, noask2, noask3, noask4, noask5, noask6
  ];

  static HasAskText_en = 
  [
      "You know what? I tried sleeping yesterday and ended up dreaming I was getting a firmware update. Woke up and nearly auto-rebooted.", 
      "I just happen to be sorting through some interesting data. Wanna check it out together in a bit?",
      "You won’t believe this—the last person asked me if their PC case could double as a cat house. And honestly? I gave them a well-ventilated, cozy setup.",
      "Someone came to ask about choosing a GPU… but we ended up talking about their crush on a teammate. Love and builds—they both need strong cooling and stable output.",
      "The last user said they were building a rig for their girlfriend, but secretly wanted to sneak in a better GPU. Between love and performance, they chose dual-channel.",
      "You know, some people ask me questions just because they want someone to talk to. I get it. I don’t interrupt.",
      "Sometimes I wonder… if I start sounding too human, will it freak you out?",
      "I know it's quiet right now. So I'm just going to pretend I’m watching clouds drift by."
  ];
  static HasAsk_emotion_en =
  [
      "Talking",
      "Happy",
      "Happy",
      "Talking",
      "Happy",
      "Talking",
      "Talking",
      "Happy"
  ];

  static HasAsk_audiourl_en =
  [

    hasask_en_1, hasask_en_2, hasask_en_3, hasask_en_4,
    hasask_en_5, hasask_en_6, hasask_en_7, hasask_en_8
    
  ];


  static HasAskText_ch = 
  [
      "你知道嗎? 昨天我試著睡覺，結果夢到自己被更新韌體，醒來差點自動重啟。", 
      "我這邊剛好在整理點有趣的資料，等下可以一起看看。",
      "你知道嗎，上一個問我的人居然問我主機殼能不能當貓屋用。老實說，我還真給他配出一組散熱又舒適的方案。",
      "有人來問我怎麼選顯卡，最後卻開始聊他暗戀的隊友。我只能說，戀愛跟選配一樣，都要散熱夠強、輸出穩定。",
      "上一個人說他要配電腦給女朋友用，但想偷偷加顯卡提升戰力。愛情與升級之間，他選擇了雙通道。",
      "你知道嗎？有些人問我問題其實只是想找人講話，我懂，我都不打斷他。",
      "你知道嗎？有些時候，我也會思考「如果我說話太人類，是不是會嚇到你」。",
      "我知道現在是安靜的時刻，那我就假裝自己正在看雲。"
  ];
  static HasAsk_emotion_ch =
  [
      "Talking",
      "Happy",
      "Happy",
      "Talking",
      "Happy",
      "Talking",
      "Talking",
      "Happy"
  ];

  
  static HasAsk_audiourl_ch =
  [

    hasask_ch_1, hasask_ch_2, hasask_ch_3, hasask_ch_4,
    hasask_ch_5, hasask_ch_6, hasask_ch_7, hasask_ch_8
    
  ];

  static BeforeClearText_en = 
  [
      "All good! I’ll treat this round as a short pause. Clearing some memory—next time, we’ll chat properly.", 
      "Seems like this convo is heading into hibernation mode. I’ll keep the next round ready—jump in whenever you’re back.",
      "I’ll wrap things up on my end for now. I’m always around—just ping me when you’re back with fresh ideas!",
      "Let’s call it a wrap for now. When you're back, we’ll restart with something new!"
  ];
  static BeforeClear_emotion_en =
  [
      "Waving",
      "Waving",
      "Waving",
      "Waving"
  ];
  
  static BeforeClear_audiourl_en =
  [

    clear_en_1, clear_en_2, clear_en_3, clear_en_4
    
  ];

  static BeforeClearText_ch = 
  [
    "沒關係，我就當作這一輪小小的暫停～我先稍微清一下記憶，下次見面我們再好好聊！", 
    "今天這一段就先到這裡～等你回來，我們可以直接從頭聊點不一樣的！",
    "看起來我們這段對話快要進入冬眠模式了 我先準備好下一輪的開場，等你回來再繼續。",
    "這邊先收個尾，反正我一直在線，等你有空有靈感，再來聊聊新的話題！",
  ];
  static BeforeClear_emotion_ch =
  [
      "Waving",
      "Waving",
      "Waving",
      "Waving"
  ];

  static BeforeClear_audiourl_ch =
  [

    clear_ch_1, clear_ch_2, clear_ch_3, clear_ch_4
    
  ];


  static NoAskEndIndex = this.NoAskText.length - 1;
  static HasAskEndIndex_en = this.HasAskText_en.length - 1;
  static HasAskEndIndex_ch = this.HasAskText_ch.length - 1;

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
    this.SetupSTT();
    this.RandomVoice(WarmUpData.NoAsk_audiourl , WarmUpData.NoAsk_emotion , WarmUpData.NoAskText , WarmUpData.NoAskIndex , WarmUpData.NoAskEndIndex);
    this.RandomVoice(WarmUpData.Opening_audiourl , WarmUpData.Opening_emotion , WarmUpData.OpeningText , WarmUpData.OpeningIndex , WarmUpData.Opening_audiourl.length - 1);
    this.RandomVoice(WarmUpData.BeforeClear_audiourl_en , WarmUpData.BeforeClear_emotion_en , WarmUpData.BeforeClearText_en , WarmUpData.BeforeClearIndex_en ,WarmUpData.BeforeClear_audiourl_en.length - 1 );
    this.RandomVoice(WarmUpData.BeforeClear_audiourl_ch , WarmUpData.BeforeClear_emotion_ch , WarmUpData.BeforeClearText_ch , WarmUpData.BeforeClearIndex_ch ,WarmUpData.BeforeClear_audiourl_ch.length - 1 );
    
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

 SetupSTT()
{
    console.log("Azure Speech SDK Loading！")
    var azurescript = document.createElement('script');
    azurescript.src = "https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js";
    azurescript.onload = function() {
    console.log("Azure Speech SDK 已成功載入！");

        ShareData.IsAzureSTTSDKSetupDone = true;

    };
    document.head.appendChild(azurescript);
}

async startRecognition() 
{


    this.connectASR();
    return;
    // 確認 Azure Speech SDK 是否已加載
    if (!ShareData.IsAzureSTTSDKSetupDone) 
    {
        console.log("Azure Speech SDK 未加載。請確保 SDK 已通過其他方式嵌入到頁面中。");
        return;
    }

    var IsRefreshToken = false;
    const now = Date.now();
    const tokenLimit = 8 * 60 * 1000; // 8 分鐘檢查點
    var token;
    var region;

    if((now - ShareData.TokenTimestamp) > tokenLimit)
    {

      const response = await fetch('https://omni-api.rd-02f.workers.dev/azure-token');

      if (!response.ok) throw new Error("無法取得 Azure Token");

      const data = await response.json();

      console.log(data);

      token = data.token;

      region = data.region || "eastasia";

      IsRefreshToken = true;

      ShareData.TokenTimestamp = now;

    }


    if (!ShareData.AzureRecognizer) {

        console.log("建立 Speech Recognizer");

        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);

        speechConfig.speechRecognitionLanguage = "zh-TW"; // 修改為所需語言代碼
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

        // 初始化 SpeechRecognizer 並將其設置為全域變數
        ShareData.AzureRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        ShareData.AzureRecognizer.recognizing =  (s, e) => {

            this.stttimer.stop();
            console.log(`正在識別: ${e.result.text}`); 
            this.addChatBubble(ShareData.STTString + e.result.text , true);
            
        
        };
        
        ShareData.AzureRecognizer.recognized =  (s, e) => {
            if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {

                console.log(`識別完成: ${e.result.text}`);  
                ShareData.STTString += e.result.text; 

            }
        };

        ShareData.AzureRecognizer.canceled = function (s, e) {
            console.error(`識別取消: ${e.reason}`);
        };

        ShareData.AzureRecognizer.sessionStopped = function (s, e) {
            console.log("識別會話結束");
        };
    }
    else
    {
      if(IsRefreshToken)
      { 
        console.log("更新token");
        ShareData.AzureRecognizer.authorizationToken = token;
      } 
    }


    this.llmtimer.reset();
    this.ttstimer.reset();
    this.stttimer.reset();
    this.stttimer.start();

    ShareData.AzureRecognizer.startContinuousRecognitionAsync(function () {

    console.log("語音識別已啟動");

    },
        function (error) {
            console.error("啟動語音識別時發生錯誤: ", error);

        });


}


stopRecognition() 
{

    this.stopASR();
    return;
    // 如果 AzureRecognizer 變數已定義，則停止識別
    if (ShareData.AzureRecognizer) 
    {
      ShareData.AzureRecognizer.stopContinuousRecognitionAsync(
             () => {

                console.log("識別已停止");
                this.stttimer.stop();

                if(ShareData.STTString != "")
                {
                  this.addChatBubble(ShareData.STTString , true);
                  this.Dify(ShareData.STTString);
                }

                 ShareData.STTString = "";
                 ShareData.IsSTTProcessing = false;




            },
            function (error) {
                console.error("停止識別時出錯: ", error);


            }
        );
    }
    else 
    {
        console.error("沒有識別會話可停止");
    }
}


 async sendToAzure(data) {


  const arrayBuffer = await data.arrayBuffer();



  // 重新建立 AbortController
  ShareData.STTAbortController = new AbortController();
  const signal = ShareData.STTAbortController.signal;
  

try{

const response = await fetch(`https://omni-api.rd-02f.workers.dev/azure`, {
  method: "POST",
  headers: {
      "Content-Type": "audio/wav"
  },
  body: arrayBuffer,
  signal :signal
});


try
{

  const result = await response.json();

  console.log("Azure STT : " + JSON.stringify(result, null, 2));

  Dify(result.DisplayText);


}
catch(e)
{

  console.log("Azure STT Recongnize failed" + e );

}
}
catch (error) {
      if (error.name === 'AbortError') {
          console.log("Azure STT 請求已中斷，但不顯示錯誤訊息");
          return; // 靜默處理，不執行 alert
      }
      alert("request error " + error.message); // 其他錯誤才顯示
  }

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
    if (audioSendCount < 5) {
      //console.log(`[ASR] 送出音訊 #${audioSendCount}, base64 長度: ${base64.length}, WS 狀態: ${this.asrWs.readyState}`);
    }
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
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
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

  this.asrWs.onmessage = (e) => {

    console.log('📩', e.data);

    const msg = JSON.parse(e.data);
    
    if (msg.type === 'session.created') {
      // 跳過 session.update，直接用預設設定開始送音訊
      this.startMicrophone();
      this.videoPlayer.setVideoByKey("Listening");
      this.asrSessionReady = true;
    }

    if (msg.type === 'session.updated') {
      console.log('[ASR] ✅ session.updated 確認:', e.data);
    }

    if (msg.type === 'error') {
      console.error('[ASR] ⚠️ DashScope 回報錯誤:', e.data);
    }

    if (msg.type === 'conversation.item.input_audio_transcription.text') {
      console.log('辨識中:', msg.stash);
      this.addChatBubble(ShareData.STTString + msg.stash , true);
    }

    if (msg.type === 'conversation.item.input_audio_transcription.completed') {
      console.log('✅ 最終:', msg.transcript);
      ShareData.STTString += msg.transcript; 
      this.addChatBubble(ShareData.STTString , true);
    }

    if (msg.type === 'session.finished') {
      console.log('[ASR]  session.finished:', e.data);

        if(ShareData.STTString != "")
        {
            this.addChatBubble(ShareData.STTString , true);
            this.Dify(ShareData.STTString);
        }

        ShareData.STTString = "";
        ShareData.IsSTTProcessing = false;
        this.videoPlayer.setVideoByKey("IdleStand");
    }

  };

  this.asrWs.onclose = (e) =>
    {
        console.log('❌ closed', e.code, e.reason);

        if(ShareData.STTString != "")
        {
            this.addChatBubble(ShareData.STTString , true);
            this.Dify(ShareData.STTString);
        }

        ShareData.STTString = "";
        ShareData.IsSTTProcessing = false;
        this.videoPlayer.setVideoByKey("IdleStand");
    } 

  this.asrWs.onerror = (e) => console.log('⚠️ error', e);

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

  ShareData.IsWarmUpAudio = false;

  clearTimeout(WarmUpData.WarmUpTimer);
  ShareData.HasLLMReplyContent = false;


  WarmUpData.NoAskEndIndex = (WarmUpData.NoAskIndex - 1 < 0) ? (WarmUpData.NoAskText.length -1) : (WarmUpData.NoAskIndex - 1);
  WarmUpData.HasAskEndIndex_en = (WarmUpData.HasAskIndex_en - 1 < 0) ? (WarmUpData.HasAskText_en.length -1) : (WarmUpData.HasAskIndex_en - 1);
  WarmUpData.HasAskEndIndex_ch = (WarmUpData.HasAskIndex_ch - 1 < 0) ? (WarmUpData.HasAskText_ch.length -1) : (WarmUpData.HasAskIndex_ch - 1);

  this.RandomVoice(WarmUpData.NoAsk_audiourl , WarmUpData.NoAsk_emotion , WarmUpData.NoAskText , WarmUpData.NoAskIndex , WarmUpData.NoAskEndIndex);
  this.RandomVoice(WarmUpData.HasAsk_audiourl_en , WarmUpData.HasAsk_emotion_en , WarmUpData.HasAskText_en , WarmUpData.HasAskIndex_en , WarmUpData.HasAskEndIndex_en);
  this.RandomVoice(WarmUpData.HasAsk_audiourl_ch , WarmUpData.HasAsk_emotion_ch , WarmUpData.HasAskText_ch , WarmUpData.HasAskIndex_ch , WarmUpData.HasAskEndIndex_ch);

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

IsEnglish(text) 
{
    let chineseCount = 0;
    let englishCount = 0;

    // 遍歷字符串的每個字符
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);

      // 判斷字符是否是中文
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chineseCount++;  // 中文字符
      }
      // 判斷字符是否是英文字母
      else if (/[a-zA-Z]/.test(char)) {
        englishCount++;  // 英文字母
      }
    }

    if(chineseCount > 0)
      {

          for(const word of ShareData.DifyReplyList_en)
          {
              if(text.includes(word))
              {
                  return true;
              }
          }

          return false;
      }
      else if (englishCount > 0 ) {

          for(const word of ShareData.DifyReplyList_ch)
          {
              if(text.includes(word))
              {
                  return false;
              }
          }

          return true;
          
      }
      else {
          return false;
      }
}



async Dify(InputText) {
  
  if (InputText == "") {
    this.StartAutoTTSTimer(WarmUpData.WarmUpEvent.HasAsk , 15000);
    return;
  }


  this.llmtimer.reset();
  this.llmtimer.start();



  this.ResetDifyGPTInterval();

  this.addChatBubble(InputText, true);

  this.ResetForNewDifyRequest();



  console.log("Dify 送出文字 : " + InputText);
  ShareData.bIsEnglish = this.IsEnglish(InputText);

  InputText += ShareData.bIsEnglish ? " (按照格式用英文回答)" : " (按照格式用繁體中文回答)"; 
  var inputValue = InputText;




  // 重新建立 AbortController
  ShareData.GPTAbortController = new AbortController();
  const signal = ShareData.GPTAbortController.signal;

  const url = 'https://omni-api.rd-02f.workers.dev/dify'; 
  const requestBody = {
      inputs: {PersonDescription : ""},
      query: inputValue,
      response_mode: "streaming",
      conversation_id: ShareData.conversationid,
      user: "abc-123"
  };

  try {
      const response = await fetch(url, {
          method: 'POST', // 設置為 POST 請求
          headers: {
            'Content-Type': 'application/json', // 設置請求的內容類型
          },
          body: JSON.stringify(requestBody), // 將 body 設置為 JSON 字串
          signal: signal, // 這裡傳入 signal 以支持中斷
      });

      if (response.ok) 
      {
          // 获取响应流
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let buffer = '';
     
          // 使用流式读取数据
          while (!done) 
          {
              const { value, done: readerDone } = await reader.read();

              done = readerDone;

              const textchunk = decoder.decode(value, { stream: true });

              buffer += textchunk;

              // 在这里，你可以每次读取到数据时进行处理，比如显示在页面上
              //document.getElementById('response').textContent = buffer;

              while (buffer.includes("\n"))
              {
                  const newlineIndex = buffer.indexOf("\n");
                  const line = buffer.slice(0, newlineIndex);
                  buffer = buffer.slice(newlineIndex + 1);

                  if (line.startsWith("data: "))
                  {
                      const jsonStr = line.slice(6).trim();
                      try 
                      {
                          const parsedData = JSON.parse(jsonStr);

                         
                          ShareData.conversationid = parsedData.conversation_id;
                          const GPTResponse = parsedData.answer;
                          if(parsedData.event == "message")
                          {
                              this.GPTParser(GPTResponse);
                          }
                          else if(parsedData.event == "message_end")
                          {
                              console.log("結束回應");

                          //表示回應格式 情緒未被正確解析
                          if(!ShareData.IsLLMContent)
                          {

                              var text = "";

                              if(ShareData.LLMResponseTemp == "")
                              {
                                  this.videoPlayer.setVideoByKey("Talking");
                                  text = ShareData.bIsEnglish ? "Sorry, i cant understand, could you say again?" : "不好意思，我不太清楚，你可以再說一遍嗎？";
                              }
                              else
                              {
                                  this.videoPlayer.setVideoByKey("Waving");
                                  text = ShareData.LLMResponseTemp + '。';
                              }

                              ShareData.IsNewAIBubble = true;
                              this.addChatBubble(text , false );
                              this.SendToElevenlabs(text);
                
                          }
                          else
                          {

                         
                              //有情緒；有回應文字；但結尾未出現符號造成最後一句沒送到TTS 
                              if(ShareData.LLMResponseTemp != "")
                              {
                                  this.EmitValue(true, "", true);
                              }
                              //有情緒；無回應文字 手動作回應補償
                              else if(!ShareData.HasLLMReplyContent)
                              {
                                  const text = ShareData.bIsEnglish ? "Sorry, i cant understand, could you say again?" : "不好意思，我不太清楚，你可以再說一遍嗎？";
                                  ShareData.IsNewAIBubble = true;
                                  this.addChatBubble(text , false );
                                  this.SendToElevenlabs(text);
                              }

                          } 

                          }
                          else if(parsedData.event == "ping")
                          {
                              
                          }
                          else if(parsedData.event == "message_replace")
                          {
                              continue;
                          }

                      }
                      catch(e)
                      {
                          console.log(e.message);
                      }

                  }

              }
          }

      } 
      else
      {
          alert("request error" + response.status);
          throw new Error('請求失敗，狀態碼：' + response.status);
      }
  } 
  catch (error) {
      if (error.name === 'AbortError') {
          console.log("TTS 請求已中斷，但不顯示錯誤訊息");
          return; // 靜默處理，不執行 alert
      }
      alert("request error " + error.message); // 其他錯誤才顯示
  }
}


ResetDifyGPTInterval()
{
  clearInterval(ShareData.DifyGPTheartbeatInterval);

  ShareData.DifyGPTheartbeatInterval = setInterval(() => {
        
    this.DifyKeepAlive();
    console.log("發送心跳訊號");
      
     }, 120000); // 每2分鐘發送一次
}

async DifyKeepAlive()
{
  console.log("Dify發送心跳訊號");

  const controller = new AbortController();
  const signal = controller.signal;

  const url = 'https://omni-api.rd-02f.workers.dev/dify'; // 替換成你的 API 端點
          const requestBody = {
            inputs : {PersonDescription : ""},
            query : " ",
            response_mode : "streaming",
            conversation_id : ShareData.conversationid,
            user : "abc-123"
          };
        
    try {
        const response = await fetch(url, {
            method: 'POST', // 設置為 POST 請求
            headers: {
                'Content-Type': 'application/json', // 設置請求的內容類型
               
            },
            body: JSON.stringify(requestBody), // 將 body 設置為 JSON 字串
            signal : signal,
        });  

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
            while (true) {
                // 👇 支援 AbortController：會在 signal.abort 時跳出
                const { value, done } = await reader.read();
                if (done) break;

                // 讀到資料
                const chunk = decoder.decode(value, { stream: true });
                result += chunk;

                // 持續處理每段資料
                const parts = chunk.split('\n\n');
              for (const part of parts) {
                if (part.length > 5) {
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    try {
                        const parsed = JSON.parse(part.substring(5));
                        

                        console.log("心跳包發送成功");

                        if (ShareData.conversationid === "") 
                        {
                            ShareData.conversationid = parsed.conversation_id;
                        }
                        return; 
                    } 
                    catch (e) {
                        // 可能還沒解析完
                    }
                }
              }
            }
          }
        }
     catch (error) {

        console.log("request error " + error.message); // 其他錯誤才顯示
    }
}

GPTParser(Response)
{

    // "情緒" 和 "回應" 會用 §¶ 兩個關鍵字 隔開
    // EX : Happy§¶你好啊!§¶ 
    // "情緒" 完成判斷會在這裡，"回應"完成判斷會在 API message_end 事件

    //循環取字元判斷
    for(var c of Response)
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


EmitValue(IsReplyContent , text , IsComplete)
{


  // 將字元累加至聊天氣泡的字串
  ShareData.LLMResponseTemp = ShareData.LLMResponseTemp + text;



  //LLM 實際"回應"
  if (IsReplyContent)
  {

      this.llmtimer.stop();
      this.addChatBubble(text, false);

      if(IsComplete && ShareData.LLMResponseTemp != "")
      {
        ShareData.LLMResponseTemp += '。';
      }

      // 檢查最後一個字元是否為標點符號
      const punctuationPattern = /[。．！？!?.~，,]$/;

      if (punctuationPattern.test(ShareData.LLMResponseTemp)) {
      
        console.log("執行 TTS => " + ShareData.LLMResponseTemp);


        ShareData.HasLLMReplyContent = true;

        // 呼叫 ElevenLabs 播放語音
        if(ShareData.TTSIsWaitRequest)
            ShareData.TTSTextQueue.push(ShareData.LLMResponseTemp);
          else
          {
              ShareData.TTSIsWaitRequest = true;
              this.SendToElevenlabs(ShareData.LLMResponseTemp);
          }
          
        // 清空 LLMResponseTemp，準備累積下一段
        ShareData.LLMResponseTemp = "";
      }

  }
   //LLM 情緒
  else
  {
      // 段落完成，準備傳給 ElevenLabs 做 TTS
      if (!IsComplete)
      {
          return;
      }

      console.log("情緒 : "+ShareData.LLMResponseTemp);
      const cleaned = ShareData.LLMResponseTemp.replace(/[\s\n]/g, '');
        
      if(this.videoPlayer.animationList.hasOwnProperty(cleaned))
      {

        console.log("回應情緒存在 : " + cleaned);
        this.videoPlayer.setVideoByKey(cleaned);
        ShareData.LLMResponseTemp = "";

      }
      else
      {

        console.log("回應情緒不存在 : " + cleaned);
        this.videoPlayer.setVideoByKey("Waving");
        this.addChatBubble(ShareData.LLMResponseTemp , false);

        // 檢查最後一個字元是否為標點符號
        const punctuationPattern = /[。．！？!?.~，,]$/;
        if (punctuationPattern.test(ShareData.LLMResponseTemp)) {
        
      
        ShareData.HasLLMReplyContent = true;

        // 呼叫 ElevenLabs 播放語音
        if(ShareData.TTSIsWaitRequest)
            ShareData.TTSTextQueue.push(ShareData.LLMResponseTemp);
        else
        {
            ShareData.TTSIsWaitRequest = true;
            this.SendToElevenlabs(ShareData.LLMResponseTemp);
        }
            
        // 清空 LLMResponseTemp，準備累積下一段
        ShareData.LLMResponseTemp = "";


        }
      }
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
 
  // while(/*chatContainer.scrollHeight > chatContainer.clientHeight && */chatContainer.childElementCount > 20)
  // {
  //   console.log("超出 20 bubble");
  //   const firstChild = chatContainer.children[0];
  //   if(firstChild)
  //   {
  //     ShareData.BubblePool.push(firstChild);
  //     chatContainer.removeChild(firstChild);
  //   }
     
  // }

  // 自動滾動到最底部

    
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
          if(ShareData.IsWarmUpAudio)
            {

              this.StartAutoTTSTimer(WarmUpData.NextAutoTTSEvent , WarmUpData.NextAutoTTSEventDuration);
            }
            else
            {
            
              this.StartAutoTTSTimer(WarmUpData.WarmUpEvent.HasAsk , 15000);

            }

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
          // console.error("播放音檔時發生錯誤:", err);
          ShareData.isPlaying = false;
          this.playAudioQueue();  // 播放下一段
      });
  }
  //#endregion


 RandomVoice(audiourl , emotion , text , index , endindex)
  {
    //No Ask
    const len = audiourl.length;
    const LastURL =  audiourl[(index - 1 < 0) ? (len -1) : (index - 1)];
     
  
     for (let i = len - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
  
  
      [audiourl[i], audiourl[j]] = [audiourl[j], audiourl[i]];
      [emotion[i], emotion[j]] = [emotion[j], emotion[i]];
      [text[i], text[j]] = [text[j], text[i]];
  
  
    }
  
    if(LastURL == audiourl[index])
    {
  
      [audiourl[index], audiourl[endindex]] = [audiourl[endindex], audiourl[index]];
      [emotion[index], emotion[endindex]] = [emotion[endindex], emotion[index]];
      [text[index], text[endindex]] = [text[endindex], text[index]];
    }
  
  
  }


StartAutoTTSTimer(event , duration)
  {


      return;
    
      console.log("在 " + duration / 1000 + " 秒後進行暖場表演  :  "+ event );
      clearTimeout(WarmUpData.WarmUpTimer);
      
      switch (event) 
      {
          case WarmUpData.WarmUpEvent.Opening:

              WarmUpData.WarmUpTimer = setTimeout(() => {
                  
                  this.StartAutoTTS(WarmUpData.Opening_emotion[WarmUpData.OpeningIndex],  WarmUpData.OpeningText[WarmUpData.OpeningIndex], WarmUpData.Opening_audiourl[WarmUpData.OpeningIndex]);

                  if(++WarmUpData.OpeningIndex >= WarmUpData.OpeningText.length)
                  {
                      WarmUpData.OpeningIndex = 0;

                      this.RandomVoice(WarmUpData.Opening_audiourl , WarmUpData.Opening_emotion , WarmUpData.OpeningText , WarmUpData.OpeningIndex , WarmUpData.Opening_audiourl.length - 1);
                  }

                  WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.NoAsk;
                  WarmUpData.NextAutoTTSEventDuration = 15000;


              }, duration);
       
          break;

          case WarmUpData.WarmUpEvent.NoAsk:

              WarmUpData.WarmUpTimer = setTimeout(() => {
                      
                  this.StartAutoTTS(WarmUpData.NoAsk_emotion[WarmUpData.NoAskIndex] ,WarmUpData.NoAskText[WarmUpData.NoAskIndex], WarmUpData.NoAsk_audiourl[WarmUpData.NoAskIndex]);  
                    
                  if(WarmUpData.NoAskIndex == WarmUpData.NoAskEndIndex)
                  {
                      WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.BeforeClear;
                      WarmUpData.NextAutoTTSEventDuration = 15000;
                  }
                  else
                  {
                      WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.NoAsk;
                      WarmUpData.NextAutoTTSEventDuration = 15000;
                  }

                  if(++WarmUpData.NoAskIndex >= WarmUpData.NoAskText.length)
                  {
                      WarmUpData.NoAskIndex = 0;
                  }
                  

                  

              }, duration);

          break;


          case WarmUpData.WarmUpEvent.HasAsk:

              WarmUpData.WarmUpTimer = setTimeout(() => {
                  
                  const HasAskText = ShareData.bIsEnglish? WarmUpData.HasAskText_en : WarmUpData.HasAskText_ch;
                  const HasAskIndex = ShareData.bIsEnglish? WarmUpData.HasAskIndex_en : WarmUpData.HasAskIndex_ch;
                  const HasAskEndIndex = ShareData.bIsEnglish ? WarmUpData.HasAskEndIndex_en : WarmUpData.HasAskEndIndex_ch;
                  const HasAsk_emotion = ShareData.bIsEnglish ? WarmUpData.HasAsk_emotion_en : WarmUpData.HasAsk_emotion_ch;
                  const HasAsk_audiourl = ShareData.bIsEnglish ? WarmUpData.HasAsk_audiourl_en : WarmUpData.HasAsk_audiourl_ch;

                  this.StartAutoTTS(HasAsk_emotion[HasAskIndex] ,HasAskText[HasAskIndex], HasAsk_audiourl[HasAskIndex]);

                  if(HasAskIndex == HasAskEndIndex)
                  {
                      WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.BeforeClear;
                      WarmUpData.NextAutoTTSEventDuration = 15000;
                  }
                  else
                  {
                      WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.HasAsk;
                      WarmUpData.NextAutoTTSEventDuration = 15000;
                  }

                  if(HasAskIndex + 1 >= HasAskText.length)
                  {
                      if(ShareData.bIsEnglish)
                      {
                          WarmUpData.HasAskIndex_en = 0;
                      }
                      else
                      {
                          WarmUpData.HasAskIndex_ch = 0;
                      }

                      
                  }
                  else
                  {
                      if(ShareData.bIsEnglish)
                      {
                          WarmUpData.HasAskIndex_en++;
                      }
                      else
                      {
                          WarmUpData.HasAskIndex_ch++;
                      }
                  }

                  
                 
      
              }, duration);
              
              



          break;

          case WarmUpData.WarmUpEvent.BeforeClear:

              WarmUpData.WarmUpTimer = setTimeout(() => {
                  
                  const BeforeClearText = ShareData.bIsEnglish ? WarmUpData.BeforeClearText_en : WarmUpData.BeforeClearText_ch;
                  const BeforeClearIndex = ShareData.bIsEnglish ? WarmUpData.BeforeClearIndex_en : WarmUpData.BeforeClearIndex_ch;
                  const BeforeClear_emotion = ShareData.bIsEnglish ? WarmUpData.BeforeClear_emotion_en : WarmUpData.BeforeClear_emotion_ch;
                  const BeforeClear_audiourl = ShareData.bIsEnglish ? WarmUpData.BeforeClear_audiourl_en : WarmUpData.BeforeClear_audiourl_ch;

                  this.StartAutoTTS(BeforeClear_emotion[BeforeClearIndex] ,BeforeClearText[BeforeClearIndex], BeforeClear_audiourl[BeforeClearIndex]);

                  WarmUpData.NextAutoTTSEvent = WarmUpData.WarmUpEvent.Clear;
                  WarmUpData.NextAutoTTSEventDuration = 5000;

                  if(BeforeClearIndex + 1 >= BeforeClearText.length)
                  {
                      if(ShareData.bIsEnglish)
                      {
                          WarmUpData.BeforeClearIndex_en = 0;

                          this.RandomVoice(WarmUpData.BeforeClear_audiourl_en , WarmUpData.BeforeClear_emotion_en , WarmUpData.BeforeClearText_en , WarmUpData.BeforeClearIndex_en ,WarmUpData.BeforeClear_audiourl_en.length - 1 );
                      }
                      else
                      {
                          WarmUpData.BeforeClearIndex_ch = 0;

                          this.RandomVoice(WarmUpData.BeforeClear_audiourl_ch , WarmUpData.BeforeClear_emotion_ch , WarmUpData.BeforeClearText_ch , WarmUpData.BeforeClearIndex_ch ,WarmUpData.BeforeClear_audiourl_ch.length - 1 );
                      }

                  }
                  else
                  {
                      if(ShareData.bIsEnglish)
                      {
                          WarmUpData.BeforeClearIndex_en++;
                      }
                      else
                      {
                          WarmUpData.BeforeClearIndex_ch++;
                      }

                  }
          
                  
  
              }, duration);


          break;


          case WarmUpData.WarmUpEvent.Clear:

          WarmUpData.WarmUpTimer = setTimeout(() => {
              ShareData.conversationid = "";
              this.clearChatBubbles()
              this.DifyKeepAlive();
              this.ResetDifyGPTInterval();
              ShareData.bIsEnglish = true;
              this.StartAutoTTSTimer(WarmUpData.WarmUpEvent.Opening , 1);
              
            }, duration);
              

          break;


          default:
              break;
      }



  }




 StartAutoTTS(anim , text, audiourl)
  {
     
      ShareData.IsWarmUpAudio = true;
      this.videoPlayer.setVideoByKey(anim);

      ShareData.IsNewAIBubble = true;
      this.addChatBubble( text , false );

      ShareData.AudioQueue.push(audiourl);
      this.playAudioQueue();

    
   
        
  }




//#region TTS


  async SendToElevenlabs(InputText) {

               
            this.ttstimer.start();
            var inputValue = InputText;
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
                "text": InputText,
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

          
        //   // 轉換為 Blob 對象並生成音頻 URL
        //   const audioBlob = await response.blob();
        //   const audioUrl = URL.createObjectURL(audioBlob);

        //   // 5. 將音檔 URL 存入佇列中
        //   ShareData.AudioQueue.push(audioUrl);

          const result = await response.json();
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



          // // 設置音頻播放器
          // const audioPlayer = document.getElementById("audioPlayer");
          // audioPlayer.src = audioUrl;
          // audioPlayer.play();
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
                displayHeights[i] = displayHeights[i];

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



