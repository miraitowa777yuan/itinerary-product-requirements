# 领域对象与数据模型

本文用于保证小程序、Web 和未来导入能力共享同一套产品语义。字段为概念模型，不限定具体数据库。

## 1. User

| 字段 | 含义 |
|---|---|
| id | 内部用户标识 |
| wechatOpenId / unionId | 微信身份映射，按平台合规保存 |
| displayName | 显示名称 |
| avatar | 头像资源 |
| locale | 语言地区 |
| defaultTimezone | 默认时区 |
| createdAt / updatedAt | 创建与更新时间 |

## 2. Trip

| 字段 | 含义 |
|---|---|
| id | 旅行标识 |
| ownerId | 所有者 |
| title | 旅行名称 |
| destinations | 一个或多个目的地 |
| startDate / endDate | 旅行日期范围 |
| defaultTimezone | 默认时区 |
| status | upcoming / active / completed / archived |
| coverAssetId | 可选封面资源 |
| note | 旅行级备注 |
| version | 并发控制版本 |
| createdAt / updatedAt / deletedAt | 生命周期时间 |

## 3. ItineraryItem

### 公共字段

| 字段 | 含义 |
|---|---|
| id / tripId | 项目与所属旅行 |
| type | flight / train / hotel / activity / food / local_transport / custom |
| title | 用户可理解的名称 |
| status | planned / confirmed / in_progress / completed / cancelled |
| startAt / endAt | 标准时间，可为空 |
| startTimezone / endTimezone | IANA 时区 |
| allDay | 是否为当天事项 |
| locationStart / locationEnd | 起终点结构化地点 |
| address | 详细地址 |
| notes | 备注 |
| source | manual / pasted / ocr / integration |
| sourceConfidence | 自动解析置信度，仅用于辅助确认 |
| sortKey | 同时间或无时间项目的手动顺序 |
| visibility | 默认、成员可见、仅自己等 |
| version | 并发控制版本 |
| createdBy / updatedBy | 操作者 |
| createdAt / updatedAt / deletedAt | 生命周期时间 |

### 航班 FlightDetail

- 航空公司、航班号
- 出发 / 到达机场、航站楼
- 计划与实际出发 / 到达时间
- 值机截止、登机口、座位
- 预订编号、票号（敏感）
- 航班状态与状态来源
- cabinClass：订单识别或用户确认的舱位

### 火车 TrainDetail

- 运营方、车次
- 出发 / 到达车站
- 检票口、车厢、座位
- 取票或乘车凭证说明
- 订单号（敏感）
- bookingStatus：waiting_to_book / ticketed；`waiting_to_book` 对应用户可见状态“待抢票”
- expectedSaleAt：预计开售时间，可为空，不得由系统在无可靠依据时自动填充
- preferredSeatClasses：期望席别，可多选
- bookingReminderId：关联开售提醒，可为空

### 酒店 HotelDetail

- 酒店名称、地址、联系电话
- 入住 / 离店时间
- 房型、入住人
- 预订平台、确认号（敏感）
- 入住说明与取消政策摘要
- city、roomType、checkInDate、checkOutDate：截图识别后由用户确认的结构化字段

### 城际巴士 IntercityBusDetail

- 班次（可为空）
- 出发站点、目的地站点
- 出发日期与具体时间，到达时间可为空
- 班次与站点信息由用户手动录入并确认

### 活动与餐饮 ActivityDetail

- 场所、预约时间、预计时长
- 预约人、人数、联系电话
- 预约号或票券（可设为敏感）
- 营业 / 入场说明

### 当地交通 LocalTransportDetail

- 方式：地铁、公交、出租车、租车、步行、接驳等
- 起点、终点、预计时长
- 预订信息、车辆信息、司机联系信息（敏感）

## 4. Place

- id、名称、格式化地址
- 经纬度与地图供应商标识
- 城市、国家 / 地区
- 时区
- 交通枢纽代码，如 IATA 机场代码

## 5. Attachment

- id、tripId、itemId（可选）
- 类型、文件名、MIME 类型、大小
- 存储引用、缩略图引用
- sensitive 标记
- 上传者、创建时间
- 附件备注与敏感级别；当前原型不上传或长期保存订单截图

附件访问必须通过授权校验与短时有效地址，不能将永久公开 URL 写入项目。

行程项目可包含 `driveToNextMinutes`，表示用户手动填写的“从当前项目到时间线下一项”的驾车分钟数。该字段不调用地图服务，也不承诺实时路况准确性。

## 6. TripMember

- tripId、userId
- role：owner / editor / viewer
- sensitiveAccess：允许访问的敏感字段范围
- invitedBy、joinedAt、revokedAt

## 7. Reminder

- id、tripId、itemId、userId
- triggerAt 或相对提前量
- channel 与订阅授权状态
- deliveryStatus
- createdAt / updatedAt

提醒为用户级配置，不应因为一名成员设置而打扰所有同行者。

## 8. ChangeEvent

- id、tripId、entityType、entityId
- actorId、operation
- changedFields 摘要
- occurredAt、clientId

不在普通变更日志中复制保存证件号、完整订单号等敏感原值。

## 9. SyncOperation

- operationId：客户端生成的幂等键
- entityType / entityId
- baseVersion / resultingVersion
- payload 或补丁
- clientTimestamp / serverTimestamp
- status / conflictDetail

## 10. 关键关系与约束

- 一个旅行有且只有一个所有者，可以有多个成员。
- 一个项目属于一段旅行，可关联多个附件和提醒。
- 连续住宿作为一个跨日项目保存，展示层可在每天提供引用。
- 交通项目允许起终点使用不同时区。
- 删除默认软删除，附件根据保留策略延迟清理。
- 自动识别结果在用户确认前不得进入正式行程。
- “待抢票”是火车 / 高铁的预订状态，独立于项目的时间运行状态；出票后必须保留同一项目并更新为 ticketed，避免生成重复行程。
