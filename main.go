package main

import (
	"context"
	"embed"
	"log"

	"synapse-pos-desktop/internal/category"
	"synapse-pos-desktop/internal/database"
	"synapse-pos-desktop/internal/inventory"
	"synapse-pos-desktop/internal/product"
	"synapse-pos-desktop/internal/unit"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {

	db, err := database.Connect("./test.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	app := NewApp()
	categoryApi := category.NewCategoryApi(db)
	productApi := product.NewProductApi(db)
	unitApi := unit.NewUnitApi(db)
	inventoryApi := inventory.NewInventoryApi(db)

	err = wails.Run(&options.App{
		Title:  "synapse-pos-desktop",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			categoryApi.SetContext(ctx)
			productApi.SetContext(ctx)
			unitApi.SetContext(ctx)
			inventoryApi.SetContext(ctx)
		},
		Bind: []interface{}{
			app,
			categoryApi,
			productApi,
			unitApi,
			inventoryApi,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
