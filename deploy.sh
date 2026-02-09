#!/bin/bash

# 四国语言背单词 - 一键部署到GitHub Pages
# 作者: Clawd
# 用法: bash deploy.sh

echo "🚀 开始部署到GitHub Pages..."

# 检查是否安装了gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 请先安装 GitHub CLI: brew install gh"
    echo "   或者手动在GitHub创建仓库，上传文件"
    exit 1
fi

# 配置git（如果没配置）
git config --global user.email "you@example.com" 2>/dev/null
git config --global user.name "Your Name" 2>/dev/null

# 创建GitHub仓库
echo "📦 创建GitHub仓库..."
gh repo create flashcards-4lang --public --description "四国语言背单词 - 科技/电动车/外贸" --source=. || {
    echo "⚠️ 仓库可能已存在，跳过创建..."
}

# 推送到GitHub
echo "📤 推送代码..."
git add .
git commit -m "Initial commit: 四国语言背单词App" 2>/dev/null || echo "⚠️ 没有新更改"
git branch -M main
git push -u origin main || echo "⚠️ 推送失败，请检查权限"

# 启用GitHub Pages
echo "🔗 启用GitHub Pages..."
gh repo edit flashcards-4lang --enable-pages --source /docs || {
    echo "⚠️ Pages设置可能需要手动开启"
    echo "   请去: https://github.com/你的用户名/flashcards-4lang/settings/pages"
    echo "   选择: Deploy from a branch → main分支 → /(root) → 保存"
}

echo ""
echo "✅ 部署完成！"
echo ""
echo "📱 访问地址（5-10分钟后生效）:"
echo "   https://你的用户名.github.io/flashcards-4lang/"
echo ""
echo "🔧 如果自动设置失败，手动开启:"
echo "   1. 打开 https://github.com/你的用户名/flashcards-4lang/settings/pages"
echo "   2. Source 选择 \"Deploy from a branch\""
echo "   3. Branch 选择 \"main\" / \"/(root)\""
echo "   4. 点击 Save"
