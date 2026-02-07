// ==UserScript==
// @match https://www.youtube.com/*
// @run-at document-end
// @grant none
// ==/UserScript==

(function() {
  'use strict';

  function onWatchPage() {
    console.log('视频页功能启动');
  }

  function routeCheck() {
    if (location.pathname === '/watch') {
      onWatchPage();
    }
  }

  routeCheck();

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      routeCheck();
    }
  }).observe(document, { subtree: true, childList: true });
})();
