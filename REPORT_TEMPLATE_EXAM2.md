# PRACTICAL EXAM 2 REPORT: AUTHENTICATION, TEAMS & REAL-TIME CHAT

**Course Code:** MMA (Mobile Application Development)  
**Student Name:** [Điền Họ và Tên: ví dụ Đinh Thành Nam]  
**Student ID:** [Điền Mã Số Sinh Viên: ví dụ QE160123 / SE160123]  
**Class:** [Điền Mã Lớp: ví dụ SE1801]  
**GitHub Repository:** https://github.com/ThanhNam7791aaa/Ass2_MMA  
**Direct APK Download Link:** https://expo.dev/artifacts/eas/ht-oDi4un_gOy8f1LqB08gcv5L2MdVRR5RSpKWYL-bE.apk  
**Expo Build Details:** https://expo.dev/accounts/thanhnam7791as-team/projects/ass1-mma/builds/ce03aa2e-68b6-4eac-810b-1cd3ef2214cc  
**Download QR Code:** [app_download_qr.png](app_download_qr.png)  

---

## 1. ARCHITECTURAL OVERVIEW & PROGRESSION FROM EXAM 1

Practical Exam 2 significantly extends the foundational architecture of **TaskPulse** established in Exam 1:

1. **Identity & Access Management:** Integrated Firebase Authentication (Email/Password & Google Sign-In) paired with an `AuthContext` to persist sessions via `@react-native-async-storage/async-storage` and conditionally switch between `AuthStack` and `AppStack`.
2. **Multi-Tenant Team Collaboration:** The former placeholder Teams screen is replaced by a fully dynamic team workspace module (`teams` and `teamMembers` collections), supporting code-based invitations and member role designations (`owner` vs `member`).
3. **Delegated Task Management:** Upgraded the task data model so work items can be assigned to a specific team (`teamId`, `teamName`) and team member (`assigneeId`, `assigneeName`).
4. **Real-Time Group Messaging:** Embedded a dedicated chat room for each team using Firestore subcollection (`teams/{teamId}/messages`), synchronized with sub-second latency via `onSnapshot`.
5. **Security Hardening:** Transitioned Firestore rules from test-mode open permissions to authenticated access enforcement (`request.auth != null`).
6. **Task Isolation & Multi-Account Privacy:** Enhanced task architecture by binding all personal tasks to the creator's `userId`. Personal tasks on the Home Screen are strictly isolated per account, while team tasks remain strictly segregated inside their respective team workspaces (`teamId`).
7. **Team Lifecycle & Member Moderation:** Implemented full lifecycle management allowing regular members to leave teams (`leaveTeam`) via a quick button on team cards or inside the team detail view, and granting team owners administrative controls to remove specific members (`removeTeamMember`) or delete/disband entire workspaces (`deleteTeam`) with automated task cleanup.
8. **Account Security (Self-Service Password Change):** Built an in-app password change modal inside the Profile screen featuring Firebase re-authentication (`reauthenticateWithCredential`) before password updates.
9. **Android System Bar Safe Area Optimization:** Incorporated dynamic safe area insets via `react-native-safe-area-context` to guarantee zero overlap with Android's bottom 3-button navigation bar.

---

## 2. DATA MODEL & SCHEMA SPECIFICATION

### 2.1 Schema Definition Table

| Collection | Document Fields | Types | Description |
| :--- | :--- | :--- | :--- |
| **`users`** | `id`, `name`, `email`, `avatarUrl`, `createdAt` | string, string, string, string, timestamp | Synchronized profile document for each authenticated user. |
| **`teams`** | `id`, `name`, `description`, `ownerId`, `ownerName`, `code`, `createdAt` | string, string, string, string, string, string, timestamp | Team workspace entity with 6-character uppercase invite code. |
| **`teamMembers`**| `id`, `teamId`, `userId`, `userName`, `userEmail`, `role`, `joinedAt` | string, string, string, string, string, string, timestamp | Junction document associating users with teams (`role`: 'owner' \| 'member'). |
| **`tasks`** | `id`, `title`, `description`, `status`, `priority`, `dueDate`, `userId`, `teamId`, `teamName`, `assigneeId`, `assigneeName`, `createdAt` | string, string, string, string, string, string, string, string, string, string, string, timestamp | Work item linked to an owner/creator (`userId`) or team workspace (`teamId`) and team assignee. |
| **`teams/{teamId}/messages`** | `id`, `senderId`, `senderName`, `text`, `createdAt` | string, string, string, string, timestamp | Subcollection storing chronologically ordered team chat messages. |

