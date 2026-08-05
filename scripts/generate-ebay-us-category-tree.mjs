/**
 * Generates a demo-complete US eBay category tree (compact flat JSON).
 *
 * Source: curated from eBay US marketplace taxonomy (EBAY_US / tree id "0").
 * Real leaf IDs preserved where used by MockEbayAspectsClient; deeper nodes
 * use stable synthetic IDs under each branch for offline demo completeness.
 *
 * Run: node scripts/generate-ebay-us-category-tree.mjs
 */

import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outJson = join(__dirname, "../src/lib/ebay/us-category-tree.json");
const outGz = join(__dirname, "../src/lib/ebay/us-category-tree.json.gz");

/** @typedef {{ name: string, id: string, children?: Node[] }} Node */

let seq = 900000;

function id(preferred) {
  if (preferred) return String(preferred);
  seq += 1;
  return String(seq);
}

/** @param {string} name @param {string|undefined} cid @param {Node[]|undefined} children */
function n(name, cid, children) {
  /** @type {Node} */
  const node = { name, id: id(cid) };
  if (children?.length) node.children = children;
  return node;
}

/** Expand a list of leaf names under a parent with optional id prefix. */
function leaves(names, idPrefix) {
  return names.map((name, i) => n(name, idPrefix ? `${idPrefix}${i + 1}` : undefined));
}

function clothingBranch() {
  return n("Clothing, Shoes & Accessories", "11450", [
    n("Women", "15724_p", [
      n("Women's Clothing", "15724_w", [
        n("Dresses", "63861", leaves(["Casual", "Formal", "Cocktail", "Maxi", "Mini", "Wedding"], "wd")),
        n("Tops & Blouses", "53159", leaves(["Blouses", "T-Shirts", "Tank Tops", "Sweaters", "Hoodies"], "wt")),
        n("Jeans", "11554", leaves(["Skinny", "Straight", "Bootcut", "Wide Leg", "Boyfriend"], "wj")),
        n("Pants", "63863", leaves(["Casual", "Dress", "Leggings", "Capris"], "wp")),
        n("Skirts", "63864", leaves(["Mini", "Midi", "Maxi", "Pencil"], "wsk")),
        n("Coats & Jackets", "63862", leaves(["Blazers", "Puffer", "Leather", "Trench", "Denim"], "wc")),
        n("Activewear", "185101", leaves(["Tops", "Bottoms", "Sets", "Sports Bras"], "wa")),
        n("Swimwear", "63867", leaves(["One-Piece", "Bikini", "Cover-Ups"], "wsw")),
        n("Lingerie & Sleepwear", "11530", leaves(["Bras", "Panties", "Sleepwear", "Shapewear"], "wl")),
        n("Socks & Tights", "163210", leaves(["Socks", "Tights", "Hosiery"], "wso")),
      ]),
      n("Women's Shoes", "3034", [
        n("Boots", "53557", leaves(["Ankle", "Knee-High", "Combat", "Rain"], "wsb")),
        n("Flats & Oxfords", "45333", leaves(["Ballet", "Loafers", "Oxfords"], "wsf")),
        n("Heels", "55793", leaves(["Pumps", "Stilettos", "Wedges", "Block"], "wsh")),
        n("Sandals", "62107", leaves(["Flat", "Heeled", "Sport"], "wss")),
        n("Athletic Shoes", "95672", leaves(["Running", "Training", "Walking", "Fashion Sneakers"], "wsa")),
        n("Slippers", "11525", leaves(["House", "Bootie"], "wsl")),
      ]),
      n("Women's Accessories", "4250", [
        n("Handbags & Bags", "15724", leaves(
          ["Shoulder Bags", "Crossbody Bags", "Totes", "Satchels", "Clutches", "Backpacks", "Wallets"],
          "whb"
        )),
        n("Scarves & Wraps", "45220", leaves(["Scarves", "Shawls", "Wraps"], "wsc")),
        n("Hats", "45230", leaves(["Baseball Caps", "Beanies", "Fedoras", "Sun Hats"], "wh")),
        n("Belts", "3003", leaves(["Leather", "Fabric", "Chain"], "wbe")),
        n("Sunglasses & Eyewear", "179247", leaves(["Sunglasses", "Eyeglasses", "Cases"], "wsg")),
      ]),
    ]),
    n("Men", "1059", [
      n("Men's Clothing", "1059_c", [
        n("Suits & Suit Separates", "3001", leaves(
          ["Suits", "Suit Jackets & Blazers", "Dress Pants", "Vests", "Tuxedos"],
          "ms"
        )),
        n("Shirts", "57990", leaves(["Dress Shirts", "Casual Button-Down", "Polos", "T-Shirts", "Henleys"], "msh")),
        n("Jeans", "11483", leaves(["Slim", "Straight", "Relaxed", "Skinny", "Bootcut"], "mj")),
        n("Pants", "57989", leaves(["Chinos", "Dress", "Cargo", "Joggers"], "mp")),
        n("Shorts", "15689", leaves(["Casual", "Cargo", "Athletic"], "mso")),
        n("Coats & Jackets", "57988", leaves(["Bomber", "Leather", "Puffer", "Parka", "Denim", "Blazer"], "mc")),
        n("Sweaters", "11484", leaves(["Crewneck", "V-Neck", "Cardigan", "Hoodie"], "msw")),
        n("Activewear", "185100", leaves(["Tops", "Bottoms", "Sets"], "ma")),
        n("Swimwear", "15690", leaves(["Trunks", "Board Shorts", "Briefs"], "mswim")),
        n("Socks", "11507", leaves(["Dress", "Athletic", "Casual"], "msock")),
        n("Underwear", "11510", leaves(["Boxers", "Briefs", "Boxer Briefs"], "mu")),
      ]),
      n("Men's Shoes", "93427_p", [
        n("Athletic Shoes", "93427", leaves(["Running", "Training", "Basketball", "Fashion Sneakers"], "msa")),
        n("Boots", "11498", leaves(["Work", "Chelsea", "Chukka", "Hiking"], "msb")),
        n("Casual Shoes", "24087", leaves(["Loafers", "Slip-Ons", "Boat Shoes"], "msc")),
        n("Dress Shoes", "53120", leaves(["Oxfords", "Derby", "Monk Strap"], "msd")),
        n("Sandals & Flip-Flops", "11504", leaves(["Sandals", "Flip-Flops", "Slides"], "mss")),
        n("Slippers", "11505", leaves(["House", "Moccasin"], "msl")),
      ]),
      n("Men's Accessories", "4251", [
        n("Bags", "170083", leaves(["Backpacks", "Messenger", "Briefcases", "Duffels"], "mba")),
        n("Belts", "2993", leaves(["Leather", "Fabric", "Reversible"], "mbe")),
        n("Hats", "52382", leaves(["Baseball Caps", "Beanies", "Fedora"], "mh")),
        n("Ties & Pocket Squares", "15662", leaves(["Neckties", "Bow Ties", "Pocket Squares"], "mt")),
        n("Wallets", "2996", leaves(["Bifold", "Trifold", "Card Holder"], "mw")),
        n("Sunglasses", "179248", leaves(["Aviator", "Wayfarer", "Sport"], "msg")),
      ]),
    ]),
    n("Kids", "260011", [
      n("Boys", "260012", [
        n("Clothing", "260013", leaves(["Tops", "Bottoms", "Sets", "Outerwear", "Activewear"], "kb")),
        n("Shoes", "260014", leaves(["Sneakers", "Boots", "Sandals", "Dress"], "kbs")),
      ]),
      n("Girls", "260015", [
        n("Clothing", "260016", leaves(["Dresses", "Tops", "Bottoms", "Sets", "Outerwear"], "kg")),
        n("Shoes", "260017", leaves(["Sneakers", "Boots", "Sandals", "Flats"], "kgs")),
      ]),
      n("Baby", "260018", leaves(["Onesies", "Sets", "Outerwear", "Accessories"], "kbb")),
    ]),
    n("Unisex", "260020", [
      n("Adult Shoes", "260021", leaves(["Sneakers", "Sandals", "Slippers"], "ua")),
      n("Kids Shoes", "260022", leaves(["Sneakers", "Sandals"], "uk")),
    ]),
  ]);
}

