# PRACTICAL EXAM 1: TASK MANAGEMENT MOBILE APP
**Course:** Mobile Application Development (MMA)  
**Student ID:** [Điền mã số sinh viên, ví dụ: QE160000]  
**Student Name:** [Điền họ và tên sinh viên]  
**Class:** [Điền mã lớp]  
**GitHub Repository:** https://github.com/ThanhNam7791aaa/Ass1_MMA  
**Expo / App Preview Link:** [Điền link Expo hoặc đính kèm ảnh QR code]  

---

## 1. FIRESTORE DATA MODEL DESCRIPTION

### 1.1 Overview
Ứng dụng sử dụng cơ sở dữ liệu phi quan hệ Google Cloud Firestore với bộ sưu tập chính là `tasks`. Mỗi tài liệu (document) đại diện cho một công việc được quản lý độc lập, không yêu cầu xác thực người dùng (Public CRUD).

### 1.2 Data Schema Table
| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Mô tả |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Có (Auto) | Mã định danh duy nhất của tài liệu do Firestore tự sinh. |
| `title` | `string` | Có | Tiêu đề của công việc (được kiểm tra client-side validation không để trống). |
| `description` | `string` | Không | Nội dung chi tiết hoặc ghi chú của công việc. |
| `status` | `string` | Có | Trạng thái công việc: `"To Do"` \| `"In Progress"` \| `"Done"`. |
| `priority` | `string` | Có | Mức độ ưu tiên: `"Low"` \| `"Medium"` \| `"High"`. |
| `dueDate` | `string` | Không | Ngày hạn chót thực hiện (định dạng `YYYY-MM-DD`). |
| `createdAt` | `timestamp` | Có | Thời gian khởi tạo do máy chủ Firebase tạo (`serverTimestamp`). |
| `teamId` | `string \| null` | Không | Trường dự lưu cho Practical Exam 2 (hiện tại mang giá trị `null`). |
| `assigneeId` | `string \| null` | Không | Trường dự lưu cho Practical Exam 2 (hiện tại mang giá trị `null`). |

---

## 2. FUNCTIONAL SCREENSHOTS & DESCRIPTIONS

> **Lưu ý:** Chèn ảnh chụp màn hình tương ứng vào từng mục bên dưới trong file Word và đảm bảo kích thước ảnh rõ ràng, đọc được chữ.

### 2.1 Firebase Console - Firestore Collection
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Firebase Console -> Firestore Database -> Collection `tasks`]
- **Chú thích:** "Giao diện Firestore Database trên Firebase Console hiển thị collection `tasks` với các documents mẫu và đầy đủ các trường dữ liệu theo đặc tả đề bài."

### 2.2 Home Screen ban đầu
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Home Screen khi mở app]
- **Chú thích:** "Màn hình Home hiển thị tiêu đề ứng dụng 'TaskPulse', mô tả ngắn gọn, thanh lọc trạng thái (Status Filter), nút '+ New Task', danh sách task ban đầu và thanh điều hướng Bottom Tab Navigation."

### 2.3 Form Create Task (Trước khi Submit)
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Modal Create Task đã điền đủ thông tin]
- **Chú thích:** "Modal tạo mới công việc với các trường Title, Description, lựa chọn Status, Priority và DueDate đã được nhập hoàn chỉnh trước khi bấm Create Task."

### 2.4 Task List sau khi Create
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Task List xuất hiện task mới]
- **Chú thích:** "Danh sách task trên màn hình Home được tự động cập nhật ngay lập tức (real-time qua `onSnapshot`) hiển thị công việc mới vừa tạo kèm badge trạng thái."

### 2.5 Form Edit Task
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Modal Edit với dữ liệu cũ đang được thay đổi]
- **Chú thích:** "Modal chỉnh sửa công việc hiển thị thông tin cũ của task và đang được cập nhật tiêu đề, trạng thái sang 'In Progress'."

### 2.6 Task List sau khi Edit
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Task List sau khi sửa]
- **Chú thích:** "Danh sách công việc hiển thị thông tin mới nhất sau khi cập nhật thành công mà không cần tải lại trang."

### 2.7 Task List sau khi Delete
- **Ảnh chụp:** [Chèn ảnh chụp màn hình sau khi xóa task]
- **Chú thích:** "Xác nhận xóa công việc sau hộp thoại cảnh báo (Alert confirmation); công việc đã bị xóa hoàn toàn khỏi cơ sở dữ liệu Firestore và giao diện."

### 2.8 Teams Placeholder Screen
- **Ảnh chụp:** [Chèn ảnh chụp màn hình Tab Teams]
- **Chú thích:** "Màn hình điều hướng tab Teams hiển thị thông báo 'Coming Soon in Practical Exam 2' cùng với thanh Bottom Tab Navigation."

---

## 3. BONUS FEATURES IMPLEMENTED
1. **Client-side Form Validation:** Kiểm tra bắt buộc nhập tiêu đề task trước khi lưu, hiển thị banner cảnh báo lỗi nếu bỏ trống.
2. **Status Filter with Badges:** Bộ lọc trạng thái (All / To Do / In Progress / Done) kèm bộ đếm số lượng real-time trên thanh lọc.
3. **Pull-to-refresh:** Hỗ trợ kéo vuốt xuống danh sách để đồng bộ lại dữ liệu nhanh.
4. **Sơ đồ ERD:** Đã vẽ sơ đồ Mermaid và ghi chú đầy đủ trong `README.md` của GitHub repository.
