# API Documentation - Smart CRM, flow L2 (track SE), tag v1.0

Student: Nguyen Hoang Thuan - 2374802010489. Base URL after `docker compose up`: `http://localhost:3000` (port = `APP_PORT`).

All request/response examples below were **copied from a real run** of the packaged system (tag v1.0 code, sample data, 2026-11-13). Tokens are shortened to `eyJ...…`; long lists are cut after 1-2 items (marked "omitted").

## 1. Conventions

- **Endpoints:** 23 - equal to the number of routes in the code: 1 in `src/app.js` (`GET /health`) + 22 in `src/routes/index.js`. Check: `grep -cE "router\.(get|post|put|patch|delete)\(" src/routes/index.js` → 22.
- **Authentication:** `Authorization: Bearer <token>` from `POST /api/v1/auth/login`. Every business endpoint needs a token (NFR4). Demo accounts (password `Mekong@2026`): `letan01` (RECEPTIONIST, Can Tho), `quanly01` (MANAGER, Can Tho), `letan02` (RECEPTIONIST, Vinh Long).
- **Data scope:** tickets are filtered by the caller's service centre. Customers and devices are shared by all centres (one customer can bring a device to any centre).
- **Format:** JSON, UTF-8, times in ISO-8601 UTC (`...Z`), dates `YYYY-MM-DD`. Success: `{ "data": ... }` (+ `meta` for lists). Request body max 100 kB.
- **Error format (all endpoints):** `{ "error": "<CODE>", "message": "<Vietnamese text>", "details": { "<field>": "<reason>" } }` (`details` only for field errors). No stack trace, SQL or table names are returned.

### Error code table

| HTTP | `error` | Meaning | Checked by |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Invalid input (field errors in `details`) or invalid JSON body | TC-05, TC-06, TC-08 |
| 401 | `CHUA_DANG_NHAP` | No token, invalid/expired/forged token, wrong login | TC-10 |
| 403 | `KHONG_DU_QUYEN` | Wrong role, or ticket of another centre | TC-09 |
| 404 | `KHONG_TIM_THAY` | Resource or route not found | TC-08 |
| 409 | `XUNG_DOT` | Conflict with existing data (phone, serial, delete with children) | TC-07 |
| 409 | `SAI_TRANG_THAI` | Wrong ticket status for the action | unit test `ticket.service.test.js` |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable | `tests/unit/errorHandler.test.js`, checklist item 5 |
| 500 | `LOI_HE_THONG` | Unexpected error (logged on the server only) | `tests/unit/errorHandler.test.js` |

### Endpoint index

| # | Method | Path | Auth / role |
|---|---|---|---|
| 1 | GET | `/health` | public |
| 2 | GET | `/api/v1/health` | public |
| 3 | POST | `/api/v1/auth/login` | public |
| 4 | GET | `/api/v1/auth/me` | RECEPTIONIST, MANAGER |
| 5 | GET | `/api/v1/catalog/categories` | RECEPTIONIST, MANAGER |
| 6 | GET | `/api/v1/catalog/products` | RECEPTIONIST, MANAGER |
| 7 | GET | `/api/v1/customers` | RECEPTIONIST, MANAGER |
| 8 | GET | `/api/v1/customers/lookup` | RECEPTIONIST, MANAGER |
| 9 | GET | `/api/v1/customers/:id` | RECEPTIONIST, MANAGER |
| 10 | GET | `/api/v1/customers/:id/devices` | RECEPTIONIST, MANAGER |
| 11 | POST | `/api/v1/customers` | RECEPTIONIST, MANAGER |
| 12 | PUT | `/api/v1/customers/:id` | MANAGER |
| 13 | DELETE | `/api/v1/customers/:id` | MANAGER |
| 14 | GET | `/api/v1/devices/lookup` | RECEPTIONIST, MANAGER |
| 15 | GET | `/api/v1/devices/:id` | RECEPTIONIST, MANAGER |
| 16 | POST | `/api/v1/devices` | RECEPTIONIST, MANAGER |
| 17 | PUT | `/api/v1/devices/:id` | RECEPTIONIST, MANAGER |
| 18 | DELETE | `/api/v1/devices/:id` | MANAGER |
| 19 | GET | `/api/v1/tickets` | RECEPTIONIST, MANAGER |
| 20 | GET | `/api/v1/tickets/sla-preview` | RECEPTIONIST, MANAGER |
| 21 | GET | `/api/v1/tickets/:id` | RECEPTIONIST, MANAGER |
| 22 | POST | `/api/v1/tickets` | RECEPTIONIST |
| 23 | PATCH | `/api/v1/tickets/:id/review` | MANAGER |

