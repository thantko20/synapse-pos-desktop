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

export namespace product {
	
	export class CreateProductVariantInput {
	    name: string;
	    sku: string;
	    barcode: string;
	    unitName: string;
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
	        this.unitName = source["unitName"];
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
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
	export class ProductVariant {
	    id: string;
	    productId: string;
	    name: string;
	    sku: string;
	    barcode: string;
	    unitName: string;
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
	        this.unitName = source["unitName"];
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
	
	
	
	export class UpdateProductVariantInput {
	    id: string;
	    name: string;
	    sku: string;
	    barcode: string;
	    unitName: string;
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
	        this.unitName = source["unitName"];
	        this.reorderPoint = source["reorderPoint"];
	        this.alertThreshold = source["alertThreshold"];
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

