# WebChess 域名部署指南

## 🎯 你的专属域名
**maxaccurate.dpdns.org**

## 🚀 部署步骤

### 步骤1: 部署到 Vercel
1. 访问 https://vercel.com
2. 点击 "Add New" → "Project"
3. 导入 `Maxaccurate/Webchess_New` 仓库
4. 点击 "Deploy"

### 步骤2: 添加自定义域名
部署完成后，在 Vercel 项目中：
1. 点击 "Settings" → "Domains"
2. 输入 `maxaccurate.dpdns.org`
3. 点击 "Add"

### 步骤3: 配置 DNS 记录
Vercel 会显示需要添加的 DNS 记录：

#### 选项A: CNAME 记录（推荐）
```
类型: CNAME
名称: @ 或 www
值: cname.vercel-dns.com
TTL: 自动
```

#### 选项B: A 记录
```
类型: A
名称: @ 或 www
值: 76.76.21.21
TTL: 自动
```

### 步骤4: 验证 DNS
1. 登录你的域名注册商控制面板
2. 找到 DNS 管理页面
3. 添加上述 DNS 记录
4. 保存更改

### 步骤5: 等待生效
DNS 更改需要时间传播：
- **通常**: 5-30分钟
- **最长**: 24小时（罕见）

## 🔧 验证部署

### 验证步骤
1. **访问你的域名**:
   ```
   https://maxaccurate.dpdns.org
   ```

2. **检查 API 状态**:
   ```
   https://maxaccurate.dpdns.org/api/health
   ```

3. **查看欢迎页面**:
   应该显示你的域名和系统状态

### 预期结果
- ✅ 欢迎页面显示 `maxaccurate.dpdns.org`
- ✅ API 健康检查返回成功
- ✅ 所有功能正常工作
- ✅ 自动 HTTPS 加密

## ⚙️ 技术配置

### 环境变量
项目已配置以下环境变量：
```
VITE_API_URL=/api
VITE_WS_URL=wss://maxaccurate.dpdns.org
VITE_APP_NAME=WebChess
VITE_BASE_URL=https://maxaccurate.dpdns.org
```

### 功能特性
- ✅ 欢迎页面显示专属域名
- ✅ 系统状态监控
- ✅ 完整的国际象棋功能
- ✅ 响应式设计

## 🛠️ 故障排除

### 问题1: DNS 未生效
**症状**: 无法访问域名
**解决方案**:
1. 等待更长时间（最多24小时）
2. 检查 DNS 记录是否正确
3. 使用在线 DNS 检查工具

### 问题2: HTTPS 证书问题
**症状**: 浏览器显示不安全警告
**解决方案**:
1. Vercel 会自动配置 SSL 证书
2. 等待证书签发（通常几分钟）
3. 强制刷新浏览器缓存

### 问题3: API 无法访问
**症状**: 欢迎页面显示服务器离线
**解决方案**:
1. 检查 `/api/health` 端点
2. 查看 Vercel 部署日志
3. 重新部署项目

### 问题4: 功能不正常
**症状**: 某些功能无法使用
**解决方案**:
1. 检查浏览器控制台错误
2. 验证网络连接
3. 清除浏览器缓存

## 📊 监控和维护

### 监控工具
1. **Vercel Analytics**: 访问统计和性能监控
2. **浏览器开发者工具**: 实时调试
3. **控制台日志**: 查看错误信息

### 维护建议
1. **定期更新**: 保持依赖包最新
2. **备份配置**: 备份重要配置文件
3. **监控性能**: 关注页面加载速度

## 🔄 更新部署

### 代码更新后
1. 推送代码到 GitHub
2. Vercel 会自动重新部署
3. 等待部署完成（约1-2分钟）

### 手动重新部署
1. 进入 Vercel 项目
2. 点击 "Deployments"
3. 点击 "Redeploy"

## 📞 支持

### 紧急联系方式
如果遇到问题：
1. **截图错误信息**
2. **发送给我（Max Chen）**
3. **我会提供解决方案**

### 查看日志
```bash
# Vercel 日志
vercel logs

# 或通过 Vercel 控制台查看
```

### 重启服务
在 Vercel 控制台：
1. 点击 "Deployments"
2. 找到最新部署
3. 点击 "Redeploy"

---

## 🎉 恭喜！
你的 WebChess 平台现在拥有专属域名：
**https://maxaccurate.dpdns.org**

### 下一步
1. **测试所有功能**
2. **邀请朋友体验**
3. **提供反馈以便改进**

---

**最后更新**: 2026-02-23  
**维护者**: Max Chen  
**项目状态**: ✅ 准备部署  
**域名状态**: 🟡 等待配置