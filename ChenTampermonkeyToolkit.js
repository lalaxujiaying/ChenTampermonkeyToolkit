// ==UserScript==
// @name         ChenTampermonkeyToolkit
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自用chrome网页脚本工具
// @author       Chen
// @match		https://www.bilibili.com/video/*
// @match		https://www.douyu.com/directory/myFollow
// @match		https://www.douyu.com/*
// @match		https://v.douyu.com/show/*
// @match		https://www.huya.com/video/u/*
// @match		https://www.huya.com/[0-9].*
// @match		https://www.youtube.com/watch*
// @match		https://www.twitch.tv/*
// @run-at       document-idle
// @grant GM_xmlhttpRequest
// @connect douyu.com
// @updateURL    https://raw.githubusercontent.com/lalaxujiaying/ChenTampermonkeyToolkit/ChenTampermonkeyToolkit.js
// @downloadURL  https://raw.githubusercontent.com/lalaxujiaying/ChenTampermonkeyToolkit/ChenTampermonkeyToolkit.js
// ==/UserScript==

(function() {
    'use strict';

    const currentDomain = window.location.href;

    Main();
    function Main(){
        FullscreenVideo();
        DouyuMyFollowPageFunction();
    }
    function DelayFunc(){
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
         // 网站选择器配置表
        const siteConfig = {
            'bilibili.com': {
                selector : '.bpx-player-ctrl-full'
            },
            'youtube.com': {
                selector : '.ytp-fullscreen-button'
            },
            'twitch.tv': {
                selector : 'button[data-a-target="player-fullscreen-button"]'
            },
            'huya.com/video':{
                selector : 'button[class="style__controlBarFullscreenButton___7_tQe style__controlBarButton___2cjb4"]'
            },
            'huya.com':{
                selector : '.player-fullscreen-btn'
            },
            'v.douyu.com/show':{
                selector : '.ControllerBar-WindowFull-Icon',
                shadowPath : ['demand-video','demand-video-controller-bar'],
            },
            'douyu.com': {
                selector : '.controlbar__LhZiJ .right-17e251 > .icon-c8be96:has(path[d="M20 25h5v-5M20 7h5v5M12 7H7v5M12 25H7v-5"])'
            },
        };
        // 匹配当前域名的选择器
        let targetSelector = null;
        for (const domain in siteConfig) {
            if (currentDomain.includes(domain)) {
                targetSelector = siteConfig[domain];
                break;
            }
        }
        // 未匹配时退出
        if (!targetSelector) return;
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
    function DouyuMyFollowPageFunction() {
        const targetUrl = 'douyu.com/directory/myFollow';
        if(currentDomain.includes(targetUrl)){
            document.addEventListener('click', function(event) {
                const clickedElement = event.target;
                if(clickedElement.className == 'DyCardBottom-cardTitle'){
                    event.preventDefault();
                    GetUpidByDouyuRid(clickedElement.getAttribute('rid'));
                }
            });
        }
        function GetUpidByDouyuRid(rid){
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