## 2. Endpoints

Each endpoint has seven parts: (1) method + path, (2) description, (3) authentication, (4) parameters, (5) success response, (6) error codes, (7) limits.

### 2.1 `GET /health`

1. **Method + path:** `GET /health`
2. **Description:** Health check of the app **and** the database (runs `SELECT 1`, 2 s timeout). Used by the Docker healthcheck and by "Verify it works".
3. **Authentication:** None (public). Returns no data.
4. **Parameters:** None.
5. **Success response:** HTTP 200 - real example:

```http
GET /health
```

Response `200`:

```json
{
  "status": "ok",
  "db": "up"
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 503 | `-` | Database down: body `{"status":"degraded","db":"down"}` |

7. **Limits:** Not rate-limited. Does not reveal error details.

### 2.2 `GET /api/v1/health`

1. **Method + path:** `GET /api/v1/health`
2. **Description:** Liveness of the API process only (does **not** check the database). Kept from BT2 for backward compatibility.
3. **Authentication:** None (public).
4. **Parameters:** None.
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/health
```

Response `200`:

```json
{
  "status": "ok"
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|

7. **Limits:** Always 200 while the process is running; use `GET /health` to check the database.

### 2.3 `POST /api/v1/auth/login`

1. **Method + path:** `POST /api/v1/auth/login`
2. **Description:** Log in with username/password; returns a signed JWT and the user profile.
3. **Authentication:** None (public).
4. **Parameters:** Body: `username` (string, required), `password` (string, required).
5. **Success response:** HTTP 200 - real example:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "letan01",
  "password": "Mekong@2026"
}
```

Response `200`:

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs…",
    "user": {
      "employeeId": 2,
      "fullName": "Trần Thị Lan",
      "role": "RECEPTIONIST",
      "centerId": 1,
      "centerName": "TTBH Mekong Cần Thơ"
    }
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | username or password missing |
| 400 | `DU_LIEU_KHONG_HOP_LE` | Body is not valid JSON |
| 401 | `CHUA_DANG_NHAP` | Wrong username **or** password (same message for both, does not reveal which accounts exist) |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "letan01"
}
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Nhập tên đăng nhập và mật khẩu"
}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "letan01",
  "password": "sai"
}
```

Response `401`:

```json
{
  "error": "CHUA_DANG_NHAP",
  "message": "Sai tên đăng nhập hoặc mật khẩu"
}
```

7. **Limits:** Token lifetime `JWT_EXPIRES_IN` (default 8h). Body max 100 kB. No lockout/rate limit yet (known limitation).

### 2.4 `GET /api/v1/auth/me`

1. **Method + path:** `GET /api/v1/auth/me`
2. **Description:** Return the user encoded in the current token.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** None.
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/auth/me
```

Response `200`:

```json
{
  "data": {
    "employeeId": 2,
    "fullName": "Trần Thị Lan",
    "role": "RECEPTIONIST",
    "centerId": 1,
    "centerName": "TTBH Mekong Cần Thơ"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 500 | `LOI_HE_THONG` | Unexpected error |

   Real error example(s):

```http
GET /api/v1/auth/me
```

Response `401`:

```json
{
  "error": "CHUA_DANG_NHAP",
  "message": "Cần đăng nhập để sử dụng chức năng này"
}
```

7. **Limits:** Reads only the token, no database call.

### 2.5 `GET /api/v1/catalog/categories`

1. **Method + path:** `GET /api/v1/catalog/categories`
2. **Description:** List issue categories with their default priority (QT-A1).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** None.
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/catalog/categories
```

Response `200`:

```json
{
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Màn hình",
      "defaultPriority": "CAO"
    },
    {
      "categoryId": 2,
      "categoryName": "Pin",
      "defaultPriority": "TRUNG_BINH"
    },
    "... 4 more item(s) omitted"
  ]
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** Only active categories (`is_active`); 6 in sample data; no paging.

### 2.6 `GET /api/v1/catalog/products`

1. **Method + path:** `GET /api/v1/catalog/products`
2. **Description:** List device models (products).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** None.
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/catalog/products
```

Response `200`:

