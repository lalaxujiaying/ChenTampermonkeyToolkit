// ==UserScript==
// @name         ChenTampermonkeyToolkit
// @namespace    http://tampermonkey.net/
// @version      1.8.6
// @description  自用chrome网页脚本工具
// @author       Chen
// @match		https://www.bilibili.com/video/*
// @match		https://www.douyu.com/directory/myFollow*
// @match		https://www.douyu.com/*
// @match		https://v.douyu.com/show/*
// @match		https://www.huya.com/video/play/*
// @match		https://www.huya.com/*
// @match		https://www.youtube.com/*
// @match		https://www.twitch.tv/*
// @run-at       document-end
// @grant GM_xmlhttpRequest
// @connect douyu.com
// @updateURL    https://raw.githubusercontent.com/lalaxujiaying/ChenTampermonkeyToolkit/master/ChenTampermonkeyToolkit.js
// @downloadURL  https://raw.githubusercontent.com/lalaxujiaying/ChenTampermonkeyToolkit/master/ChenTampermonkeyToolkit.js
// ==/UserScript==

(function() {
    'use strict';

    const currentDomain = window.location.href;

    Main();
    function Main(){
        FullscreenVideo();
        DouyuMyFollowPageFunction();
        VideoProgressJumper();
    }
    function DelayFunc(){
    }

    // 获取当前域名匹配的站点配置（包含全屏按钮选择器、是否视频站等）
    function GetSiteConfig(){
        const siteConfig = {
            'bilibili.com': {
                selector : '.bpx-player-ctrl-full',
                isVideo : true
            },
            'youtube.com': {
                selector : '.ytp-fullscreen-button',
                isVideo : true
            },
            'twitch.tv': {
                selector : 'button[data-a-target="player-fullscreen-button"]',
                isVideo : true
            },
            'huya.com/video':{
                selector : 'button[class="style__controlBarFullscreenButton___7_tQe style__controlBarButton___2cjb4"]',
                isVideo : true
            },
            'huya.com':{
                selector : '.player-fullscreen-btn',
                isVideo : true
            },
            'v.douyu.com/show':{
                selector : '.ControllerBar-WindowFull-Icon',
                shadowPath : ['demand-video','demand-video-controller-bar'],
                isVideo : true
            },
            'douyu.com': {
                selector : '.controlbar__LhZiJ .right-17e251 > .icon-c8be96:has(path[d="M20 25h5v-5M20 7h5v5M12 7H7v5M12 25H7v-5"])',
                isVideo : true
            },
        };
        for (const domain in siteConfig) {
            if (currentDomain.includes(domain)) {
                return { domain, config: siteConfig[domain] };
            }
        }
        return null;
    }

    function FullscreenVideo(){
         function GetElement(selector){
             return document.querySelector(selector.selector)
         }
        function GetElementWithShadowPath(selector){
            let currentSelector = selector.selector
            let currentShadowPath = selector.shadowPath
            let currentElement = document.querySelector(currentShadowPath[0]);
            if (!currentElement) return null;
            for(let i = 1;i < currentShadowPath.length; i++){
                currentElement = currentElement.shadowRoot.querySelector(currentShadowPath[i])
            }
            return currentElement.shadowRoot.querySelector(currentSelector)
        }
        const siteCfg = GetSiteConfig();
        if (!siteCfg) return;
        const targetSelector = siteCfg.config;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey) {
                let fullscreenBtn = null
                if(targetSelector.shadowPath){
                    fullscreenBtn = GetElementWithShadowPath(targetSelector)
                }
                else{
                    fullscreenBtn = GetElement(targetSelector)
                }
                if (fullscreenBtn) fullscreenBtn.click();
            }
        });
    }
    function VideoProgressJumper(){
        const siteCfg = GetSiteConfig();
        if (!siteCfg || !siteCfg.config.isVideo) return;

        // ============================================================
        //  🎯 配置区域
        // ============================================================
        const CONFIG = {
            triggerKey: 'j',
            stepForward: 5,
            stepBackward: 5,
            stepForwardShift: 10,
            stepBackwardShift: 10,
            stepForwardCtrl: 30,
            stepBackwardCtrl: 30,
            feedbackDuration: 1500,
            inputStyle: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: '#ffffff',
                border: '2px solid #ff6b6b',
                borderRadius: '12px',
                padding: '14px 24px',
                fontSize: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textAlign: 'center',
                width: '380px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                outline: 'none',
                backdropFilter: 'blur(4px)',
            },
            feedbackStyle: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '20px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: '99999',
            },
        };

        // ---------- 工具函数 ----------
        function formatTime(seconds) {
            if (!seconds || seconds < 0) return '0:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            if (h > 0) {
                return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        function parseTimeInput(input) {
            input = input.trim();
            if (!input) return null;
            if (input.includes(':')) {
                const parts = input.split(':').map(Number);
                if (parts.some(isNaN)) return null;
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                return null;
            }
            if (input.includes('.')) {
                const parts = input.split('.').map(Number);
                if (parts.some(isNaN)) return null;
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                return null;
            }
            const num = Number(input);
            if (!isNaN(num) && num >= 0) return num * 60;
            return null;
        }

        function getVideoElement() {
            let video = document.querySelector('video');
            if (video && video.readyState > 0) return video;
            const playerSelectors = [
                '.video-player video', '.player-container video', '.bilibili-player video',
                '.vjs-tech', '.html5-video-container video', '#movie_player video',
                '.jw-video', 'video[src]', 'video[data-src]',
            ];
            for (const sel of playerSelectors) {
                const el = document.querySelector(sel);
                if (el && el.readyState > 0) return el;
            }
            const allVideos = document.querySelectorAll('video');
            for (const v of allVideos) {
                if (v.readyState > 0) return v;
            }
            return document.querySelector('video') || null;
        }

        function jumpToTime(video, targetSeconds) {
            if (!video || !video.duration) return false;
            video.currentTime = Math.max(0, Math.min(targetSeconds, video.duration));
            return true;
        }

        function stepTime(video, deltaSeconds) {
            if (!video || !video.duration) return false;
            video.currentTime = Math.max(0, Math.min(video.currentTime + deltaSeconds, video.duration));
            return true;
        }

        // ---------- UI ----------
        let feedbackTimer = null;
        let inputActive = false;
        let inputContainer = null;

        // 全屏时 UI 须挂到全屏元素内，否则会被全屏层遮挡
        function getUIParent() {
            return document.fullscreenElement || document.webkitFullscreenElement || document.body;
        }

        function showFeedback(text, isSuccess, duration) {
            if (isSuccess === undefined) isSuccess = true;
            if (duration === undefined) duration = CONFIG.feedbackDuration;
            const old = document.getElementById('vj-feedback');
            if (old) old.remove();
            if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
            const el = document.createElement('div');
            el.id = 'vj-feedback';
            Object.assign(el.style, CONFIG.feedbackStyle);
            el.textContent = text;
            el.style.position = 'fixed';
            el.style.top = '50%';
            el.style.left = '50%';
            el.style.transform = 'translate(-50%, -50%)';
            el.style.border = isSuccess ? '2px solid #51cf66' : '2px solid #ff6b6b';
            getUIParent().appendChild(el);
            feedbackTimer = setTimeout(() => {
                if (el.parentNode) el.remove();
                feedbackTimer = null;
            }, duration);
        }

        function closeInputUI() {
            if (inputContainer) {
                // 归还焦点给页面，避免后续快捷键被 Chrome 原生接管
                if (document.activeElement && inputContainer.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                document.body.focus();
                if (inputContainer._updateInterval) clearInterval(inputContainer._updateInterval);
                inputContainer.remove();
                inputContainer = null;
                inputActive = false;
            }
            const fb = document.getElementById('vj-feedback');
            if (fb) fb.remove();
            if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
        }

        function createInputUI(video) {
            if (inputContainer) { inputContainer.remove(); inputContainer = null; }
            const container = document.createElement('div');
            container.id = 'vj-input-container';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:99998;pointer-events:none;';
            const backdrop = document.createElement('div');
            backdrop.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.3);pointer-events:auto;cursor:pointer;';
            backdrop.addEventListener('click', () => closeInputUI());
            container.appendChild(backdrop);
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:8px;';
            const info = document.createElement('div');
            info.id = 'vj-info';
            const current = video ? formatTime(video.currentTime) : '0:00';
            const total = video && video.duration ? formatTime(video.duration) : '--:--';
            info.textContent = `⏱ 当前: ${current} / ${total}`;
            info.style.cssText = 'color:rgba(255,255,255,0.85);font-size:16px;font-family:system-ui,-apple-system,sans-serif;text-shadow:0 2px 8px rgba(0,0,0,0.5);letter-spacing:0.5px;';
            wrapper.appendChild(info);
            const input = document.createElement('input');
            input.id = 'vj-input';
            input.type = 'text';
            input.placeholder = '输入时间 (如: 25 / 0.30 / 1:30 / 1.1.1=1h1m1s)';
            input.autofocus = true;
            input.spellcheck = false;
            input.autocomplete = 'off';
            const style = CONFIG.inputStyle;
            Object.keys(style).forEach(k => { input.style[k] = style[k]; });
            input.style.display = 'block';
            input.style.margin = '0 auto';
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = input.value.trim();
                    if (!val) { showFeedback('⏳ 请输入时间', false, 1200); return; }
                    const seconds = parseTimeInput(val);
                    if (seconds === null) { showFeedback(`❌ 无法解析 "${val}"`, false, 1800); return; }
                    const videoEl = getVideoElement();
                    if (!videoEl) { showFeedback('❌ 未找到视频元素', false, 1200); return; }
                    if (jumpToTime(videoEl, seconds)) {
                        showFeedback(`✅ 已跳转到 ${formatTime(seconds)}`, true, CONFIG.feedbackDuration);
                    } else {
                        showFeedback('❌ 跳转失败，请检查视频', false, 1200);
                    }
                    closeInputUI();
                }
            });
            input.addEventListener('input', () => {
                const val = input.value.trim();
                const infoEl = document.getElementById('vj-info');
                if (infoEl && video) {
                    const cur = formatTime(video.currentTime);
                    const tot = video.duration ? formatTime(video.duration) : '--:--';
                    let preview = '';
                    if (val) {
                        const sec = parseTimeInput(val);
                        if (sec !== null && sec >= 0) preview = ` → ${formatTime(sec)}`;
                        else if (val.length > 0) preview = ' ⚠️ 格式错误';
                    }
                    infoEl.textContent = `⏱ 当前: ${cur} / ${tot}${preview}`;
                }
            });
            wrapper.appendChild(input);
            container.appendChild(wrapper);
            getUIParent().appendChild(container);
            inputContainer = container;
            setTimeout(() => { input.focus(); input.select(); }, 50);
            container._input = input;
            container._video = video;
            inputActive = true;
            if (container._updateInterval) clearInterval(container._updateInterval);
            container._updateInterval = setInterval(() => {
                const infoEl = document.getElementById('vj-info');
                const videoEl = getVideoElement();
                if (infoEl && videoEl && videoEl.duration) {
                    const cur = formatTime(videoEl.currentTime);
                    const tot = formatTime(videoEl.duration);
                    const val = input.value.trim();
                    let preview = '';
                    if (val) {
                        const sec = parseTimeInput(val);
                        if (sec !== null && sec >= 0) preview = ` → ${formatTime(sec)}`;
                        else if (val.length > 0) preview = ' ⚠️ 格式错误';
                    }
                    infoEl.textContent = `⏱ 当前: ${cur} / ${tot}${preview}`;
                }
            }, 500);
        }

        function handleKeydown(e) {
            const tag = e.target.tagName.toLowerCase();
            if ((tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) && e.target.id !== 'vj-input') return;

            // ESC 关闭 UI（优先处理，不依赖视频状态）
            if (inputActive && e.key === 'Escape') {
                e.preventDefault();
                closeInputUI();
                return;
            }

            const video = getVideoElement();
            if (!video) return;
            const key = e.key;
            const shift = e.shiftKey;
            const ctrl = e.ctrlKey || e.metaKey;
            if (key.toLowerCase() === CONFIG.triggerKey.toLowerCase() && ctrl) {
                e.preventDefault();
                if (inputActive) {
                    const inp = document.getElementById('vj-input');
                    if (inp) { inp.focus(); inp.select(); }
                    return;
                }
                const videoEl = getVideoElement();
                if (!videoEl) { showFeedback('❌ 未找到视频元素', false, 1200); return; }
                createInputUI(videoEl);
                return;
            }
            if (inputActive) return;
            let delta = null;
            if (key === 'ArrowRight' && !shift && !ctrl) delta = CONFIG.stepForward;
            else if (key === 'ArrowLeft' && !shift && !ctrl) delta = -CONFIG.stepBackward;
            else if (key === 'ArrowRight' && shift && !ctrl) delta = CONFIG.stepForwardShift;
            else if (key === 'ArrowLeft' && shift && !ctrl) delta = -CONFIG.stepBackwardShift;
            else if (key === 'ArrowRight' && ctrl && !shift) delta = CONFIG.stepForwardCtrl;
            else if (key === 'ArrowLeft' && ctrl && !shift) delta = -CONFIG.stepBackwardCtrl;
            if (delta !== null) {
                e.preventDefault();
                if (stepTime(video, delta)) {
                    const sign = delta > 0 ? '+' : '';
                    const newTime = video.currentTime;
                    const total = video.duration;
                    const pct = total > 0 ? (newTime / total * 100).toFixed(1) : 0;
                    showFeedback(`${sign}${Math.abs(delta)}s  →  ${formatTime(newTime)} / ${formatTime(total)} (${pct}%)`, true, CONFIG.feedbackDuration);
                }
            }
        }

        document.addEventListener('keydown', handleKeydown, true);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && inputActive) closeInputUI();
        });
        window.addEventListener('beforeunload', () => { closeInputUI(); });
        console.log('[视频进度跳转助手] 已加载 🎬  按 Ctrl+Shift+J 跳转时间，方向键步进');
    }
    function DouyuMyFollowPageFunction() {
        const targetUrl = 'douyu.com/directory/myFollow';
        if(currentDomain.includes(targetUrl)){
            document.addEventListener('click', function(event) {
                const clickedElement = event.target;
                if(clickedElement.className == 'DyCardBottom-cardTitle'){
                    event.preventDefault();
                    const rid = clickedElement.getAttribute('rid');
                    if(event.shiftKey){
                        OpenyubaWeb(rid);
                    }
                    else{
                        OpenVodsWeb(rid);
                    }
                }
                if(clickedElement.className == 'DyLiveCardTitle-cardTagContainer'){
                    event.preventDefault();
                    const rid = GetRidFromCard(clickedElement);
                    if(rid) OpenyubaWeb(rid);
                }
            });
            RenameGameTagsToYuba();
        }
        // 把卡片上的游戏分区标签改名为"鱼吧"，列表是动态渲染的所以用observer持续处理
        function RenameGameTagsToYuba(){
            function RenameTags(){
                document.querySelectorAll('.DyLiveCardTitle-cardTagContainer').forEach(tag => {
                    if(tag.textContent !== '鱼吧') tag.textContent = '鱼吧';
                });
            }
            const observer = new MutationObserver(RenameTags);
            observer.observe(document.body, {childList: true, characterData: true, subtree: true});
            RenameTags();
        }
        // 从标签元素向上找到所属卡片，取卡片内cardTitle上的rid
        function GetRidFromCard(element){
            let card = element.parentElement;
            while(card && card !== document.body){
                const titles = card.querySelectorAll('.DyCardBottom-cardTitle');
                // 恰好包含一个cardTitle的祖先就是所属卡片，多于一个说明已越过卡片范围
                if(titles.length === 1) return titles[0].getAttribute('rid');
                if(titles.length > 1) return null;
                card = card.parentElement;
            }
            return null;
        }
        function OpenVodsWeb(rid){
            const api = 'https://www.douyu.com/swf_api/getRoomCloseVod/' + rid;
            GM_xmlhttpRequest({
                method: "GET",
                url: api,
                onload: function (res) {
                    const data = JSON.parse(res.responseText);
                    const authorUrl = data.authorUrl

                    if (!authorUrl) {
                        return;
                    }
                    const replayUrl = authorUrl.replace('author','author-replay');
                    window.open(replayUrl);
                }
            });
        }
        function OpenyubaWeb(rid){
            const api = 'https://www.douyu.com/wgapi/yubanc/api/group/getRoomRelatedGroups?room_id=' + rid + '&relate_type=1';
            GM_xmlhttpRequest({
                method: "GET",
                url: api,
                onload: function (res) {
                    const data = JSON.parse(res.responseText).data;
                    // data是数组，包含主播鱼吧(is_anchor)和分区鱼吧(is_cate)，取主播鱼吧
                    const anchorGroup = data.find(group => group.is_anchor).group_id;

                    if (!anchorGroup) {
                        return;
                    }
                    const yubaUrl = `https://yuba.douyu.com/discussion/${anchorGroup}/posts`;
                    window.open(yubaUrl);
                }
            });
        }
    }
    function DelayFindElement(getElementFunc,onFinished,interval = 500){
        const timer = setInterval(() => {
            const el = getElementFunc();
            if (el) {
                clearInterval(timer);
                onFinished(el);
            }
        }, interval);
    }

})();