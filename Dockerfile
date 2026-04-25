# 直接用 Nginx 托管本地构建好的 dist
FROM nginx:alpine

# 删除默认 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制本地构建好的 dist
COPY dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