### 2.2 Entity Relationship Diagram (ERD)

```text
       +------------------+                 +-------------------+
       |      users       |                 |       teams       |
       +------------------+                 +-------------------+
       | [PK] id (UID)    |<-------+        | [PK] id           |<-------+
       |      name        |        |        |      name         |        |
       |      email       |        |        |      description  |        |
       |      avatarUrl   |        |        |      ownerId (FK) |        |
       |      createdAt   |        |        |      code (Invite)|        |
       +------------------+        |        |      createdAt    |        |
           |          |            |        +-------------------+        |
           |          |            |                  |                  |
           |          v            |                  |                  |
           |   +------------------+|                  v                  |
           |   |   teamMembers    ||        +-------------------+        |
           |   +------------------+|        |     messages      |        |
           |   | [PK] id          ||        |   (subcollection) |        |
           |   | [FK] teamId -----++------->| [PK] id           |        |
           |   | [FK] userId -----++        | [FK] senderId ----+--------+
           |   |      userName    |         |      senderName   |
           |   |      userEmail   |         |      text         |
           |   |      role        |         |      createdAt    |
           |   |      joinedAt    |         +-------------------+
           |   +------------------+
           |            ^
           |            |
           v            +----------------------------------+
+-------------------+                                      |
|       tasks       |                                      |
+-------------------+                                      v
| [PK] id           |
|      title        |
|      description  |
|      status       |
|      priority     |
|      dueDate      |
| [FK] userId (Own) |
| [FK] teamId (Work)|
|      teamName     |
| [FK] assigneeId   |
|      assigneeName |
|      createdAt    |
+-------------------+
```

---

## 3. SCREENSHOT EVIDENCE & COMPREHENSIVE CAPTIONS

---

### Screenshot 1: Firebase Authentication Console — Test Users & Providers
- **[Chèn ảnh chụp màn hình Firebase Console -> tab Authentication -> Users hiển thị các tài khoản test và providers: Email/Password, Google]**
- **Detailed Caption (EN):**  
  *Figure 1 (Requirement 1 — Firebase Authentication): The Firebase Authentication console verifying active user provisioning with Email/Password and Google OAuth providers.*
- **Chú thích chi tiết (VI):**  
  *Hình 1 (Yêu cầu 1 — Xác thực Firebase): Màn hình quản lý Firebase Authentication xác nhận các tài khoản kiểm thử đã được cấp quyền qua phương thức Email/Password và Google OAuth.*

---

### Screenshot 2: Cloud Firestore Database — All Collections
- **[Chèn ảnh chụp màn hình Firestore Console hiển thị đầy đủ các collections: `users`, `teams`, `teamMembers`, `tasks`, và subcollection `messages`]**
- **Detailed Caption (EN):**  
  *Figure 2 (Requirements 1, 2, 3, 4 — Firestore Collections): The Cloud Firestore console displaying the complete NoSQL schema, including `users`, `teams`, `teamMembers`, `tasks`, and the nested `messages` subcollection with populated documents.*
- **Chú thích chi tiết (VI):**  
  *Hình 2 (Yêu cầu 1, 2, 3, 4 — Cơ sở dữ liệu Firestore): Giao diện Firestore Database hiển thị đầy đủ các collections chính (`users`, `teams`, `teamMembers`, `tasks`) và subcollection tin nhắn `messages` với dữ liệu mẫu.*

