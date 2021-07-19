import CallApp from '../src'

const btn2 = document.getElementById('btn')
const callApp = (window.callApp = new CallApp())
btn2.addEventListener('click', function () {
  callApp.start({
    path: 'jump/shortVideo/videoHome/jump', // 兼容app所有统跳地址
    channelId: 'BM_GJ618XC',
    targetApp: 'zz',
    wechatStyle: 1, // 1表示浮层右上角，2表示浮层按钮
    // deeplinkId: getQuery('channelId')
  })
})