function electronicsBranch() {
  return n("Consumer Electronics", "293", [
    n("TV, Video & Home Audio", "32852", [
      n("TVs", "11071", leaves(["LED", "OLED", "QLED", "Smart TV", "4K", "8K"], "tv")),
      n("Home Audio", "14969", leaves(["Soundbars", "Receivers", "Speakers", "Turntables"], "ha")),
      n("Streaming Media Players", "168058", leaves(["Roku", "Fire TV", "Apple TV", "Chromecast"], "sm")),
      n("DVD & Blu-ray Players", "11724", leaves(["DVD", "Blu-ray", "4K UHD"], "dvd")),
    ]),
    n("Portable Audio & Headphones", "15052", [
      n("Headphones", "112529", leaves(
        ["Over-Ear", "On-Ear", "In-Ear", "Earbuds", "Noise Cancelling", "Gaming"],
        "hp"
      )),
      n("Portable Speakers", "11195", leaves(["Bluetooth", "Wi-Fi", "Waterproof"], "ps")),
      n("MP3 Players", "73839", leaves(["iPod", "Digital Media Player"], "mp3")),
    ]),
    n("Cameras & Photo", "625", [
      n("Digital Cameras", "31388", leaves(["Point & Shoot", "DSLR", "Mirrorless", "Instant"], "cam")),
      n("Lenses & Filters", "28005", leaves(["Lenses", "Filters", "Adapters"], "len")),
      n("Camera Drones", "179697", leaves(["Camera Drones", "Parts"], "dr")),
      n("Tripods & Supports", "30078", leaves(["Tripods", "Monopods", "Gimbals"], "tri")),
    ]),
    n("Vehicle Electronics", "3270", [
      n("Car Audio", "3283", leaves(["Head Units", "Speakers", "Amps", "Subwoofers"], "ca")),
      n("GPS Units", "155226", leaves(["Automotive", "Handheld", "Marine"], "gps")),
      n("Radar Detectors", "39745", leaves(["Radar", "Laser"], "rd")),
    ]),
    n("Virtual Reality", "183067", leaves(["Headsets", "Controllers", "Accessories"], "vr")),
    n("Vintage Electronics", "183500", leaves(["Radios", "Cassette Players", "Other"], "ve")),
  ]);
}

