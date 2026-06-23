import './style.css';
// @ts-ignore
import {ShareData , Coordinator} from './Coordinator.js';
const push_black = 'https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/icon/icon_push_black_red.png';
const push = 'https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/icon/icon_push_red.png';



//音訊流
let micStream: MediaStream | null = null;

//麥克風權限狀態
let IsMicAllow = false;

//麥克風是否正在收音
let IsMicRecording:boolean = false;

//AI 服務 Script
let _Coordinator : Coordinator = null;

//是否開始使用服務 (關閉進入網頁遮罩)
let IsStartService = false;



//HTML 元件

// 按鈕類：使用 HTMLButtonElement 才能存取 .disabled 等屬性
const PresstoTalkBtn = document.getElementById('PresstoTalkbutton') as HTMLButtonElement;
const StartBtn = document.getElementById('StartBtn') as HTMLButtonElement;

// 容器類：一般的 <div> 使用 HTMLDivElement
const PresstoTalkDiv = document.getElementById('PresstoTalk') as HTMLDivElement;

// 畫布類：使用 HTMLCanvasElement 才能存取 .getContext('2d')
const WaveformCanvas = document.getElementById('waveform') as HTMLCanvasElement;

//驗收用
const DebugContainer = document.getElementById('status-container') as HTMLDivElement;

//監聽網頁載入完成
window.addEventListener("load", async () => 
{


    // 等待影片和背景圖片都載入完成
    console.log("window load success");


    //初始化物件
    _Coordinator = new Coordinator();

    _Coordinator.Initialize();



    const video = document.getElementById("video-player") as HTMLVideoElement;
    const background = document.getElementById("background") as HTMLDivElement;

    const checkVideoReady = new Promise<void>((resolve) => {
        if (video.readyState >= 3) {
            resolve();
        } else {
            video.addEventListener("canplaythrough", () => resolve(), { once: true });
        }
    });

    const checkBackgroundReady = new Promise<void>((resolve) => {
        const bg = new Image();
        bg.src = background.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        if (bg.complete) {
            resolve();
        } else {
            bg.onload = () => resolve();
        }
    });

    await Promise.all([checkVideoReady, checkBackgroundReady]);

    // 載入完成後顯示 app，隱藏 loading
    const loading = document.getElementById("loading-screen");
    const app = document.getElementById("app");

    if (loading && app) {
        loading.style.display = "none";
        app.style.display = "block";
    }
});

//導出函數 
export function GetIsMicRecording()
{
    return IsMicRecording;
}


//開始按鈕綁定
if (StartBtn) {
    StartBtn.addEventListener('click', () => 
    {


        console.log("關閉起始畫面 開始服務");


        IsStartService = true;



        //關閉開始按鈕
        const targetDiv = document.getElementById('StartBtnDiv');
        if (targetDiv) 
        {
            targetDiv.style.display = 'none';
        }



        
    });
}

//按下/放開 收音處理
function HandleRecording(IsStartRecord : boolean)
{
    

    const CheckRecord = function() 
    {
        //檢查是否STT SDK 初始化完成
        if(!ShareData.IsAzureSTTSDKSetupDone)
        {
            return;
        }

        //執行動作重複
        if(IsMicRecording == IsStartRecord)
        {
            return;
        }

        //檢查動作為錄音時，是否STT為閒置
        if(IsStartRecord && ShareData.IsSTTProcessing)
        {
            return;
        }


        IsMicRecording = IsStartRecord;

        ShareData.IsSTTProcessing = true;

        if(IsMicRecording)
        {
            console.log("開始 STT 語音辨識");

            PresstoTalkDiv.querySelector("p")!.innerText = "Release To Send";
            PresstoTalkBtn.querySelector("img")!.src=push_black;
            WaveformCanvas.style.display = 'block';
            _Coordinator.ResetForNewDifyRequest();


            //_Coordinator.videoPlayer.setVideoByKey("Listening");
            
            _Coordinator.startRecognition();

        }
        else
        {
            console.log("結束 STT 語音辨識");

            PresstoTalkDiv.querySelector("p")!.innerText = "Press To Talk";
            PresstoTalkBtn.querySelector("img")!.src=push;
            WaveformCanvas.style.display = 'none';

            //_Coordinator.videoPlayer.setVideoByKey("IdleStand");

            _Coordinator.stopRecognition();
        }
    };

    if(!IsMicAllow && IsStartRecord)
    {
        
        navigator.permissions.query({ name: "microphone" as PermissionName })
        
        .then((result) => 
        {
      
            if (result.state === "granted") 
            {
                console.log("麥克風權限 已允許");
                SetupMediaStream();
                IsMicAllow = true;
                CheckRecord();

            } 
            else if (result.state === "prompt") 
            {
                console.log("麥克風權限 請求中");
                SetupMediaStream();
                WaveformCanvas.style.display = 'none';
                CheckRecord();
            } 
            else if (result.state === "denied") 
            {
                console.log("麥克風權限 已被拒絕");
            }
        });

        
    }
    else
    {
        CheckRecord();
              
    }
        



    
    
}

