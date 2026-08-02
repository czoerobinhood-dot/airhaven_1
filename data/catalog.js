/*
 * AirHaven catalog — inflatable water parks for kids and inflatable car beds.
 * Still shaped after Saleor's commerce domain model (see the type mapping
 * below); only the merchandise changed.
 *
 *   Channel / Warehouse / Attribute / ProductType / Category / Collection
 *   Product / ProductChannelListing / ProductVariant
 *   ProductVariantChannelListing / Stock / ProductMedia / Money
 *
 * Two primary collections ("water-play", "car-travel") drive the top-level
 * category navigation; `sortOrder` is the position inside each list.
 *
 * Deviations kept deliberate so the page stays a dependency-free static site:
 *   - relations are referenced by slug instead of by global ID
 *   - `description` is plain text rather than Saleor's EditorJS JSON blob
 *
 * Prices are demo values. No order is ever submitted.
 */
(function () {
  'use strict';

  const gid = (type, pk) => btoa(`${type}:${pk}`);
  const money = (amount, currency) => ({ amount, currency });

  const CA = 'canada-cad';
  const US = 'united-states-usd';

  const channels = [
    { id: gid('Channel', 1), slug: CA, name: 'Canada', currencyCode: 'CAD', defaultCountry: { code: 'CA', country: 'Canada' }, isActive: true },
    { id: gid('Channel', 2), slug: US, name: 'United States', currencyCode: 'USD', defaultCountry: { code: 'US', country: 'United States' }, isActive: true }
  ];

  const warehouses = [
    { id: gid('Warehouse', 1), slug: 'mississauga-on', name: 'Mississauga, ON' },
    { id: gid('Warehouse', 2), slug: 'richmond-bc', name: 'Richmond, BC' }
  ];

  const attributes = [
    { id: gid('Attribute', 1), slug: 'brand', name: 'Brand', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 2), slug: 'age-range', name: 'Age Range', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 3), slug: 'capacity', name: 'Capacity', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 4), slug: 'inflated-size', name: 'Inflated Size', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 5), slug: 'packed-size', name: 'Packed Size', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 6), slug: 'material', name: 'Material', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 7), slug: 'pump-included', name: 'Pump Included', type: 'PRODUCT_TYPE', inputType: 'BOOLEAN' },
    { id: gid('Attribute', 8), slug: 'certification', name: 'Safety Certification', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 9), slug: 'weight-capacity', name: 'Weight Capacity', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 10), slug: 'setup-time', name: 'Setup Time', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    // Variant-level attributes
    { id: gid('Attribute', 11), slug: 'size', name: 'Size', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 12), slug: 'car-fit', name: 'Vehicle Fit', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 13), slug: 'power-source', name: 'Power Source', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 14), slug: 'play-zones', name: 'Play Zones', type: 'PRODUCT_TYPE', inputType: 'MULTISELECT' },
    { id: gid('Attribute', 15), slug: 'product-weight', name: 'Product Weight', type: 'PRODUCT_TYPE', inputType: 'NUMERIC', unit: 'KILOGRAM' },
    { id: gid('Attribute', 16), slug: 'blower', name: 'Blower', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 17), slug: 'usage', name: 'Use', type: 'PRODUCT_TYPE', inputType: 'DROPDOWN' },
    { id: gid('Attribute', 18), slug: 'safety-features', name: 'Safety', type: 'PRODUCT_TYPE', inputType: 'MULTISELECT' },
    { id: gid('Attribute', 19), slug: 'in-the-box', name: 'In the Box', type: 'PRODUCT_TYPE', inputType: 'MULTISELECT' }
  ];

  const productTypes = [
    {
      id: gid('ProductType', 1),
      slug: 'water-park',
      name: 'Inflatable Water Park',
      hasVariants: true,
      isShippingRequired: true,
      productAttributes: [
        'brand', 'usage', 'play-zones', 'age-range', 'capacity', 'weight-capacity',
        'inflated-size', 'packed-size', 'product-weight', 'material',
        'blower', 'setup-time', 'certification', 'safety-features', 'in-the-box'
      ],
      variantAttributes: ['size']
    },
    {
      id: gid('ProductType', 5),
      slug: 'bounce-house',
      name: 'Bounce House',
      hasVariants: true,
      isShippingRequired: true,
      productAttributes: [
        'brand', 'usage', 'play-zones', 'age-range', 'capacity', 'weight-capacity',
        'inflated-size', 'packed-size', 'product-weight', 'material',
        'blower', 'setup-time', 'certification', 'safety-features', 'in-the-box'
      ],
      variantAttributes: ['size']
    },
    {
      id: gid('ProductType', 2),
      slug: 'car-mattress',
      name: 'Car Mattress',
      hasVariants: true,
      isShippingRequired: true,
      productAttributes: ['brand', 'material', 'weight-capacity', 'packed-size', 'pump-included', 'setup-time'],
      variantAttributes: ['car-fit']
    },
    {
      id: gid('ProductType', 3),
      slug: 'pump',
      name: 'Air Pump',
      hasVariants: true,
      isShippingRequired: true,
      productAttributes: ['brand', 'setup-time'],
      variantAttributes: ['power-source']
    },
    {
      id: gid('ProductType', 4),
      slug: 'care-kit',
      name: 'Care Kit',
      hasVariants: false,
      isShippingRequired: true,
      productAttributes: ['brand'],
      variantAttributes: []
    }
  ];

  const categories = [
    { id: gid('Category', 1), slug: 'water-castles', name: 'Water Castles & Slides', level: 0 },
    { id: gid('Category', 2), slug: 'splash-pads', name: 'Splash Pads', level: 0 },
    { id: gid('Category', 5), slug: 'bounce-houses', name: 'Bounce Houses', level: 0 },
    { id: gid('Category', 3), slug: 'car-mattresses', name: 'Car Mattresses', level: 0 },
    { id: gid('Category', 4), slug: 'travel-accessories', name: 'Pumps & Care', level: 0 }
  ];

  const bothChannels = [
    { channel: CA, isPublished: true },
    { channel: US, isPublished: true }
  ];

  // `isPrimary` collections become the top-level category chips in the UI.
  const collections = [
    {
      id: gid('Collection', 1),
      slug: 'water-play',
      name: 'Kids Play',
      tagline: 'Wet or dry, backyard or basement',
      description:
        'Water parks for the summer and bounce houses for the rest of the year. Every unit ships with a blower, anchor stakes and a repair patch.',
      isPrimary: true,
      channelListings: bothChannels,
      products: [
        'rainbow-splash-castle',
        'tropical-slide-splash-park',
        'double-slide-water-park',
        'ocean-wave-bounce-castle',
        'jungle-climb-water-slide',
        'mini-splash-pad',
        'car-theme-bounce-house',
        'quickfill-electric-pump',
        'patch-care-kit'
      ]
    },
    {
      id: gid('Collection', 2),
      slug: 'car-travel',
      name: 'Car Travel',
      tagline: 'Sleep anywhere you park',
      description:
        'Inflatable car beds that turn a back seat or cargo bay into a flat sleeping surface. Flocked tops, side bolsters and a pump that runs off the 12V socket.',
      isPrimary: true,
      channelListings: bothChannels,
      products: [
        'suv-rear-seat-mattress',
        'car-bed-pro-bolsters',
        'backseat-gap-cushion',
        'quickfill-electric-pump',
        'patch-care-kit'
      ]
    },
    {
      id: gid('Collection', 5),
      slug: 'bounce-houses',
      name: 'Bounce Houses',
      tagline: 'Dry play, indoors or out',
      description:
        'No hose, no puddles. Themed bounce houses with slides, climbing walls and obstacle courses that work on a lawn in July or a basement floor in January.',
      // Folded into Kids Play as an on-page section; kept as a curated list.
      isPrimary: false,
      channelListings: bothChannels,
      products: ['car-theme-bounce-house', 'quickfill-electric-pump', 'patch-care-kit']
    },
    {
      id: gid('Collection', 3),
      slug: 'best-sellers',
      name: 'Best Sellers',
      description: 'What families order most.',
      isPrimary: false,
      channelListings: bothChannels,
      products: ['rainbow-splash-castle', 'mini-splash-pad', 'suv-rear-seat-mattress']
    },
    {
      id: gid('Collection', 4),
      slug: 'new-arrivals',
      name: 'New Arrivals',
      description: 'Just landed for the season.',
      isPrimary: false,
      channelListings: bothChannels,
      products: ['double-slide-water-park', 'tropical-slide-splash-park', 'car-theme-bounce-house', 'car-bed-pro-bolsters']
    }
  ];

  const publishedEverywhere = [
    { channel: CA, isPublished: true, visibleInListings: true, isAvailableForPurchase: true, publishedAt: '2026-03-01' },
    { channel: US, isPublished: true, visibleInListings: true, isAvailableForPurchase: true, publishedAt: '2026-03-01' }
  ];

  const attr = (slug, ...values) => ({
    attribute: slug,
    values: values.map(name => ({ slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name }))
  });

  const products = [
    /* ---------------------------- Water Play ---------------------------- */
    {
      id: gid('Product', 1),
      slug: 'rainbow-splash-castle',
      name: 'Rainbow Splash Castle — 9-in-1 Water Park',
      description:
        'Nine play zones in one footprint: a wide slide into a deep catch pool, a climbing wall with a breathable mesh screen at the top, a bounce floor, a splash pool, a water cannon, a basketball hoop and a ring-toss target. Hook up the garden hose in summer; unhook it on cooler days and the same unit is a dry bounce house, so it earns its space year-round. Lay it flat, connect the blower, and it is fully up in about a minute.',
      productType: 'water-park',
      category: 'water-castles',
      collections: ['water-play', 'best-sellers'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('usage', 'Wet or dry — hose optional'),
        attr('play-zones', 'Wide slide', 'Climbing wall', 'Bounce floor', 'Deep pool', 'Splash pool', 'Water cannon', 'Basketball hoop', 'Ring toss', 'Sticky-ball target'),
        attr('age-range', '3–8 years'),
        attr('capacity', '7–8 kids at once'),
        attr('weight-capacity', '225 kg (496 lb)'),
        attr('inflated-size', '4.54 × 3.64 × 1.97 m (178.7 × 143.3 × 77.5 in)'),
        attr('packed-size', '76 × 52 × 38 cm carry bag'),
        attr('product-weight', '25.5 kg (56.3 lb)'),
        attr('material', 'Reinforced Oxford cloth'),
        attr('blower', '450 W, continuous-run'),
        attr('setup-time', 'About 1 minute to inflate'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('safety-features', 'Elevated slide with raised rails', 'Breathable mesh screen at climb top', 'Full-perimeter ground anchoring'),
        attr('in-the-box',
          '450 W blower', '4 blower stakes', '11 ground stakes', 'Stake hammer', 'Carry bag',
          'Water hose', '2 pipe clamps', 'Hose coil', '2 water blasters', '2 basketballs',
          '4 ring-toss rings', 'Hand air pump', '4 repair kits', '12 repair patches',
          'User manual', 'Safety reminder card')
      ],
      media: [{ id: gid('ProductMedia', 1), url: 'assets/photos/castle-square.jpg', alt: 'Rainbow Splash Castle set up on a backyard lawn', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 101), url: 'assets/photos/gallery/rsc-02.jpg', alt: 'Rainbow Splash Castle — gallery image 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 102), url: 'assets/photos/gallery/rsc-03.jpg', alt: 'Rainbow Splash Castle — gallery image 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 103), url: 'assets/photos/gallery/rsc-04.jpg', alt: 'Rainbow Splash Castle — gallery image 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 104), url: 'assets/photos/gallery/rsc-05.jpg', alt: 'Rainbow Splash Castle — gallery image 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 105), url: 'assets/photos/gallery/rsc-06.jpg', alt: 'Rainbow Splash Castle — gallery image 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 106), url: 'assets/photos/gallery/rsc-07.jpg', alt: 'Rainbow Splash Castle — gallery image 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 107), url: 'assets/photos/gallery/rsc-08.jpg', alt: 'Rainbow Splash Castle — gallery image 8', type: 'IMAGE', sortOrder: 7 },
        { id: gid('ProductMedia', 108), url: 'assets/photos/gallery/rsc-09.jpg', alt: 'Rainbow Splash Castle — gallery image 9', type: 'IMAGE', sortOrder: 8 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-RSC-STD',
      variants: [
        {
          id: gid('ProductVariant', 1),
          sku: 'AN-RSC-STD',
          name: 'Standard · 15 ft',
          attributes: [attr('size', 'Standard · 15 ft')],
          channelListings: [{ channel: CA, price: money(429, 'CAD') }, { channel: US, price: money(314.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 14 }, { warehouse: 'richmond-bc', quantity: 9 }]
        },
        {
          id: gid('ProductVariant', 2),
          sku: 'AN-RSC-XL',
          name: 'XL · 18 ft',
          attributes: [attr('size', 'XL · 18 ft')],
          channelListings: [{ channel: CA, price: money(569, 'CAD') }, { channel: US, price: money(414.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 6 }, { warehouse: 'richmond-bc', quantity: 3 }]
        }
      ]
    },

    {
      id: gid('Product', 2),
      slug: 'tropical-slide-splash-park',
      name: 'Twin Bounce Splash Park',
      description:
        'The widest unit we make: two mesh-walled bounce houses either side of a six-metre dual-lane waterslide, with a ball pit under each tower. Fill the pits with balls for a dry play day, or drop the balls and run water into them and they become paddling pools at the bottom of the slide.',
      productType: 'water-park',
      category: 'water-castles',
      collections: ['water-play', 'new-arrivals'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('usage', 'Wet or dry — ball pits convert to pools'),
        attr('play-zones', 'Twin bounce houses', '6 m dual-lane slide', 'Splash pad', 'Two ball pits / pools', 'Water cannons', 'Toss rings'),
        attr('age-range', '3–8 years'),
        attr('capacity', '1–8 kids at once'),
        attr('weight-capacity', '181 kg (400 lb)'),
        attr('inflated-size', '4.98 × 4.88 × 2.36 m (196 × 192 × 93 in)'),
        attr('product-weight', '22.5 kg (49.5 lb)'),
        attr('material', '840D / 420D Oxford fabric'),
        attr('blower', '750 W, continuous-run'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('safety-features', 'Mesh-walled bounce areas', 'Full-perimeter ground anchoring'),
        attr('in-the-box',
          '750 W blower', 'Ground stakes', 'Stake hammer', 'Storage bag', 'Water pipe',
          'Slip-n-slide mat', '2 bodyboards', 'Water gun', 'Basketball', 'Toss ring',
          'Hand air pump', 'Repair patch', 'Instruction manual')
      ],
      media: [{ id: gid('ProductMedia', 2), url: 'assets/photos/twin-slide-square.jpg', alt: 'Twin Bounce Splash Park set up on a back lawn', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 201), url: 'assets/photos/gallery/tsp-02.jpg', alt: 'Twin Bounce Splash Park — gallery image 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 202), url: 'assets/photos/gallery/tsp-03.jpg', alt: 'Twin Bounce Splash Park — gallery image 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 203), url: 'assets/photos/gallery/tsp-04.jpg', alt: 'Twin Bounce Splash Park — gallery image 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 204), url: 'assets/photos/gallery/tsp-05.jpg', alt: 'Twin Bounce Splash Park — gallery image 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 205), url: 'assets/photos/gallery/tsp-06.jpg', alt: 'Twin Bounce Splash Park — gallery image 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 206), url: 'assets/photos/gallery/tsp-07.jpg', alt: 'Twin Bounce Splash Park — gallery image 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 207), url: 'assets/photos/gallery/tsp-08.jpg', alt: 'Twin Bounce Splash Park — gallery image 8', type: 'IMAGE', sortOrder: 7 },
        { id: gid('ProductMedia', 208), url: 'assets/photos/gallery/tsp-09.jpg', alt: 'Twin Bounce Splash Park — gallery image 9', type: 'IMAGE', sortOrder: 8 },
        { id: gid('ProductMedia', 209), url: 'assets/photos/gallery/tsp-10.jpg', alt: 'Twin Bounce Splash Park — gallery image 10', type: 'IMAGE', sortOrder: 9 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-TSP-STD',
      variants: [
        {
          id: gid('ProductVariant', 3),
          sku: 'AN-TSP-STD',
          name: 'Standard',
          attributes: [attr('size', 'Standard')],
          channelListings: [{ channel: CA, price: money(995, 'CAD') }, { channel: US, price: money(725.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 5 }, { warehouse: 'richmond-bc', quantity: 2 }]
        }
      ]
    },

    {
      id: gid('Product', 12),
      slug: 'double-slide-water-park',
      name: 'Double Slide Water Park',
      description:
        'A central climbing tower with a wide slide down each face, both landing in one large surrounding pool — two kids ride at once and nobody waits at the top. Three water cannons fire across the pool, with a basketball hoop, ring toss and sticky-ball target around the rim. Unhook the hose on cooler days and the tower is a dry climb-and-slide.',
      productType: 'water-park',
      category: 'water-castles',
      collections: ['water-play', 'new-arrivals'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('usage', 'Wet or dry — hose optional'),
        attr('play-zones', 'Two wide slides', 'Climbing tower', 'Bounce area', 'Large deep pool', '3 water cannons', 'Basketball hoop', 'Ring toss', 'Sticky-ball target'),
        attr('age-range', '3–8 years'),
        attr('capacity', '7–8 kids at once'),
        attr('weight-capacity', '360 kg (793 lb)'),
        attr('inflated-size', '6.40 × 3.85 × 1.90 m (251.9 × 151.5 × 74.8 in)'),
        attr('product-weight', '32.3 kg (71.3 lb)'),
        attr('material', 'Reinforced Oxford cloth'),
        attr('blower', '750 W, continuous-run'),
        attr('setup-time', '1–2 minutes to inflate'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('safety-features', 'Elevated slides with extended handrails', 'Breathable mesh screen at climb top', 'Full-perimeter ground anchoring'),
        attr('in-the-box',
          '750 W blower', '4 blower stakes', '5 ground stakes', 'Stake hammer', 'Storage bag',
          'Water hose', '2 pipe clamps', 'Hose coil', '2 water blasters', 'Basketball',
          '4 ring-toss rings', '8 sticky balls', 'Hand air pump', '4 repair kits',
          '12 repair patches', 'User manual', 'Safety reminder card')
      ],
      media: [
        { id: gid('ProductMedia', 12), url: 'assets/photos/double-slide-square.jpg', alt: 'Double Slide Water Park set up on a backyard lawn', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 401), url: 'assets/photos/gallery/mwp-02.jpg', alt: 'Double Slide Water Park — gallery image 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 402), url: 'assets/photos/gallery/mwp-03.jpg', alt: 'Double Slide Water Park — gallery image 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 403), url: 'assets/photos/gallery/mwp-04.jpg', alt: 'Double Slide Water Park — gallery image 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 404), url: 'assets/photos/gallery/mwp-05.jpg', alt: 'Double Slide Water Park — gallery image 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 405), url: 'assets/photos/gallery/mwp-06.jpg', alt: 'Double Slide Water Park — gallery image 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 406), url: 'assets/photos/gallery/mwp-07.jpg', alt: 'Double Slide Water Park — gallery image 7', type: 'IMAGE', sortOrder: 6 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-DWP-STD',
      variants: [
        {
          id: gid('ProductVariant', 20),
          sku: 'AN-DWP-STD',
          name: 'Standard',
          attributes: [attr('size', 'Standard')],
          channelListings: [{ channel: CA, price: money(559, 'CAD') }, { channel: US, price: money(409.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 9 }, { warehouse: 'richmond-bc', quantity: 6 }]
        }
      ]
    },

    {
      id: gid('Product', 3),
      slug: 'ocean-wave-bounce-castle',
      name: 'Multi-Play Splash Castle',
      description:
        'One footprint, four ways to play: a slide into the splash pool, a mesh-walled bounce floor, a ball pit and toss-ring target cones. Run the water line in summer or keep it dry indoors off-season — the mesh walls keep kids visible from the patio either way.',
      productType: 'water-park',
      category: 'water-castles',
      collections: ['water-play'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('usage', 'Wet or dry — year-round'),
        attr('play-zones', 'Slide', 'Splash pool', 'Bounce floor', 'Ball pit', 'Toss-ring targets'),
        attr('age-range', '3–8 years'),
        attr('capacity', '4–6 kids at once'),
        attr('weight-capacity', '159 kg (350 lb)'),
        attr('inflated-size', '4.00 × 3.85 × 2.00 m (157.4 × 151.5 × 78.7 in)'),
        attr('product-weight', '24.4 kg (53.7 lb)'),
        attr('material', 'Durable Oxford fabric'),
        attr('setup-time', 'About 3–5 minutes'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('safety-features', 'Mesh walls on all sides', 'Full-perimeter ground anchoring'),
        attr('in-the-box',
          'Blower', '4 blower stakes', '8 bouncer stakes', 'Stake hammer', 'Carry bag',
          'Repair kit', 'Basketball', 'Hand air pump', '2 water guns', 'Instruction manual')
      ],
      media: [
        { id: gid('ProductMedia', 3), url: 'assets/photos/multi-play-square.jpg', alt: 'Multi-Play Splash Castle set up beside a patio', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 30), url: 'assets/photos/gallery/owc-02.jpg', alt: 'Multi-Play Splash Castle — detail 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 31), url: 'assets/photos/gallery/owc-03.jpg', alt: 'Multi-Play Splash Castle — detail 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 32), url: 'assets/photos/gallery/owc-04.jpg', alt: 'Multi-Play Splash Castle — detail 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 33), url: 'assets/photos/gallery/owc-05.jpg', alt: 'Multi-Play Splash Castle — detail 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 34), url: 'assets/photos/gallery/owc-06.jpg', alt: 'Multi-Play Splash Castle — detail 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 35), url: 'assets/photos/gallery/owc-07.jpg', alt: 'Multi-Play Splash Castle — detail 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 36), url: 'assets/photos/gallery/owc-08.jpg', alt: 'Multi-Play Splash Castle — detail 8', type: 'IMAGE', sortOrder: 7 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-OWC-STD',
      variants: [
        {
          id: gid('ProductVariant', 4),
          sku: 'AN-OWC-STD',
          name: 'Standard · 13 ft',
          attributes: [attr('size', 'Standard · 13 ft')],
          channelListings: [{ channel: CA, price: money(509, 'CAD') }, { channel: US, price: money(369.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 11 }, { warehouse: 'richmond-bc', quantity: 7 }]
        }
      ]
    },

    {
      id: gid('Product', 4),
      slug: 'jungle-climb-water-slide',
      name: 'Jungle Climb Water Slide',
      description:
        'A tall climb-and-plunge slide with a padded landing lane. The climb wall uses moulded grips rather than rope, which is easier on small hands.',
      productType: 'water-park',
      category: 'water-castles',
      collections: ['water-play'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('age-range', '5–12 years'),
        attr('capacity', '2 kids / 110 kg'),
        attr('inflated-size', '4.8 × 2.4 × 3.1 m'),
        attr('material', '0.6 mm reinforced PVC'),
        attr('pump-included', 'Yes — 950 W blower'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('setup-time', 'About 5 minutes')
      ],
      media: [{ id: gid('ProductMedia', 4), url: 'assets/products/water-slide-jungle.svg', alt: 'Jungle Climb Water Slide', type: 'IMAGE', sortOrder: 0 }],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-JCS-STD',
      variants: [
        {
          id: gid('ProductVariant', 6),
          sku: 'AN-JCS-STD',
          name: 'Standard',
          attributes: [attr('size', 'Standard')],
          channelListings: [{ channel: CA, price: money(629, 'CAD') }, { channel: US, price: money(459, 'USD') }],
          // Restocking — renders the "Sold out" badge.
          stocks: [{ warehouse: 'mississauga-on', quantity: 0 }, { warehouse: 'richmond-bc', quantity: 0 }]
        }
      ]
    },

    {
      id: gid('Product', 5),
      slug: 'mini-splash-pad',
      name: 'Mini Splash Pad',
      description:
        'A low, soft-walled sprinkler pad for toddlers. Fills to ankle depth in about a minute and folds into a bag the size of a picnic blanket.',
      productType: 'water-park',
      category: 'splash-pads',
      collections: ['water-play', 'best-sellers'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('age-range', '1–5 years'),
        attr('capacity', '3 toddlers'),
        attr('inflated-size', '1.7 m diameter'),
        attr('material', '0.4 mm soft-touch PVC'),
        attr('pump-included', 'No — garden hose only'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('setup-time', 'About 1 minute')
      ],
      media: [{ id: gid('ProductMedia', 5), url: 'assets/products/splash-pad-mini.svg', alt: 'Mini Splash Pad', type: 'IMAGE', sortOrder: 0 }],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-MSP-5',
      variants: [
        {
          id: gid('ProductVariant', 7),
          sku: 'AN-MSP-5',
          name: '5 ft',
          attributes: [attr('size', '5 ft')],
          channelListings: [{ channel: CA, price: money(89, 'CAD') }, { channel: US, price: money(65, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 32 }, { warehouse: 'richmond-bc', quantity: 24 }]
        },
        {
          id: gid('ProductVariant', 8),
          sku: 'AN-MSP-68',
          name: '6.8 ft',
          attributes: [attr('size', '6.8 ft')],
          channelListings: [{ channel: CA, price: money(119, 'CAD') }, { channel: US, price: money(87, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 18 }, { warehouse: 'richmond-bc', quantity: 15 }]
        }
      ]
    },

    /* --------------------------- Bounce Houses -------------------------- */
    {
      id: gid('Product', 11),
      slug: 'car-theme-bounce-house',
      name: 'Race Car Bounce House',
      description:
        'A car-shaped play centre built around a head-to-head race track: two slides and two climbing walls side by side, so kids race each other instead of queuing. An obstacle course runs through the middle, with a basketball hoop and a sticky-ball target at the far end. Dry use only — it works on a lawn in July and on a basement floor in January.',
      productType: 'bounce-house',
      category: 'bounce-houses',
      collections: ['water-play', 'bounce-houses', 'new-arrivals'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('usage', 'Dry only — indoors or outdoors'),
        attr('play-zones', 'Twin racing slides', 'Two climbing walls', 'Obstacle course', 'Bounce floor', 'Basketball hoop', 'Sticky-ball target'),
        attr('age-range', '3–8 years (36–96 months)'),
        attr('inflated-size', '5.61 × 2.59 × 2.62 m (18.4 × 8.5 × 8.6 ft)'),
        attr('material', '840D / 420D Oxford fabric, reinforced seams'),
        attr('blower', '750 W, continuous-run'),
        attr('setup-time', 'About 1 minute to inflate'),
        attr('certification', 'ASTM F963 · CPSIA'),
        attr('safety-features', 'Reinforced seams', 'Safety mesh walls', 'Full-perimeter ground anchoring'),
        attr('in-the-box',
          '750 W blower', '4 blower stakes', '8 ground stakes', 'Stake hammer', 'Power cord',
          'Carry bag', '4 repair kits', '10 repair patches', 'Air pump with nozzle',
          'Basketball', '8 sticky balls')
      ],
      media: [{ id: gid('ProductMedia', 11), url: 'assets/photos/car-bounce-square.jpg', alt: 'Race Car Bounce House set up on a back lawn', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 301), url: 'assets/photos/gallery/rcb-02.jpg', alt: 'Race Car Bounce House — gallery image 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 302), url: 'assets/photos/gallery/rcb-03.jpg', alt: 'Race Car Bounce House — gallery image 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 303), url: 'assets/photos/gallery/rcb-04.jpg', alt: 'Race Car Bounce House — gallery image 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 304), url: 'assets/photos/gallery/rcb-05.jpg', alt: 'Race Car Bounce House — gallery image 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 305), url: 'assets/photos/gallery/rcb-06.jpg', alt: 'Race Car Bounce House — gallery image 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 306), url: 'assets/photos/gallery/rcb-07.jpg', alt: 'Race Car Bounce House — gallery image 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 307), url: 'assets/photos/gallery/rcb-08.jpg', alt: 'Race Car Bounce House — gallery image 8', type: 'IMAGE', sortOrder: 7 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-RCB-STD',
      variants: [
        {
          id: gid('ProductVariant', 19),
          sku: 'AN-RCB-STD',
          name: 'Standard',
          attributes: [attr('size', 'Standard')],
          channelListings: [{ channel: CA, price: money(959, 'CAD') }, { channel: US, price: money(699, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 7 }, { warehouse: 'richmond-bc', quantity: 4 }]
        }
      ]
    },

    {
      id: gid('Product', 13),
      slug: 'whack-a-mole-bounce-house',
      name: 'Whack-a-Mole Bounce House',
      description:
        'A castle-style bounce house built around a Whack-a-Mole game, with a large slide and a roomy bouncing area. Two basketball hoops and two sticky targets turn one backyard setup into several games for children ages 3–8.',
      productType: 'bounce-house',
      category: 'bounce-houses',
      collections: ['water-play', 'bounce-houses', 'new-arrivals'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('age-range', '3–8 years'),
        attr('inflated-size', '5.49 × 3.35 × 2.01 m (18 × 11 × 6.6 ft)'),
        attr('play-zones', 'Whack-a-Mole game', 'Large slide', 'Bouncing area', '2 basketball hoops', '2 sticky targets'),
        attr('usage', 'Outdoor play')
      ],
      media: [{
        id: gid('ProductMedia', 13),
        url: 'assets/photos/whack-a-mole-bounce-house.png',
        alt: 'Whack-a-Mole Bounce House with slide set up on a lawn',
        type: 'IMAGE',
        sortOrder: 0
      },
        { id: gid('ProductMedia', 1302), url: 'assets/photos/gallery/wam-02.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 2', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 1303), url: 'assets/photos/gallery/wam-03.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 1304), url: 'assets/photos/gallery/wam-04.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 1305), url: 'assets/photos/gallery/wam-05.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 1306), url: 'assets/photos/gallery/wam-06.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 1307), url: 'assets/photos/gallery/wam-07.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 1308), url: 'assets/photos/gallery/wam-08.jpg', alt: 'Whack-a-Mole Bounce House — gallery image 8', type: 'IMAGE', sortOrder: 7 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-WAM-STD',
      variants: [
        {
          id: gid('ProductVariant', 21),
          sku: 'AN-WAM-STD',
          name: 'Standard',
          attributes: [attr('size', '18 × 11 × 6.6 ft')],
          channelListings: [{ channel: CA, price: money(799, 'CAD') }, { channel: US, price: money(579, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 8 }, { warehouse: 'richmond-bc', quantity: 5 }]
        }
      ]
    },

    /* ---------------------------- Car Travel ---------------------------- */
    {
      id: gid('Product', 6),
      slug: 'suv-rear-seat-mattress',
      name: 'Adjustable Car Air Mattress',
      description:
        'A back-seat bed with a foldable leg section that adjusts three ways: inflate it as a leg cushion, fold it down flat to match the footwell, or leave it out entirely. The flocked top sleeps warm, two air pillows are in the bag, and the wireless pump recharges over USB — no engine running, no 12V cable across the seats. Doubles as a picnic mat once you arrive.',
      productType: 'car-mattress',
      category: 'car-mattresses',
      collections: ['car-travel', 'best-sellers'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('car-fit', 'SUV, MPV, truck, minibus, minivan'),
        attr('inflated-size', '199.9 × 130.8 × 20.1 cm (78.7 × 51.5 × 7.9 in)'),
        attr('weight-capacity', '272 kg (600 lb)'),
        attr('material', 'Flocked top over puncture-resistant PVC'),
        attr('pump-included', 'Yes — wireless, USB-rechargeable'),
        attr('in-the-box', 'Air mattress', '2 air pillows', 'Wireless air pump', 'USB charging cable', 'Storage bag')
      ],
      media: [
        { id: gid('ProductMedia', 6), url: 'assets/photos/car-mattress-square.jpg', alt: 'SUV cargo bay made up as a bed with the inflatable mattress', type: 'IMAGE', sortOrder: 0 },
        { id: gid('ProductMedia', 60), url: 'assets/photos/gallery/crm-02.jpg', alt: 'Adjustable Car Air Mattress — dimensions', type: 'IMAGE', sortOrder: 1 },
        { id: gid('ProductMedia', 61), url: 'assets/photos/gallery/crm-03.jpg', alt: 'Adjustable Car Air Mattress — detail 3', type: 'IMAGE', sortOrder: 2 },
        { id: gid('ProductMedia', 62), url: 'assets/photos/gallery/crm-04.jpg', alt: 'Adjustable Car Air Mattress — detail 4', type: 'IMAGE', sortOrder: 3 },
        { id: gid('ProductMedia', 63), url: 'assets/photos/gallery/crm-05.jpg', alt: 'Adjustable Car Air Mattress — detail 5', type: 'IMAGE', sortOrder: 4 },
        { id: gid('ProductMedia', 64), url: 'assets/photos/gallery/crm-06.jpg', alt: 'Adjustable Car Air Mattress — detail 6', type: 'IMAGE', sortOrder: 5 },
        { id: gid('ProductMedia', 65), url: 'assets/photos/gallery/crm-07.jpg', alt: 'Adjustable Car Air Mattress — detail 7', type: 'IMAGE', sortOrder: 6 },
        { id: gid('ProductMedia', 66), url: 'assets/photos/gallery/crm-08.jpg', alt: 'Adjustable Car Air Mattress — detail 8', type: 'IMAGE', sortOrder: 7 },
        { id: gid('ProductMedia', 67), url: 'assets/photos/gallery/crm-09.jpg', alt: 'Adjustable Car Air Mattress — detail 9', type: 'IMAGE', sortOrder: 8 }
      ],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-CRM-ADJ',
      variants: [
        {
          id: gid('ProductVariant', 10),
          sku: 'AN-CRM-ADJ',
          name: 'One size · adjustable',
          attributes: [attr('car-fit', 'SUV, MPV, truck, minibus, minivan')],
          channelListings: [{ channel: CA, price: money(142, 'CAD') }, { channel: US, price: money(102.99, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 26 }, { warehouse: 'richmond-bc', quantity: 19 }]
        }
      ]
    },

    {
      id: gid('Product', 7),
      slug: 'car-bed-pro-bolsters',
      name: 'Car Bed Pro with Bolsters',
      description:
        'Raised side bolsters keep a sleeping child off the door panel, and the two-chamber build means a puncture on one side still leaves you a usable bed.',
      productType: 'car-mattress',
      category: 'car-mattresses',
      collections: ['car-travel', 'new-arrivals'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('material', 'Flocked 0.5 mm PVC'),
        attr('weight-capacity', '300 kg'),
        attr('packed-size', '42 × 26 × 16 cm'),
        attr('pump-included', 'Yes — 12V car pump'),
        attr('setup-time', 'About 4 minutes')
      ],
      media: [{ id: gid('ProductMedia', 7), url: 'assets/products/car-bed-pro.svg', alt: 'Car Bed Pro with Bolsters', type: 'IMAGE', sortOrder: 0 }],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-CBP-SUV',
      variants: [
        {
          id: gid('ProductVariant', 12),
          sku: 'AN-CBP-SUV',
          name: 'SUV / Crossover',
          attributes: [attr('car-fit', 'SUV / Crossover')],
          channelListings: [{ channel: CA, price: money(189, 'CAD') }, { channel: US, price: money(138, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 12 }, { warehouse: 'richmond-bc', quantity: 7 }]
        },
        {
          id: gid('ProductVariant', 13),
          sku: 'AN-CBP-TRK',
          name: 'Pickup Truck',
          attributes: [attr('car-fit', 'Pickup Truck')],
          channelListings: [{ channel: CA, price: money(209, 'CAD') }, { channel: US, price: money(152, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 4 }, { warehouse: 'richmond-bc', quantity: 2 }]
        }
      ]
    },

    {
      id: gid('Product', 8),
      slug: 'backseat-gap-cushion',
      name: 'Backseat Gap Cushion',
      description:
        'A wedge that closes the gap between the bench and the front seats. Useful on its own for kids, or as a levelling block under a full car bed.',
      productType: 'car-mattress',
      category: 'car-mattresses',
      collections: ['car-travel'],
      attributes: [
        attr('brand', 'AirHaven'),
        attr('material', 'Flocked 0.4 mm PVC'),
        attr('weight-capacity', '120 kg'),
        attr('packed-size', '26 × 18 × 10 cm'),
        attr('pump-included', 'No — sold separately'),
        attr('setup-time', 'Under 2 minutes')
      ],
      media: [{ id: gid('ProductMedia', 8), url: 'assets/products/backseat-cushion.svg', alt: 'Backseat Gap Cushion', type: 'IMAGE', sortOrder: 0 }],
      // Canadian channel only — switching to USD drops it from the grid, which
      // is how Saleor's per-channel publication behaves.
      channelListings: [
        { channel: CA, isPublished: true, visibleInListings: true, isAvailableForPurchase: true, publishedAt: '2026-02-10' }
      ],
      defaultVariant: 'AN-BGC-UNI',
      variants: [
        {
          id: gid('ProductVariant', 14),
          sku: 'AN-BGC-UNI',
          name: 'Universal',
          attributes: [attr('car-fit', 'Universal')],
          channelListings: [{ channel: CA, price: money(59, 'CAD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 40 }, { warehouse: 'richmond-bc', quantity: 28 }]
        }
      ]
    },

    /* --------------------------- Pumps & Care --------------------------- */
    {
      id: gid('Product', 9),
      slug: 'quickfill-electric-pump',
      name: 'QuickFill Electric Pump',
      description:
        'Inflates and deflates, with three nozzle sizes that fit every AirHaven product. Pick the plug that matches where you use it most.',
      productType: 'pump',
      category: 'travel-accessories',
      collections: ['water-play', 'car-travel', 'bounce-houses'],
      attributes: [attr('brand', 'AirHaven'), attr('setup-time', 'Instant')],
      media: [{ id: gid('ProductMedia', 9), url: 'assets/products/air-pump.svg', alt: 'QuickFill Electric Pump', type: 'IMAGE', sortOrder: 0 }],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-PMP-AC',
      variants: [
        {
          id: gid('ProductVariant', 15),
          sku: 'AN-PMP-AC',
          name: 'AC 110V',
          attributes: [attr('power-source', 'AC 110V')],
          channelListings: [{ channel: CA, price: money(49, 'CAD') }, { channel: US, price: money(36, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 45 }, { warehouse: 'richmond-bc', quantity: 31 }]
        },
        {
          id: gid('ProductVariant', 16),
          sku: 'AN-PMP-12V',
          name: '12V Car Socket',
          attributes: [attr('power-source', '12V Car Socket')],
          channelListings: [{ channel: CA, price: money(59, 'CAD') }, { channel: US, price: money(43, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 38 }, { warehouse: 'richmond-bc', quantity: 22 }]
        },
        {
          id: gid('ProductVariant', 17),
          sku: 'AN-PMP-RC',
          name: 'Rechargeable',
          attributes: [attr('power-source', 'Rechargeable')],
          channelListings: [{ channel: CA, price: money(89, 'CAD') }, { channel: US, price: money(65, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 17 }, { warehouse: 'richmond-bc', quantity: 11 }]
        }
      ]
    },

    {
      id: gid('Product', 10),
      slug: 'patch-care-kit',
      name: 'Patch & Care Kit',
      description:
        'Vinyl patches, seam adhesive, a valve wrench and a microfibre cloth. The one thing worth keeping in the car alongside any inflatable.',
      productType: 'care-kit',
      category: 'travel-accessories',
      collections: ['water-play', 'car-travel', 'bounce-houses'],
      attributes: [attr('brand', 'AirHaven')],
      media: [{ id: gid('ProductMedia', 10), url: 'assets/products/repair-kit.svg', alt: 'Patch and Care Kit', type: 'IMAGE', sortOrder: 0 }],
      channelListings: publishedEverywhere,
      defaultVariant: 'AN-KIT-STD',
      variants: [
        {
          id: gid('ProductVariant', 18),
          sku: 'AN-KIT-STD',
          name: 'Default',
          attributes: [],
          channelListings: [{ channel: CA, price: money(24.95, 'CAD') }, { channel: US, price: money(18.95, 'USD') }],
          stocks: [{ warehouse: 'mississauga-on', quantity: 60 }, { warehouse: 'richmond-bc', quantity: 44 }]
        }
      ]
    }
  ];

  window.SALEOR_CATALOG = {
    brand: 'AirHaven',
    defaultChannel: CA,
    defaultCollection: 'all',
    channels,
    warehouses,
    attributes,
    productTypes,
    categories,
    collections,
    products
  };
})();
