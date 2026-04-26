import {
  ArchiveProduct,
  CreateProduct,
  GetAllProducts,
  GetProductById,
  UpdateProduct,
} from "../../../wailsjs/go/product/ProductApi";

export const productApi = {
  getAllProducts: GetAllProducts,
  getProductById: GetProductById,
  createProduct: CreateProduct,
  updateProduct: UpdateProduct,
  archiveProduct: ArchiveProduct,
};
