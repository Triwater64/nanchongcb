@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p REPO=请输入GitHub仓库HTTPS地址（https://github.com/用户名/仓库名.git）:
set /p NAME=请输入提交者姓名（英文或拼音，如 Admin）:
set /p EMAIL=请输入提交者邮箱（如 admin@example.com）:
git init
git add .
set GIT_AUTHOR_NAME=%NAME%
set GIT_AUTHOR_EMAIL=%EMAIL%
set GIT_COMMITTER_NAME=%NAME%
set GIT_COMMITTER_EMAIL=%EMAIL%
git commit -m "Initial commit: Nanchong cross-border commerce demo"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO%
git pull origin main --allow-unrelated-histories --no-edit >nul 2>&1
git push -u origin main
pause