function computersBranch() {
  return n("Computers/Tablets & Networking", "58058", [
    n("Laptops & Netbooks", "175672", leaves(
      ["PC Laptops", "Apple Laptops", "Chromebooks", "Gaming Laptops"],
      "lap"
    )),
    n("Desktops & All-In-Ones", "171957", leaves(["PC Desktops", "Apple Desktops", "All-In-Ones"], "desk")),
    n("Tablets & eBook Readers", "171485", leaves(["iPad", "Android Tablets", "Kindle", "eReaders"], "tab")),
    n("Computer Components & Parts", "175673", [
      n("CPUs/Processors", "164", leaves(["Intel", "AMD"], "cpu")),
      n("Graphics/Video Cards", "27386", leaves(["NVIDIA", "AMD", "Other"], "gpu")),
      n("Motherboards", "1244", leaves(["Intel", "AMD"], "mb")),
      n("Memory (RAM)", "170083_ram", leaves(["DDR4", "DDR5", "Laptop RAM"], "ram")),
      n("Hard Drives & SSDs", "165", leaves(["HDD", "SSD", "NVMe", "External"], "hdd")),
      n("Power Supplies", "42017", leaves(["Modular", "Non-Modular"], "psu")),
      n("Cases & Chassis", "42014", leaves(["ATX", "Micro-ATX", "Mini-ITX"], "case")),
    ]),
    n("Monitors & Projectors", "162483", leaves(["Computer Monitors", "Projectors", "Mounts"], "mon")),
    n("Printers & Scanners", "171961", leaves(["Inkjet", "Laser", "All-In-One", "Scanners"], "prt")),
    n("Networking", "11176", leaves(["Routers", "Switches", "Wi-Fi Extenders", "Modems", "Cables"], "net")),
    n("Keyboards & Mice", "3676", leaves(["Keyboards", "Mice", "Trackpads", "Combos"], "km")),
    n("Software", "18793", leaves(["Operating Systems", "Office", "Security", "Games"], "sw")),
  ]);
}

function phonesBranch() {
  return n("Cell Phones & Accessories", "15032", [
    n("Cell Phones & Smartphones", "9355", leaves(
      ["Apple", "Samsung", "Google", "Motorola", "Other"],
      "ph"
    )),
    n("Smart Watches", "178893", leaves(["Apple Watch", "Samsung", "Fitbit", "Garmin", "Other"], "swatch")),
    n("Cases, Covers & Skins", "20349", leaves(["Phone Cases", "Screen Protectors", "Skins"], "pcase")),
    n("Chargers & Cradles", "123422", leaves(["Wall Chargers", "Car Chargers", "Wireless", "Cables"], "pch")),
    n("Headphones & Headsets", "80077", leaves(["Wired", "Wireless", "Bluetooth"], "phead")),
    n("Smart Watch Accessories", "178894", leaves(["Bands", "Chargers", "Cases"], "swa")),
  ]);
}

function jewelryBranch() {
  return n("Jewelry & Watches", "281", [
    n("Fashion Jewelry", "10968_p", [
      n("Necklaces & Pendants", "10968", leaves(["Pendants", "Chains", "Chokers", "Lockets"], "jn")),
      n("Earrings", "10985", leaves(["Studs", "Hoops", "Dangles", "Clip-On"], "je")),
      n("Bracelets", "10994", leaves(["Bangles", "Cuffs", "Charm", "Tennis"], "jb")),
      n("Rings", "10975", leaves(["Statement", "Stackable", "Midi"], "jr")),
      n("Brooches & Pins", "10986", leaves(["Brooches", "Pins", "Clips"], "jbr")),
    ]),
    n("Fine Jewelry", "4196", [
      n("Rings", "67726", leaves(["Engagement", "Wedding Bands", "Fashion", "Men's"], "fjr")),
      n("Necklaces & Pendants", "67725", leaves(["Diamond", "Gold", "Silver", "Gemstone"], "fjn")),
      n("Earrings", "67724", leaves(["Studs", "Hoops", "Drops"], "fje")),
      n("Bracelets", "67723", leaves(["Tennis", "Bangle", "Charm"], "fjb")),
    ]),
    n("Watches", "14324", [
      n("Wristwatches", "31387", leaves(["Men", "Women", "Unisex", "Kids"], "ww")),
      n("Pocket Watches", "260325", leaves(["Mechanical", "Quartz"], "pw")),
      n("Watch Accessories", "260326", leaves(["Bands", "Boxes", "Tools"], "wa")),
    ]),
    n("Vintage & Antique Jewelry", "48579", leaves(["Victorian", "Art Deco", "Mid-Century", "Costume"], "vj")),
    n("Loose Diamonds & Gemstones", "491", leaves(["Diamonds", "Colored Gemstones", "Pearls"], "ld")),
  ]);
}

