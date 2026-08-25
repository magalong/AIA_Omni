// 圖片用字串常數（不要用 import URL，否則會被當成 ES module 載入而觸發 CORS）
const BG_16_9 = 'https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/background/BG_16_9.jpg';
const BG_9_16 = 'https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/background/BG_9_16.jpg';

// 本地測試：影片放在 public/，Vite 會以根路徑 / 服務（正式再換回 CDN/OSS 網址）
const mainVideoFile = "https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/video/ROG_OMNI_Video.webm";
const mainVideoFileforios = "https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com/video/ROG_OMNI_Video.mp4";
// 依照平台選取影片檔案
function isIOS(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
}


export class SimpleVideoPlayer {


    // 定義所有動作類型對應的動畫片段名稱
    public animationList: { [key: string]: string[] } = {
    'IdleStand': ['01_Standing'],
    'Smile': ['13_TwisDance', '16_SillyDance'],
    'Listening': ['08_Thinking'],
    'Talking': ['42_Whisper', '43_Kneel'],
    'Waving': ['17_WavingGesture', '34_Waving(1)'],
    'Happy': ['41_Smile'],
    'Exciting': ['03_Excited', '35_Excited(1)','39_Boxing'],
    'Sad': ['14_SadIdle'],
    'Shock':['07_Suprised(1)','32_Suprised(2)','27_LookAround'],
    'Compliment':['28_StandingTauntChestThump'],
    'Pride':['31_Pride_Seq01','28_StandingTauntChestThump'],
    'Cool':['12_WaveHipHopDance', '13_TwisDance', '16_SillyDance'],
    'Scanning':['27_LookAround','44_Seeking'],
    'Unsure':['07_Suprised(1)','32_Suprised(2)'],
    'Like':['13_TwisDance', '16_SillyDance'],
    'Show off':['22_NorthenSoulSpin','12_WaveHipHopDance'],
    'News':['35_Excited(1)','39_Boxing'],
    'Whisper':['42_Whisper','43_Kneel'],
    'ThinkTooLong':['27_LookAround','44_Seeking'],
    };

    // 定義影片中各片段的時間範圍
    private videoSegments: { [key: string]: { start: number; end: number } } = {
        '01_Standing': { start: 0.03, end: 2.95 },
        '03_Excited': { start: 3.20, end: 11.40 },
        '07_Suprised(1)': { start: 11.57, end: 15.03 },
        '08_Thinking': { start: 15.20, end: 19.10 },
        '12_WaveHipHopDance': { start: 19.27, end: 20.43 },
        '13_TwisDance': { start: 20.60, end: 30.03 },
        '14_SadIdle': { start: 30.20, end: 33.00 },
        '16_SillyDance': { start: 33.17, end: 37.00 },
        '17_WavingGesture': { start: 37.17, end: 38.97 },
        '22_NorthenSoulSpin': { start: 39.13, end: 43.17 }, // 對應圖片 22_NorthenSoulSp
        '27_LookAround': { start: 43.33, end: 46.00 },
        '28_StandingTauntChestThump': { start: 46.17, end: 49.37 }, // 對應圖片 28_StandingTaunt
        '31_Pride_Seq01': { start: 49.53, end: 54.63 }, // 對應圖片 31_Pride_Seq01_S
        '32_Suprised(2)': { start: 54.80, end: 58.13 }, // 對應圖片 32_Suprised(2)_S
        '34_Waving(1)': { start: 58.30, end: 59.87 },   // 對應圖片 34_Waving(1)_Seq
        '35_Excited(1)': { start: 60.03, end: 62.63 },  // 對應圖片 35_Excited(1)_Se
        '39_Boxing': { start: 62.80, end: 69.57 },      // 對應圖片 39_Boxing_Seq01_
        '40_Talking': { start: 69.73, end: 79.40 },     // 對應圖片 40_Talking(4)_Se
        '41_Smile': { start: 79.57, end: 86.13 },       // 對應圖片 41_Smile_Seq01_S
        '42_Whisper': { start: 86.30, end: 92.30 },     // 對應圖片 42_Whisper_Seq03
        '43_Kneel': { start: 92.47, end: 100.23 },      // 對應圖片 43_Kneel_Seq03_s
        '44_Seeking': { start: 100.40, end: 103.47 }    // 對應圖片 44_Seeking_Seq01
    };


    private segmentCheckIntervalId: number | null = null;
    private videoElement!: HTMLVideoElement; // 影片播放元素
    private backgroundElement!: HTMLDivElement; // 背景容器元素
    // @ts-ignore


    private currentAnimationKey: string | null = null;//目前的情緒
    private currentAnimationIndex: number = 0;//情緒內的影片index
    private segment : { start: number; end: number; } = {start:1 , end :1};





    private currentSegment: string | null = ""; // 目前播放段落
    // private segmentCheckId: number | null = null; // 播放動畫名稱檢查的ID





    public Initialize(): void {

        console.log("Video Player Init");

        this.videoElement = document.getElementById('video-player') as HTMLVideoElement;
        this.backgroundElement = document.getElementById('background') as HTMLDivElement;


        // 配置影片元素以提升效能

        // 自動預載
        this.videoElement.preload = 'auto'; 
        // 在 iOS 上重要
        this.videoElement.playsInline = true; 


        //解析度檢查 使用16:9 或 9:16
        this.CheckResolution();

        //加載媒體資源
        this.LoadMedia();

        // 設置初始動作
        this.setVideoByKey('IdleStand'); 
        
    }


