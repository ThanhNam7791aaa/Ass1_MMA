# PRACTICAL EXAM 2 REPORT: AUTHENTICATION, TEAMS & REAL-TIME CHAT

**Course Code:** MMA (Mobile Application Development)  
**Student Name:** [Điền Họ và Tên: ví dụ Đinh Thành Nam]  
**Student ID:** [Điền Mã Số Sinh Viên: ví dụ QE160123 / SE160123]  
**Class:** [Điền Mã Lớp: ví dụ SE1801]  
**GitHub Repository:** https://github.com/ThanhNam7791aaa/Ass1_MMA  
**Direct APK Download Link:** https://expo.dev/artifacts/eas/sziYajedKeSergLOtGZdgBR2WV-J_NDfeK_Y7f9QGc8.apk  
**Expo Build Details:** https://expo.dev/accounts/thanhnam7791as-team/projects/ass1-mma/builds/ce03aa2e-68b6-4eac-810b-1cd3ef2214cc  
**Download QR Code:** [app_download_qr.png](app_download_qr.png)  

---

## 1. ARCHITECTURAL OVERVIEW & PROGRESSION FROM EXAM 1

Practical Exam 2 significantly extends the foundational architecture of **TaskPulse** established in Exam 1:

1. **Identity & Access Management:** Integrated Firebase Authentication (Email/Password) paired with an `AuthContext` to persist sessions via `@react-native-async-storage/async-storage` and conditionally switch between `AuthStack` and `AppStack`.
2. **Multi-Tenant Team Collaboration:** The former placeholder Teams screen is replaced by a fully dynamic team workspace module (`teams` and `teamMembers` collections), supporting code-based invitations and member role designations (`owner` vs `member`).
3. **Delegated Task Management:** Upgraded the task data model so work items can be assigned to a specific team (`teamId`, `teamName`) and team member (`assigneeId`, `assigneeName`).
4. **Real-Time Group Messaging:** Embedded a dedicated chat room for each team using Firestore subcollection (`teams/{teamId}/messages`), synchronized with sub-second latency via `onSnapshot`.
5. **Security Hardening:** Transitioned Firestore rules from test-mode open permissions to authenticated access enforcement (`request.auth != null`).

---

## 2. DATA MODEL & SCHEMA SPECIFICATION

### 2.1 Schema Definition Table

| Collection | Document Fields | Types | Description |
| :--- | :--- | :--- | :--- |
| **`users`** | `id`, `name`, `email`, `avatarUrl`, `createdAt` | string, string, string, string, timestamp | Synchronized profile document for each authenticated user. |
| **`teams`** | `id`, `name`, `description`, `ownerId`, `ownerName`, `code`, `createdAt` | string, string, string, string, string, string, timestamp | Team workspace entity with 6-character uppercase invite code. |
| **`teamMembers`**| `id`, `teamId`, `userId`, `userName`, `userEmail`, `role`, `joinedAt` | string, string, string, string, string, string, timestamp | Junction document associating users with teams (`role`: 'owner' \| 'member'). |
| **`tasks`** | `id`, `title`, `description`, `status`, `priority`, `dueDate`, `teamId`, `teamName`, `assigneeId`, `assigneeName`, `createdAt` | string, string, string, string, string, string, string, string, string, string, timestamp | Work item linked to team workspaces and team assignees. |
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
                |                  |        +-------------------+        |
                |                  |                  |                  |
                |                  |                  |                  |
                v                  |                  v                  |
       +------------------+        |        +-------------------+        |
       |   teamMembers    |        |        |     messages      |        |
       +------------------+        |        |   (subcollection) |        |
       | [PK] id          |        |        +-------------------+        |
       | [FK] teamId -----+--------+------->| [PK] id           |        |
       | [FK] userId -----+--------+        | [FK] senderId ----+--------+
       |      userName    |                 |      senderName   |
       |      userEmail   |                 |      text         |
       |      role        |                 |      createdAt    |
       |      joinedAt    |                 +-------------------+
       +------------------+
                ^
                |
                +----------------------------------+
                                                   |
                                                   v
                                        +-------------------+
                                        |       tasks       |
                                        +-------------------+
                                        | [PK] id           |
                                        |      title        |
                                        |      description  |
                                        |      status       |
                                        |      priority     |
                                        |      dueDate      |
                                        | [FK] teamId       |
                                        |      teamName     |
                                        | [FK] assigneeId   |
                                        |      assigneeName |
                                        |      createdAt    |
                                        +-------------------+