function collectiblesBranch() {
  return n("Collectibles", "1", [
    n("Decorative Collectibles", "137_p", [
      n("Figurines", "137", leaves(["Porcelain", "Resin", "Crystal", "Metal", "Character"], "fig")),
      n("Plates", "1403", leaves(["Collector Plates", "Decorative"], "plt")),
      n("Vases", "1404", leaves(["Ceramic", "Glass", "Crystal"], "vas")),
    ]),
    n("Comics", "63", leaves(["Modern Age", "Silver Age", "Golden Age", "Graphic Novels", "Manga"], "com")),
    n("Trading Cards", "259099", [
      n("Sports Trading Cards", "212", leaves(["Baseball", "Basketball", "Football", "Hockey", "Soccer"], "stc")),
      n("Non-Sport Trading Cards", "183050", leaves(["Pokemon", "Magic", "Yu-Gi-Oh", "Other"], "nstc")),
    ]),
    n("Souvenirs & Travel Memorabilia", "165800", leaves(["Magnets", "Keychains", "Postcards", "Pins"], "sou")),
    n("Vintage Advertising", "13905", leaves(["Signs", "Tins", "Posters"], "vad")),
    n("Militaria", "140", leaves(["WWII", "Modern", "Insignia", "Uniforms"], "mil")),
    n("Autographs", "14429", leaves(["Sports", "Entertainment", "Historical"], "auto")),
    n("Disneyana", "13877", leaves(["Pins", "Figurines", "Plush", "Other"], "dis")),
  ]);
}

function homeBranch() {
  return n("Home & Garden", "11700", [
    n("Furniture", "3197", [
      n("Living Room", "38208", leaves(["Sofas", "Chairs", "Coffee Tables", "TV Stands", "Bookcases"], "lr")),
      n("Bedroom", "3199", leaves(["Beds", "Dressers", "Nightstands", "Mattresses"], "br")),
      n("Dining", "38207", leaves(["Tables", "Chairs", "Sideboards"], "dr")),
      n("Office", "61677", leaves(["Desks", "Office Chairs", "Filing"], "of")),
      n("Outdoor Furniture", "20444", leaves(["Patio Sets", "Lounge", "Umbrellas"], "outf")),
    ]),
    n("Kitchen, Dining & Bar", "20625", [
      n("Small Kitchen Appliances", "20667", leaves(
        ["Coffee Makers", "Blenders", "Toasters", "Mixers", "Air Fryers", "Microwaves"],
        "ska"
      )),
      n("Cookware", "20626", leaves(["Pots", "Pans", "Bakeware", "Knives"], "cook")),
      n("Dinnerware & Serveware", "36025", leaves(["Plates", "Bowls", "Cups", "Serving"], "din")),
      n("Drinkware", "36026", leaves(["Glasses", "Mugs", "Tumblers", "Wine Glasses"], "dw")),
      n("Kitchen Storage", "20668", leaves(["Canisters", "Racks", "Organizers"], "kst")),
    ]),
    n("Bedding", "20444_bed", leaves(["Sheets", "Comforters", "Pillows", "Blankets", "Mattress Pads"], "bed")),
    n("Bath", "26677", leaves(["Towels", "Shower Curtains", "Bath Mats", "Accessories"], "bath")),
    n("Home Décor", "10033", [
      n("Wall Décor", "360", leaves(["Art Prints", "Posters", "Mirrors", "Clocks"], "wall")),
      n("Candles & Holders", "46778", leaves(["Candles", "Holders", "Diffusers"], "cand")),
      n("Rugs & Carpets", "20571", leaves(["Area Rugs", "Runners", "Doormats"], "rug")),
      n("Lamps & Lighting", "20697", leaves(["Table Lamps", "Floor Lamps", "Ceiling", "Bulbs"], "lamp")),
      n("Curtains & Window Treatments", "20563", leaves(["Curtains", "Blinds", "Shades"], "cur")),
    ]),
    n("Major Appliances", "20710", leaves(["Refrigerators", "Washers", "Dryers", "Dishwashers", "Ranges"], "maj")),
    n("Tools & Workshop Equipment", "631", [
      n("Power Tools", "3246", leaves(["Drills", "Saws", "Sanders", "Impact Drivers"], "pt")),
      n("Hand Tools", "3245", leaves(["Wrenches", "Screwdrivers", "Hammers", "Pliers"], "ht")),
      n("Measuring Tools", "3247", leaves(["Levels", "Tape Measures", "Multimeters"], "mt")),
      n("Tool Storage", "3248", leaves(["Tool Boxes", "Cabinets", "Bags"], "ts")),
    ]),
    n("Yard, Garden & Outdoor Living", "159912", [
      n("Garden Tools", "29518", leaves(["Hand Tools", "Watering", "Pruning"], "gt")),
      n("Plants & Seeds", "181073", leaves(["Seeds", "Live Plants", "Bulbs"], "pl")),
      n("Grills & Outdoor Cooking", "184593", leaves(["Gas Grills", "Charcoal", "Smokers", "Accessories"], "gr")),
      n("Lawn Mowers", "29521", leaves(["Push", "Riding", "Robotic"], "lm")),
    ]),
    n("Household Supplies & Cleaning", "299", leaves(["Vacuums", "Cleaning Tools", "Laundry", "Storage"], "hs")),
  ]);
}