```json
{
  "data": [
    {
      "productId": 8,
      "productName": "iPad Air M2 11 inch",
      "brand": "Apple"
    },
    {
      "productId": 2,
      "productName": "iPhone 14 Pro 256GB",
      "brand": "Apple"
    },
    "... 6 more item(s) omitted"
  ]
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** No paging (8 rows in sample data).

### 2.7 `GET /api/v1/customers`

1. **Method + path:** `GET /api/v1/customers`
2. **Description:** Search customers (FR1). Phone is masked for `RECEPTIONIST` (NFR4), full for `MANAGER`.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Query: `q` (name contains, case-insensitive, or phone contains; optional), `page` (default 1), `pageSize` (default 20, max 100), `phone` (exact lookup, optional - returns a 1-item list).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/customers?pageSize=2
```

Response `200`:

```json
{
  "data": [
    {
      "customerId": 6,
      "fullName": "Huỳnh Gia Phúc",
      "phone": "096****666",
      "email": "phuc.huynh@example.com",
      "address": "Ô Môn, Cần Thơ",
      "segment": "MOI",
      "createdAt": "2026-11-13T08:50:35.811Z"
    },
    "... 1 more item(s) omitted"
  ],
  "meta": {
    "page": 1,
    "pageSize": 2,
    "total": 6
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | `phone` given but invalid |
| 404 | `KHONG_TIM_THAY` | `phone` given but not found |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** pageSize capped at 100. Search value is passed as a SQL parameter (no string concatenation).

### 2.8 `GET /api/v1/customers/lookup`

1. **Method + path:** `GET /api/v1/customers/lookup`
2. **Description:** Find one customer by phone. The phone is normalised first (QT-02: spaces, dots, +84 removed).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Query: `phone` (required).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/customers/lookup?phone=090%20123%204567
```

Response `200`:

```json
{
  "data": {
    "customerId": 1,
    "fullName": "Nguyễn Văn An",
    "phone": "090****567",
    "email": "an.nguyen@example.com",
    "address": "Ninh Kiều, Cần Thơ",
    "segment": "MOI",
    "createdAt": "2026-11-13T08:50:35.811Z"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Phone is not 10 digits starting with 0 |
| 404 | `KHONG_TIM_THAY` | No customer with this phone |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
GET /api/v1/customers/lookup?phone=12345
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "SĐT không hợp lệ",
  "details": {
    "phone": "SĐT phải gồm 10 chữ số, bắt đầu bằng 0"
  }
}
```

```http
GET /api/v1/customers/lookup?phone=0999999999
```

Response `404`:

```json
{
  "error": "KHONG_TIM_THAY",
  "message": "Chưa có hồ sơ khách hàng với SĐT này"
}
```

7. **Limits:** Exact match only.

### 2.9 `GET /api/v1/customers/:id`

