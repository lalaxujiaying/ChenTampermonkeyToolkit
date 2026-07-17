// ==UserScript==
// @name         ChenTampermonkeyToolkit
// @namespace    http://tampermonkey.net/
// @version      1.7
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