//檢查麥克風權限
function SetupMediaStream() 
{

    if(micStream != null)
    {
        return;
    }

    const constraints = {
        audio: {
          // --- WebRTC 內建處理選項 ---
          echoCancellation: true, // 建議開啟，雖然主要針對回音，但有時對整體音質有益
          noiseSuppression: true, // **這是最相關的選項，用於抑制背景噪音**
          autoGainControl: true,  // 自動調整音量，效果可能因裝置而異
  
          // --- 其他可能選項 (非所有瀏覽器/設備都支援) ---
          // latency: 0.01, // 嘗試要求低延遲
          // channelCount: 1, // 通常設為單聲道用於 STT
          // sampleRate: 16000, // 許多 STT 服務偏好的取樣率
          // sampleSize: 16     // 位元深度
        },
        video: false // 我們只需要音訊
      };

    try 
    {

        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream: MediaStream) => 
        {
            // 這裡的 stream 型別自動推斷為 MediaStream
            console.log("取得音訊串流", stream);
            micStream = stream;
            _Coordinator.OnGetMedaiStream(stream);
            
         

        })
        .catch((err: DOMException) => {
          console.error("無法取得麥克風：", err);
        });


      } 
      catch (err)
      {
        console.error("無法存取麥克風：", err);
      }
}




//監聽視窗狀態
document.addEventListener('visibilitychange', async function() 
{
    if (document.visibilityState === 'hidden') 
    {

        if (micStream) 
        {
            micStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            IsMicAllow = false;
            micStream = null;
            console.log('🔴 瀏覽器切到背景了！關閉麥克風');
        }

        ShareData.audioElement.muted = true;
   


        console.log('🔴 瀏覽器切到背景了！');

    } 
    else if (document.visibilityState === 'visible') 
    {
        
        ShareData.audioElement.muted=false;
     

        console.log('🟢 瀏覽器回到前台了！');
    }
});









//監聽滑鼠點擊

if (PresstoTalkBtn) {
    PresstoTalkBtn.addEventListener('mousedown', () => {

        HandleRecording(true);
    }, { passive: false });
}

//監聽滑鼠鬆開
window.addEventListener('mouseup', () => {
    HandleRecording(false);
});




//按鍵按下按鍵
document.addEventListener('keydown', function(event: KeyboardEvent) {


    // 全螢幕開啟
    if (event.key === 'F' || event.key === 'f') 
    {
        console.log("全螢幕開啟");
        _Coordinator.toggleFullScreen(true); // 呼叫從 JS 檔案導入的函數
    }

    // 全螢幕關閉
    else if (event.key === 'Escape') 
    {
        console.log("全螢幕關閉");
        _Coordinator.toggleFullScreen(false); // 呼叫從 JS 檔案導入的函數
    }
    else if (event.key == ' ' || event.key == ' ') 
    {
        if(IsStartService)
        {
            HandleRecording(true);
        }
    }
    else if (event.key === 'O' || event.key === 'o') 
    {
        console.log("開啟關閉計時頁面");
        
        if (DebugContainer) 
        {
            // 檢查當前 display 屬性
            const isHidden: boolean = DebugContainer.style.display === 'none';
            DebugContainer.style.display = isHidden ? 'block' : 'none';
        } 
        else 
        {
            console.warn("找不到 id 為 'status-container' 的元素");
        }
    }

    
});

//按鍵鬆開按鍵
document.addEventListener('keyup', function(event: KeyboardEvent) {
    if(event.key == ' ' || event.key == ' ')
    

        if(IsStartService)
        {
           HandleRecording(false);
        }

});