function sportsBranch() {
  return n("Sporting Goods", "888", [
    n("Exercise & Fitness", "15273", leaves(
      ["Cardio Equipment", "Strength Training", "Yoga", "Weights", "Fitness Trackers"],
      "fit"
    )),
    n("Team Sports", "159049", [
      n("Football", "20862", leaves(["Balls", "Helmets", "Pads", "Gloves"], "fb")),
      n("Basketball", "20863", leaves(["Balls", "Hoops", "Shoes"], "bb")),
      n("Baseball & Softball", "20864", leaves(["Bats", "Gloves", "Balls", "Protective"], "bsb")),
      n("Soccer", "20865", leaves(["Balls", "Cleats", "Goals", "Shin Guards"], "soc")),
      n("Hockey", "20866", leaves(["Sticks", "Skates", "Pads", "Pucks"], "hoc")),
    ]),
    n("Outdoor Sports", "159048", [
      n("Camping & Hiking", "16034", leaves(["Tents", "Sleeping Bags", "Backpacks", "Cookware"], "camp")),
      n("Cycling", "7294", leaves(["Bikes", "Helmets", "Parts", "Apparel"], "cyc")),
      n("Fishing", "1492", leaves(["Rods", "Reels", "Lures", "Tackle"], "fish")),
      n("Hunting", "7301", leaves(["Optics", "Apparel", "Accessories"], "hunt")),
      n("Water Sports", "159053", leaves(["Kayaks", "Paddleboards", "Life Jackets", "Swim"], "water")),
      n("Winter Sports", "159054", leaves(["Skis", "Snowboards", "Ice Skates", "Apparel"], "winter")),
    ]),
    n("Golf", "1513", leaves(["Clubs", "Balls", "Bags", "Apparel", "GPS"], "golf")),
    n("Tennis & Racquet Sports", "159045", leaves(["Rackets", "Balls", "Apparel", "Bags"], "ten")),
  ]);
}

function toysBranch() {
  return n("Toys & Hobbies", "220", [
    n("Action Figures & Accessories", "246", leaves(["Modern", "Vintage", "Playsets"], "af")),
    n("Building Toys", "183446", leaves(["LEGO", "Mega Bloks", "Other Building Sets"], "bt")),
    n("Dolls & Bears", "237", leaves(["Fashion Dolls", "Baby Dolls", "Teddy Bears", "Accessories"], "db")),
    n("Games", "233", leaves(["Board Games", "Card Games", "Puzzles", "Electronic Games"], "gm")),
    n("Model Trains", "190", leaves(["HO Scale", "N Scale", "O Scale", "Accessories"], "mt")),
    n("RC Model Vehicles", "2562", leaves(["Cars", "Planes", "Helicopters", "Boats", "Parts"], "rc")),
    n("Stuffed Animals", "436", leaves(["Plush", "Character", "Vintage"], "sa")),
    n("Vintage & Antique Toys", "460", leaves(["Diecast", "Wind-Up", "Other"], "vt")),
    n("Arts & Crafts", "14339_toys", leaves(["Drawing", "Painting", "Kits", "Beads"], "ac")),
  ]);
}

function booksBranch() {
  return n("Books & Magazines", "267", [
    n("Books", "261186", [
      n("Fiction & Literature", "377", leaves(["Novels", "Short Stories", "Poetry", "Classics"], "bf")),
      n("Children & Young Adults", "279", leaves(["Picture Books", "Chapter Books", "YA"], "bc")),
      n("Textbooks & Education", "2228", leaves(["College", "K-12", "Study Guides"], "bt")),
      n("Nonfiction", "171228", leaves(["Biography", "History", "Self-Help", "Business", "Science"], "bn")),
      n("Comics & Graphic Novels", "259109", leaves(["Comics", "Manga", "Graphic Novels"], "bcg")),
    ]),
    n("Magazines", "280", leaves(["Fashion", "Sports", "News", "Hobby", "Vintage"], "mag")),
    n("Audiobooks", "29792", leaves(["CD", "Digital", "Cassette"], "ab")),
    n("Accessories", "45113", leaves(["Bookmarks", "Book Lights", "Covers"], "ba")),
  ]);
}

function mediaBranch() {
  return [
    n("DVDs & Movies", "11232", [
      n("DVDs & Blu-ray Discs", "617", leaves(["DVD", "Blu-ray", "4K UHD", "Box Sets"], "mov")),
      n("VHS Tapes", "309", leaves(["Movies", "TV", "Other"], "vhs")),
      n("Film Stock", "60327", leaves(["8mm", "16mm", "35mm"], "film")),
    ]),
    n("Music", "11233", [
      n("CDs", "176984", leaves(["Album", "Single", "Box Set"], "cd")),
      n("Vinyl Records", "176985", leaves(["LP", "7\"", "12\"", "Box Set"], "vin")),
      n("Cassettes", "176983", leaves(["Album", "Single"], "cas")),
      n("Music Memorabilia", "2329", leaves(["Autographs", "Posters", "Apparel"], "mm")),
    ]),
    n("Video Games & Consoles", "1249", [
      n("Video Games", "139973", leaves(
        ["Sony PlayStation", "Microsoft Xbox", "Nintendo", "PC Games", "Retro"],
        "vg"
      )),
      n("Video Game Consoles", "139971", leaves(
        ["PlayStation", "Xbox", "Nintendo Switch", "Retro Consoles"],
        "vgc"
      )),
      n("Video Game Accessories", "54968", leaves(["Controllers", "Headsets", "Cases", "Cables"], "vga")),
      n("Prepaid Gaming Cards", "156231", leaves(["Xbox", "PlayStation", "Nintendo", "Steam"], "vgp")),
    ]),
  ];
}

