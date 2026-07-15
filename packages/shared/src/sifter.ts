export interface SifterDiscountCategory {
  title: string;
  codes: {
    code: string;
    discount: string;
    category?: string;
  }[];
}

export interface SifterCouponCategory {
  title: string;
  entries: {
    label: string;
    description: string;
    copyValue: string;
    category?: string;
    ctaLabel?: string;
    disclosure?: string;
    href?: string;
  }[];
}

export interface SifterQualityCategory {
  name: string;
  audience: "universal" | "men" | "women";
  guidance: string;
  searchTerms: readonly string[];
  verificationChecks: readonly string[];
  avoid: string;
}

export interface SifterMaterialDecoderGroup {
  title: string;
  items: readonly {
    term: string;
    meaning: string;
  }[];
}

export const SIFTER_SUGGESTIONS = [
  "Find heavyweight cotton T-shirts",
  "Best heavyweight hoodies on Temu",
  "Gold chains that won't fade or tarnish",
  "Premium denim jeans for men",
  "Build me a complete casual outfit",
  "Sterling silver earrings for sensitive ears",
] as const;

export const SIFTER_TEMU_FIRST_ORDER_CODE = "ale889115";
export const SIFTER_TEMU_FIRST_ORDER_OFFER_URL =
  "https://temu.to/k/e5m9kmup2rl";

export const SIFTER_DISCOUNT_CODE_GROUPS: SifterDiscountCategory[] = [
  {
    title: "Women's Clothes",
    codes: [
      { code: "FXTS4", discount: "40% - 80% off" },
      { code: "PR4XN43", discount: "40% - 80% off" },
      { code: "SWZS7", discount: "30% - 80% off" },
    ],
  },
  {
    title: "Men's Clothing",
    codes: [
      { code: "UYNA7", discount: "40% - 80% off" },
      { code: "SWZS7", discount: "30% - 80% off" },
      { code: "84CWM", discount: "50% - 70% off" },
      { code: "MG264", discount: "60% off", category: "New account" },
    ],
  },
  {
    title: "Specialty & Deals",
    codes: [
      { code: "QYQQ6", discount: "40% - 90% off", category: "Swimwear" },
      { code: "HDTS2EP", discount: "40% off", category: "Human hair" },
      { code: "GX7HR6W", discount: "40% off", category: "Gym wear" },
      { code: "8CAMN", discount: "40% off", category: "Brand items" },
      { code: "XRX4XAE", discount: "80% off", category: "Vacation items" },
      { code: "DSPR8", discount: "$1.99 items", category: "New users only" },
      { code: "942CV", discount: "Under $1 deals" },
    ],
  },
];

export const SIFTER_TEMU_COUPON_GROUPS: SifterCouponCategory[] = [
  {
    title: "Featured offer",
    entries: [
      {
        label: "Temu first-order coupon bundle",
        description:
          "Use code ale889115 for a ₦100,000 coupon bundle + 30% off your first Temu app order.",
        copyValue: SIFTER_TEMU_FIRST_ORDER_CODE,
        ctaLabel: "Open Temu offer",
        disclosure: "Sifter may earn from this link.",
        href: SIFTER_TEMU_FIRST_ORDER_OFFER_URL,
      },
    ],
  },
  {
    title: "Coupon checks",
    entries: [
      {
        label: "Coupon Center",
        description: "Check Temu's in-app coupon center before checkout.",
        copyValue: "Temu coupon center",
      },
      {
        label: "New user bundle",
        description: "Look for new-account coupon bundles on eligible orders.",
        copyValue: "Temu new user coupon bundle",
        category: "New account",
      },
      {
        label: "Store coupons",
        description: "Open item pages and claim store coupons before adding.",
        copyValue: "Temu store coupons",
      },
    ],
  },
  {
    title: "Deal keywords",
    entries: [
      {
        label: "Lightning deals",
        description: "Time-limited discounts worth checking before checkout.",
        copyValue: "Temu lightning deals",
      },
      {
        label: "Limited-time sale",
        description: "Useful when hunting for cheaper versions of basics.",
        copyValue: "Temu limited time sale",
      },
      {
        label: "Free shipping",
        description: "Pair with material search terms when comparing listings.",
        copyValue: "Temu free shipping",
      },
    ],
  },
];