---

### Screenshot 3: Firestore Security Rules
- **[Chèn ảnh chụp màn hình Firebase Console -> Firestore Database -> tab Rules]**
- **Detailed Caption (EN):**  
  *Figure 3 (Requirement 5 — Security Rules): The updated Firestore Security Rules rejecting unauthenticated operations and enforcing `request.auth != null` for reading and writing all application collections.*
- **Chú thích chi tiết (VI):**  
  *Hình 3 (Yêu cầu 5 — Luật bảo mật Firestore): Quy tắc bảo mật Firestore được cập nhật để yêu cầu xác thực (`request.auth != null`) đối với mọi thao tác đọc/ghi vào các collection.*

---

### Screenshot 4: Sign Up & Login Screens (Email & Google Sign-In)
- **[Chèn ảnh chụp màn hình ghép hoặc 2 ảnh: Màn hình Đăng ký (Sign Up) và Màn hình Đăng nhập (Login) có nút Google]**
- **Detailed Caption (EN):**  
  *Figure 4 (Requirement 1 & UI Requirements — Auth Screens): The mobile Sign In and Sign Up interfaces demonstrating input validation, secure password toggling, clean form styling, and official Google Sign-In button.*
- **Chú thích chi tiết (VI):**  
  *Hình 4 (Yêu cầu 1 & Giao diện — Đăng nhập và Đăng ký): Giao diện màn hình Login và Sign Up với kiểm tra dữ liệu đầu vào (validation), ẩn/hiện mật khẩu và nút bấm Google Sign-In chính thức.*

---

### Screenshot 5: Home Screen After Login (Personal Tasks Isolation)
- **[Chèn ảnh chụp màn hình Home Screen khi vừa đăng nhập thành công với các task cá nhân riêng biệt]**
- **Detailed Caption (EN):**  
  *Figure 5 (Requirements 1 & 3 — Protected Home Screen): The Home screen unlocked post-authentication, showing personal tasks isolated exclusively for the logged-in user, filtered away from team-level tasks.*
- **Chú thích chi tiết (VI):**  
  *Hình 5 (Yêu cầu 1 & 3 — Màn hình Home được bảo vệ): Màn hình chính sau khi đăng nhập thành công, hiển thị các công việc cá nhân của riêng tài khoản đó mà không bị lẫn với các task của nhóm.*

---

### Screenshot 6: Teams Screen (Create Team, Join Team & Quick Leave)
- **[Chèn ảnh chụp màn hình tab Teams với danh sách nhóm, nút Leave nhanh cho Member và modal Tạo nhóm]**
- **Detailed Caption (EN):**  
  *Figure 6 (Requirement 2 — Team Management): The Teams screen showcasing active team workspaces, 6-character invite codes, one-touch "Leave" quick action for members, and modals for creating/joining teams.*
- **Chú thích chi tiết (VI):**  
  *Hình 6 (Yêu cầu 2 — Quản lý Nhóm): Màn hình Teams hiển thị danh sách các nhóm đã tham gia, mã mời 6 ký tự, nút thao tác nhanh "Leave" cho thành viên và modal tạo nhóm / gia nhập nhóm.*

---

### Screenshot 7: Team Detail Screen (Members & Tasks Tabs)
- **[Chèn ảnh chụp màn hình Màn hình Team Detail với tab Members và tab Tasks]**
- **Detailed Caption (EN):**  
  *Figure 7 (Requirement 2 — Team Detail Screen): The Team Detail view displaying the team header, shareable invite code, the "Open Team Chat Room" action, and the tabbed member list with roles (Owner / Member).*
- **Chú thích chi tiết (VI):**  
  *Hình 7 (Yêu cầu 2 — Chi tiết Nhóm): Màn hình chi tiết nhóm hiển thị thông tin nhóm, nút mở phòng Chat nhóm và danh sách thành viên phân cấp vai trò (Owner / Member).*

---

