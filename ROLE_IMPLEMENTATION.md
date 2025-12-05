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
Trang cho phép user đổi role với validation:
- Hiển thị role hiện tại
- Radio buttons để chọn role mới
- **Validation checks**:
  - User → Organizer: Không được có tickets đã mua
  - Organizer → User: Không được có events đã tạo
- Hiển thị warnings/errors nếu không thể đổi
- Button "Switch Role" (disabled nếu có conflict)
- Sau khi đổi role thành công → redirect về "/"

### 7. Validation Functions (`convex/users.ts`)
**canSwitchRole** - Query để check trước khi cho phép switch:
- Trả về `{ canSwitch: boolean, reason: string, ticketCount?, eventCount? }`
- Check tickets nếu muốn thành organizer
- Check events nếu muốn thành user

**updateUserRole** - Mutation với validation:
- Throw error nếu user có tickets (khi switch sang organizer)
- Throw error nếu organizer có events (khi switch sang user)
- Chỉ update role nếu pass validation

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

### 4. Test Validation - Try to Switch with Conflicts
**Test User có tickets:**
1. Login as User
2. Mua 1 vé
3. Vào Settings → Chọn "Event Organizer"
4. Sẽ thấy warning màu đỏ: "Cannot become organizer: You have X purchased ticket(s)"
5. Button "Switch Role" bị disabled
6. Phải xóa tickets trước (qua Migration page) mới đổi được

**Test Organizer có events:**
1. Login as Organizer
2. Tạo 1 event
3. Vào Settings → Chọn "User"
4. Sẽ thấy warning màu đỏ: "Cannot become user: You have created X event(s)"
5. Button "Switch Role" bị disabled
6. Phải xóa/cancel events trước mới đổi được

### 5. Switch Back to User (if no events)
1. Click "Settings" 
2. Chọn "User"
3. Nếu không có events → Thấy "Ready to Switch" màu xanh
4. Click "Switch Role"
5. Header lại hiển thị "My Tickets"

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

## Validation Rules ✅

### User → Organizer
- ❌ KHÔNG được có tickets đã mua
- ✅ Nếu có tickets, phải xóa hết trước (qua Migration page)
- Lý do: Organizers không được mua vé, sẽ conflict với business logic

### Organizer → User
- ❌ KHÔNG được có events đã tạo
- ✅ Nếu có events, phải xóa/cancel hết trước
- Lý do: Users không được tạo events, sẽ làm mất dữ liệu quản lý

### Settings Page Behavior
1. **Chọn role khác** → Query `canSwitchRole` tự động
2. **Có conflict** → Hiển thị warning màu đỏ với lý do cụ thể
3. **Không conflict** → Hiển thị "Ready to Switch" màu xanh
4. **Button disabled** nếu:
   - Role giống nhau
   - Có conflict (canSwitch = false)
   - Đang loading
5. **Click Switch** → Call mutation với validation
6. **Backend validation** → Double-check trước khi update
7. **Success** → Redirect về "/"

## Future Improvements

1. **Admin Role**: Thêm role "admin" để quản lý toàn bộ hệ thống
2. **Permission Granularity**: Thêm permissions chi tiết hơn (create_event, view_analytics, etc.)
3. **Role Approval**: Organizer cần được admin approve trước khi có thể tạo events
4. **Audit Log**: Log lại mỗi lần đổi role
5. **Multi-role**: Cho phép user có nhiều roles cùng lúc
6. **Role-based Pricing**: Organizer trả phí để tạo events
7. **Bulk Role Assignment**: Admin có thể assign role cho nhiều users cùng lúc
8. **Event Transfer**: Cho phép transfer events từ organizer này sang organizer khác

## Notes

- Role được lưu trong Convex database
- Clerk chỉ handle authentication, không handle authorization
- Frontend kiểm tra role để hiển thị UI phù hợp
- Backend mutations/queries cũng nên check role cho security (nên thêm)
- Settings page hiện tại cho phép tự do đổi role - trong production nên có approval process