export const SIFTER_SALE_KEYWORDS = [
  "Clearance",
  "Sale",
  "Summer sale",
  "New in sale",
  "Flash sale",
  "Under 5",
  "Under 10",
  "Last chance",
] as const;

export const SIFTER_QUALITY_CATEGORIES: readonly SifterQualityCategory[] = [
  {
    name: "T-shirts",
    audience: "universal",
    guidance:
      "Cotton weight drives feel and opacity. Strong searches mention 240-300 GSM, combed cotton, mercerized cotton, pique, heavyweight, or 100% cotton.",
    searchTerms: [
      "250 GSM cotton t-shirt",
      "240 GSM combed cotton t-shirt",
      "280 GSM heavyweight cotton t-shirt",
      "300 GSM premium cotton oversized tee",
      "mercerized cotton polo shirt",
      "100% cotton pique polo shirt",
    ],
    verificationChecks: [
      "Listing mentions 240-300 GSM or heavyweight fabric.",
      "Material composition is cotton, combed cotton, mercerized cotton, or pique.",
      "Customer photos show opacity at the chest and shoulders.",
      "Reviews do not repeatedly mention thin fabric or twisting seams.",
    ],
    avoid:
      "Thin polyester fashion tees unless the user explicitly wants gym or quick-dry wear.",
  },
  {
    name: "Jeans",
    audience: "universal",
    guidance:
      "More cotton usually ages better. Temu/SHEIN search handles broad cotton denim terms better than exact fiber percentages, so verify exact ratios inside the listing.",
    searchTerms: [
      "cotton denim straight leg jeans",
      "stretch cotton jeans men",
      "straight leg denim pants cotton",
      "raw denim straight-leg jeans",
      "selvedge denim slim-fit jeans",
      "heavyweight cotton denim jeans",
    ],
    verificationChecks: [
      "Composition is 98-99% cotton for structured denim.",
      "Stretch pairs cotton with only 1-2% elastane or spandex.",
      "Fit details say straight-leg, slim-fit, relaxed, or the requested cut.",
      "Polyester is absent or low enough that denim still reads as cotton denim.",
      "Customer photos show fabric structure instead of thin jegging fabric.",
    ],
    avoid:
      "High polyester denim blends and vague stretch jeans without composition.",
  },
  {
    name: "Body-hug tops",
    audience: "universal",
    guidance:
      "Modal, viscose, ribbed knit, cotton spandex, and cotton-elastane blends help fitted basics feel softer and keep shape.",
    searchTerms: [
      "ribbed modal top",
      "modal cotton fitted t-shirt",
      "viscose knit bodysuit",
      "cotton spandex ribbed tank",
      "heavyweight cotton-elastane top",
    ],
    verificationChecks: [
      "Composition includes modal, viscose, cotton, spandex, or elastane.",
      "Listing photos show rib texture or a dense knit rather than shiny fabric.",
      "Reviews mention shape retention after washing.",
      "Stretch content is present but not described as cheap polyester.",
    ],
    avoid: "Cheap shiny polyester fitted tops that lose shape after washing.",
  },
  {
    name: "Hoodies and sweats",
    audience: "universal",
    guidance:
      "400+ GSM, French terry, heavyweight cotton, and cotton fleece separate real sweats from thin sweatshirt fabric.",
    searchTerms: [
      "400 GSM French terry hoodie",
      "500 GSM heavyweight cotton hoodie",
      "cotton fleece pullover hoodie",
      "heavyweight French terry zip hoodie",
      "heavyweight French terry sweatpants",
    ],
    verificationChecks: [
      "Listing mentions 400 GSM or heavier when GSM is used.",
      "Fabric is French terry, cotton fleece, or heavyweight cotton blend.",
      "Product weight and reviews support a thick garment.",
      "Rib cuffs, hem, and pocket seams look dense in customer photos.",
    ],
    avoid:
      "Lightweight polyester fleece and listings with no fabric weight or composition.",
  },
  {
    name: "Chains, necklaces, earrings, and rings",
    audience: "universal",
    guidance:
      "316L stainless steel, titanium steel, tungsten carbide, 925 sterling silver, PVD plating, and vacuum plating are stronger non-tarnish signals.",
    searchTerms: [
      "316L stainless steel Cuban chain",
      "titanium steel Figaro chain",
      "PVD gold plated rope chain",
      "vacuum plated stainless steel chain",
      "925 sterling silver hoop earrings",
      "tungsten carbide ring",
    ],
    verificationChecks: [
      "Base metal is 316L stainless steel, titanium steel, tungsten carbide, or 925 sterling silver.",
      "Gold color uses PVD or vacuum plating when available.",
      "Reviews mention tarnish resistance after wear.",
      "Sensitive-ear items clearly say hypoallergenic or nickel-safe.",
    ],
    avoid:
      "Generic alloy, vague gold plated jewelry, and suspiciously cheap sterling silver without review proof.",
  },
  {
    name: "Scarves and cold-weather accessories",
    audience: "universal",
    guidance:
      "Natural and semi-natural fibers drape better. Mulberry silk, silk blend, cashmere blend, wool blend, and viscose are stronger search anchors.",
    searchTerms: [
      "mulberry silk scarf",
      "cashmere blend winter scarf",
      "wool blend oversized scarf",
      "silk blend square scarf",
      "viscose lightweight scarf",
    ],
    verificationChecks: [
      "Composition names silk, mulberry silk, cashmere blend, wool blend, or viscose.",
      "Customer photos show drape instead of stiff shiny fabric.",
      "Edges and stitching look clean in close-up photos.",
      "Reviews do not mention scratchy feel, static, or severe shedding.",
    ],
    avoid: "Thin shiny polyester scarves when the user wants a premium look.",
  },
  {
    name: "Loafers, slippers, and leather footwear",
    audience: "universal",
    guidance:
      "Cow leather, full grain leather, suede, rubber outsoles, cork footbeds, and EVA soles are better durability and comfort signals.",
    searchTerms: [
      "cow leather penny loafers",
      "full grain leather loafers",
      "genuine leather loafers rubber outsole",
      "suede leather slippers",
      "cork footbed slippers",
      "EVA sole comfort slippers",
    ],
    verificationChecks: [
      "Upper material says cow leather, full grain leather, suede, or genuine leather.",
      "Sole material is rubber or EVA instead of hard plastic.",
      "Footbed mentions cork, cushioning, or comfort support when relevant.",
      "Review photos show stitching, sole thickness, and leather texture.",
    ],
    avoid: "PU leather marketed as real leather and flat plastic soles.",
  },
  {
    name: "Sneakers",
    audience: "universal",
    guidance:
      "Rubber outsole, EVA midsole, breathable mesh, leather upper, and stitched sole are practical comfort and durability signals.",
    searchTerms: [
      "leather upper rubber outsole sneakers",
      "breathable mesh EVA midsole sneakers",
      "stitched sole leather sneakers",
      "leather upper stitched sole sneakers",
      "breathable mesh running sneakers",
    ],
    verificationChecks: [
      "Upper material is leather, breathable mesh, or the requested performance material.",
      "Outsole is rubber and midsole mentions EVA or cushioning.",
      "Customer photos show stitching or reinforced construction.",
      "Reviews do not repeatedly mention sole separation or hard plastic feel.",
    ],
    avoid: "Glued-only fashion sneakers with unclear sole material.",
  },
  {
    name: "Wristwatches",
    audience: "universal",
    guidance:
      "Sapphire crystal, 316L stainless steel, automatic or mechanical movement, quartz movement, leather straps, and silicone sports straps are useful signals.",
    searchTerms: [
      "sapphire crystal quartz watch",
      "stainless steel automatic watch",
      "316L stainless steel watch",
      "leather strap dress watch",
      "skeleton mechanical watch",
    ],
    verificationChecks: [
      "Case material is 316L stainless steel or another clearly specified metal.",
      "Crystal is sapphire or mineral glass rather than vague glass.",
      "Movement type is listed as quartz, automatic, or mechanical.",
      "Reviews mention timekeeping accuracy and strap quality.",
    ],
    avoid:
      "Alloy cases, luxury wording without movement details, and fake premium claims.",
  },
  {
    name: "Dress and corporate shirts",
    audience: "men",
    guidance:
      "Cotton weave matters. Oxford, poplin, twill, herringbone, non-iron cotton, and 120s cotton are better than generic dress shirt searches.",
    searchTerms: [
      "100% cotton oxford shirt",
      "poplin cotton dress shirt",
      "twill cotton long sleeve shirt",
      "non-iron cotton dress shirt",
      "herringbone cotton shirt",
      "120s cotton dress shirt",
    ],
    verificationChecks: [
      "Fabric is cotton oxford, poplin, twill, herringbone, or 120s cotton.",
      "Composition is 100% cotton or a cotton-rich blend.",
      "Collar, cuff, and button placket look structured in customer photos.",
      "Reviews do not mention transparency or limp fabric.",
    ],
    avoid:
      "Thin polyester corporate shirts unless the user wants easy-care synthetic fabric.",
  },
  {
    name: "Perfumes",
    audience: "universal",
    guidance:
      "EDP is stronger than EDT. Search by concentration and notes such as oud, musk, amber, vanilla, sandalwood, attar, or perfume oil.",
    searchTerms: [
      "EDP long lasting perfume men",
      "EDP long lasting perfume women",
      "oud perfume 100ml",
      "musk perfume attar",
      "amber vanilla perfume",
      "sandalwood perfume oil",
    ],
    verificationChecks: [
      "Concentration is EDP, perfume oil, attar, or clearly stated fragrance type.",
      "Notes match the requested scent family such as oud, musk, amber, vanilla, or sandalwood.",
      "Bottle size and seller photos match the listing title.",
      "Reviews mention longevity rather than only packaging.",
    ],
    avoid: "Vague luxury scent listings with no concentration or note family.",
  },
  {
    name: "Office trousers and blazers",
    audience: "women",
    guidance:
      "Terylene and viscose blends can drape better than thin polyester. Heavy drape wording is useful for workwear trousers and blazers.",
    searchTerms: [
      "high waist drape trousers women",
      "viscose blend blazer",
      "heavy drape wide-leg pants",
      "terylene wide-leg trousers",
      "viscose blend suit blazer",
    ],
    verificationChecks: [
      "Composition includes terylene, viscose blend, rayon blend, or a heavier drape fabric.",
      "Cut details match the requested high-waist, wide-leg, straight, or blazer shape.",
      "Customer photos show opacity and drape rather than clingy thin fabric.",
      "Reviews do not mention severe wrinkling, shine, or see-through fabric.",
    ],
    avoid: "Thin polyester suiting that looks flat or wrinkles poorly.",
  },
  {
    name: "Silk, satin dresses, and dressy tops",
    audience: "women",
    guidance:
      "Mulberry silk, silk blend, acetate satin, and heavyweight satin are better signals for a soft expensive glow.",
    searchTerms: [
      "mulberry silk blend shirt",
      "heavyweight satin slip dress",
      "acetate satin midi dress",
      "silk blend blouse",
      "mulberry silk camisole",
    ],
    verificationChecks: [
      "Composition mentions mulberry silk, silk blend, acetate satin, or heavyweight satin.",
      "Fabric has soft drape in customer photos, not a plastic shine.",
      "Seams, straps, and hems look clean in close-ups.",
      "Reviews do not mention static, cling, or very thin polyester satin.",
    ],
    avoid: "100% polyester satin when the user wants a premium dressy look.",
  },
  {
    name: "Bags and leather goods",
    audience: "universal",
    guidance:
      "Split leather, suede leather, microfiber leather, cow leather, genuine leather, full grain leather, heavy canvas, and thick nylon are stronger bag signals.",
    searchTerms: [
      "split leather tote bag",
      "suede leather shoulder bag",
      "microfiber leather crossbody bag",
      "cow leather handbag",
      "genuine leather laptop bag",
      "full grain leather backpack",
    ],
    verificationChecks: [
      "Material is split leather, suede leather, cow leather, full grain leather, heavy canvas, or thick nylon.",
      "Listing shows lining, zipper, strap, and hardware details.",
      "Customer photos show structure and corner quality.",
      "Reviews do not mention peeling, strong chemical smell, or collapsing shape.",
    ],
    avoid: "Thin PU leather unless reviews confirm structure and durability.",
  },
  {
    name: "Bonus wardrobe staples",
    audience: "universal",
    guidance:
      "For staple outerwear and smart casual pieces, prefer wool blend, heavyweight cotton, linen, cashmere blend, canvas, and well-specified natural fibers.",
    searchTerms: [
      "wool blend overcoat",
      "heavyweight cotton chinos",
      "100% linen shirt",
      "cashmere blend sweater",
      "heavy canvas tote bag",
    ],
    verificationChecks: [
      "Composition names the claimed wool, cotton, linen, cashmere blend, canvas, or natural fiber.",
      "Product weight, weave, or construction details support the quality claim.",
      "Customer photos show structure, drape, and stitching.",
      "Reviews do not repeatedly mention thin fabric, bad seams, or misleading material.",
    ],
    avoid:
      "Listings with only aesthetic keywords and no composition, weight, weave, or construction details.",
  },
] as const;

