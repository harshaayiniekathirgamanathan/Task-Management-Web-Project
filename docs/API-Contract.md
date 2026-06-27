> Notation: `→` means "sends back". `[Bearer]` = needs login token. `[admin]` / `[PM]` = needs that role.

**Auth** (Member 2)
```
POST /api/auth/login           {email, password} → {accessToken, user:{id,name,email,role,must_reset_password}} | 401
POST /api/auth/refresh         (cookie)          → {accessToken} | 401
POST /api/auth/logout          [Bearer]          → 204
POST /api/auth/change-password [Bearer] {currentPassword,newPassword} → {message} | 400
```
**Users** (Member 2) — all `[admin]`
```
GET   /api/users?search=&role=&active=  → [{id,name,email,role,is_active,created_at}]
POST  /api/users        {name,email,role} → 201 {id,name,email,role}   (also emails a temp password)
PATCH /api/users/:id    {name?,role?}     → {user}
PATCH /api/users/:id/deactivate           → {user}
PATCH /api/users/:id/activate             → {user}
```
**Projects** (Member 3)
```
GET    /api/projects                  [Bearer] → [{id,title,description,created_by,created_at}]
POST   /api/projects   [PM] {title,description} → 201 {project}
GET    /api/projects/:id              [Bearer] → {project}
PATCH  /api/projects/:id [PM] {title?,description?} → {project}
DELETE /api/projects/:id [PM]         → 204
```
**Tasks** (Member 3)
```
GET   /api/tasks?project_id=&status=&priority=&assignee=&sort= [Bearer]
        → [{id,title,description,priority,status,due_date,assignees:[{id,name}],labels:[{id,name,color}]}]
POST  /api/tasks  [PM] {project_id,title,description,priority,due_date,assignee_ids:[]} → 201 {task}
GET   /api/tasks/:id           [Bearer] → {task}
PATCH /api/tasks/:id     [PM] {title?,description?,priority?,due_date?,assignee_ids?} → {task}
PATCH /api/tasks/:id/status  [Bearer, assignee or PM] {status} → {task}
DELETE /api/tasks/:id    [PM] → 204
```
**Comments** (Member 4)
```
GET  /api/tasks/:taskId/comments  [Bearer] → [{id,content,author:{id,name},created_at}]
POST /api/tasks/:taskId/comments  [Bearer] {content} → 201 {comment}
```
**Attachments** (Member 4)
```
GET  /api/tasks/:taskId/attachments [Bearer] → [{id,file_name,file_url,file_size,created_at}]
POST /api/tasks/:taskId/attachments [Bearer] (file upload) → 201 {attachment}
```
**Labels** (Member 4)
```
GET    /api/projects/:projectId/labels [Bearer] → [{id,name,color}]
POST   /api/projects/:projectId/labels [PM] {name,color} → 201 {label}
POST   /api/tasks/:taskId/labels/:labelId   [PM] → 200   (attach label to task)
DELETE /api/tasks/:taskId/labels/:labelId   [PM] → 204   (remove label)
```
**Notifications** (Member 4)
```
GET   /api/notifications        [Bearer] → [{id,type,message,task_id,is_read,created_at}]
PATCH /api/notifications/:id/read [Bearer] → {notification}
Live: after login the browser connects a socket; server sends event "notification:new" {id,type,message,task_id,created_at}
```

> Roles: **admin** (manages users), **project_manager / PM** (manages projects & tasks), **collaborator** (works on assigned tasks: change status, comment, attach files — cannot delete tasks).
