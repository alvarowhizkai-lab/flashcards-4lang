#!/bin/bash
# 部署到GitHub（使用API + Token）

TOKEN=$(cat .gh_token)
USER="alvarowhizkai-lab"
REPO="flashcards-4lang"

echo "🚀 开始部署到 GitHub..."

# 1. 创建仓库
echo "📦 创建仓库..."
curl -X POST -H "Authorization: token $TOKEN" \
    -d '{"name":"'$REPO'","description":"四国语言背单词 - 科技/电动车/外贸","public":true}' \
    https://api.github.com/user/repos 2>/dev/null | grep -q "already_exists" && echo "⚠️ 仓库已存在"

# 2. 配置git
git config --global user.email "alvarowhizkai-lab@users.noreply.github.com"
git config --global user.name "alvarowhizkai-lab"

# 3. 添加远程仓库
git remote remove origin 2>/dev/null
git remote add origin https://$USER:$TOKEN@github.com/$USER/$REPO.git

# 4. 提交文件
git add .
git commit -m "Initial commit: 四国语言背单词App" 2>/dev/null || echo "⚠️ 无新更改"

# 5. 推送
echo "📤 推送代码..."
git branch -M main
git push -u origin main

echo ""
echo "✅ 完成！现在启用 GitHub Pages..."