### Screenshot 8: Team Member Moderation (Remove Member by Owner & Leave Team by Member)
- **[Chèn ảnh chụp màn hình tab Members trong Team Detail hiển thị nút xóa thành viên đỏ của Owner và nút Disband / Leave ở dưới cùng]**
- **Detailed Caption (EN):**  
  *Figure 8 (Requirement 2 — Team Moderation & Member Removal): The Members list showcasing the Owner's red remove member action next to regular member items, the current user "(You)" tag, and the "Disband & Delete Team" footer button.*
- **Chú thích chi tiết (VI):**  
  *Hình 8 (Yêu cầu 2 — Quản lý và Xóa thành viên nhóm): Danh sách thành viên hiển thị nút xóa thành viên màu đỏ dành cho chủ nhóm (Owner), nhãn nhận diện "(You)" và nút giải tán/xóa nhóm ở chân trang.*

---

### Screenshot 9: Task Creation / Edit with Team & Assignee Selected
- **[Chèn ảnh chụp màn hình Modal Create/Edit Task khi đã chọn Team và chọn Assignee]**
- **Detailed Caption (EN):**  
  *Figure 9 (Requirement 3 — Task Delegation): The Task creation modal demonstrating team workspace selection and specific member assignment from dynamic team chips.*
- **Chú thích chi tiết (VI):**  
  *Hình 9 (Yêu cầu 3 — Gán công việc cho thành viên): Modal tạo/sửa task với tùy chọn liên kết công việc vào một Team và chỉ định thành viên chịu trách nhiệm (Assignee).*

---

### Screenshot 10: Task Card Displaying Assigned Member Name & Team Badge
- **[Chèn ảnh chụp màn hình Task Card trên danh sách hiển thị rõ tên Assignee và tên Team]**
- **Detailed Caption (EN):**  
  *Figure 10 (Requirement 3 — Assignee Visibility): The task card rendering the designated team badge and green assignee tag ("Assigned to: Member Name") verifying end-to-end data binding.*
- **Chú thích chi tiết (VI):**  
  *Hình 10 (Yêu cầu 3 — Hiển thị người được giao việc): Thẻ công việc hiển thị rõ ràng nhãn nhóm (Team badge) và huy hiệu người thực hiện (Assignee tag) xác nhận liên kết dữ liệu thành công.*

---

### Screenshot 11: Real-Time Team Chat Screen (Multi-User Conversation)
- **[Chèn ảnh chụp màn hình Phòng Chat hiển thị đoạn hội thoại qua lại giữa 2 tài khoản kèm timestamps]**
- **Detailed Caption (EN):**  
  *Figure 11 (Requirement 4 — Real-Time Chat): The team chat screen displaying synchronized conversation between two test accounts; current user messages are highlighted in blue on the right while teammate messages appear on the left with sender names and timestamps.*
- **Chú thích chi tiết (VI):**  
  *Hình 11 (Yêu cầu 4 — Chat thời gian thực): Màn hình chat nhóm thể hiện cuộc trò chuyện qua lại giữa 2 tài khoản kiểm thử; tin nhắn của mình màu xanh bên phải và tin nhắn của đồng đội bên trái có kèm tên và mốc thời gian.*

---

### Screenshot 12: User Profile Screen & Change Password Modal
- **[Chèn ảnh chụp màn hình tab Profile hiển thị thông tin tài khoản, nút Change Password và hộp thoại xác nhận Sign Out]**
- **Detailed Caption (EN):**  
  *Figure 12 (Requirement 1 — Profile, Password Update & Sign Out): The User Profile screen displaying verified Firebase credentials, UID, password change dialog with re-authentication, and the logout confirmation.*
- **Chú thích chi tiết (VI):**  
  *Hình 12 (Yêu cầu 1 — Hồ sơ, Đổi mật khẩu & Đăng xuất): Màn hình Profile hiển thị thông tin tài khoản Firebase đã xác thực, modal đổi mật khẩu an toàn và hộp thoại xác nhận đăng xuất.*