function travelBranch() {
  return n("Travel", "3252", [
    n("Luggage", "181378", [
      n("Backpacks", "181379", leaves(
        ["Daypacks", "Hiking Backpacks", "School Backpacks", "Travel Backpacks", "Mini Backpacks"],
        "bp"
      )),
      n("Travel Duffel Bags", "261953", leaves(["Weekenders", "Gym Bags", "Carryalls"], "duf")),
      n("Carry-On Luggage", "181380", leaves(["Softside", "Hardside", "Spinner"], "co")),
      n("Checked Luggage", "181381", leaves(["Softside", "Hardside", "Sets"], "cl")),
      n("Garment Bags", "181382", leaves(["Hanging", "Foldable"], "gb")),
      n("Luggage Sets", "181383", leaves(["2-Piece", "3-Piece", "4-Piece"], "ls")),
      n("Laptop Bags", "181384", leaves(["Briefcases", "Messenger", "Sleeves"], "lb")),
    ]),
    n("Luggage Accessories", "181385", leaves(["Tags", "Locks", "Scales", "Covers", "Organizers"], "la")),
    n("Maps & Atlases", "1188", leaves(["Road Maps", "Travel Guides", "Atlases"], "map")),
    n("Travel Accessories", "181386", leaves(["Neck Pillows", "Adapters", "Toiletry Bags", "Passport Holders"], "ta")),
  ]);
}

