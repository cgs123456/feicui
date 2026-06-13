// 全局类型定义
// 业务模型类型统一在 models.ts 中定义，此处重新导出以保持向后兼容
// 新代码建议直接从 @/types/models 导入
export type {
  Product, UserInfo, ChatMessage, ProductRecommendation,
  UserRequirement, MatchResult, OrderStatus, OrderItem,
  Address, Order, CartItem, Favorite, UserPreferences,
  Customer, ConversionFunnel, MerchantRole, PermissionKey,
  MerchantPermission, OrderStats, RevenueStats, DashboardStats
} from './models'
