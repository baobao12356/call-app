/**
 * uri 生成 处理中心
 * generate uri center (include generate url-scheme && generate universal-link && generate Intent uri)
 */
import { AppFlags, handlePath2appName } from './targetApp'
import { CallAppInstance } from '../index'
import { logError } from '../libs/utils'
import { genWXminiJumpPath } from '../libs/sdk'

export const enum SchemeMapKeys {
  HOME = 'home',
  MSGCENTER = 'messagecenter',
  MYBUY = 'mybuy',
  PUBLISH = 'publish',
  DETAIL = 'detail',
  MYSELL = 'mysell',
  ORDER = 'order',
  PERSON = 'person',
  VILLAGE = 'village',
  WEB = 'web',
}

export interface UrlSearch {
  openType: SchemeMapKeys
  id?: string
}
export interface Intent {
  package: string
  scheme: string
  action?: string
  category?: string
  component?: string
}

// 生成 scheme 链接
export const generateScheme = (instance: CallAppInstance): string => {
  // 生成  path || urlSearch || targetApp
  const { options, targetInfo } = instance
  let { path, urlSearch } = options

  path = path || (urlSearch ? getSchemeByUrlSearch(urlSearch) : '')
  // new Regexp(zzInnerSchemeReg).test(path)
  // 检验 path 中是否有 scheme-prefix  // 旧版本逻辑迁移

  // todo: 兼容逻辑, path 中是否 [https?://] - prefix, 唤起对应目标app的path页面
  // 需要根据各app统跳协议规范 帮业务拼接好 scheme-uri
  const { appName } = handlePath2appName(path)

  let uri = appName ? path : `${targetInfo?.schemePrefix}//${path}`

  if (targetInfo && targetInfo.flag & AppFlags.WXMini) {
    uri = appName ? path : genWXminiJumpPath(path)
  }

  return uri
}

// universal-link-host
const universalLinkHost = 'mjump.zhuanzhuan.com'

// 生成 universalLink 链接
export const generateUniversalLink = (instance: CallAppInstance) => {
  const {
    targetInfo,
    options: { universal, channelId },
    urlScheme = '',
  } = instance

  if (!universal) return ''

  const host = universalLinkHost
  const path = targetInfo?.universalPath
  const channel = channelId ? `&channelId=${channelId}` : ''

  // 中间下载页 标记位 // 目前只有 转转 找靓机支持 universal-link
  // https://gitlab.zhuanspirit.com/zz-fe-common/app_download/-/blob/master/README.md
  // app=zz 代表转转中间下载页
  // app=zlj 代表找靓机中间下载页
  // app=hunter 代表采货侠中间下载页
  let app = '&app=zz'
  if (targetInfo) {
    if (targetInfo.flag & AppFlags.ZZSeeker) {
      app = '&app=zlj'
    } else if (targetInfo.flag & AppFlags.ZZHunter) {
      app = '&app=hunter'
    }
  }

  const universalLink = `https://${host}/${path}/index.html?path=${encodeURIComponent(
    urlScheme
  )}${channel}${app}`

  return universalLink
}

// 生成 appLinks Intent 链接 // 目前客户端app 都还不支持该协议
export const generateIntent = (instance: CallAppInstance): string => {
  const { options, downloadLink } = instance
  const { intent, intentParams } = options

  if (intent && !intentParams) {
    logError(`options.intentParams is not found, please check`)
    return ''
  }

  if (!intent || !intentParams) return ''

  const keys = Object.keys(intentParams) as Array<keyof Intent>
  const intentParam = keys.map((key) => `${key}=${intentParams[key]};`).join('')

  const intentTail = `#Intent;${intentParam}S.browser_fallback_url=${encodeURIComponent(
    downloadLink || ''
  )};end;`

  let urlPath = generateScheme(instance)

  urlPath = urlPath.slice(urlPath.indexOf('//') + 2)

  return `intent://${urlPath}${intentTail}`
}

// 兼容旧版本
/**
 * 适配传统的吊起方式, 客户端后期将不会兼容openType的方式, 统一通过'zhuanzhuan://'的统跳形式拉起
 * (ps: 特殊客户端类似58App, 会采用schema和sdk结合的方式拉起App)
 *
 * 以前的入参:
 * 一个参数 { openType } :
 *      首页: { openType: 'home' }
 *      消息tab页: { openType: 'messagecenter' }
 *      我买到的: { openType: 'mybuy' }
 *      发布页: { openType: 'publish' }
 * 两个参数 { openType, id } :
 *      详情页: { openType: 'detail', id: 'infoId' }
 *      我卖出的: { openType: 'mysell', id: '' }
 *      订单详情页: { openType: 'order', id: 'orderId' }
 *      个人主页: { openType: 'person', id: 'userId' }
 *      小区页: { openType: 'village', id: 'villageId' }
 *      M页: { openType: 'web', id: 'url' }
 */

/**
 * 跳转协议映射, 老的openType对应统跳的映射表
 * */

export const SchemaMap = {
  [SchemeMapKeys.HOME]: {
    name: 'home',
    path: 'zhuanzhuan://jump/core/mainPage/jump?tabId=0',
    params: {
      id: '',
    },
  },
  [SchemeMapKeys.MSGCENTER]: {
    name: 'messagecenter',
    path: 'zhuanzhuan://jump/core/mainPage/jump?tabId=2',
    params: {
      id: '',
    },
  },
  [SchemeMapKeys.MYBUY]: {
    name: 'mybuy',
    path: 'zhuanzhuan://jump/core/myBuyList/jump?tab=price',
    params: {
      id: '',
    },
  },
  [SchemeMapKeys.PUBLISH]: {
    name: 'publish',
    path: 'zhuanzhuan://jump/core/publish/jump',
    params: {
      id: '',
    },
  },
  [SchemeMapKeys.DETAIL]: {
    name: 'detail',
    path: 'zhuanzhuan://jump/core/infoDetail/jump',
    params: {
      id: 'infoId',
    },
  },
  [SchemeMapKeys.MYSELL]: {
    name: 'mysell',
    path: 'zhuanzhuan://jump/core/mySellList/jump?tab=price',
    params: {
      id: '',
    },
  },
  [SchemeMapKeys.ORDER]: {
    name: 'order',
    path: 'huanzhuan://jump/core/orderDetail/jump',
    params: {
      id: 'orderId',
    },
  },
  [SchemeMapKeys.PERSON]: {
    name: 'person',
    path: 'zhuanzhuan://jump/core/personHome/jump',
    params: {
      id: 'uid',
    },
  },
  [SchemeMapKeys.VILLAGE]: {
    name: 'village',
    path: 'zhuanzhuan://jump/core/village/jump',
    params: {
      id: 'villageId',
    },
  },
  [SchemeMapKeys.WEB]: {
    name: 'web',
    path: 'zhuanzhuan://jump/core/web/jump',
    params: {
      id: 'url',
    },
  },
}

const getSchemeByUrlSearch = ({ openType = SchemeMapKeys.HOME, id = '' }: UrlSearch): string => {
  const queryStr =
    (id &&
      `${!/\?/g.test(SchemaMap[openType]?.path) && '?'}${
        SchemaMap[openType]?.params?.id
      }=${encodeURIComponent(id)}`) ||
    ''
  return `${SchemaMap[openType]?.path}${queryStr}`
}
