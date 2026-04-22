# 待办应用 PRD

## 1. 产品概述

| 项目 | 内容 |
|------|------|
| 产品名称 | 极简待办 |
| 产品类型 | 本地待办应用 |
| 风格定位 | 极简、可爱风 |
| 目标用户 | 需要规划日常任务的人群 |
| 灵感来源 | Todoist |

---

## 2. 功能需求

### 2.1 核心功能清单

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 任务管理 | 添加、修改、删除任务 | P0 |
| 任务列表 | 支持按日期、分类、优先级查询/排序 | P0 |
| 分类筛选 | 用户可创建自定义分类（工作、学习等） | P0 |
| 每日统计 | 展示总任务数、已完成数、完成率 | P0 |

### 2.2 统计面板

- 总任务数
- 已完成任务数
- 完成率

### 2.3 分类管理

- 用户自定义分类名称
- 分类颜色（可选）
- 支持创建、编辑、删除分类

### 2.4 任务属性

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识，UUID |
| title | string | 任务标题 |
| category | string | 所属分类 |
| priority | enum | high / medium / low |
| deadline | string | 截止日期，ISO 格式 |
| completed | boolean | 完成状态 |
| createdAt | string | 创建时间，ISO 格式 |

---

## 3. 数据存储

### 3.1 存储方案

- **技术**：LocalStorage
- **容量**：5MB
- **保存策略**：每次操作后自动保存，无需手动保存

### 3.2 数据结构

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "任务标题",
      "category": "工作",
      "priority": "high|medium|low",
      "deadline": "2026-04-22",
      "completed": false,
      "createdAt": "2026-04-22T10:00:00Z"
    }
  ],
  "categories": [
    { "id": "uuid", "name": "工作", "color": "#FF6B6B" },
    { "id": "uuid", "name": "学习", "color": "#4ECDC4" }
  ],
  "settings": {
    "lastUpdated": "2026-04-22T10:00:00Z"
  }
}
```

### 3.3 存储 Key 规划

| Key | 内容 |
|-----|------|
| `todo_tasks` | 任务列表 |
| `todo_categories` | 分类列表 |
| `todo_settings` | 设置信息 |

### 3.4 防丢失措施

- 每次操作后立即保存到 LocalStorage
- 支持手动导出 JSON 备份
- 启动时检查数据完整性

---

## 4. 技术方案

### 4.1 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| React | UI 框架 | 生态成熟，社区活跃 |
| TypeScript | 类型系统 | 类型安全，减少 bug |
| Vite | 构建工具 | 快速启动，热更新 |
| Tailwind CSS | 样式 | 原子化 CSS，开发效率高 |
| Zustand | 状态管理 | 轻量级，比 Redux 简单 |
| date-fns | 日期处理 | 轻量、模块化的日期库 |
| LocalStorage | 数据持久化 | 本地存储，刷新不丢数据 |

### 4.2 项目结构

```
src/
├── components/     # UI 组件
├── hooks/          # 自定义 Hooks
├── stores/         # Zustand Store（状态管理）
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
└── App.tsx         # 入口组件
```

---

## 5. 里程碑

| 阶段 | 内容 |
|------|------|
| M1 | 项目初始化、Vite + React + TS 搭建完成 |
| M2 | 基础 UI 布局、样式框架搭建 |
| M3 | 任务 CRUD 功能 |
| M4 | 分类管理功能 |
| M5 | 统计面板 |
| M6 | 数据筛选与排序 |
| M7 | 导出/备份功能 |
| M8 | 细节优化与 Bug 修复 |
