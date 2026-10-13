// ==============================================================================
// BUILDFORGE DA3 - IDEMPOTENT NEO4J SEED DATASET
// 10+ Users, 8 Categories, 40+ Components, 5 Retailers, Listings, Price Histories,
// 10 Saved Builds, Benchmarks, Reviews, Addresses, Carts & Orders
// All Prices in INR (₹)
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. CATEGORIES (8 Categories)
// ------------------------------------------------------------------------------
UNWIND [
  {categoryId: 'cat-cpu', name: 'CPU', slug: 'cpu', icon: 'Cpu'},
  {categoryId: 'cat-mobo', name: 'Motherboard', slug: 'motherboard', icon: 'CircuitBoard'},
  {categoryId: 'cat-gpu', name: 'GPU', slug: 'gpu', icon: 'Tv'},
  {categoryId: 'cat-ram', name: 'RAM', slug: 'ram', icon: 'MemoryStick'},
  {categoryId: 'cat-storage', name: 'Storage', slug: 'storage', icon: 'HardDrive'},
  {categoryId: 'cat-psu', name: 'Power Supply', slug: 'psu', icon: 'Zap'},
  {categoryId: 'cat-case', name: 'Case', slug: 'case', icon: 'Box'},
  {categoryId: 'cat-cooler', name: 'CPU Cooler', slug: 'cooler', icon: 'Wind'}
] AS cat
MERGE (c:Category {categoryId: cat.categoryId})
SET c.name = cat.name, c.slug = cat.slug, c.icon = cat.icon;

// ------------------------------------------------------------------------------
// 2. USERS (10 Users) & ADDRESSES
// ------------------------------------------------------------------------------
UNWIND [
  {userId: 'usr-1', username: 'aarav_sharma', email: 'aarav@buildforge.in', phone: '+91 98765 43210', addressId: 'addr-1', city: 'Bengaluru', state: 'Karnataka', zip: '560001'},
  {userId: 'usr-2', username: 'priya_patel', email: 'priya@buildforge.in', phone: '+91 98234 56789', addressId: 'addr-2', city: 'Mumbai', state: 'Maharashtra', zip: '400001'},
  {userId: 'usr-3', username: 'rohan_verma', email: 'rohan@buildforge.in', phone: '+91 97123 45678', addressId: 'addr-3', city: 'Delhi', state: 'Delhi', zip: '110001'},
  {userId: 'usr-4', username: 'ananya_iyer', email: 'ananya@buildforge.in', phone: '+91 96543 21098', addressId: 'addr-4', city: 'Chennai', state: 'Tamil Nadu', zip: '600001'},
  {userId: 'usr-5', username: 'vikram_singh', email: 'vikram@buildforge.in', phone: '+91 95432 10987', addressId: 'addr-5', city: 'Hyderabad', state: 'Telangana', zip: '500001'},
  {userId: 'usr-6', username: 'sneha_nair', email: 'sneha@buildforge.in', phone: '+91 94321 09876', addressId: 'addr-6', city: 'Kochi', state: 'Kerala', zip: '682001'},
  {userId: 'usr-7', username: 'karthik_rajan', email: 'karthik@buildforge.in', phone: '+91 93210 98765', addressId: 'addr-7', city: 'Pune', state: 'Maharashtra', zip: '411001'},
  {userId: 'usr-8', username: 'divya_mukherjee', email: 'divya@buildforge.in', phone: '+91 92109 87654', addressId: 'addr-8', city: 'Kolkata', state: 'West Bengal', zip: '700001'},
  {userId: 'usr-9', username: 'rahul_deshmukh', email: 'rahul@buildforge.in', phone: '+91 91098 76543', addressId: 'addr-9', city: 'Ahmedabad', state: 'Gujarat', zip: '380001'},
  {userId: 'usr-10', username: 'meera_reddy', email: 'meera@buildforge.in', phone: '+91 90987 65432', addressId: 'addr-10', city: 'Bengaluru', state: 'Karnataka', zip: '560034'}
] AS uData
MERGE (u:User {userId: uData.userId})
SET u.username = uData.username,
    u.email = uData.email,
    u.phone = uData.phone,
    u.registrationDate = '2026-01-15'
MERGE (addr:UserAddress {addressId: uData.addressId})
SET addr.city = uData.city,
    addr.state = uData.state,
    addr.zipCode = uData.zip
MERGE (u)-[:HAS_ADDRESS]->(addr)
MERGE (cart:Cart {cartId: 'cart-' + uData.userId})
SET cart.createdAt = '2026-02-01T10:00:00Z', cart.updatedAt = '2026-03-01T10:00:00Z'
MERGE (u)-[:HAS_CART]->(cart);

