# Production Deployment Checklist

## 📋 Pre-Deployment

### Security
- [ ] Thay đổi `SECRET_KEY` thành một giá trị random mạnh
- [ ] Thay đổi default admin password
- [ ] Cấu hình CORS origins chính xác (không dùng `*`)
- [ ] Kiểm tra tất cả sensitive data không bị commit vào git
- [ ] Đảm bảo `.env` file không được commit (có trong `.gitignore`)

### Database
- [ ] Backup database hiện tại
- [ ] Test database connection
- [ ] Kiểm tra database indexes
- [ ] Cấu hình connection pool phù hợp
- [ ] Setup database backup tự động

### Environment Variables
- [ ] `DATABASE_URL` - Production database connection
- [ ] `SECRET_KEY` - Strong random key
- [ ] `ENVIRONMENT` - Set to "production"
- [ ] `DEBUG` - Set to False
- [ ] `BACKEND_CORS_ORIGINS` - Production frontend URLs
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` - Appropriate value
- [ ] `LOG_LEVEL` - Set to "INFO" or "WARNING"

### Code Quality
- [ ] Tất cả tests pass
- [ ] Code review completed
- [ ] No TODO or FIXME comments
- [ ] Documentation updated
- [ ] API documentation reviewed

## 🚀 Deployment

### Server Setup
- [ ] Python 3.9+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed from `requirements.txt`
- [ ] ODBC Driver for SQL Server installed (if using MSSQL)

### Application Configuration
- [ ] Environment variables configured
- [ ] Log directory created and writable
- [ ] Upload directory created and writable (if applicable)
- [ ] Static files configured (if applicable)

### Web Server
- [ ] Nginx/Apache configured as reverse proxy
- [ ] SSL/TLS certificate installed
- [ ] HTTPS enabled and HTTP redirected
- [ ] Rate limiting configured
- [ ] Request size limits configured

### Process Manager
- [ ] Systemd service file created
- [ ] Or Supervisor configured
- [ ] Or PM2 configured (if using)
- [ ] Auto-restart on failure enabled
- [ ] Multiple workers configured (4-8 recommended)

### Example Systemd Service
```ini
[Unit]
Description=WebOrder FastAPI Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/weborder/backend
Environment="PATH=/var/www/weborder/backend/venv/bin"
ExecStart=/var/www/weborder/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

### Example Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## ✅ Post-Deployment

### Verification
- [ ] Application starts without errors
- [ ] Health check endpoint responds: `/health`
- [ ] API documentation accessible: `/api/v1/docs`
- [ ] Can login with admin account
- [ ] Can create test order
- [ ] Database connections working
- [ ] CORS working with frontend
- [ ] SSL certificate valid

### Monitoring
- [ ] Application logs configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring setup
- [ ] Uptime monitoring configured
- [ ] Database monitoring setup
- [ ] Disk space monitoring
- [ ] Memory usage monitoring

### Backup
- [ ] Database backup configured
- [ ] Application backup configured
- [ ] Backup restoration tested
- [ ] Backup retention policy defined

### Documentation
- [ ] Deployment documentation updated
- [ ] API documentation published
- [ ] Admin credentials documented (securely)
- [ ] Monitoring dashboards documented
- [ ] Incident response plan documented

## 🔧 Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Update dependencies (security patches)
- [ ] Database maintenance (vacuum, analyze)
- [ ] Backup verification
- [ ] SSL certificate renewal (if needed)

### Performance Optimization
- [ ] Enable database query caching
- [ ] Configure Redis for session storage (if needed)
- [ ] Setup CDN for static files (if applicable)
- [ ] Optimize database queries
- [ ] Add database indexes where needed
- [ ] Configure connection pooling

## 🚨 Rollback Plan

### If Deployment Fails
1. Stop the new application
2. Restore previous application version
3. Restore database backup (if schema changed)
4. Verify application working
5. Investigate issues
6. Fix and redeploy

### Rollback Commands
```bash
# Stop current service
sudo systemctl stop weborder

# Restore previous version
cd /var/www/weborder/backend
git checkout previous-tag

# Restore database (if needed)
# ... database restore commands ...

# Restart service
sudo systemctl start weborder

# Verify
curl http://localhost:8000/health
```

## 📊 Performance Benchmarks

### Expected Performance
- Response time: < 200ms (p95)
- Throughput: > 1000 req/s
- Error rate: < 0.1%
- Uptime: > 99.9%

### Load Testing
```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:8000/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:8000/api/v1/products
```

## 🔐 Security Hardening

- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication only
- [ ] Fail2ban configured
- [ ] Regular security updates
- [ ] SQL injection protection (using ORM)
- [ ] XSS protection headers
- [ ] CSRF protection (if needed)
- [ ] Rate limiting per IP
- [ ] Input validation on all endpoints

## 📞 Support

### Contact Information
- DevOps Team: devops@company.com
- On-call: +84-xxx-xxx-xxx
- Slack Channel: #weborder-support

### Useful Commands
```bash
# Check application status
sudo systemctl status weborder

# View logs
sudo journalctl -u weborder -f

# Restart application
sudo systemctl restart weborder

# Check database connection
python test_connection.py

# Run migrations (if using Alembic)
alembic upgrade head
```

---

**Last Updated**: 2025-12-18
**Deployment Version**: 1.0.0
