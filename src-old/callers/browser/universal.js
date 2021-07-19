const targetToPath = {
  zz: 'zhuanzhuan',
  zzseller: 'seller',
  check: 'check',
  yige: 'yige',
}

export default function (opt) {
  const { __SCHEMA_PATH, channelId } = opt
  location.href = `https://mjump.zhuanzhuan.com/${targetToPath[opt.targetApp]}/index.html?path=${encodeURIComponent(__SCHEMA_PATH)}&channelId=${channelId}`
}