    private async LoadMedia(): Promise<void> {



        //Html 元件設置
        const loadingBar = document.getElementById('loading-bar') as HTMLProgressElement;
        const loadingText = document.getElementById('loading-progress') as HTMLParagraphElement;


        //要載入的主影片（所有動作都在這一支大檔裡，用時間軸切換）
        const Video = isIOS() ? mainVideoFileforios : mainVideoFile;

        //更新進度條與文字（0~100）
        const setProgress = (percent: number) => {
            const p = Math.max(0, Math.min(100, Math.floor(percent)));
            if (loadingBar) loadingBar.value = p;
            if (loadingText) loadingText.textContent = `Loading... ${p}%`;
        };

        //關閉 loading 畫面、顯示主畫面
        const hideLoadingScreen = () => {
            const loadingScreen = document.getElementById('loading-screen');
            const app = document.getElementById('app');
            if (loadingScreen && app) {
                loadingScreen.style.display = 'none';
                app.style.display = 'block';
            }
        };

        //以「已緩衝時間 / 影片總長度」計算下載進度，做出真正漸進的 loading 效果
        await new Promise<void>((resolve) => {
            let done = false;

            const finish = () => {
                if (done) return;
                done = true;
                setProgress(100);
                hideLoadingScreen();
                resolve();
            };

            const onProgress = () => {
                const v = this.videoElement;
                if (v.duration > 0 && v.buffered.length > 0) {
                    // 用最後一段緩衝的結尾位置估算下載百分比
                    setProgress((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
                }
            };

            // progress：下載到新資料時觸發，用來漸進更新進度條
            this.videoElement.addEventListener('progress', onProgress);
            this.videoElement.addEventListener('loadedmetadata', onProgress);
            // canplaythrough：已可流暢播放 → 視為載入完成
            this.videoElement.addEventListener('canplaythrough', finish);
            this.videoElement.addEventListener('error', finish);

            // fallback：5 秒仍未完成也放行，避免永遠卡在 loading
            setTimeout(() => {
                if (!done) {
                    console.warn(`Timeout while loading video: ${Video}`);
                    finish();
                }
            }, 15000);

            this.videoElement.src = Video;
            this.videoElement.load();
        });

        
    }


    private CheckResolution()
    {
        
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;
        const ratio: number = width / height;
       
        if( Math.abs((ratio - 16/9)) <= Math.abs((ratio - 9/16)) )
        {
            this.backgroundElement.style.backgroundImage = `url(${BG_16_9})`;
            console.log("目前是 16:9 或更寬的螢幕");
        }
        else
        {
            this.backgroundElement.style.backgroundImage = `url(${BG_9_16})`;
            console.log("目前是 9:16 或更窄的螢幕");
        }
    }


    public setVideoByKey(key: string): void {

        console.log(`動作類型: ${key}`);

        const animations = this.animationList[key];
   
        if (!animations || animations.length === 0) {
            console.warn(`找不到對應動畫: ${key}`);
            return;
        }


        //輪播隨機播放
        this.currentAnimationKey = key;
        const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % animations.length;
        this.currentAnimationIndex = randomIndex;
        const targetName = animations[randomIndex];
        const segment = this.videoSegments[targetName];


        if (!segment) {
            console.error(`找不到片段定義: ${targetName}`);
            return;
        }



        if (targetName === this.currentSegment) {
            console.log(`已在播放 "${targetName}"，略過重複切換`);
            return;
        }

        
        this.playSegment(targetName);
    }



    private playSegment(name: string): void {

        console.log("切換動畫:", name);

        if (this.currentSegment === name) {
            return;
        }

        this.segment = this.videoSegments[name];
        if (!this.segment) {
            console.error(`找不到片段定義: ${name}`);
            return;
        }

        if (this.segmentCheckIntervalId !== null) {
            clearInterval(this.segmentCheckIntervalId);
            this.segmentCheckIntervalId = null;
        }

        const onSeeked = () => {
            this.videoElement.removeEventListener('seeked', onSeeked);
            this.currentSegment = name;
            this.videoElement.play().catch(e => {
                console.error(`播放失敗: ${e}`);
            });
        };

        this.videoElement.addEventListener('seeked', onSeeked);
        this.videoElement.currentTime = this.segment.start;
       

        this.segmentCheckIntervalId = window.setInterval(() => {
            if (!this.segment) return;
         
            if (this.videoElement.currentTime >= this.segment.end) {
                const key = this.currentAnimationKey;
                const animations = key ? this.animationList[key] : null;
               
                //判斷情緒內是不是有多組動畫
                if (animations && animations.length > 1) {
                    // 輪播下一段動畫
                    this.currentAnimationIndex = (this.currentAnimationIndex + 1) % animations.length;
                    const nextSegmentName = animations[this.currentAnimationIndex];
                    this.playSegment(nextSegmentName);
                  
                } else {
                    //重新播放同段影片
                    this.videoElement.currentTime = this.segment.start;
                   
                }
            }
        }, 10);
    }
}