export const SIFTER_REALITY_CHECKS = [
  "Keywords narrow the pool; they do not prove quality.",
  "Sellers may stuff titles with premium terms the product does not actually meet.",
  "Cross-check the composition tab, product weight, customer photos, and one-star reviews.",
  "Sort by most orders or best selling before chasing the cheapest result.",
  "Treat low-price genuine leather and 925 sterling silver claims as directional signals until reviews and details support them.",
] as const;

export const SIFTER_MATERIAL_DECODER: readonly SifterMaterialDecoderGroup[] = [
  {
    title: "Fabric weight",
    items: [
      {
        term: "180-220 GSM tees",
        meaning: "A good everyday T-shirt range; lower weights can turn sheer.",
      },
      {
        term: "230-280 GSM leggings",
        meaning: "A stronger opacity range for squat-proof stretch fabric.",
      },
      {
        term: "320-420 GSM hoodies",
        meaning: "A useful heavyweight range for sweats and French terry.",
      },
    ],
  },
  {
    title: "Special units",
    items: [
      {
        term: "19 momme silk",
        meaning:
          "Everyday real silk weight for pillowcases, masks, and sleepwear.",
      },
      {
        term: "80 denier tights",
        meaning: "Opaque tights; 20-40 denier is usually sheer.",
      },
      {
        term: "10-12 oz denim",
        meaning: "Proper jeans weight; under 9 oz often behaves like jeggings.",
      },
    ],
  },
  {
    title: "Materials and hardware",
    items: [
      {
        term: "925 / titanium / surgical steel",
        meaning:
          "Searchable jewelry signals that still need review verification.",
      },
      {
        term: "top grain / full grain",
        meaning: "Leather grades stronger than vague genuine leather claims.",
      },
      {
        term: "YKK / SBS zipper",
        meaning: "Hardware brands that often predict bag or boot lifespan.",
      },
    ],
  },
] as const;