```

---

## 3. SCREENSHOT EVIDENCE & COMPREHENSIVE CAPTIONS

---

### Screenshot 1: Firebase Authentication Console — Test Users
- **[Chèn ảnh chụp màn hình Firebase Console -> tab Authentication -> Users hiển thị ít nhất 2 tài khoản test: Alice & Bob]**
- **Detailed Caption (EN):**  
  *Figure 1 (Requirement 1 — Firebase Authentication): The Firebase Authentication console proving active user provisioning with Email/Password provider for two test accounts (e.g. alice@test.com and bob@test.com).*
- **Chú thích chi tiết (VI):**  
  *Hình 1 (Yêu cầu 1 — Xác thực Firebase): Màn hình quản lý Firebase Authentication xác nhận 2 tài khoản kiểm thử đã được đăng ký thành công bằng phương thức Email/Password.*

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

### Screenshot 4: Sign Up & Login Screens
- **[Chèn ảnh chụp màn hình ghép hoặc 2 ảnh: Màn hình Đăng ký (Sign Up) và Màn hình Đăng nhập (Login)]**
- **Detailed Caption (EN):**  
  *Figure 4 (Requirement 1 & UI Requirements — Auth Screens): The mobile Sign In and Sign Up interfaces demonstrating input validation, secure password toggling, and clean form styling.*
- **Chú thích chi tiết (VI):**  
  *Hình 4 (Yêu cầu 1 & Giao diện — Đăng nhập và Đăng ký): Giao diện màn hình Login và Sign Up với kiểm tra dữ liệu đầu vào (validation), ẩn/hiện mật khẩu và liên kết chuyển hướng mượt mà.*

---

### Screenshot 5: Home Screen After Login (Protected Route)
- **[Chèn ảnh chụp màn hình Home Screen khi vừa đăng nhập thành công]**
- **Detailed Caption (EN):**  
  *Figure 5 (Requirements 1 & 3 — Protected Home Screen): The Home screen unlocked post-authentication, showing tasks associated with the user's teams along with interactive status filter chips.*
- **Chú thích chi tiết (VI):**  
  *Hình 5 (Yêu cầu 1 & 3 — Màn hình Home được bảo vệ): Màn hình chính sau khi đăng nhập thành công, hiển thị các công việc thuộc các nhóm mà người dùng tham gia cùng bộ lọc trạng thái.*

---

### Screenshot 6: Teams Screen (Create Team & Join Team Modals)
- **[Chèn ảnh chụp màn hình tab Teams với danh sách nhóm và modal Tạo nhóm hoặc Gia nhập nhóm bằng mã Code]**
- **Detailed Caption (EN):**  
  *Figure 6 (Requirement 2 — Team Management): The Teams screen showcasing active team workspaces, 6-character invite codes, and modal dialogs for creating new teams or joining with a code.*
- **Chú thích chi tiết (VI):**  
  *Hình 6 (Yêu cầu 2 — Quản lý Nhóm): Màn hình Teams hiển thị danh sách các nhóm đã tham gia, mã mời 6 ký tự và modal tạo nhóm mới / gia nhập nhóm bằng mã mời.*

---

### Screenshot 7: Team Detail Screen (Members & Tasks Tabs)
- **[Chèn ảnh chụp màn hình Màn hình Team Detail với tab Members và tab Tasks]**
- **Detailed Caption (EN):**  
  *Figure 7 (Requirement 2 — Team Detail Screen): The Team Detail view displaying the team header, shareable invite code, the "Open Team Chat Room" action, and the tabbed member list with roles (Owner / Member).*
- **Chú thích chi tiết (VI):**  
  *Hình 7 (Yêu cầu 2 — Chi tiết Nhóm): Màn hình chi tiết nhóm hiển thị thông tin nhóm, nút mở phòng Chat nhóm và danh sách thành viên phân cấp vai trò (Owner / Member).*

---

### Screenshot 8: Task Creation / Edit with Team & Assignee Selected
- **[Chèn ảnh chụp màn hình Modal Create/Edit Task khi đã chọn Team và chọn Assignee]**
- **Detailed Caption (EN):**  
  *Figure 8 (Requirement 3 — Task Delegation): The Task creation modal demonstrating team workspace selection and specific member assignment from dynamic team chips.*
- **Chú thích chi tiết (VI):**  
  *Hình 8 (Yêu cầu 3 — Gán công việc cho thành viên): Modal tạo/sửa task với tùy chọn liên kết công việc vào một Team và chỉ định thành viên chịu trách nhiệm (Assignee).*

---

### Screenshot 9: Task Card Displaying Assigned Member Name
- **[Chèn ảnh chụp màn hình Task Card trên danh sách hiển thị rõ tên Assignee và tên Team]**
- **Detailed Caption (EN):**  
  *Figure 9 (Requirement 3 — Assignee Visibility): The task card rendering the designated team badge and green assignee tag ("Assigned to: Member Name") verifying end-to-end data binding.*
- **Chú thích chi tiết (VI):**  
  *Hình 9 (Yêu cầu 3 — Hiển thị người được giao việc): Thẻ công việc hiển thị rõ ràng nhãn nhóm (Team badge) và huy hiệu người thực hiện (Assignee tag) xác nhận liên kết dữ liệu thành công.*

---

### Screenshot 10: Real-Time Team Chat Screen (Multi-User Conversation)
- **[Chèn ảnh chụp màn hình Phòng Chat hiển thị đoạn hội thoại qua lại giữa 2 tài khoản (Alice và Bob) kèm timestamps]**
- **Detailed Caption (EN):**  
  *Figure 10 (Requirement 4 — Real-Time Chat): The team chat screen displaying synchronized conversation between two test accounts; current user messages are highlighted in blue on the right while teammate messages appear on the left with sender names and timestamps.*
- **Chú thích chi tiết (VI):**  
  *Hình 10 (Yêu cầu 4 — Chat thời gian thực): Màn hình chat nhóm thể hiện cuộc trò chuyện qua lại giữa 2 tài khoản kiểm thử; tin nhắn của mình màu xanh bên phải và tin nhắn của đồng đội bên trái có kèm tên và mốc thời gian.*

---

### Screenshot 11: User Profile Screen & Sign Out Confirmation
- **[Chèn ảnh chụp màn hình tab Profile hiển thị tên/email người dùng và hộp thoại xác nhận Sign Out]**
- **Detailed Caption (EN):**  
  *Figure 11 (Requirement 1 — Profile & Sign Out): The User Profile screen displaying verified Firebase credentials, UID, and the logout confirmation dialog returning the user to the Login screen upon confirmation.*
- **Chú thích chi tiết (VI):**  
  *Hình 11 (Yêu cầu 1 — Hồ sơ & Đăng xuất): Màn hình Profile hiển thị thông tin tài khoản Firebase đã xác thực và hộp thoại xác nhận đăng xuất đưa người dùng trở về màn hình Login.*