// ------------------------------------------------------------------------------
// 3. RETAILERS (5 Retailers)
// ------------------------------------------------------------------------------
UNWIND [
  {retailerId: 'ret-1', name: 'MDComputers', websiteUrl: 'https://mdcomputers.in', rating: 4.8},
  {retailerId: 'ret-2', name: 'PrimeABGB', websiteUrl: 'https://primeabgb.com', rating: 4.7},
  {retailerId: 'ret-3', name: 'Vedant Computers', websiteUrl: 'https://vedantcomputers.com', rating: 4.6},
  {retailerId: 'ret-4', name: 'Amazon India', websiteUrl: 'https://amazon.in', rating: 4.5},
  {retailerId: 'ret-5', name: 'EliteHubs', websiteUrl: 'https://elitehubs.com', rating: 4.7}
] AS ret
MERGE (r:Retailer {retailerId: ret.retailerId})
SET r.name = ret.name, r.websiteUrl = ret.websiteUrl, r.rating = ret.rating;

// ------------------------------------------------------------------------------
// 4. COMPONENTS WITH SUBTYPES & SPECS (44 Realistic Components)
// ------------------------------------------------------------------------------

// --- 4.1 CPUs ---
UNWIND [
  {compId: 'cpu-1', mfg: 'AMD', model: 'AMD Ryzen 7 7800X3D', price: 36999, tdp: 120, score: 96, socket: 'AM5', cores: 8, threads: 16, baseClock: 4.2, boostClock: 5.0, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-2', mfg: 'AMD', model: 'AMD Ryzen 5 7600', price: 18499, tdp: 65, score: 82, socket: 'AM5', cores: 6, threads: 12, baseClock: 3.8, boostClock: 5.1, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-3', mfg: 'AMD', model: 'AMD Ryzen 9 7950X', price: 52999, tdp: 170, score: 98, socket: 'AM5', cores: 16, threads: 32, baseClock: 4.5, boostClock: 5.7, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-4', mfg: 'Intel', model: 'Intel Core i7-14700K', price: 39999, tdp: 253, score: 95, socket: 'LGA1700', cores: 20, threads: 28, baseClock: 3.4, boostClock: 5.6, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-5', mfg: 'Intel', model: 'Intel Core i5-14600K', price: 29499, tdp: 181, score: 88, socket: 'LGA1700', cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.3, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-6', mfg: 'Intel', model: 'Intel Core i5-13400F', price: 17999, tdp: 65, score: 79, socket: 'LGA1700', cores: 10, threads: 16, baseClock: 2.5, boostClock: 4.6, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cpu-7', mfg: 'AMD', model: 'AMD Ryzen 5 5600X', price: 12999, tdp: 65, score: 74, socket: 'AM4', cores: 6, threads: 12, baseClock: 3.7, boostClock: 4.6, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:CPU {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.socketType = d.socket,
    c.cores = d.cores,
    c.threads = d.threads,
    c.baseClockGhz = d.baseClock,
    c.boostClockGhz = d.boostClock,
    c.specs = d.socket + ' · ' + toString(d.cores) + 'C/' + toString(d.threads) + 'T · ' + toString(d.tdp) + 'W TDP',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-cpu'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.2 Motherboards ---
UNWIND [
  {compId: 'mobo-1', mfg: 'MSI', model: 'MSI MAG B650 Tomahawk WiFi', price: 21999, tdp: 55, score: 86, socket: 'AM5', ff: 'ATX', ram: 'DDR5', pcie: 'PCIe 4.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-2', mfg: 'ASUS', model: 'ASUS ROG Strix B650E-F Gaming WiFi', price: 28999, tdp: 60, score: 92, socket: 'AM5', ff: 'ATX', ram: 'DDR5', pcie: 'PCIe 5.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-3', mfg: 'Gigabyte', model: 'Gigabyte B650M DS3H', price: 13999, tdp: 45, score: 76, socket: 'AM5', ff: 'Micro-ATX', ram: 'DDR5', pcie: 'PCIe 4.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-4', mfg: 'MSI', model: 'MSI PRO Z790-A MAX WiFi', price: 25499, tdp: 65, score: 90, socket: 'LGA1700', ff: 'ATX', ram: 'DDR5', pcie: 'PCIe 5.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-5', mfg: 'ASUS', model: 'ASUS TUF Gaming B760-PLUS WiFi', price: 19999, tdp: 50, score: 84, socket: 'LGA1700', ff: 'ATX', ram: 'DDR5', pcie: 'PCIe 5.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-6', mfg: 'ASRock', model: 'ASRock B760M Steel Legend WiFi', price: 16499, tdp: 50, score: 80, socket: 'LGA1700', ff: 'Micro-ATX', ram: 'DDR5', pcie: 'PCIe 5.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'},
  {compId: 'mobo-7', mfg: 'MSI', model: 'MSI B550 Gaming Plus', price: 11499, tdp: 45, score: 73, socket: 'AM4', ff: 'ATX', ram: 'DDR4', pcie: 'PCIe 4.0', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:Motherboard {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.socketType = d.socket,
    c.formFactor = d.ff,
    c.ramGeneration = d.ram,
    c.pcieVersion = d.pcie,
    c.specs = d.socket + ' · ' + d.ff + ' · ' + d.ram + ' · ' + d.pcie,
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-mobo'})
MERGE (c)-[:BELONGS_TO]->(cat);

// Explicit Compatibility relationships between CPU and Motherboard
MATCH (cpu:CPU), (mobo:Motherboard)
WHERE cpu.socketType = mobo.socketType
MERGE (cpu)-[:COMPATIBLE_WITH {socketType: cpu.socketType}]->(mobo);

// --- 4.3 GPUs ---
UNWIND [
  {compId: 'gpu-1', mfg: 'NVIDIA', model: 'NVIDIA GeForce RTX 4070 SUPER', price: 61999, tdp: 220, score: 94, vram: 12, length: 242, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-2', mfg: 'NVIDIA', model: 'NVIDIA GeForce RTX 4080 SUPER', price: 104999, tdp: 320, score: 99, vram: 16, length: 304, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-3', mfg: 'NVIDIA', model: 'NVIDIA GeForce RTX 4060 Ti 8GB', price: 37999, tdp: 160, score: 81, vram: 8, length: 240, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-4', mfg: 'AMD', model: 'AMD Radeon RX 7900 GRE', price: 56999, tdp: 260, score: 92, vram: 16, length: 280, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-5', mfg: 'AMD', model: 'AMD Radeon RX 7800 XT', price: 51999, tdp: 263, score: 89, vram: 16, length: 267, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-6', mfg: 'AMD', model: 'AMD Radeon RX 7600 XT', price: 31999, tdp: 190, score: 76, vram: 16, length: 241, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'gpu-7', mfg: 'Intel', model: 'Intel Arc A770 16GB', price: 28999, tdp: 225, score: 75, vram: 16, length: 267, image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:GPU {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.vramGb = d.vram,
    c.lengthMm = d.length,
    c.specs = toString(d.vram) + 'GB GDDR6 · ' + toString(d.tdp) + 'W · Length ' + toString(d.length) + 'mm',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-gpu'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.4 RAM ---
UNWIND [
  {compId: 'ram-1', mfg: 'Corsair', model: 'Corsair Vengeance 32GB DDR5-6000', price: 10499, tdp: 10, score: 88, gen: 'DDR5', cap: 32, speed: 6000, modules: '2x16GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'},
  {compId: 'ram-2', mfg: 'G.Skill', model: 'G.Skill Trident Z5 RGB 32GB DDR5-6400', price: 12499, tdp: 12, score: 92, gen: 'DDR5', cap: 32, speed: 6400, modules: '2x16GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'},
  {compId: 'ram-3', mfg: 'Kingston', model: 'Kingston Fury Beast 16GB DDR5-5600', price: 5499, tdp: 8, score: 79, gen: 'DDR5', cap: 16, speed: 5600, modules: '2x8GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'},
  {compId: 'ram-4', mfg: 'Corsair', model: 'Corsair Vengeance 64GB DDR5-6000', price: 19999, tdp: 15, score: 95, gen: 'DDR5', cap: 64, speed: 6000, modules: '2x32GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'},
  {compId: 'ram-5', mfg: 'G.Skill', model: 'G.Skill Ripjaws V 16GB DDR4-3600', price: 3999, tdp: 6, score: 72, gen: 'DDR4', cap: 16, speed: 3600, modules: '2x8GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'},
  {compId: 'ram-6', mfg: 'Crucial', model: 'Crucial Pro 32GB DDR4-3200', price: 6499, tdp: 8, score: 75, gen: 'DDR4', cap: 32, speed: 3200, modules: '2x16GB', image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:RAM {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.ramGeneration = d.gen,
    c.capacityGb = d.cap,
    c.speedMhz = d.speed,
    c.modules = d.modules,
    c.specs = d.gen + ' · ' + toString(d.speed) + 'MHz · ' + d.modules + ' (' + toString(d.cap) + 'GB)',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-ram'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.5 Storage ---
UNWIND [
  {compId: 'stor-1', mfg: 'Samsung', model: 'Samsung 990 PRO 1TB NVMe Gen4', price: 9499, tdp: 9, score: 94, cap: 1000, read: 7450, iface: 'PCIe 4.0 x4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'},
  {compId: 'stor-2', mfg: 'Samsung', model: 'Samsung 990 PRO 2TB NVMe Gen4', price: 16999, tdp: 10, score: 97, cap: 2000, read: 7450, iface: 'PCIe 4.0 x4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'},
  {compId: 'stor-3', mfg: 'Western Digital', model: 'WD Black SN850X 1TB NVMe Gen4', price: 8999, tdp: 8, score: 93, cap: 1000, read: 7300, iface: 'PCIe 4.0 x4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'},
  {compId: 'stor-4', mfg: 'Crucial', model: 'Crucial T700 1TB NVMe Gen5', price: 14999, tdp: 12, score: 99, cap: 1000, read: 11700, iface: 'PCIe 5.0 x4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'},
  {compId: 'stor-5', mfg: 'Kingston', model: 'Kingston NV2 1TB NVMe Gen4', price: 5299, tdp: 5, score: 76, cap: 1000, read: 3500, iface: 'PCIe 4.0 x4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'},
  {compId: 'stor-6', mfg: 'Crucial', model: 'Crucial MX500 1TB SATA SSD', price: 5899, tdp: 4, score: 68, cap: 1000, read: 560, iface: 'SATA 6Gb/s', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:Storage {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.capacityGb = d.cap,
    c.readSpeedMbps = d.read,
    c.interface = d.iface,
    c.specs = d.iface + ' · Up to ' + toString(d.read) + ' MB/s · ' + toString(d.cap) + 'GB',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-storage'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.6 Power Supplies (PSU) ---
UNWIND [
  {compId: 'psu-1', mfg: 'Corsair', model: 'Corsair RM850e 850W ATX 3.0', price: 11999, tdp: 0, score: 92, watts: 850, eff: '80+ Gold', mod: 'Fully Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'},
  {compId: 'psu-2', mfg: 'Corsair', model: 'Corsair RM1000x 1000W Shift', price: 18499, tdp: 0, score: 97, watts: 1000, eff: '80+ Gold', mod: 'Fully Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'},
  {compId: 'psu-3', mfg: 'DeepCool', model: 'DeepCool PM750D 750W', price: 6299, tdp: 0, score: 82, watts: 750, eff: '80+ Gold', mod: 'Non-Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'},
  {compId: 'psu-4', mfg: 'MSI', model: 'MSI MAG A650BN 650W', price: 4799, tdp: 0, score: 75, watts: 650, eff: '80+ Bronze', mod: 'Non-Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'},
  {compId: 'psu-5', mfg: 'Seasonic', model: 'Seasonic Focus GX-750 750W', price: 10499, tdp: 0, score: 91, watts: 750, eff: '80+ Gold', mod: 'Fully Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'},
  {compId: 'psu-6', mfg: 'Cooler Master', model: 'Cooler Master MWE 550W V2', price: 3899, tdp: 0, score: 71, watts: 550, eff: '80+ Bronze', mod: 'Non-Modular', image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:PowerSupply {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.wattage = d.watts,
    c.efficiencyRating = d.eff,
    c.modular = d.mod,
    c.specs = toString(d.watts) + 'W · ' + d.eff + ' · ' + d.mod,
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-psu'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.7 Cases ---
UNWIND [
  {compId: 'case-1', mfg: 'NZXT', model: 'NZXT H5 Flow RGB (Black)', price: 8499, tdp: 0, score: 88, ff: 'ATX Mid Tower', maxGpu: 365, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'},
  {compId: 'case-2', mfg: 'Lian Li', model: 'Lian Li O11 Dynamic EVO', price: 14999, tdp: 0, score: 96, ff: 'ATX Mid Tower', maxGpu: 422, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'},
  {compId: 'case-3', mfg: 'Fractal Design', model: 'Fractal Design North Charcoal Black', price: 13999, tdp: 0, score: 94, ff: 'ATX Mid Tower', maxGpu: 355, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'},
  {compId: 'case-4', mfg: 'Corsair', model: 'Corsair 4000D Airflow', price: 6999, tdp: 0, score: 85, ff: 'ATX Mid Tower', maxGpu: 360, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'},
  {compId: 'case-5', mfg: 'Montech', model: 'Montech Air 903 Max', price: 5499, tdp: 0, score: 82, ff: 'ATX Mid Tower', maxGpu: 400, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'},
  {compId: 'case-6', mfg: 'Ant Esports', model: 'Ant Esports ICE-112', price: 3199, tdp: 0, score: 70, ff: 'Micro-ATX', maxGpu: 310, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:Case {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = d.tdp,
    c.performanceScore = d.score,
    c.formFactor = d.ff,
    c.maxGpuLengthMm = d.maxGpu,
    c.specs = d.ff + ' · Max GPU ' + toString(d.maxGpu) + 'mm · High Airflow',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-case'})
MERGE (c)-[:BELONGS_TO]->(cat);

// --- 4.8 Coolers ---
UNWIND [
  {compId: 'cool-1', mfg: 'DeepCool', model: 'DeepCool AK620 Dual Tower Air Cooler', price: 5499, tdp: 260, score: 90, type: 'Air', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cool-2', mfg: 'Arctic', model: 'Arctic Liquid Freezer III 360 AIO', price: 10499, tdp: 350, score: 96, type: 'Liquid 360mm', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'},
  {compId: 'cool-3', mfg: 'Thermalright', model: 'Thermalright Peerless Assassin 120 SE', price: 3799, tdp: 245, score: 88, type: 'Air', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80'}
] AS d
MERGE (c:Component:Cooler {compId: d.compId})
SET c.manufacturer = d.mfg,
    c.model = d.model,
    c.priceINR = d.price,
    c.tdpWatts = 5,
    c.performanceScore = d.score,
    c.coolingType = d.type,
    c.specs = d.type + ' · Max Cooling ' + toString(d.tdp) + 'W TDP',
    c.imageUrl = d.image
WITH c
MATCH (cat:Category {categoryId: 'cat-cooler'})
MERGE (c)-[:BELONGS_TO]->(cat);

// ------------------------------------------------------------------------------
// 5. RETAILER LISTINGS & PRICE HISTORIES
// ------------------------------------------------------------------------------
UNWIND [
  {compId: 'cpu-1', retId: 'ret-1', listId: 'lst-1', price: 36999, oldPrice: 38499, oldDate: '2026-01-10', url: 'https://mdcomputers.in/amd-ryzen-7-7800x3d.html'},
  {compId: 'cpu-1', retId: 'ret-2', listId: 'lst-2', price: 37499, oldPrice: 38999, oldDate: '2026-01-12', url: 'https://primeabgb.com/amd-ryzen-7-7800x3d'},
  {compId: 'cpu-1', retId: 'ret-4', listId: 'lst-3', price: 38200, oldPrice: 39999, oldDate: '2026-01-05', url: 'https://amazon.in/dp/B0BTZB7F88'},
  
  {compId: 'cpu-4', retId: 'ret-1', listId: 'lst-4', price: 39999, oldPrice: 42000, oldDate: '2026-01-08', url: 'https://mdcomputers.in/intel-i7-14700k.html'},
  {compId: 'cpu-4', retId: 'ret-3', listId: 'lst-5', price: 39499, oldPrice: 41500, oldDate: '2026-01-15', url: 'https://vedantcomputers.com/intel-i7-14700k'},
  
  {compId: 'mobo-1', retId: 'ret-1', listId: 'lst-6', price: 21999, oldPrice: 22499, oldDate: '2026-01-14', url: 'https://mdcomputers.in/msi-b650-tomahawk.html'},
  {compId: 'mobo-1', retId: 'ret-5', listId: 'lst-7', price: 21499, oldPrice: 22999, oldDate: '2026-01-18', url: 'https://elitehubs.com/msi-b650-tomahawk'},
  
  {compId: 'mobo-4', retId: 'ret-2', listId: 'lst-8', price: 25499, oldPrice: 26999, oldDate: '2026-01-10', url: 'https://primeabgb.com/msi-z790-a-max'},
  {compId: 'mobo-4', retId: 'ret-4', listId: 'lst-9', price: 25999, oldPrice: 27500, oldDate: '2026-01-05', url: 'https://amazon.in/dp/B0CHB34T78'},

  {compId: 'gpu-1', retId: 'ret-1', listId: 'lst-10', price: 61999, oldPrice: 64999, oldDate: '2026-01-11', url: 'https://mdcomputers.in/rtx-4070-super.html'},
  {compId: 'gpu-1', retId: 'ret-2', listId: 'lst-11', price: 60999, oldPrice: 63999, oldDate: '2026-01-20', url: 'https://primeabgb.com/rtx-4070-super'},
  {compId: 'gpu-1', retId: 'ret-5', listId: 'lst-12', price: 61499, oldPrice: 64500, oldDate: '2026-01-16', url: 'https://elitehubs.com/rtx-4070-super'},

  {compId: 'gpu-2', retId: 'ret-2', listId: 'lst-13', price: 104999, oldPrice: 108999, oldDate: '2026-01-15', url: 'https://primeabgb.com/rtx-4080-super'},
  {compId: 'gpu-2', retId: 'ret-4', listId: 'lst-14', price: 106999, oldPrice: 112000, oldDate: '2026-01-08', url: 'https://amazon.in/dp/B0CS35FXD9'},

  {compId: 'gpu-4', retId: 'ret-3', listId: 'lst-15', price: 56999, oldPrice: 58999, oldDate: '2026-01-12', url: 'https://vedantcomputers.com/rx-7900-gre'},
  {compId: 'gpu-4', retId: 'ret-1', listId: 'lst-16', price: 57499, oldPrice: 59499, oldDate: '2026-01-17', url: 'https://mdcomputers.in/rx-7900-gre'},

  {compId: 'ram-1', retId: 'ret-1', listId: 'lst-17', price: 10499, oldPrice: 11200, oldDate: '2026-01-09', url: 'https://mdcomputers.in/corsair-vengeance-32gb-ddr5.html'},
  {compId: 'ram-1', retId: 'ret-5', listId: 'lst-18', price: 10299, oldPrice: 10999, oldDate: '2026-01-18', url: 'https://elitehubs.com/corsair-vengeance-32gb-ddr5'},

  {compId: 'stor-1', retId: 'ret-2', listId: 'lst-19', price: 9499, oldPrice: 10499, oldDate: '2026-01-07', url: 'https://primeabgb.com/samsung-990-pro-1tb'},
  {compId: 'stor-1', retId: 'ret-4', listId: 'lst-20', price: 9299, oldPrice: 10200, oldDate: '2026-01-14', url: 'https://amazon.in/dp/B0B9C3VDHR'},

  {compId: 'psu-1', retId: 'ret-1', listId: 'lst-21', price: 11999, oldPrice: 12499, oldDate: '2026-01-05', url: 'https://mdcomputers.in/corsair-rm850e.html'},
  {compId: 'psu-1', retId: 'ret-3', listId: 'lst-22', price: 11799, oldPrice: 12299, oldDate: '2026-01-19', url: 'https://vedantcomputers.com/corsair-rm850e'}
] AS lData
MATCH (comp:Component {compId: lData.compId})
MATCH (ret:Retailer {retailerId: lData.retId})
MERGE (lst:Listing {listingId: lData.listId})
SET lst.url = lData.url,
    lst.currentPriceINR = lData.price,
    lst.stockStatus = 'In Stock'
MERGE (comp)-[:HAS_LISTING]->(lst)
MERGE (lst)-[:OFFERED_BY]->(ret)
MERGE (phOld:PriceHistory {historyId: 'ph-' + lData.listId + '-1'})
SET phOld.priceINR = lData.oldPrice, phOld.recordedAt = lData.oldDate
MERGE (phCurr:PriceHistory {historyId: 'ph-' + lData.listId + '-2'})
SET phCurr.priceINR = lData.price, phCurr.recordedAt = '2026-02-15'
MERGE (lst)-[:HAS_PRICE_HISTORY]->(phOld)
MERGE (lst)-[:HAS_PRICE_HISTORY]->(phCurr);

// ------------------------------------------------------------------------------
// 6. SAVED BUILDS (10 Builds Across Users)
// ------------------------------------------------------------------------------
UNWIND [
  {
    buildId: 'bld-1001', userId: 'usr-1', name: 'Apex Esports Beast (AM5)', createdAt: '2026-02-01',
    parts: ['cpu-1', 'mobo-1', 'gpu-1', 'ram-1', 'stor-1', 'psu-1', 'case-1']
  },
  {
    buildId: 'bld-1002', userId: 'usr-2', name: 'Intel 14th Gen Titan (LGA1700)', createdAt: '2026-02-03',
    parts: ['cpu-4', 'mobo-4', 'gpu-2', 'ram-2', 'stor-2', 'psu-2', 'case-2']
  },
  {
    buildId: 'bld-1003', userId: 'usr-3', name: 'Sweet-Spot 1440p AMD Gaming', createdAt: '2026-02-05',
    parts: ['cpu-2', 'mobo-1', 'gpu-4', 'ram-1', 'stor-3', 'psu-1', 'case-3']
  },
  {
    buildId: 'bld-1004', userId: 'usr-4', name: 'Budget High-FPS Rig (Intel)', createdAt: '2026-02-07',
    parts: ['cpu-5', 'mobo-5', 'gpu-3', 'ram-1', 'stor-5', 'psu-3', 'case-4']
  },
  {
    buildId: 'bld-1005', userId: 'usr-5', name: 'Content Creator Workstation', createdAt: '2026-02-09',
    parts: ['cpu-3', 'mobo-2', 'gpu-2', 'ram-4', 'stor-4', 'psu-2', 'case-2']
  },
  {
    buildId: 'bld-1006', userId: 'usr-6', name: 'Value AM5 Mid-Range', createdAt: '2026-02-12',
    parts: ['cpu-2', 'mobo-3', 'gpu-5', 'ram-3', 'stor-1', 'psu-3', 'case-5']
  },
  {
    buildId: 'bld-1007', userId: 'usr-7', name: 'Ultra Minimalist Stealth Rig', createdAt: '2026-02-14',
    parts: ['cpu-1', 'mobo-2', 'gpu-4', 'ram-2', 'stor-3', 'psu-5', 'case-3']
  },
  {
    buildId: 'bld-1008', userId: 'usr-8', name: 'Entry 1080p Intel Gamer', createdAt: '2026-02-16',
    parts: ['cpu-6', 'mobo-6', 'gpu-6', 'ram-3', 'stor-5', 'psu-4', 'case-6']
  },
  {
    buildId: 'bld-1009', userId: 'usr-9', name: 'Budget AM4 Legacy Workhorse', createdAt: '2026-02-18',
    parts: ['cpu-7', 'mobo-7', 'gpu-3', 'ram-5', 'stor-6', 'psu-6', 'case-6']
  },
  {
    buildId: 'bld-1010', userId: 'usr-10', name: 'Pure Radeon All-AMD Setup', createdAt: '2026-02-20',
    parts: ['cpu-1', 'mobo-1', 'gpu-4', 'ram-1', 'stor-1', 'psu-1', 'case-1']
  }
] AS bData
MATCH (u:User {userId: bData.userId})
MERGE (b:Build {buildId: bData.buildId})
SET b.name = bData.name,
    b.createdAt = bData.createdAt,
    b.status = 'COMPLETED'
MERGE (u)-[:CREATED]->(b)
WITH b, bData
UNWIND bData.parts AS pCompId
MATCH (cp:Component {compId: pCompId})
MERGE (b)-[:CONTAINS {quantity: 1}]->(cp);

// Compute and set total price & wattage on Builds dynamically from components
MATCH (b:Build)-[:CONTAINS]->(cp:Component)
WITH b, sum(cp.priceINR) AS totPrice, sum(cp.tdpWatts) AS totWatts
SET b.totalEstimatedPrice = totPrice,
    b.totalWattage = totWatts + 50;

// ------------------------------------------------------------------------------
// 7. BENCHMARKS
// ------------------------------------------------------------------------------
UNWIND [
  {benchId: 'bm-1', buildId: 'bld-1001', name: 'Cyberpunk 2077 (1440p Ultra)', score: 128, fps1080: 165, fps1440: 128},
  {benchId: 'bm-2', buildId: 'bld-1002', name: '3DMark TimeSpy Extreme', score: 14200, fps1080: 210, fps1440: 165},
  {benchId: 'bm-3', buildId: 'bld-1003', name: 'Counter-Strike 2 (1080p High)', score: 380, fps1080: 380, fps1440: 260},
  {benchId: 'bm-4', buildId: 'bld-1004', name: 'Cinebench R23 Multi-Core', score: 24200, fps1080: 140, fps1440: 95},
  {benchId: 'bm-5', buildId: 'bld-1005', name: 'Blender Monster Benchmark', score: 19800, fps1080: 230, fps1440: 180},
  {benchId: 'bm-6', buildId: 'bld-1007', name: 'Shadow of the Tomb Raider', score: 185, fps1080: 195, fps1440: 155},
  {benchId: 'bm-7', buildId: 'bld-1010', name: 'Forza Horizon 5 (Extreme)', score: 144, fps1080: 175, fps1440: 144}
] AS bmData
MATCH (b:Build {buildId: bmData.buildId})
MERGE (bm:Benchmark {benchId: bmData.benchId})
SET bm.name = bmData.name,
    bm.score = bmData.score,
    bm.fps1080p = bmData.fps1080,
    bm.fps1440p = bmData.fps1440,
    bm.testedAt = '2026-02-22'
MERGE (b)-[:TESTED_ON]->(bm);

// ------------------------------------------------------------------------------
// 8. USER REVIEWS (Rating 1 to 5)
// ------------------------------------------------------------------------------
UNWIND [
  {reviewId: 'rev-1', userId: 'usr-1', compId: 'cpu-1', rating: 5, comment: 'Undisputed gaming king. Exceptional 1% lows and run very cool on the AK620.'},
  {reviewId: 'rev-2', userId: 'usr-2', compId: 'gpu-1', rating: 5, comment: 'Phenomenal 1440p performance. DLSS 3 frame generation is incredible.'},
  {reviewId: 'rev-3', userId: 'usr-3', compId: 'mobo-1', rating: 4, comment: 'Solid VRMs, booted first try with EXPO at 6000MHz. BIOS update was smooth.'},
  {reviewId: 'rev-4', userId: 'usr-4', compId: 'ram-1', rating: 5, comment: 'Tight timings, worked right out of the box with AMD EXPO enabled.'},
  {reviewId: 'rev-5', userId: 'usr-5', compId: 'stor-1', rating: 5, comment: 'Insanely fast boot and game load times. Keep a heatsink on it.'},
  {reviewId: 'rev-6', userId: 'usr-6', compId: 'psu-1', rating: 4, comment: 'Dead silent under gaming load and the modular cables are very easy to route.'},
  {reviewId: 'rev-7', userId: 'usr-7', compId: 'cpu-4', rating: 4, comment: 'Beast for code compilation and productivity. Needs a 360mm AIO though.'},
  {reviewId: 'rev-8', userId: 'usr-8', compId: 'gpu-2', rating: 5, comment: 'Total powerhouse. Maxes out 4K gaming with ray tracing without breaking a sweat.'},
  {reviewId: 'rev-9', userId: 'usr-9', compId: 'case-3', rating: 5, comment: 'The real walnut wood front panel looks stunning in my living room.'},
  {reviewId: 'rev-10', userId: 'usr-10', compId: 'gpu-4', rating: 5, comment: '16GB VRAM at this price point blows away the competition.'}
] AS rData
MATCH (u:User {userId: rData.userId})
MATCH (cp:Component {compId: rData.compId})
MERGE (r:Review {reviewId: rData.reviewId})
SET r.rating = rData.rating,
    r.comment = rData.comment,
    r.createdAt = '2026-02-15T12:00:00Z'
MERGE (u)-[:WROTE]->(r)
MERGE (r)-[:REVIEWS]->(cp);

// ------------------------------------------------------------------------------
// 9. CARTS & ORDERS
// ------------------------------------------------------------------------------
// Add sample builds to user carts
MATCH (u1:User {userId: 'usr-1'})-[:HAS_CART]->(c1:Cart)
MATCH (b1:Build {buildId: 'bld-1001'})
MERGE (c1)-[:CONTAINS_BUILD {quantity: 1, addedAt: '2026-02-25T14:00:00Z'}]->(b1);

MATCH (u2:User {userId: 'usr-2'})-[:HAS_CART]->(c2:Cart)
MATCH (b2:Build {buildId: 'bld-1002'})
MERGE (c2)-[:CONTAINS_BUILD {quantity: 1, addedAt: '2026-02-26T15:00:00Z'}]->(b2);

// Sample Orders placed by users
UNWIND [
  {orderId: 'ord-7001', userId: 'usr-3', date: '2026-02-20', total: 149495, listings: ['lst-1', 'lst-6', 'lst-10', 'lst-17']},
  {orderId: 'ord-7002', userId: 'usr-4', date: '2026-02-24', total: 224495, listings: ['lst-4', 'lst-8', 'lst-13', 'lst-21']}
] AS oData
MATCH (u:User {userId: oData.userId})
MERGE (o:Order {orderId: oData.orderId})
SET o.orderDate = oData.date,
    o.totalAmountINR = oData.total,
    o.status = 'COMPLETED'
MERGE (u)-[:PLACED]->(o)
WITH o, oData
UNWIND oData.listings AS lId
MATCH (lst:Listing {listingId: lId})
MERGE (o)-[:CONTAINS_LISTING {quantity: 1, purchasePriceINR: lst.currentPriceINR}]->(lst);
