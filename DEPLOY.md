# 前端项目 Docker 部署完整教程

适用于 React/Vue/Angular 等单页应用（SPA）

---

## 一、项目结构

部署前准备这几个文件：

```
你的项目/
├── dist/              ← npm run build 生成
├── Dockerfile         ← Docker 镜像构建
├── nginx.conf         ← Nginx 配置
├── docker-compose.yml ← Docker Compose 编排
└── .dockerignore      ← 构建时忽略的文件
```

---

## 二、本地构建

首先在本地生成生产版本：

```bash
npm run build
```

会生成 `dist/` 目录，里面是优化后的静态文件。

---

## 三、Dockerfile 详解

```dockerfile
# 1. 基础镜像：用 Nginx，alpine 版本超小（只有几MB）
FROM nginx:alpine

# 2. 删除 Nginx 默认配置，避免冲突
RUN rm /etc/nginx/conf.d/default.conf

# 3. 把我们的 nginx.conf 复制到容器配置目录
#    左边：本地项目里的 nginx.conf
#    右边：容器里 /etc/nginx/conf.d/（Nginx 读配置的地方）
COPY nginx.conf /etc/nginx/conf.d/

# 4. 把本地 dist 目录复制到容器静态文件托管目录
#    /usr/share/nginx/html 是 Nginx 默认托管静态文件的地方
COPY dist /usr/share/nginx/html

# 5. 暴露容器内的 80 端口
#    注意：这只是声明，实际还需要 docker-compose.yml 做端口映射
EXPOSE 80

# 6. 启动命令：前台运行 nginx
#    daemon off 让 nginx 在前台，否则容器一启动就会退出
CMD ["nginx", "-g", "daemon off;"]
```

---

## 四、nginx.conf 详解

```nginx
server {
    # 容器内 nginx 监听 80 端口
    listen 80;
    server_name localhost;

    # 静态文件根目录，和 Dockerfile 里的 COPY 路径对应
    root /usr/share/nginx/html;
    index index.html;

    # ========= Gzip 压缩配置 =========
    # 开启 gzip，减小文件体积，加快加载
    gzip on;
    # 指定要压缩的文件类型
    gzip_types text/plain text/css application/json application/javascript
              text/xml application/xml application/xml+rss text/javascript;

    # ========= 缓存策略 =========
    # JS/CSS/图片等静态资源：缓存 1 年，带 immutable
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML：不缓存，避免旧版本问题
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    # ========= SPA 单页应用路由支持 =========
    # 关键！所有路由都返回 index.html，让 React Router/Vue Router 处理
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ========= 健康检查 =========
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## 五、docker-compose.yml 详解

```yaml
# Compose 文件格式版本（不用改，3.8 很稳定）
version: '3.8'

services:
  # 服务名：随便起，用项目名就行
  bloom-todo:
    # 构建：用当前目录的 Dockerfile 构建
    build: .

    # 容器名：方便管理，方便用 docker-compose logs 等
    container_name: bloom-todo

    # 重启策略：除非手动 stop，否则自动重启（防止崩了）
    restart: unless-stopped

    # 端口映射：左边是宿主机端口（外部访问用的），右边是容器内端口
    # 格式："宿主机端口:容器内端口"
    # 访问 http://你的IP:3000 → 会映射到容器的 80
    ports:
      - "3000:80"

    # 环境变量：时区设成中国
    environment:
      - TZ=Asia/Shanghai

    # 健康检查：定期检查容器是否正常
    healthcheck:
      # 测试命令：调用容器内的 /health 接口
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s    # 每 30 秒检查一次
      timeout: 10s     # 超时时间
      retries: 3       # 失败 3 次认为不健康
```

---

## 六、.dockerignore

和 `.gitignore` 类似，构建镜像时忽略的文件：

```
node_modules  # 不需要复制到镜像，我们已经用本地 dist 了
dist
.git
.gitignore
*.log
.env
.env.*
```

---

## 七、服务器部署步骤

### 1. 上传文件到服务器

推荐用 scp 或 sftp，或 git 拉取。

只需要上传这几个：
- `dist/`
- `Dockerfile`
- `nginx.conf`
- `docker-compose.yml`
- `.dockerignore`

放在服务器同一个目录下，比如 `~/Bloom-Todo/`

### 2. 服务器上运行

```bash
# 进入项目目录
cd ~/Bloom-Todo

# 构建并启动容器（--build 确保每次都重新构建）
docker-compose up -d --build

# 看日志
docker-compose logs -f

# 看状态
docker-compose ps
```

### 3. 开放端口

云服务器有两层防火墙，都需要开：

#### A. 云服务商安全组

登录你的云服务商控制台（阿里云/腾讯云等）：
- 找到「安全组」
- 添加入站规则：
  - 协议：TCP
  - 端口：3000
  - 来源：0.0.0.0/0

#### B. 服务器内防火墙（如果用了）

**firewalld：**
```bash
sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

**ufw：**
```bash
sudo ufw allow 3000/tcp
```

### 4. 访问

打开浏览器访问：`http://你的服务器IP:3000`

---

## 八、常用 Docker 命令

```bash
# 启动/构建
docker-compose up -d --build

# 停止（保留容器）
docker-compose stop

# 重启
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器和镜像
docker-compose down --rmi local

# 看日志
docker-compose logs -f

# 看状态
docker-compose ps

# 进入容器
docker exec -it bloom-todo sh

# 在容器里看文件
ls /etc/nginx/conf.d/
ls /usr/share/nginx/html/
```

---

## 九、不使用 Docker，用服务器现有 Nginx

如果你不想用 Docker，直接用服务器上的 Nginx：

### 1. 上传 dist 到服务器

```bash
# 例如放在 /var/www/bloom-todo
```

### 2. 创建 Nginx 配置

在 `/etc/nginx/conf.d/` 创建 `bloom-todo.conf`：

```nginx
server {
    listen 3000;
    server_name localhost;
    root /var/www/bloom-todo;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. 重启 Nginx

```bash
# 测试配置
sudo nginx -t

# 重载
sudo nginx -s reload
```

---

## 十、常见问题

### Q1. 端口被占用

换个端口，修改 `docker-compose.yml`：
```yaml
ports:
  - "8080:80"
```

### Q2. SPA 刷新 404

检查 nginx 配置，确保有：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q3. 更新代码后页面没变化

重新构建并上传 `dist`，然后重启：
```bash
# 本地重新 build
npm run build

# 上传 dist 到服务器

# 服务器上重新构建
docker-compose up -d --build
```

### Q4. 想把配置挂载出来方便修改

改 `docker-compose.yml`：
```yaml
services:
  bloom-todo:
    # ... 其他配置 ...
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/nginx.conf:ro
```

---

## 十一、总结

核心流程：
1. 本地 npm run build → dist
2. 上传文件到服务器
3. docker-compose up -d --build
4. 开安全组和防火墙
5. 访问

记住这个流程，任何 SPA 前端项目都通用！