const MAX_SELECTED_QUALITY_CATEGORIES = 5;

const FALLBACK_QUALITY_CATEGORY_NAMES = [
  "Bonus wardrobe staples",
  "T-shirts",
  "Jeans",
  "Bags and leather goods",
] as const;

const BROAD_QUALITY_CATEGORY_NAMES = [
  "T-shirts",
  "Jeans",
  "Hoodies and sweats",
  "Sneakers",
  "Bags and leather goods",
] as const;

const BROAD_QUERY_TERMS = [
  "capsule",
  "complete",
  "fit",
  "look",
  "outfit",
  "wardrobe",
] as const;

const STOP_WORDS = new Set([
  "and",
  "are",
  "best",
  "build",
  "can",
  "for",
  "find",
  "from",
  "good",
  "help",
  "item",
  "items",
  "make",
  "need",
  "quality",
  "search",
  "shop",
  "that",
  "the",
  "under",
  "want",
  "with",
  "won",
]);

const normalizeSifterText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const buildSifterTokens = (value: string) =>
  normalizeSifterText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const singularizeSifterToken = (token: string) =>
  token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;

const getCategoryText = (category: SifterQualityCategory) =>
  [
    category.name,
    category.guidance,
    category.searchTerms.join(" "),
    category.verificationChecks.join(" "),
    category.avoid,
  ].join(" ");