1. **Method + path:** `GET /api/v1/customers/:id`
2. **Description:** Get one customer by id.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Path: `id` (positive integer).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/customers/1
```

Response `200`:

```json
{
  "data": {
    "customerId": 1,
    "fullName": "Nguyễn Văn An",
    "phone": "0901234567",
    "email": "an.nguyen@example.com",
    "address": "Ninh Kiều, Cần Thơ",
    "segment": "MOI",
    "createdAt": "2026-11-13T08:50:35.811Z"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | id is not a positive integer |
| 404 | `KHONG_TIM_THAY` | No such customer |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
GET /api/v1/customers/9999
```

Response `404`:

```json
{
  "error": "KHONG_TIM_THAY",
  "message": "Không tìm thấy khách hàng"
}
```

7. **Limits:** Phone masked for RECEPTIONIST.

### 2.10 `GET /api/v1/customers/:id/devices`

1. **Method + path:** `GET /api/v1/customers/:id/devices`
2. **Description:** List devices owned by a customer, each with its warranty result (QT-05).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Path: `id` (positive integer).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/customers/1/devices
```

Response `200`:

```json
{
  "data": [
    {
      "deviceId": 7,
      "customerId": 1,
      "customerName": "Nguyễn Văn An",
      "customerPhone": "090****567",
      "productId": 8,
      "productName": "iPad Air M2 11 inch",
      "brand": "Apple",
      "serialNo": "SN-IPAD-2025-07",
      "purchaseDate": "2025-09-13",
      "warrantyMonths": 12,
      "warranty": {
        "result": "HET_BAO_HANH",
        "isUnderWarranty": false,
        "endDate": "2026-09-13"
      }
    },
    "... 1 more item(s) omitted"
  ]
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | id is not a positive integer |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** Returns an empty list for an unknown customer id. No paging.

### 2.11 `POST /api/v1/customers`

1. **Method + path:** `POST /api/v1/customers`
2. **Description:** Create a customer (FR2). Rejects an invalid or already used phone (QT-01, QT-02).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Body: `fullName` (2-120 chars, required), `phone` (required), `email` (optional, valid format), `address` (optional).
5. **Success response:** HTTP 201 - real example:

```http
POST /api/v1/customers
Content-Type: application/json

{
  "fullName": "Lê Văn Mới",
  "phone": "0988 777 666",
  "email": "moi@example.com",
  "address": "Cần Thơ"
}
```

Response `201`:

```json
{
  "data": {
    "customerId": 7,
    "fullName": "Lê Văn Mới",
    "phone": "098****666",
    "email": "moi@example.com",
    "address": "Cần Thơ",
    "segment": "MOI",
    "createdAt": "2026-11-13T08:51:09.997Z"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Field errors in `details` |
| 409 | `XUNG_DOT` | Phone already belongs to another customer |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
POST /api/v1/customers
Content-Type: application/json

{
  "fullName": "A",
  "phone": "123",
  "email": "x@"
}
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu không hợp lệ",
  "details": {
    "fullName": "Họ tên từ 2 đến 120 ký tự",
    "phone": "SĐT phải gồm 10 chữ số và bắt đầu bằng 0 (QT-02)",
    "email": "Email không đúng định dạng"
  }
}
```

```http
POST /api/v1/customers
Content-Type: application/json

{
  "fullName": "Trùng Số",
  "phone": "0988777666"
}
```

Response `409`:

```json
{
  "error": "XUNG_DOT",
  "message": "Số điện thoại đã thuộc về khách hàng khác (QT-01)",
  "details": {
    "phone": "SĐT đã tồn tại"
  }
}
```

7. **Limits:** Body max 100 kB.

### 2.12 `PUT /api/v1/customers/:id`

1. **Method + path:** `PUT /api/v1/customers/:id`
2. **Description:** Update a customer (full replace of the editable fields).
3. **Authentication:** Bearer JWT. Role: `MANAGER` only (a receptionist only sees masked phones).
4. **Parameters:** Path: `id`. Body: same fields as POST.
5. **Success response:** HTTP 200 - real example:

```http
PUT /api/v1/customers/7
Content-Type: application/json

{
  "fullName": "Lê Văn Mới",
  "phone": "0988777666",
  "email": "moi.le@example.com",
  "address": "Ninh Kiều, Cần Thơ"
}
```

Response `200`:

```json
{
  "data": {
    "customerId": 7,
    "fullName": "Lê Văn Mới",
    "phone": "0988777666",
    "email": "moi.le@example.com",
    "address": "Ninh Kiều, Cần Thơ",
    "segment": "MOI",
    "createdAt": "2026-11-13T08:51:09.997Z"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Field errors |
| 403 | `KHONG_DU_QUYEN` | Caller is RECEPTIONIST |
| 404 | `KHONG_TIM_THAY` | No such customer |
| 409 | `XUNG_DOT` | Phone used by another customer |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
PUT /api/v1/customers/7
Content-Type: application/json

{
  "fullName": "X Y",
  "phone": "0988777666"
}
```

Response `403`:

```json
{
  "error": "KHONG_DU_QUYEN",
  "message": "Vai trò của bạn không được phép thực hiện thao tác này"
}
```

7. **Limits:** Body max 100 kB.

### 2.13 `DELETE /api/v1/customers/:id`

1. **Method + path:** `DELETE /api/v1/customers/:id`
2. **Description:** Delete a customer who has **no** device (keeps ticket history intact).
3. **Authentication:** Bearer JWT. Role: `MANAGER` only.
4. **Parameters:** Path: `id`.
5. **Success response:** HTTP 204 - real example:

```http
DELETE /api/v1/customers/8
```

Response `204`:

```json
(empty body)
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 403 | `KHONG_DU_QUYEN` | Caller is RECEPTIONIST |
| 404 | `KHONG_TIM_THAY` | No such customer |
| 409 | `XUNG_DOT` | Customer still has devices |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
DELETE /api/v1/customers/7
```

Response `409`:

```json
{
  "error": "XUNG_DOT",
  "message": "Không thể xóa: khách hàng đang có 1 thiết bị"
}
```

7. **Limits:** Hard delete; cannot be undone.

### 2.14 `GET /api/v1/devices/lookup`

1. **Method + path:** `GET /api/v1/devices/lookup`
2. **Description:** Find a device by Serial/IMEI (normalised to upper case, spaces removed) with its warranty result (QT-05).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Query: `serial` (6-50 chars A-Z, 0-9, `-`).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/devices/lookup?serial=SN-IP15-2026-88
```

Response `200`:

```json
{
  "data": {
    "deviceId": 1,
    "customerId": 1,
    "customerName": "Nguyễn Văn An",
    "customerPhone": "090****567",
    "productId": 1,
    "productName": "iPhone 15 128GB",
    "brand": "Apple",
    "serialNo": "SN-IP15-2026-88",
    "purchaseDate": "2026-08-13",
    "warrantyMonths": 12,
    "warranty": {
      "result": "CON_BAO_HANH",
      "isUnderWarranty": true,
      "endDate": "2027-08-13"
    }
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Serial format invalid |
| 404 | `KHONG_TIM_THAY` | Serial not registered |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** Exact match only.

### 2.15 `GET /api/v1/devices/:id`

1. **Method + path:** `GET /api/v1/devices/:id`
2. **Description:** Get one device by id with warranty result.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Path: `id`.
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/devices/8
```

Response `200`:

```json
{
  "data": {
    "deviceId": 8,
    "customerId": 7,
    "customerName": "Lê Văn Mới",
    "customerPhone": "098****666",
    "productId": 1,
    "productName": "iPhone 15 128GB",
    "brand": "Apple",
    "serialNo": "SN-DEMO-2026-01",
    "purchaseDate": "2026-05-10",
    "warrantyMonths": 12,
    "warranty": {
      "result": "CON_BAO_HANH",
      "isUnderWarranty": true,
      "endDate": "2027-05-10"
    }
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | id invalid |
| 404 | `KHONG_TIM_THAY` | No such device |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** -

### 2.16 `POST /api/v1/devices`

1. **Method + path:** `POST /api/v1/devices`
2. **Description:** Register a device for a customer (FR3). One Serial/IMEI belongs to one customer only (QT-03).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Body: `customerId` (required), `productId` (required), `serialNo` (required), `purchaseDate` (YYYY-MM-DD, optional, not in the future), `warrantyMonths` (0-60, default 12).
5. **Success response:** HTTP 201 - real example:

```http
POST /api/v1/devices
Content-Type: application/json

{
  "customerId": 7,
  "productId": 1,
  "serialNo": "sn-demo-2026-01",
  "purchaseDate": "2026-05-10",
  "warrantyMonths": 12
}
```

Response `201`:

```json
{
  "data": {
    "deviceId": 8,
    "customerId": 7,
    "customerName": "Lê Văn Mới",
    "customerPhone": "098****666",
    "productId": 1,
    "productName": "iPhone 15 128GB",
    "brand": "Apple",
    "serialNo": "SN-DEMO-2026-01",
    "purchaseDate": "2026-05-10",
    "warrantyMonths": 12,
    "warranty": {
      "result": "CON_BAO_HANH",
      "isUnderWarranty": true,
      "endDate": "2027-05-10"
    }
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Field errors / unknown productId |
| 404 | `KHONG_TIM_THAY` | customerId does not exist |
| 409 | `XUNG_DOT` | Serial already registered |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
POST /api/v1/devices
Content-Type: application/json

{
  "customerId": 7,
  "productId": 1,
  "serialNo": "ab",
  "purchaseDate": "2099-01-01",
  "warrantyMonths": 99
}
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu không hợp lệ",
  "details": {
    "serialNo": "Serial/IMEI gồm 6–50 ký tự chữ, số hoặc dấu gạch",
    "purchaseDate": "Ngày mua không được ở tương lai",
    "warrantyMonths": "Số tháng bảo hành từ 0 đến 60"
  }
}
```

```http
POST /api/v1/devices
Content-Type: application/json

{
  "customerId": 1,
  "productId": 1,
  "serialNo": "SN-DEMO-2026-01"
}
```

Response `409`:

```json
{
  "error": "XUNG_DOT",
  "message": "Serial/IMEI đã thuộc về khách hàng khác (QT-03)",
  "details": {
    "serialNo": "Serial/IMEI đã tồn tại"
  }
}
```

7. **Limits:** Body max 100 kB.

### 2.17 `PUT /api/v1/devices/:id`

1. **Method + path:** `PUT /api/v1/devices/:id`
2. **Description:** Update a device (product, serial, purchase date, warranty months). Owner is not changed.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Path: `id`. Body: `productId`, `serialNo`, `purchaseDate`, `warrantyMonths` (same rules as POST).
5. **Success response:** HTTP 200 - real example:

```http
PUT /api/v1/devices/8
Content-Type: application/json

{
  "productId": 1,
  "serialNo": "SN-DEMO-2026-01",
  "purchaseDate": "2026-05-12",
  "warrantyMonths": 24
}
```

Response `200`:

```json
{
  "data": {
    "deviceId": 8,
    "customerId": 7,
    "customerName": "Lê Văn Mới",
    "customerPhone": "098****666",
    "productId": 1,
    "productName": "iPhone 15 128GB",
    "brand": "Apple",
    "serialNo": "SN-DEMO-2026-01",
    "purchaseDate": "2026-05-12",
    "warrantyMonths": 24,
    "warranty": {
      "result": "CON_BAO_HANH",
      "isUnderWarranty": true,
      "endDate": "2028-05-12"
    }
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Field errors |
| 404 | `KHONG_TIM_THAY` | No such device |
| 409 | `XUNG_DOT` | Serial used by another device |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

7. **Limits:** -

### 2.18 `DELETE /api/v1/devices/:id`

1. **Method + path:** `DELETE /api/v1/devices/:id`
2. **Description:** Delete a device that has **no** ticket.
3. **Authentication:** Bearer JWT. Role: `MANAGER` only.
4. **Parameters:** Path: `id`.
5. **Success response:** HTTP 204 - real example:

```http
DELETE /api/v1/devices/9
```

Response `204`:

```json
(empty body)
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 403 | `KHONG_DU_QUYEN` | Caller is RECEPTIONIST |
| 404 | `KHONG_TIM_THAY` | No such device |
| 409 | `XUNG_DOT` | Device already has tickets |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
DELETE /api/v1/devices/8
```

Response `403`:

```json
{
  "error": "KHONG_DU_QUYEN",
  "message": "Vai trò của bạn không được phép thực hiện thao tác này"
}
```

```http
DELETE /api/v1/devices/8
```

Response `409`:

```json
{
  "error": "XUNG_DOT",
  "message": "Không thể xóa: thiết bị đã có 1 phiếu bảo hành"
}
```

7. **Limits:** Hard delete.

### 2.19 `GET /api/v1/tickets`

1. **Method + path:** `GET /api/v1/tickets`
2. **Description:** List warranty tickets of the caller's service centre only (FR8, NFR4), newest first, with SLA state.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Query (all optional): `status` (MOI | CHO_XAC_MINH), `priority` (CAO | TRUNG_BINH | THAP), `slaState` (TRONG_HAN | SAP_TRE | TRE_HAN), `from`, `to` (YYYY-MM-DD, on received date), `q` (ticket code or phone contains), `page` (default 1), `pageSize` (default 20, max 100).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/tickets?status=MOI&priority=CAO&pageSize=2
```

Response `200`:

```json
{
  "data": [
    {
      "ticketId": 6,
      "ticketCode": "BH-100001/2026",
      "status": "MOI",
      "priority": "CAO",
      "isWarranty": true,
      "categoryName": "Màn hình",
      "customerName": "Lê Văn Mới",
      "customerPhone": "098****666",
      "productName": "iPhone 15 128GB",
      "serialNo": "SN-DEMO-2026-01",
      "issueDesc": "Màn hình bị sọc ngang",
      "receivedAt": "2026-11-13T08:51:10.082Z",
      "dueDate": "2026-11-17T04:21:00.000Z",
      "slaState": "TRONG_HAN"
    },
    "... 1 more item(s) omitted"
  ],
  "meta": {
    "page": 1,
    "pageSize": 2,
    "total": 3
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Invalid filter value |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
GET /api/v1/tickets?status=XONG&from=2026-13-01
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu không hợp lệ",
  "details": {
    "status": "Chỉ nhận: MOI, CHO_XAC_MINH",
    "from": "Ngày dạng YYYY-MM-DD"
  }
}
```

7. **Limits:** pageSize capped at 100. Tickets of other centres are never returned.

### 2.20 `GET /api/v1/tickets/sla-preview`

1. **Method + path:** `GET /api/v1/tickets/sla-preview`
2. **Description:** Preview the SLA due date for a priority if a ticket were created now (QT-04, working hours from `sla.config.json`).
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`.
4. **Parameters:** Query: `priority` (CAO | TRUNG_BINH | THAP, required).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/tickets/sla-preview?priority=CAO
```

Response `200`:

```json
{
  "data": {
    "priority": "CAO",
    "receivedAt": "2026-11-13T08:51:10.069Z",
    "dueDate": "2026-11-17T04:21:00.000Z"
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Unknown priority |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 500 | `LOI_HE_THONG` | Unexpected error |

   Real error example(s):

```http
GET /api/v1/tickets/sla-preview?priority=GAP
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Mức ưu tiên không hợp lệ",
  "details": {
    "priority": "CAO, TRUNG_BINH hoặc THAP"
  }
}
```

7. **Limits:** Pure calculation, no database write. Times are UTC ISO-8601; working hours use the app time zone `TZ` (Asia/Ho_Chi_Minh).

### 2.21 `GET /api/v1/tickets/:id`

1. **Method + path:** `GET /api/v1/tickets/:id`
2. **Description:** Ticket detail with full status history.
3. **Authentication:** Bearer JWT. Roles: `RECEPTIONIST`, `MANAGER`. Only tickets of the caller's centre.
4. **Parameters:** Path: `id` (positive integer).
5. **Success response:** HTTP 200 - real example:

```http
GET /api/v1/tickets/6
```

Response `200`:

```json
{
  "data": {
    "ticketId": 6,
    "ticketCode": "BH-100001/2026",
    "status": "MOI",
    "priority": "CAO",
    "isWarranty": true,
    "categoryName": "Màn hình",
    "customerName": "Lê Văn Mới",
    "customerPhone": "098****666",
    "productName": "iPhone 15 128GB",
    "serialNo": "SN-DEMO-2026-01",
    "issueDesc": "Màn hình bị sọc ngang",
    "receivedAt": "2026-11-13T08:51:10.082Z",
    "dueDate": "2026-11-17T04:21:00.000Z",
    "slaState": "TRONG_HAN",
    "centerName": "TTBH Mekong Cần Thơ",
    "createdByName": "Trần Thị Lan",
    "purchaseDate": "2026-05-12",
    "warrantyMonths": 24,
    "logs": [
      {
        "fromStatus": null,
        "toStatus": "MOI",
        "changedAt": "2026-11-13T08:51:10.082Z",
        "changedByName": "Trần Thị Lan",
        "note": "Tạo phiếu - CON_BAO_HANH"
      }
    ]
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | id is not a positive integer or exceeds the safe range (BUG-09) |
| 403 | `KHONG_DU_QUYEN` | Ticket belongs to another centre |
| 404 | `KHONG_TIM_THAY` | No such ticket |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
GET /api/v1/tickets/99999999999999999999
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Mã phiếu không hợp lệ"
}
```

```http
GET /api/v1/tickets/1
```

Response `403`:

```json
{
  "error": "KHONG_DU_QUYEN",
  "message": "Phiếu thuộc trung tâm khác"
}
```

7. **Limits:** -

### 2.22 `POST /api/v1/tickets`

1. **Method + path:** `POST /api/v1/tickets`
2. **Description:** Create a warranty ticket (UC04, FR4-FR6). Checks QT-02/QT-03, warranty QT-05, default priority QT-A1, SLA QT-04; writes the ticket and its first status log in **one transaction** (NFR5).
3. **Authentication:** Bearer JWT. Role: `RECEPTIONIST` only. Ticket is created in the caller's centre.
4. **Parameters:** Body: `phone` (required), `serialNo` (required), `categoryId` (required, int), `issueDesc` (5-2000 chars, required), `priority` (optional, overrides the category default).
5. **Success response:** HTTP 201 - real example:

```http
POST /api/v1/tickets
Content-Type: application/json

{
  "phone": "0988777666",
  "serialNo": "SN-DEMO-2026-01",
  "categoryId": 1,
  "issueDesc": "Màn hình bị sọc ngang"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "ticketId": 6,
    "ticketCode": "BH-100001/2026",
    "status": "MOI",
    "priority": "CAO",
    "warrantyResult": "CON_BAO_HANH",
    "warrantyEndDate": "2028-05-12",
    "isWarranty": true,
    "receivedAt": "2026-11-13T08:51:10.082Z",
    "dueDate": "2026-11-17T04:21:00.000Z",
    "createdBy": 2
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Field errors / unknown category |
| 403 | `KHONG_DU_QUYEN` | Caller is MANAGER |
| 404 | `KHONG_TIM_THAY` | Customer or device not registered yet |
| 409 | `XUNG_DOT` | Serial belongs to another customer (QT-03) |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
POST /api/v1/tickets
Content-Type: application/json

{
  "phone": "090123456",
  "serialNo": "SN-IP15-2026-88",
  "categoryId": 1,
  "issueDesc": "Hỏng"
}
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu không hợp lệ",
  "details": {
    "phone": "SĐT phải gồm 10 chữ số và bắt đầu bằng 0 (QT-02)",
    "issueDesc": "Mô tả lỗi tối thiểu 5 ký tự"
  }
}
```

```http
POST /api/v1/tickets
Content-Type: application/json

{
  "phone": "0988777666",
  "serialNo": "SN-DEMO-2026-01",
  "categoryId": 1,
  "issueDesc": "Màn hình bị sọc ngang"
}
```

Response `403`:

```json
{
  "error": "KHONG_DU_QUYEN",
  "message": "Vai trò của bạn không được phép thực hiện thao tác này"
}
```

7. **Limits:** Ticket code `BH-xxxxxx/YYYY` from a database SEQUENCE (unique under concurrency). Cannot be edited or deleted afterwards (TD-10).

### 2.23 `PATCH /api/v1/tickets/:id/review`

1. **Method + path:** `PATCH /api/v1/tickets/:id/review`
2. **Description:** Manager accepts or rejects warranty for a ticket in `CHO_XAC_MINH` (UC07, QT-A3). The row is locked (`FOR UPDATE`) so it cannot be reviewed twice.
3. **Authentication:** Bearer JWT. Role: `MANAGER` only, same centre as the ticket.
4. **Parameters:** Path: `id`. Body: `decision` (CHAP_NHAN | TU_CHOI, required), `note` (5-200 chars, required).
5. **Success response:** HTTP 200 - real example:

```http
PATCH /api/v1/tickets/4/review
Content-Type: application/json

{
  "decision": "CHAP_NHAN",
  "note": "Khách xuất trình hoá đơn mua hàng"
}
```

Response `200`:

```json
{
  "data": {
    "ticketId": 4,
    "ticketCode": "BH-000004/2026",
    "status": "MOI",
    "priority": "THAP",
    "isWarranty": true,
    "categoryName": "Phần mềm",
    "customerName": "Phạm Thu Dung",
    "customerPhone": "0938111222",
    "productName": "OPPO Reno11 F",
    "serialNo": "SN-RENO-2026-02",
    "issueDesc": "Treo logo sau khi cập nhật",
    "receivedAt": "2026-11-13T06:50:35.816Z",
    "dueDate": "2026-11-17T22:50:35.816Z",
    "slaState": "TRONG_HAN",
    "centerName": "TTBH Mekong Cần Thơ",
    "createdByName": "Trần Thị Lan",
    "purchaseDate": null,
    "warrantyMonths": 12,
    "logs": [
      {
        "fromStatus": null,
        "toStatus": "CHO_XAC_MINH",
        "changedAt": "2026-11-13T06:50:35.816Z",
        "changedByName": "Trần Thị Lan",
        "note": "Tạo phiếu (dữ liệu mẫu)"
      },
      {
        "fromStatus": "CHO_XAC_MINH",
        "toStatus": "MOI",
        "changedAt": "2026-11-13T08:51:10.238Z",
        "changedByName": "Nguyễn Hoàng Thuận",
        "note": "CHAP_NHAN: Khách xuất trình hoá đơn mua hàng"
      }
    ]
  }
}
```

6. **Error codes:**

| HTTP | `error` | When |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Missing/short note or bad decision |
| 403 | `KHONG_DU_QUYEN` | Caller is RECEPTIONIST or other centre |
| 404 | `KHONG_TIM_THAY` | No such ticket |
| 409 | `SAI_TRANG_THAI` | Ticket is not in CHO_XAC_MINH (already reviewed) |
| 401 | `CHUA_DANG_NHAP` | No token / invalid token |
| 503 | `CSDL_KHONG_SAN_SANG` | Database unreachable |

   Real error example(s):

```http
PATCH /api/v1/tickets/4/review
Content-Type: application/json

{
  "decision": "CHAP_NHAN",
  "note": ""
}
```

Response `400`:

```json
{
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu không hợp lệ",
  "details": {
    "note": "Ghi chú xét duyệt bắt buộc, tối thiểu 5 ký tự"
  }
}
```

```http
PATCH /api/v1/tickets/4/review
Content-Type: application/json

{
  "decision": "CHAP_NHAN",
  "note": "Có hoá đơn"
}
```

Response `403`:

```json
{
  "error": "KHONG_DU_QUYEN",
  "message": "Vai trò của bạn không được phép thực hiện thao tác này"
}
```

7. **Limits:** One review per ticket.