function otherRoots() {
  return [
    n("Antiques", "20081", [
      n("Furniture", "20082", leaves(["Chairs", "Tables", "Cabinets", "Desks"], "anf")),
      n("Silver", "2210", leaves(["Flatware", "Hollowware", "Jewelry"], "ans")),
      n("Decorative Arts", "20086", leaves(["Clocks", "Mirrors", "Frames"], "and")),
      n("Asian Antiques", "20087", leaves(["Chinese", "Japanese", "Other Asian"], "ana")),
      n("Architectural & Garden", "4707", leaves(["Hardware", "Lighting", "Garden"], "anaa")),
    ]),
    n("Art", "550", [
      n("Paintings", "551", leaves(["Oil", "Acrylic", "Watercolor"], "artp")),
      n("Prints", "360", leaves(["Lithographs", "Screen Prints", "Posters"], "artpr")),
      n("Photographs", "552", leaves(["Fine Art", "Vintage", "Digital"], "artph")),
      n("Sculptures", "553", leaves(["Bronze", "Stone", "Mixed Media"], "arts")),
      n("Art Supplies", "14339_art", leaves(["Paints", "Brushes", "Canvas", "Drawing"], "arts2")),
    ]),
    n("Baby", "2984", [
      n("Baby Clothing", "134751", leaves(["Bodysuits", "Sets", "Outerwear", "Shoes"], "baby")),
      n("Feeding", "20433", leaves(["Bottles", "High Chairs", "Bibs"], "feed")),
      n("Nursery Furniture", "66692", leaves(["Cribs", "Changing Tables", "Gliders"], "nur")),
      n("Strollers & Travel Gear", "66697", leaves(["Strollers", "Car Seats", "Carriers"], "str")),
      n("Toys for Baby", "19071", leaves(["Rattles", "Activity Gyms", "Plush"], "btoy")),
    ]),
    n("Business & Industrial", "12576", [
      n("Healthcare & Lab", "11815", leaves(["Lab Equipment", "Medical", "Dental"], "hl")),
      n("Office Equipment", "25398", leaves(["Copiers", "Shredders", "Projectors"], "oe")),
      n("Restaurant & Food Service", "11874", leaves(["Cooking Equipment", "Refrigeration", "Furniture"], "rfs")),
      n("Test & Measurement", "58171", leaves(["Multimeters", "Oscilloscopes", "Calibrators"], "tm")),
      n("Heavy Equipment", "257887", leaves(["Construction", "Agricultural", "Parts"], "he")),
    ]),
    n("Cameras & Photo", "625_root", [
      n("Film Photography", "15200", leaves(["35mm Cameras", "Film", "Darkroom"], "filmcam")),
      n("Flashes & Lighting", "29997", leaves(["Speedlights", "Studio Lights", "Modifiers"], "flash")),
      n("Camera & Photo Accessories", "15273_cam", leaves(["Bags", "Batteries", "Straps", "Cleaning"], "cpa")),
      n("Binoculars & Telescopes", "28179", leaves(["Binoculars", "Telescopes", "Spotting Scopes"], "bin")),
    ]),
    n("Coins & Paper Money", "11116", [
      n("Coins", "253", leaves(["US Coins", "World Coins", "Bullion", "Error Coins"], "coin")),
      n("Paper Money", "3412", leaves(["US Currency", "World Currency", "Obsolete"], "pm")),
      n("Exonumia", "39482", leaves(["Tokens", "Medals", "Elongated"], "exo")),
    ]),
    n("Crafts", "14339", [
      n("Sewing", "160677", leaves(["Machines", "Fabric", "Notions", "Patterns"], "sew")),
      n("Scrapbooking & Paper Crafts", "11788", leaves(["Paper", "Stickers", "Albums", "Dies"], "scrap")),
      n("Bead Art & Jewelry Making", "31762", leaves(["Beads", "Findings", "Tools", "Wire"], "bead")),
      n("Needlecraft", "160683", leaves(["Knitting", "Crochet", "Embroidery", "Cross Stitch"], "need")),
      n("Painting & Drawing", "11783", leaves(["Paints", "Brushes", "Paper", "Canvas"], "paint")),
    ]),
    n("Dolls & Bears", "237_root", [
      n("Dolls", "238", leaves(["Barbie", "American Girl", "Porcelain", "Fashion"], "doll")),
      n("Teddy Bears", "386", leaves(["Steiff", "Modern", "Vintage"], "teddy")),
      n("Dollhouse Miniatures", "1202", leaves(["Furniture", "Houses", "Accessories"], "dh")),
    ]),
    n("Entertainment Memorabilia", "45100", [
      n("Movie Memorabilia", "57", leaves(["Posters", "Props", "Autographs", "Lobby Cards"], "mmem")),
      n("Music Memorabilia", "2329_em", leaves(["Autographs", "Posters", "Instruments"], "musmem")),
      n("TV Memorabilia", "142", leaves(["Autographs", "Props", "Photos"], "tvmem")),
      n("Theater Memorabilia", "236", leaves(["Playbills", "Posters", "Programs"], "thmem")),
    ]),
    n("Gift Cards & Coupons", "172008", leaves(
      ["eBay Gift Cards", "Retail Gift Cards", "Restaurant", "Travel"],
      "gc"
    )),
    n("Health & Beauty", "26395", [
      n("Makeup", "11854", leaves(["Face", "Eyes", "Lips", "Sets"], "mu")),
      n("Skin Care", "11863", leaves(["Cleansers", "Moisturizers", "Serums", "Masks"], "sk")),
      n("Hair Care & Styling", "11849", leaves(["Shampoo", "Conditioner", "Styling Tools", "Color"], "hc")),
      n("Fragrance", "11848", leaves(["Women", "Men", "Unisex", "Sets"], "fr")),
      n("Health Care", "67588", leaves(["Vitamins", "First Aid", "Monitors", "Mobility"], "hcare")),
      n("Massage", "36447", leaves(["Massagers", "Oils", "Tables"], "mass")),
      n("Salon & Spa Equipment", "177013", leaves(["Furniture", "Tools", "Supplies"], "spa")),
      n("Vision Care", "31414", leaves(["Contact Lenses", "Solutions", "Eyeglasses"], "vis")),
    ]),
    n("Musical Instruments & Gear", "619", [
      n("Guitars & Basses", "3858", leaves(["Electric", "Acoustic", "Bass", "Amplifiers", "Effects"], "guit")),
      n("Keyboards & Pianos", "180012", leaves(["Digital Pianos", "Synths", "Acoustic Pianos"], "keys")),
      n("Drums & Percussion", "10181", leaves(["Acoustic Kits", "Electronic", "Cymbals", "Hardware"], "drum")),
      n("Pro Audio", "180014", leaves(["Microphones", "Mixers", "Interfaces", "Monitors"], "proa")),
      n("Wind & Woodwind", "16212", leaves(["Saxophone", "Flute", "Clarinet", "Trumpet"], "wind")),
      n("String Instruments", "10178", leaves(["Violin", "Cello", "Ukulele", "Mandolin"], "str")),
      n("DJ Equipment", "48458", leaves(["Controllers", "Turntables", "Mixers", "Headphones"], "dj")),
    ]),
    n("Pet Supplies", "1281", [
      n("Dog Supplies", "20737", leaves(["Food", "Toys", "Beds", "Collars", "Apparel"], "dog")),
      n("Cat Supplies", "20738", leaves(["Food", "Litter", "Toys", "Trees", "Beds"], "cat")),
      n("Fish & Aquariums", "20754", leaves(["Tanks", "Filters", "Decor", "Food"], "fishp")),
      n("Bird Supplies", "20742", leaves(["Cages", "Food", "Toys", "Perches"], "bird")),
      n("Small Animal Supplies", "20747", leaves(["Cages", "Food", "Bedding", "Toys"], "smal")),
      n("Reptile Supplies", "1285", leaves(["Terrariums", "Heating", "Food", "Decor"], "rep")),
    ]),
    n("Pottery & Glass", "870", [
      n("Decorative Pottery", "4733", leaves(["Vases", "Bowls", "Figurines"], "pot")),
      n("Art Glass", "50693", leaves(["Vases", "Paperweights", "Sculptures"], "agl")),
      n("Glassware", "28059", leaves(["Drinking", "Serving", "Decorative"], "gw")),
      n("China & Dinnerware", "2622", leaves(["Sets", "Plates", "Cups"], "china")),
    ]),
    n("Specialty Services", "316", leaves(
      ["Artistic Services", "Custom Manufacturing", "Restoration", "Printing"],
      "ss"
    )),
    n("Sports Mem, Cards & Fan Shop", "64482", [
      n("Fan Apparel & Souvenirs", "24409", leaves(["Jerseys", "Hats", "Flags", "Pins"], "fan")),
      n("Trading Cards", "259099_sm", leaves(["Baseball", "Basketball", "Football", "Hockey"], "stc2")),
      n("Autographs-Original", "50116", leaves(["Balls", "Photos", "Jerseys", "Cards"], "autog")),
      n("Game Used Memorabilia", "50118", leaves(["Jerseys", "Equipment", "Balls"], "gum")),
    ]),
    n("Stamps", "260", [
      n("United States", "261", leaves(["Mint", "Used", "Plate Blocks", "Covers"], "usst")),
      n("Worldwide", "181162", leaves(["Europe", "Asia", "Americas", "Africa"], "wwst")),
      n("Topical", "181163", leaves(["Animals", "Sports", "Space", "Art"], "topst")),
      n("Philatelic Supplies", "181164", leaves(["Albums", "Mounts", "Catalogs"], "phil")),
    ]),
    n("Tickets & Experiences", "1305", leaves(
      ["Sports", "Concerts", "Theater", "Theme Parks", "Travel Experiences"],
      "tix"
    )),
    n("Everything Else", "99", [
      n("Adult Only", "319", leaves(["Adult", "Other"], "adult")),
      n("Funeral & Cemetery", "3143", leaves(["Urns", "Markers", "Other"], "fun")),
      n("Genealogy", "261186_g", leaves(["Records", "Charts", "Books"], "gen")),
      n("Information Products", "3144", leaves(["eBooks", "Software", "Other"], "info")),
      n("Metaphysical", "19266", leaves(["Crystals", "Tarot", "Other"], "meta")),
      n("Personal Development", "102535", leaves(["Courses", "Books", "Other"], "pd")),
      n("Religious Products & Supplies", "102540", leaves(["Books", "Jewelry", "Decor"], "rel")),
      n("Weird Stuff", "3669", leaves(["Oddities", "Novelty", "Other"], "weird")),
    ]),
  ];
}

