export namespace category {
	
	export class Category {
	    id: string;
	    name: string;
	    description: string;
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateCategoryInput {
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateCategoryInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class GetAllCategoriesInput {
	    page: number;
	    pageSize: number;
	    includeArchived: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GetAllCategoriesInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.includeArchived = source["includeArchived"];
	    }
	}
	export class GetAllCategoriesResult {
	    items: Category[];
	    total: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetAllCategoriesResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], Category);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetCategoryByIdInput {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new GetCategoryByIdInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	export class UpdateCategoryInput {
	    id: string;
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateCategoryInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}

}

export namespace inventory {
	
	export class GetBalancesByProductIDInput {
	    productId: string;
	
	    static createFrom(source: any = {}) {
	        return new GetBalancesByProductIDInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	    }
	}
	export class GetInventoryBalanceInput {
	    productVariantId: string;
	
	    static createFrom(source: any = {}) {
	        return new GetInventoryBalanceInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productVariantId = source["productVariantId"];
	    }
	}
	export class GetLowStockInput {
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetLowStockInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	}
	export class LowStockVariant {
	    productId: string;
	    productName: string;
	    productVariantId: string;
	    variantName: string;
	    sku: string;
	    quantity: number;
	    reorderPoint: number;
	    alertThreshold: number;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new LowStockVariant(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.productName = source["productName"];
	        this.productVariantId = source["productVariantId"];
	        this.variantName = source["variantName"];
	        this.sku = source["sku"];
	        this.quantity = source["quantity"];
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetLowStockResult {
	    items: LowStockVariant[];
	    total: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetLowStockResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], LowStockVariant);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetMovementsInput {
	    productId: string;
	    productVariantId: string;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetMovementsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.productVariantId = source["productVariantId"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	}
	export class InventoryMovement {
	    id: string;
	    productId: string;
	    productVariantId: string;
	    movementType: string;
	    quantity: number;
	    referenceType: string;
	    referenceId: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new InventoryMovement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.productVariantId = source["productVariantId"];
	        this.movementType = source["movementType"];
	        this.quantity = source["quantity"];
	        this.referenceType = source["referenceType"];
	        this.referenceId = source["referenceId"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetMovementsResult {
	    items: InventoryMovement[];
	    total: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetMovementsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], InventoryMovement);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class InventoryBalance {
	    productId: string;
	    productVariantId: string;
	    quantity: number;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new InventoryBalance(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.productVariantId = source["productVariantId"];
	        this.quantity = source["quantity"];
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace product {
	
	export class CreateProductVariantUnitInput {
	    unitId: string;
	    parentUnitId: string;
	    factorToParent: number;
	    isDefault: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CreateProductVariantUnitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.unitId = source["unitId"];
	        this.parentUnitId = source["parentUnitId"];
	        this.factorToParent = source["factorToParent"];
	        this.isDefault = source["isDefault"];
	    }
	}
	export class CreateProductVariantInput {
	    name: string;
	    sku: string;
	    barcode: string;
	    units: CreateProductVariantUnitInput[];
	    reorderPoint: number;
	    alertThreshold: number;
	
	    static createFrom(source: any = {}) {
	        return new CreateProductVariantInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.sku = source["sku"];
	        this.barcode = source["barcode"];
	        this.units = this.convertValues(source["units"], CreateProductVariantUnitInput);
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateProductInput {
	    name: string;
	    description: string;
	    categoryId: string;
	    brand: string;
	    notes: string;
	    variants: CreateProductVariantInput[];
	
	    static createFrom(source: any = {}) {
	        return new CreateProductInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.categoryId = source["categoryId"];
	        this.brand = source["brand"];
	        this.notes = source["notes"];
	        this.variants = this.convertValues(source["variants"], CreateProductVariantInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class GetProductByIdInput {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new GetProductByIdInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	export class GetProductsInput {
	    categoryId: string;
	    query: string;
	    page: number;
	    pageSize: number;
	    includeArchived: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GetProductsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.categoryId = source["categoryId"];
	        this.query = source["query"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.includeArchived = source["includeArchived"];
	    }
	}
	export class ProductVariantUnit {
	    id: string;
	    productVariantId: string;
	    unitId: string;
	    unitName: string;
	    unitSymbol: string;
	    parentUnitId: string;
	    factorToParent: number;
	    isDefault: boolean;
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ProductVariantUnit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productVariantId = source["productVariantId"];
	        this.unitId = source["unitId"];
	        this.unitName = source["unitName"];
	        this.unitSymbol = source["unitSymbol"];
	        this.parentUnitId = source["parentUnitId"];
	        this.factorToParent = source["factorToParent"];
	        this.isDefault = source["isDefault"];
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProductVariant {
	    id: string;
	    productId: string;
	    name: string;
	    sku: string;
	    barcode: string;
	    units?: ProductVariantUnit[];
	    reorderPoint: number;
	    alertThreshold: number;
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ProductVariant(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.name = source["name"];
	        this.sku = source["sku"];
	        this.barcode = source["barcode"];
	        this.units = this.convertValues(source["units"], ProductVariantUnit);
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProductCategory {
	    id: string;
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ProductCategory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class Product {
	    id: string;
	    name: string;
	    description: string;
	    categoryId: string;
	    category?: ProductCategory;
	    brand: string;
	    notes: string;
	    variantCount: number;
	    variants?: ProductVariant[];
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.categoryId = source["categoryId"];
	        this.category = this.convertValues(source["category"], ProductCategory);
	        this.brand = source["brand"];
	        this.notes = source["notes"];
	        this.variantCount = source["variantCount"];
	        this.variants = this.convertValues(source["variants"], ProductVariant);
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetProductsResult {
	    items: Product[];
	    total: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetProductsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], Product);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class UpdateProductVariantUnitInput {
	    unitId: string;
	    parentUnitId: string;
	    factorToParent: number;
	    isDefault: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UpdateProductVariantUnitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.unitId = source["unitId"];
	        this.parentUnitId = source["parentUnitId"];
	        this.factorToParent = source["factorToParent"];
	        this.isDefault = source["isDefault"];
	    }
	}
	export class UpdateProductVariantInput {
	    id: string;
	    name: string;
	    sku: string;
	    barcode: string;
	    units: UpdateProductVariantUnitInput[];
	    reorderPoint: number;
	    alertThreshold: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdateProductVariantInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sku = source["sku"];
	        this.barcode = source["barcode"];
	        this.units = this.convertValues(source["units"], UpdateProductVariantUnitInput);
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateProductInput {
	    id: string;
	    name: string;
	    description: string;
	    categoryId: string;
	    brand: string;
	    notes: string;
	    variants: UpdateProductVariantInput[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateProductInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.categoryId = source["categoryId"];
	        this.brand = source["brand"];
	        this.notes = source["notes"];
	        this.variants = this.convertValues(source["variants"], UpdateProductVariantInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace unit {
	
	export class CreateUnitInput {
	    name: string;
	    symbol: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateUnitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.symbol = source["symbol"];
	    }
	}
	export class GetAllUnitsInput {
	    page: number;
	    pageSize: number;
	    includeArchived: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GetAllUnitsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.includeArchived = source["includeArchived"];
	    }
	}
	export class Unit {
	    id: string;
	    name: string;
	    symbol: string;
	    isActive: boolean;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Unit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.symbol = source["symbol"];
	        this.isActive = source["isActive"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetAllUnitsResult {
	    items: Unit[];
	    total: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new GetAllUnitsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], Unit);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetUnitByIdInput {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new GetUnitByIdInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	
	export class UpdateUnitInput {
	    id: string;
	    name: string;
	    symbol: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateUnitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.symbol = source["symbol"];
	    }
	}

}

