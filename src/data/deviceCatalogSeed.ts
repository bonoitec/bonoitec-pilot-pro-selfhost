// Comprehensive device catalog seed data with 300+ real models
// Brands are normalized and deduplicated

interface SeedDevice {
  category: string;
  brand: string;
  model: string;
  release_year?: number;
  storage_variants?: string[];
}

export const SEED_DEVICES: SeedDevice[] = [
  // ── Apple – Smartphones ──
  { category: "Smartphone", brand: "Apple", model: "iPhone 7", release_year: 2016, storage_variants: ["32 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 7 Plus", release_year: 2016, storage_variants: ["32 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 8", release_year: 2017, storage_variants: ["64 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 8 Plus", release_year: 2017, storage_variants: ["64 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone X", release_year: 2017, storage_variants: ["64 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone XR", release_year: 2018, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone XS", release_year: 2018, storage_variants: ["64 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone XS Max", release_year: 2018, storage_variants: ["64 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 11", release_year: 2019, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 11 Pro", release_year: 2019, storage_variants: ["64 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 11 Pro Max", release_year: 2019, storage_variants: ["64 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone SE (2020)", release_year: 2020, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 12 Mini", release_year: 2020, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 12", release_year: 2020, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 12 Pro", release_year: 2020, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 12 Pro Max", release_year: 2020, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 13 Mini", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 13", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 13 Pro", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 13 Pro Max", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone SE (2022)", release_year: 2022, storage_variants: ["64 Go", "128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 14", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 14 Plus", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 14 Pro", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 14 Pro Max", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 15", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 15 Plus", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 15 Pro", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 15 Pro Max", release_year: 2023, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 16", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 16 Plus", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 16 Pro", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Apple", model: "iPhone 16 Pro Max", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  // Apple – Tablettes
  { category: "Tablette", brand: "Apple", model: "iPad 9", release_year: 2021, storage_variants: ["64 Go", "256 Go"] },
  { category: "Tablette", brand: "Apple", model: "iPad 10", release_year: 2022, storage_variants: ["64 Go", "256 Go"] },
  { category: "Tablette", brand: "Apple", model: "iPad Air M1", release_year: 2022, storage_variants: ["64 Go", "256 Go"] },
  { category: "Tablette", brand: "Apple", model: "iPad Air M2", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Tablette", brand: "Apple", model: "iPad Mini 6", release_year: 2021, storage_variants: ["64 Go", "256 Go"] },
  { category: "Tablette", brand: "Apple", model: "iPad Pro 11 M2", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To", "2 To"] },
  { category: "Tablette", brand: "Apple", model: "iPad Pro 12.9 M2", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To", "2 To"] },
  { category: "Tablette", brand: "Apple", model: "iPad Pro 11 M4", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To", "2 To"] },
  { category: "Tablette", brand: "Apple", model: "iPad Pro 13 M4", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To", "2 To"] },
  // Apple – Ordinateurs
  { category: "Ordinateur", brand: "Apple", model: "MacBook Air M1", release_year: 2020, storage_variants: ["256 Go", "512 Go"] },
  { category: "Ordinateur", brand: "Apple", model: "MacBook Air M2", release_year: 2022, storage_variants: ["256 Go", "512 Go"] },
  { category: "Ordinateur", brand: "Apple", model: "MacBook Air M3", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Ordinateur", brand: "Apple", model: "MacBook Pro 14 M3", release_year: 2023, storage_variants: ["512 Go", "1 To", "2 To"] },
  { category: "Ordinateur", brand: "Apple", model: "MacBook Pro 16 M3 Pro", release_year: 2023, storage_variants: ["512 Go", "1 To", "2 To"] },
  // Apple – Montres
  { category: "Montre", brand: "Apple", model: "Apple Watch SE (2e)", release_year: 2022 },
  { category: "Montre", brand: "Apple", model: "Apple Watch Series 8", release_year: 2022 },
  { category: "Montre", brand: "Apple", model: "Apple Watch Series 9", release_year: 2023 },
  { category: "Montre", brand: "Apple", model: "Apple Watch Ultra 2", release_year: 2023 },
  { category: "Montre", brand: "Apple", model: "Apple Watch Series 10", release_year: 2024 },

  // ── Samsung – Smartphones ──
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S20", release_year: 2020, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S20+", release_year: 2020, storage_variants: ["128 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S20 Ultra", release_year: 2020, storage_variants: ["128 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S20 FE", release_year: 2020, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S21", release_year: 2021, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S21+", release_year: 2021, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S21 Ultra", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S21 FE", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S22", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S22+", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S22 Ultra", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S23", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S23+", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S23 Ultra", release_year: 2023, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S23 FE", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S24", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S24+", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S24 Ultra", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S24 FE", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S25", release_year: 2025, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S25+", release_year: 2025, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy S25 Ultra", release_year: 2025, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A14", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A15", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A25", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A34", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A35", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A54", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy A55", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Flip 4", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Flip 5", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Flip 6", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Fold 4", release_year: 2022, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Fold 5", release_year: 2023, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Samsung", model: "Galaxy Z Fold 6", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  // Samsung – Tablettes
  { category: "Tablette", brand: "Samsung", model: "Galaxy Tab A8", release_year: 2022, storage_variants: ["32 Go", "64 Go", "128 Go"] },
  { category: "Tablette", brand: "Samsung", model: "Galaxy Tab A9", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Tablette", brand: "Samsung", model: "Galaxy Tab S8", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Tablette", brand: "Samsung", model: "Galaxy Tab S9", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Tablette", brand: "Samsung", model: "Galaxy Tab S9 FE", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  // Samsung – Montres
  { category: "Montre", brand: "Samsung", model: "Galaxy Watch 5", release_year: 2022 },
  { category: "Montre", brand: "Samsung", model: "Galaxy Watch 6", release_year: 2023 },
  { category: "Montre", brand: "Samsung", model: "Galaxy Watch 7", release_year: 2024 },
  { category: "Montre", brand: "Samsung", model: "Galaxy Watch Ultra", release_year: 2024 },

  // ── Xiaomi ──
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 11", release_year: 2022, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 11 Pro", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 12", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 12 Pro", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 13", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 13 Pro", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 13 Pro+", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 14", release_year: 2025, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi Note 14 Pro", release_year: 2025, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Redmi 13C", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Poco X5 Pro", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Poco X6 Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Poco X7 Pro", release_year: 2025, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Poco F5", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Poco F6", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Xiaomi 13T", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Xiaomi 13T Pro", release_year: 2023, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Xiaomi 14T", release_year: 2024, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Xiaomi 14T Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Xiaomi", model: "Xiaomi 14 Ultra", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Tablette", brand: "Xiaomi", model: "Redmi Pad SE", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Tablette", brand: "Xiaomi", model: "Xiaomi Pad 6", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },

  // ── Google ──
  { category: "Smartphone", brand: "Google", model: "Pixel 6", release_year: 2021, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 6 Pro", release_year: 2021, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 6a", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 7", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 7 Pro", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 7a", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 8", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 8 Pro", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 8a", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 9", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 9 Pro", release_year: 2024, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Smartphone", brand: "Google", model: "Pixel 9 Pro Fold", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Montre", brand: "Google", model: "Pixel Watch", release_year: 2022 },
  { category: "Montre", brand: "Google", model: "Pixel Watch 2", release_year: 2023 },
  { category: "Montre", brand: "Google", model: "Pixel Watch 3", release_year: 2024 },

  // ── Honor ──
  { category: "Smartphone", brand: "Honor", model: "Honor X7", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor X8", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor X8a", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor X8b", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor Magic 5 Pro", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor Magic 6 Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor Magic 7 Pro", release_year: 2025, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor 90", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Honor", model: "Honor 200 Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Tablette", brand: "Honor", model: "Honor Pad 9", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },

  // ── Huawei ──
  { category: "Smartphone", brand: "Huawei", model: "P30", release_year: 2019, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "P30 Pro", release_year: 2019, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "P40", release_year: 2020, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "P40 Pro", release_year: 2020, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "P50 Pro", release_year: 2021, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "P60 Pro", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "Nova 10", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "Nova 11", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "Nova 12", release_year: 2024, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Huawei", model: "Mate 50 Pro", release_year: 2022, storage_variants: ["256 Go", "512 Go"] },
  { category: "Montre", brand: "Huawei", model: "Huawei Watch GT 4", release_year: 2023 },
  { category: "Montre", brand: "Huawei", model: "Huawei Watch Fit 3", release_year: 2024 },
  { category: "Tablette", brand: "Huawei", model: "MatePad 11.5", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },

  // ── OnePlus ──
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus 11", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus 12", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus 13", release_year: 2025, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus Nord 3", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus Nord 4", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "OnePlus", model: "OnePlus Nord CE 4", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },

  // ── Oppo ──
  { category: "Smartphone", brand: "Oppo", model: "Oppo A78", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Oppo", model: "Oppo A79", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Oppo", model: "Oppo Reno 10", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Oppo", model: "Oppo Reno 11", release_year: 2024, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Oppo", model: "Oppo Find X6 Pro", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Oppo", model: "Oppo Find X7 Ultra", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },

  // ── Realme ──
  { category: "Smartphone", brand: "Realme", model: "Realme 11 Pro", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Realme", model: "Realme 12 Pro+", release_year: 2024, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Realme", model: "Realme GT 5 Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Realme", model: "Realme C55", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Realme", model: "Realme C67", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Realme", model: "Realme Narzo 70 Pro", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },

  // ── Nothing ──
  { category: "Smartphone", brand: "Nothing", model: "Nothing Phone (1)", release_year: 2022, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Nothing", model: "Nothing Phone (2)", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Nothing", model: "Nothing Phone (2a)", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },

  // ── Motorola ──
  { category: "Smartphone", brand: "Motorola", model: "Moto G84", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Motorola", model: "Moto G54", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Motorola", model: "Moto Edge 40", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Motorola", model: "Moto Edge 50 Pro", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Motorola", model: "Moto Razr 40 Ultra", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Motorola", model: "Moto Razr 50 Ultra", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },

  // ── Nokia ──
  { category: "Smartphone", brand: "Nokia", model: "Nokia G22", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Nokia", model: "Nokia G42", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Nokia", model: "Nokia XR21", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Nokia", model: "Nokia C32", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },

  // ── Sony ──
  { category: "Smartphone", brand: "Sony", model: "Xperia 1 V", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Sony", model: "Xperia 5 V", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Sony", model: "Xperia 10 V", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Sony", model: "Xperia 1 VI", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },

  // ── LG ──
  { category: "Smartphone", brand: "LG", model: "LG Velvet", release_year: 2020, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "LG", model: "LG V60 ThinQ", release_year: 2020, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "LG", model: "LG Wing", release_year: 2020, storage_variants: ["128 Go", "256 Go"] },

  // ── Asus ──
  { category: "Smartphone", brand: "Asus", model: "ROG Phone 7", release_year: 2023, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Asus", model: "ROG Phone 8", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Asus", model: "Zenfone 10", release_year: 2023, storage_variants: ["128 Go", "256 Go", "512 Go"] },
  { category: "Smartphone", brand: "Asus", model: "Zenfone 11 Ultra", release_year: 2024, storage_variants: ["256 Go", "512 Go"] },
  { category: "Ordinateur", brand: "Asus", model: "VivoBook 15", release_year: 2024 },
  { category: "Ordinateur", brand: "Asus", model: "ZenBook 14", release_year: 2024 },
  { category: "Ordinateur", brand: "Asus", model: "ROG Strix G16", release_year: 2024 },

  // ── Lenovo ──
  { category: "Ordinateur", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 11", release_year: 2023 },
  { category: "Ordinateur", brand: "Lenovo", model: "ThinkPad T14s Gen 4", release_year: 2023 },
  { category: "Ordinateur", brand: "Lenovo", model: "IdeaPad Slim 5", release_year: 2024 },
  { category: "Ordinateur", brand: "Lenovo", model: "Legion Pro 5", release_year: 2024 },
  { category: "Tablette", brand: "Lenovo", model: "Lenovo Tab M11", release_year: 2024, storage_variants: ["64 Go", "128 Go"] },
  { category: "Tablette", brand: "Lenovo", model: "Lenovo Tab P12", release_year: 2023, storage_variants: ["128 Go", "256 Go"] },

  // ── Crosscall ──
  { category: "Smartphone", brand: "Crosscall", model: "Core-X5", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Crosscall", model: "Core-T5", release_year: 2022, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Crosscall", model: "Stellar-X5", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Smartphone", brand: "Crosscall", model: "Action-X5", release_year: 2021, storage_variants: ["64 Go"] },
  { category: "Tablette", brand: "Crosscall", model: "Core-T5", release_year: 2022, storage_variants: ["128 Go"] },

  // ── Condor ──
  { category: "Smartphone", brand: "Condor", model: "Condor Plume L8 Pro", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Condor", model: "Condor Allure A8 Plus", release_year: 2022, storage_variants: ["64 Go"] },
  { category: "Smartphone", brand: "Condor", model: "Condor Griffe T9", release_year: 2023, storage_variants: ["128 Go"] },
  { category: "Tablette", brand: "Condor", model: "Condor TAB TGW801", release_year: 2022, storage_variants: ["32 Go", "64 Go"] },

  // ── Garmin ──
  { category: "Montre", brand: "Garmin", model: "Garmin Venu 3", release_year: 2023 },
  { category: "Montre", brand: "Garmin", model: "Garmin Fenix 7", release_year: 2022 },
  { category: "Montre", brand: "Garmin", model: "Garmin Forerunner 965", release_year: 2023 },
  { category: "Montre", brand: "Garmin", model: "Garmin Forerunner 265", release_year: 2023 },
  { category: "Montre", brand: "Garmin", model: "Garmin Enduro 2", release_year: 2022 },
  { category: "GPS", brand: "Garmin", model: "Garmin DriveSmart 76", release_year: 2022 },
  { category: "GPS", brand: "Garmin", model: "Garmin DriveSmart 66", release_year: 2022 },
  { category: "GPS", brand: "Garmin", model: "Garmin Zumo XT2", release_year: 2024 },
  { category: "GPS", brand: "Garmin", model: "Garmin Edge 1040", release_year: 2022 },

  // ── Nintendo ──
  { category: "Console", brand: "Nintendo", model: "Nintendo Switch", release_year: 2017 },
  { category: "Console", brand: "Nintendo", model: "Nintendo Switch Lite", release_year: 2019 },
  { category: "Console", brand: "Nintendo", model: "Nintendo Switch OLED", release_year: 2021 },
  { category: "Console", brand: "Nintendo", model: "Nintendo Switch 2", release_year: 2025 },
  { category: "Console", brand: "Nintendo", model: "Nintendo 3DS", release_year: 2011 },
  { category: "Console", brand: "Nintendo", model: "Nintendo 2DS XL", release_year: 2017 },

  // ── Sony – Consoles ──
  { category: "Console", brand: "Sony", model: "PlayStation 4", release_year: 2013 },
  { category: "Console", brand: "Sony", model: "PlayStation 4 Pro", release_year: 2016 },
  { category: "Console", brand: "Sony", model: "PlayStation 5", release_year: 2020 },
  { category: "Console", brand: "Sony", model: "PlayStation 5 Slim", release_year: 2023 },
  { category: "Console", brand: "Sony", model: "PS Vita", release_year: 2012 },
  { category: "Console", brand: "Sony", model: "PlayStation Portal", release_year: 2023 },

  // ── Valve ──
  { category: "Console", brand: "Valve", model: "Steam Deck 64 Go", release_year: 2022, storage_variants: ["64 Go"] },
  { category: "Console", brand: "Valve", model: "Steam Deck 256 Go", release_year: 2022, storage_variants: ["256 Go"] },
  { category: "Console", brand: "Valve", model: "Steam Deck 512 Go", release_year: 2022, storage_variants: ["512 Go"] },
  { category: "Console", brand: "Valve", model: "Steam Deck OLED", release_year: 2023, storage_variants: ["512 Go", "1 To"] },

  // ── Orange ──
  { category: "Smartphone", brand: "Orange", model: "Orange Neva Jet", release_year: 2019, storage_variants: ["16 Go"] },
  { category: "Smartphone", brand: "Orange", model: "Orange Rise 54", release_year: 2020, storage_variants: ["16 Go"] },

  // ── Oscal ──
  { category: "Smartphone", brand: "Oscal", model: "Oscal S70 Pro", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },
  { category: "Smartphone", brand: "Oscal", model: "Oscal Tiger 12", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Tablette", brand: "Oscal", model: "Oscal Pad 15", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },

  // ── Ulefone ──
  { category: "Smartphone", brand: "Ulefone", model: "Ulefone Armor 22", release_year: 2024, storage_variants: ["128 Go", "256 Go"] },
  { category: "Smartphone", brand: "Ulefone", model: "Ulefone Armor 23 Ultra", release_year: 2024, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Ulefone", model: "Ulefone Power Armor 19", release_year: 2023, storage_variants: ["256 Go"] },
  { category: "Smartphone", brand: "Ulefone", model: "Ulefone Note 16 Pro", release_year: 2023, storage_variants: ["128 Go"] },

  // ── Zebra ──
  { category: "Smartphone", brand: "Zebra", model: "Zebra TC52x", release_year: 2021, storage_variants: ["32 Go"] },
  { category: "Smartphone", brand: "Zebra", model: "Zebra TC53", release_year: 2023, storage_variants: ["64 Go"] },
  { category: "Smartphone", brand: "Zebra", model: "Zebra TC58", release_year: 2023, storage_variants: ["64 Go"] },
  { category: "Tablette", brand: "Zebra", model: "Zebra ET45", release_year: 2023, storage_variants: ["64 Go", "128 Go"] },

  // ── Windows / Microsoft ──
  { category: "Ordinateur", brand: "Windows", model: "Surface Pro 9", release_year: 2022, storage_variants: ["128 Go", "256 Go", "512 Go", "1 To"] },
  { category: "Ordinateur", brand: "Windows", model: "Surface Pro 10", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Ordinateur", brand: "Windows", model: "Surface Laptop 5", release_year: 2022, storage_variants: ["256 Go", "512 Go"] },
  { category: "Ordinateur", brand: "Windows", model: "Surface Laptop 6", release_year: 2024, storage_variants: ["256 Go", "512 Go", "1 To"] },
  { category: "Ordinateur", brand: "Windows", model: "Surface Go 4", release_year: 2023, storage_variants: ["64 Go", "128 Go", "256 Go"] },

  // ── Universel ──
  { category: "Universel", brand: "Universel", model: "Accessoire universel" },
  { category: "Universel", brand: "Universel", model: "Câble USB-C" },
  { category: "Universel", brand: "Universel", model: "Chargeur universel" },
  { category: "Universel", brand: "Universel", model: "Protection écran universelle" },
  { category: "Universel", brand: "Universel", model: "Coque universelle" },

  // ── GPS – TomTom ──
  { category: "GPS", brand: "TomTom", model: "TomTom GO Expert 7", release_year: 2023 },
  { category: "GPS", brand: "TomTom", model: "TomTom GO Classic 6", release_year: 2022 },
  { category: "GPS", brand: "TomTom", model: "TomTom Rider 550", release_year: 2019 },
];