/** @type {Node} */
const root = {
  name: "Root",
  id: "0",
  children: [
    clothingBranch(),
    electronicsBranch(),
    computersBranch(),
    phonesBranch(),
    jewelryBranch(),
    collectiblesBranch(),
    homeBranch(),
    sportsBranch(),
    toysBranch(),
    booksBranch(),
    ...mediaBranch(),
    travelBranch(),
    ...otherRoots(),
  ],
};

/**
 * Flatten nested tree to compact rows: [id, name, parentId|null, leaf(0|1)]
 * @param {Node} node
 * @param {string|null} parentId
 * @param {Array} rows
 * @param {Set<string>} seen
 */
function flatten(node, parentId, rows, seen) {
  if (seen.has(node.id)) {
    // Avoid duplicate ids (Cameras appears under CE and as root alias)
    const alt = `${node.id}_${rows.length}`;
    node = { ...node, id: alt };
  }
  seen.add(node.id);
  const kids = node.children ?? [];
  const isLeaf = kids.length === 0;
  if (node.id !== "0") {
    rows.push([node.id, node.name, parentId, isLeaf ? 1 : 0]);
  }
  for (const child of kids) {
    flatten(child, node.id === "0" ? null : node.id, rows, seen);
  }
}

const rows = [];
flatten(root, null, rows, new Set());

const payload = {
  marketplaceId: "EBAY_US",
  categoryTreeId: "0",
  /** Bundled snapshot for mock/demo; live mode may refresh via Taxonomy API. */
  source: "vendored-demo-snapshot",
  version: "2026-08-04-demo",
  generatedAt: new Date().toISOString(),
  note:
    "Compact US eBay category tree for offline demo. Prefer live Commerce Taxonomy getCategoryTree when EBAY_* credentials are set. Real leaf IDs preserved for aspect-mock categories (3001, 15724, 112529, 10968, 93427, 137, 181378, 181379, 261953).",
  /** @type {Array<[string, string, string|null, 0|1]>} */
  nodes: rows,
};

const json = JSON.stringify(payload);
writeFileSync(outJson, json);
writeFileSync(outGz, gzipSync(Buffer.from(json)));

const leavesCount = rows.filter((r) => r[3] === 1).length;
const branches = rows.filter((r) => r[3] === 0).length;
console.log(
  `Wrote ${rows.length} nodes (${branches} branch, ${leavesCount} leaf) → ${outJson} (${(json.length / 1024).toFixed(1)} KB) + .gz (${(gzipSync(Buffer.from(json)).length / 1024).toFixed(1)} KB)`
);
