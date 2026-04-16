import { product } from "../../../wailsjs/go/models";

export type Product = product.Product;
export type ProductVariant = product.ProductVariant;
export type ProductVariantUnit = product.ProductVariantUnit;
export type GetProductsResult = product.GetProductsResult;
export class GetProductsInput extends product.GetProductsInput {}
export class GetProductByIdInput extends product.GetProductByIdInput {}
export class CreateProductInput extends product.CreateProductInput {}
export class CreateProductVariantInput
  extends product.CreateProductVariantInput {}
export class CreateProductVariantUnitInput
  extends product.CreateProductVariantUnitInput {}
export class UpdateProductInput extends product.UpdateProductInput {}
export class UpdateProductVariantInput
  extends product.UpdateProductVariantInput {}
export class UpdateProductVariantUnitInput
  extends product.UpdateProductVariantUnitInput {}
