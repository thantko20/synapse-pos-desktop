import {
  GetAllCategories,
  GetCategoryById,
  CreateCategory,
  UpdateCategory,
  ArchiveCategory,
} from "../../../wailsjs/go/category/CategoryApi"

export const categoryApi = {
  getAllCategories: GetAllCategories,
  getCategoryById: GetCategoryById,
  createCategory: CreateCategory,
  updateCategory: UpdateCategory,
  archiveCategory: ArchiveCategory,
}