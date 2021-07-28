/**
 * 根据不同环境 加载不同 sdk, 调用不同 evoke方法
 */

import {
  isQQ, isWeibo, isQzone,
  isAndroid, isIos, isQQBrowser,
  getIOSVersion, semverCompare,
  isBaidu, IOSVersion, isOriginalChrome, isWechat, getWeChatVersion
} from "../libs/platform"
import { evokeByTagA, evokeByIFrame, evokeByLocation, checkOpen as _checkOpen } from "../libs/evoke"
import { generateIntent, generateScheme, generateUniversalLink } from './generate'
import { CallAppInstance } from '../types'
import { showMask } from '../libs/utils'
import { compareVersion } from "../../src-old/libs/utils"
/**
 * 普通 url-scheme 唤起， 不同平台对应不同的 evoke
 * @param {Object} instance
 */
export const launch = (instance: CallAppInstance) => {
  const { options, download, urlScheme: schemeURL, universalLink } = instance;
  let { universal, intent, callFailed, callSuccess, callError, delay } = options;

  //
  const intentLink = generateIntent(instance)

  // 唤端失败时落地处理
  let checkOpenFall: () => void;
  const supportUniversal = universal
  const supportIntent = intent

  // 唤端失败 才执行 checkOpen(cb)
  const checkOpen = (failure: any, success?: any, error?: any) => {
    // 唤端失败执行 checkOpen(failedCb, successCb, time) , hack by setTimeout
    return _checkOpen(() => {
      callFailed && callFailed()

      failure();
    }, () => {
      callSuccess && callSuccess()

      success()
    }, () => {
      callError && callError()

      error()
    }, delay);
  }
  // scheme 处理落地状态
  const handleFall = () => {
    checkOpen(() => {
      // 触发下载 或者 跳指定页面
      console.log('处理 失败 逻辑')
      download.call(instance)
    }, () => {
      console.log('处理 成功 逻辑')
    }, () => {
      console.log('处理 异常 逻辑')
    });
  }
  // uLink/appLink 处理落地状态
  const xLinkHandleFall = () => {
    checkOpen(() => {
      console.log('处理 失败 逻辑')
    }, () => {
      console.log('处理 成功 逻辑')
    }, () => {
      console.log('处理 异常 逻辑')
    });
  }

  if (isIos) {
    console.log('isIos', isIos)
    // ios-version > v12.3.0
    if (semverCompare(IOSVersion(), '12.3.0') > 0) (delay = options.delay = 3000);
    console.log('isIos > 12.3.0', semverCompare(IOSVersion(), '12.3.0') > 0)
    console.log('instance', instance)

    if (isWeibo || (isWechat && semverCompare(getWeChatVersion(), '7.0.5') === -1)) {
      // 显示遮罩 在浏览器打开
      // download.call(instance)
      console.log(
        'isIos - isWeibo || isWechat < 7.0.5',
        isIos && (isWeibo || (isWechat && semverCompare(getWeChatVersion(), '7.0.5') === -1 ))
      )

      showMask()
    } else if (getIOSVersion() < 9) {
      console.log('isIos - version < 9', isIos, getIOSVersion() < 9)
      evokeByIFrame(schemeURL);
      checkOpenFall = handleFall
    } else if (!supportUniversal || isQQ || isQQBrowser || isQzone) {
      console.log('isIos - !supportUniversal || isQQ || isQQBrowser || isQzone',
        !supportUniversal || isQQ || isQQBrowser || isQzone);

      evokeByTagA(schemeURL);
      checkOpenFall = handleFall
    } else if(isWechat) {
      // 失败则跳到应用商店
      evokeByLocation(universalLink)
      checkOpenFall = handleFall
    } else {
      // universalLink 唤起, 不支持 失败回调处理。
      // 没有app时, 页面重定向到中间页面，原页面生命周期结束 js 不再执行。
      // 更新app 时候，universalLink 可能会失效, u-link 自身的坑。
      console.log('isIos - support universalLink')

      console.log('universalLink', universalLink)

      evokeByLocation(universalLink)
      checkOpenFall = xLinkHandleFall

      // 有必要的话, 降级采用 schemeURL 处理
      // 测试过程中发现： schemeURL 比 universalLink 稳定，但缺点是需要用户二次确认
      // setTimeout(() => {
      //   evokeByLocation(schemeURL)
      //   checkOpenFall = handleFall
      // });
    }

  } else if (isAndroid) {
    //
    console.log('isAndroid', isAndroid)
    if (isOriginalChrome) {
      if (supportIntent) {
        console.log('isAndroid - supportIntent', isAndroid && supportIntent)
        evokeByLocation(intentLink)
        // app-links 无法处理 失败回调， 原因同 universal-link
        checkOpenFall = xLinkHandleFall
      } else {
        console.log('isAndroid - !supportIntent', isAndroid && !supportIntent)
        // scheme 在 andriod chrome 25+ 版本上 iframe 无法正常拉起
        evokeByLocation(schemeURL)
        checkOpenFall = handleFall
      }
    } else if (isWechat || isBaidu || isWeibo || isQzone) {
      console.log('isAndroid -- showMask， isBaidu || isWeibo || isQzone', isBaidu || isWeibo || isQzone)
      // 不支持 scheme, 显示遮罩 请在浏览器打开
      showMask()
    } else {
      // 其他浏览器 通过 scheme 唤起，失败则下载
      console.log('isAndroid - schemeURL')
      evokeByLocation(schemeURL)
      checkOpenFall = handleFall
    }
  } else {
    console.error ?
      console.error('your platform is not considered, please contact developer') :
      console.log('your platform is not considered, please contact developer');
  }

  console.log('checkOpenFall', checkOpenFall)

  if (checkOpenFall) {
    return checkOpenFall()
  }

  callFailed && callFailed()
}
