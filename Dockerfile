FROM nginx:alpine

# Clean default nginx webroot
RUN rm -rf /usr/share/nginx/html/*

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy prebuilt SPA application
COPY dist /usr/share/nginx/html

# Copy bank assets
COPY bank /usr/share/nginx/html/bank

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