const buildSifterTokenSet = (value: string) =>
  new Set(
    buildSifterTokens(value).flatMap((token) => [
      token,
      singularizeSifterToken(token),
    ]),
  );

const getCategoriesByName = (names: readonly string[]) =>
  names
    .map((name) =>
      SIFTER_QUALITY_CATEGORIES.find((category) => category.name === name),
    )
    .filter((category): category is SifterQualityCategory => Boolean(category));

export const selectSifterQualityCategories = (message: string) => {
  const queryTokens = buildSifterTokens(message);

  if (queryTokens.length === 0) {
    return getCategoriesByName(FALLBACK_QUALITY_CATEGORY_NAMES);
  }

  const queryTokenSet = new Set([
    ...queryTokens,
    ...queryTokens.map(singularizeSifterToken),
  ]);
  const normalizedQuery = normalizeSifterText(message);
  const isBroadQuery = BROAD_QUERY_TERMS.some((term) =>
    queryTokenSet.has(term),
  );

  const rankedCategories = SIFTER_QUALITY_CATEGORIES.map((category, index) => {
    const nameTokens = buildSifterTokenSet(category.name);
    const categoryTokens = buildSifterTokenSet(getCategoryText(category));
    const matchedNameTokens = [...queryTokenSet].filter((token) =>
      nameTokens.has(token),
    );
    const matchedTokens = [...queryTokenSet].filter((token) =>
      categoryTokens.has(token),
    );
    const normalizedCategoryName = normalizeSifterText(category.name);
    const phraseMatch = category.searchTerms.some((term) =>
      normalizedQuery.includes(normalizeSifterText(term)),
    );

    return {
      category,
      index,
      score:
        matchedNameTokens.length * 3 +
        matchedTokens.length +
        (normalizedQuery.includes(normalizedCategoryName) ? 4 : 0) +
        (phraseMatch ? 5 : 0),
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const minimumScore = isBroadQuery
    ? 1
    : rankedCategories[0]?.score
      ? Math.max(2, rankedCategories[0].score - 3)
      : 2;
  const selected = rankedCategories
    .filter((entry) => entry.score >= minimumScore)
    .slice(0, MAX_SELECTED_QUALITY_CATEGORIES)
    .map((entry) => entry.category);

  if (selected.length === 0) {
    return getCategoriesByName(FALLBACK_QUALITY_CATEGORY_NAMES);
  }

  if (!isBroadQuery) {
    return selected;
  }

  const byName = new Map(selected.map((category) => [category.name, category]));
  for (const category of getCategoriesByName(BROAD_QUALITY_CATEGORY_NAMES)) {
    if (byName.size >= MAX_SELECTED_QUALITY_CATEGORIES) {
      break;
    }
    byName.set(category.name, category);
  }

  return [...byName.values()];
};

export const buildSifterQualityKnowledgePrompt = (message = "") =>
  [
    "Search grounding rules:",
    "- searchTerms are marketplace candidate-finding queries; they do not prove product quality.",
    "- verificationChecks are the listing details users must confirm before buying.",
    "- Keep GSM in search terms for shirts, hoodies, and sweats because sellers often advertise fabric weight.",
    "- For jeans and exact fiber ratios, use broad cotton denim search terms and put 98-99% cotton or 1-2% elastane/spandex in verificationChecks.",
    "- Jewelry material terms such as 316L stainless steel and 925 sterling silver can stay in searchTerms, but still require review/detail checks.",
    "- Shoes and bags can use material plus construction terms in searchTerms, but genuine leather claims still need verification.",
    "- Each searchTerms item must include a term and a short why explaining why the keyword helps find better candidates.",
    "- Buy the fabric, not the photo: labels, composition, customer photos, and reviews verify the search result.",
    "- Use GSM, momme, denier, denim ounces, leather grades, YKK/SBS hardware, and 925/titanium/surgical steel when relevant.",
    "",
    "Expanded quality knowledge:",
    ...selectSifterQualityCategories(message).map(
      (category) =>
        `- ${category.name} (${category.audience}): ${category.guidance} Candidate search terms: ${category.searchTerms.join("; ")}. Verification checks: ${category.verificationChecks.join("; ")}. Avoid: ${category.avoid}`,
    ),
    "",
    "Material decoder:",
    ...SIFTER_MATERIAL_DECODER.flatMap((group) => [
      `- ${group.title}`,
      ...group.items.map((item) => `  - ${item.term}: ${item.meaning}`),
    ]),
    "",
    "Reality checks:",
    ...SIFTER_REALITY_CHECKS.map((check) => `- ${check}`),
  ].join("\n");

export const buildTemuSearchUrl = (query: string) =>
  `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;

export const buildSheinSearchUrl = (query: string) =>
  `https://www.shein.com/pdsearch/${encodeURIComponent(query)}/`;
