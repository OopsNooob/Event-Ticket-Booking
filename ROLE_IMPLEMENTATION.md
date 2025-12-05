# Role-Based Access Control Implementation

## Overview
Đã implement hệ thống phân quyền giữa User (người dùng thường) và Event Organizer (người tổ chức sự kiện).

## Changes Made

### 1. Database Schema (`convex/schema.ts`)
- Thêm field `role` vào users table:
  ```typescript
  role: v.union(v.literal("user"), v.literal("organizer"))
  ```
- Mặc định khi tạo user mới, role = "user"

### 2. Backend Functions (`convex/users.ts`)
- **updateUser**: Tạo user mới với role mặc định là "user"
- **getUserRole**: Query để lấy role của user
- **updateUserRole**: Mutation để đổi role của user

### 3. RoleGuard Component (`components/RoleGuard.tsx`)
- Component bảo vệ routes dựa trên role
- Props:
  - `allowedRole`: "user" hoặc "organizer"
  - `children`: Nội dung cần bảo vệ
- Logic:
  - Nếu chưa login → redirect về "/"
  - Nếu role không đúng → redirect về trang phù hợp
  - Hiển thị spinner khi đang loading

### 4. Protected Routes

#### Organizer-only Routes (wrapped with `<RoleGuard allowedRole="organizer">`)
- `/seller` - Seller landing page
- `/seller/dashboard` - Dashboard với thống kê doanh thu
- `/seller/new-event` - Tạo event mới
- `/seller/events` - Danh sách events của organizer
- `/seller/events/[id]` - Chi tiết event với danh sách người mua
- `/seller/events/[id]/edit` - Chỉnh sửa event

#### User-only Routes (wrapped with `<RoleGuard allowedRole="user">`)
- `/tickets` - Xem danh sách vé đã mua

### 5. Header Navigation (`components/Header.tsx`)
Header hiển thị menu khác nhau tùy theo role:

**Organizer:**
- Dashboard (xanh dương)
- Create Event (xanh lá)
- My Events (xám)
- Settings (tím)

**User:**
- My Tickets (xám)
- Settings (tím)

### 6. Settings Page (`app/settings/page.tsx`)
Trang cho phép user đổi role:
- Hiển thị role hiện tại
- Radio buttons để chọn role mới
- Button "Switch Role" (disabled nếu role giống nhau)
- Sau khi đổi role thành công → redirect về "/"

## How to Test

### 1. Test User Role
1. Login vào app
2. Mặc định sẽ là "User" role
3. Xem được:
   - Homepage với danh sách events
   - My Tickets (nếu đã mua vé)
4. KHÔNG thể truy cập:
   - Các trang /seller/* (sẽ bị redirect về /)

### 2. Switch to Organizer
1. Click vào "Settings" trên header
2. Chọn "Event Organizer"
3. Click "Switch Role"
4. Sẽ redirect về homepage
5. Header giờ hiển thị: Dashboard, Create Event, My Events

### 3. Test Organizer Role
1. Truy cập được:
   - /seller/dashboard - Thống kê doanh thu
   - /seller/new-event - Tạo event
   - /seller/events - Danh sách events
   - /seller/events/[id] - Chi tiết event
2. KHÔNG thể truy cập:
   - /tickets (sẽ bị redirect về /seller/dashboard)

### 4. Switch Back to User
1. Click "Settings" 
2. Chọn "User"
3. Click "Switch Role"
4. Header lại hiển thị "My Tickets"

## Technical Details

### RoleGuard Flow
```
User truy cập protected route
         ↓
    RoleGuard check
         ↓
   ┌─────┴─────┐
   ↓           ↓
Not Login   Logged In
   ↓           ↓
Redirect    Check Role
to "/"         ↓
         ┌─────┴─────┐
         ↓           ↓
    Wrong Role   Correct Role
         ↓           ↓
    Redirect    Render Content
    to proper
    dashboard
```

### Database Updates
- Tất cả users hiện tại trong database sẽ có role = undefined ban đầu
- Khi họ login lần tiếp theo, `updateUser` sẽ không set role (vì user đã tồn tại)
- Users cần vào Settings để set role lần đầu tiên
- Hoặc có thể chạy migration script để set default role cho existing users

## Future Improvements

1. **Admin Role**: Thêm role "admin" để quản lý toàn bộ hệ thống
2. **Permission Granularity**: Thêm permissions chi tiết hơn (create_event, view_analytics, etc.)
3. **Role Approval**: Organizer cần được admin approve trước khi có thể tạo events
4. **Audit Log**: Log lại mỗi lần đổi role
5. **Multi-role**: Cho phép user có nhiều roles cùng lúc
6. **Role-based Pricing**: Organizer trả phí để tạo events

## Notes

- Role được lưu trong Convex database
- Clerk chỉ handle authentication, không handle authorization
- Frontend kiểm tra role để hiển thị UI phù hợp
- Backend mutations/queries cũng nên check role cho security (nên thêm)
- Settings page hiện tại cho phép tự do đổi role - trong production nên có approval process
