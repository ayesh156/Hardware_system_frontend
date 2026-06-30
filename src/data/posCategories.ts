/**
 * POS Category & Item Mock Data
 * Structured for the Quick Checkout category grid with searchable items per category.
 */

export interface PosItem {
  id: string;
  sku: string;
  name: string;
  nameSi?: string;
  unitRate: number;
  stock: number;
  unit: string;
}

export interface PosCategory {
  id: string;
  name: string;
  nameSi?: string;
  icon: string;
  color: string;
  items: PosItem[];
}

export const posCategories: PosCategory[] = [
  {
    id: 'cat-pipes',
    name: 'PVC Pipes',
    nameSi: 'PVC නල',
    icon: '🔩',
    color: 'from-cyan-500 to-blue-600',
    items: [
      { id: 'pipe-001', sku: 'PVC-1INCH', name: 'PVC Pipe 1 inch', nameSi: 'PVC නල 1 අඟල්', unitRate: 620, stock: 200, unit: 'piece' },
      { id: 'pipe-002', sku: 'PVC-2INCH', name: 'PVC Pipe 2 inch', nameSi: 'PVC නල 2 අඟල්', unitRate: 1000, stock: 150, unit: 'piece' },
      { id: 'pipe-003', sku: 'PVC-3INCH', name: 'PVC Pipe 3 inch', nameSi: 'PVC නල 3 අඟල්', unitRate: 1600, stock: 80, unit: 'piece' },
      { id: 'pipe-004', sku: 'PVC-4INCH', name: 'PVC Pipe 4 inch', nameSi: 'PVC නල 4 අඟල්', unitRate: 1900, stock: 60, unit: 'piece' },
      { id: 'pipe-005', sku: 'PVC-ELBOW', name: 'PVC Elbow 1"', nameSi: 'PVC කූරු 1"', unitRate: 85, stock: 500, unit: 'piece' },
      { id: 'pipe-006', sku: 'PVC-TEE', name: 'PVC Tee 1"', nameSi: 'PVC ටී 1"', unitRate: 120, stock: 400, unit: 'piece' },
      { id: 'pipe-007', sku: 'PVC-COUPLING', name: 'PVC Coupling 1"', nameSi: 'PVC සම්බන්ධකය 1"', unitRate: 65, stock: 600, unit: 'piece' },
    ],
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    nameSi: 'විදුලි භාණ්ඩ',
    icon: '💡',
    color: 'from-amber-500 to-yellow-600',
    items: [
      { id: 'elec-001', sku: 'CABLE-1.5', name: 'House Wire 1.5mm', nameSi: 'ගෘහ කේබල් 1.5mm', unitRate: 110, stock: 2000, unit: 'meter' },
      { id: 'elec-002', sku: 'CABLE-2.5', name: 'House Wire 2.5mm', nameSi: 'ගෘහ කේබල් 2.5mm', unitRate: 175, stock: 1500, unit: 'meter' },
      { id: 'elec-003', sku: 'SWITCH-1W', name: '1-Way Switch White', nameSi: '1-මාර්ග ස්විචය සුදු', unitRate: 185, stock: 350, unit: 'piece' },
      { id: 'elec-004', sku: 'SWITCH-2W', name: '2-Way Switch White', nameSi: '2-මාර්ග ස්විචය සුදු', unitRate: 250, stock: 280, unit: 'piece' },
      { id: 'elec-005', sku: 'SOCKET-13A', name: '13A Socket White', nameSi: '13A සොකට් සුදු', unitRate: 320, stock: 200, unit: 'piece' },
      { id: 'elec-006', sku: 'MCB-16A', name: 'MCB 16A Single Pole', nameSi: 'MCB 16A තනි ධ්‍රැව', unitRate: 495, stock: 180, unit: 'piece' },
      { id: 'elec-007', sku: 'MCB-32A', name: 'MCB 32A Single Pole', nameSi: 'MCB 32A තනි ධ්‍රැව', unitRate: 550, stock: 120, unit: 'piece' },
      { id: 'elec-008', sku: 'LED-10W', name: 'LED Bulb 10W', nameSi: 'LED බල්බය 10W', unitRate: 350, stock: 400, unit: 'piece' },
    ],
  },
  {
    id: 'cat-hand-tools',
    name: 'Hand Tools',
    nameSi: 'අත් මෙවලම්',
    icon: '🔨',
    color: 'from-orange-500 to-red-600',
    items: [
      { id: 'tool-001', sku: 'HAMMER-CLAW', name: 'Claw Hammer 16oz', nameSi: 'කුට්ටි මිටිය 16oz', unitRate: 850, stock: 45, unit: 'piece' },
      { id: 'tool-002', sku: 'PLIERS-COMB', name: 'Combination Pliers 8"', nameSi: 'සංයුක්ත ප්ලයර්ස් 8"', unitRate: 650, stock: 60, unit: 'piece' },
      { id: 'tool-003', sku: 'SCREWDRV-SET', name: 'Screwdriver Set 6pc', nameSi: 'ඉස්කුරුප්පු නියන කට්ටලය 6pc', unitRate: 1200, stock: 35, unit: 'set' },
      { id: 'tool-004', sku: 'TAPE-5M', name: 'Measuring Tape 5m', nameSi: 'මිනුම් පටිය 5m', unitRate: 450, stock: 80, unit: 'piece' },
      { id: 'tool-005', sku: 'SPANNER-ADJ', name: 'Adjustable Spanner 10"', nameSi: 'වෙනස් කළ හැකි ස්පැනර් 10"', unitRate: 1100, stock: 30, unit: 'piece' },
      { id: 'tool-006', sku: 'HACKSAW', name: 'Hacksaw Frame 12"', nameSi: 'කපන කියත 12"', unitRate: 750, stock: 25, unit: 'piece' },
      { id: 'tool-007', sku: 'LEVEL-24', name: 'Spirit Level 24"', nameSi: 'ආත්ම මට්ටමේ 24"', unitRate: 1400, stock: 20, unit: 'piece' },
    ],
  },
  {
    id: 'cat-steel',
    name: 'Steel Bars',
    nameSi: 'වානේ කූරු',
    icon: '🏗️',
    color: 'from-slate-600 to-slate-800',
    items: [
      { id: 'stl-001', sku: 'TMT-10MM', name: 'TMT Bar 10mm', nameSi: 'TMT කූරු 10mm', unitRate: 350, stock: 500, unit: 'kg' },
      { id: 'stl-002', sku: 'TMT-12MM', name: 'TMT Bar 12mm', nameSi: 'TMT කූරු 12mm', unitRate: 360, stock: 450, unit: 'kg' },
      { id: 'stl-003', sku: 'TMT-16MM', name: 'TMT Bar 16mm', nameSi: 'TMT කූරු 16mm', unitRate: 365, stock: 300, unit: 'kg' },
      { id: 'stl-004', sku: 'TMT-20MM', name: 'TMT Bar 20mm', nameSi: 'TMT කූරු 20mm', unitRate: 375, stock: 200, unit: 'kg' },
      { id: 'stl-005', sku: 'GI-PIPE-1', name: 'GI Pipe 1" 6m', nameSi: 'GI නල 1" 6m', unitRate: 1100, stock: 120, unit: 'piece' },
      { id: 'stl-006', sku: 'BINDING-WIRE', name: 'Binding Wire 1kg', nameSi: 'බැඳුම් කම්බි 1kg', unitRate: 450, stock: 200, unit: 'kg' },
    ],
  },
  {
    id: 'cat-paint',
    name: 'Paint',
    nameSi: 'තීන්ත',
    icon: '🎨',
    color: 'from-pink-500 to-purple-600',
    items: [
      { id: 'pnt-001', sku: 'EMULSION-4L', name: 'Interior Emulsion 4L White', nameSi: 'අභ්‍යන්තර ඉමල්ෂන් 4L සුදු', unitRate: 3200, stock: 85, unit: 'liter' },
      { id: 'pnt-002', sku: 'EMULSION-10L', name: 'Interior Emulsion 10L White', nameSi: 'අභ්‍යන්තර ඉමල්ෂන් 10L සුදු', unitRate: 6400, stock: 50, unit: 'liter' },
      { id: 'pnt-003', sku: 'ENAMEL-1L', name: 'Gloss Enamel 1L White', nameSi: 'ග්ලොස් එනමල් 1L සුදු', unitRate: 1750, stock: 65, unit: 'liter' },
      { id: 'pnt-004', sku: 'PRIMER-4L', name: 'Wall Primer 4L', nameSi: 'බිත්ති ප්‍රයිමර් 4L', unitRate: 2800, stock: 40, unit: 'liter' },
      { id: 'pnt-005', sku: 'PUTTY-1KG', name: 'Wall Putty 1kg', nameSi: 'බිත්ති පුට්ටි 1kg', unitRate: 350, stock: 100, unit: 'kg' },
      { id: 'pnt-006', sku: 'THINNER-1L', name: 'Paint Thinner 1L', nameSi: 'තීන්ත තනුක 1L', unitRate: 650, stock: 75, unit: 'liter' },
    ],
  },
  {
    id: 'cat-cement',
    name: 'Cement',
    nameSi: 'සිමෙන්ති',
    icon: '🧱',
    color: 'from-slate-500 to-gray-700',
    items: [
      { id: 'cem-001', sku: 'CEM-INSEE-50', name: 'INSEE Cement 50kg', nameSi: 'ඉන්සී සිමෙන්ති 50kg', unitRate: 2100, stock: 250, unit: 'bag' },
      { id: 'cem-002', sku: 'CEM-TOKYO-50', name: 'Tokyo Cement 50kg', nameSi: 'ටෝකියෝ සිමෙන්ති 50kg', unitRate: 2200, stock: 180, unit: 'bag' },
      { id: 'cem-003', sku: 'CEM-HOLCIM-50', name: 'Holcim Cement 50kg', nameSi: 'හොල්සිම් සිමෙන්ති 50kg', unitRate: 2050, stock: 200, unit: 'bag' },
    ],
  },
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    nameSi: 'නල කටයුතු',
    icon: '🚰',
    color: 'from-teal-500 to-emerald-600',
    items: [
      { id: 'plu-001', sku: 'TAP-KITCHEN', name: 'Kitchen Mixer Tap', nameSi: 'මුළුතැන්ගෙයි මික්සර් ටැප්', unitRate: 3500, stock: 30, unit: 'piece' },
      { id: 'plu-002', sku: 'TAP-BASIN', name: 'Basin Tap Chrome', nameSi: 'බේසින් ටැප් ක්‍රෝම්', unitRate: 1800, stock: 45, unit: 'piece' },
      { id: 'plu-003', sku: 'BALL-VALVE', name: 'Ball Valve 1"', nameSi: 'බෝල කපාටය 1"', unitRate: 850, stock: 60, unit: 'piece' },
      { id: 'plu-004', sku: 'FLOAT-VALVE', name: 'Float Valve 1"', nameSi: 'ෆ්ලෝට් කපාටය 1"', unitRate: 650, stock: 40, unit: 'piece' },
      { id: 'plu-005', sku: 'TANK-500L', name: 'Water Tank 500L', nameSi: 'ජල ටැංකිය 500L', unitRate: 12500, stock: 15, unit: 'piece' },
      { id: 'plu-006', sku: 'TANK-1000L', name: 'Water Tank 1000L', nameSi: 'ජල ටැංකිය 1000L', unitRate: 22000, stock: 10, unit: 'piece' },
    ],
  },
  {
    id: 'cat-gardening',
    name: 'Gardening',
    nameSi: 'උද්‍යාන',
    icon: '🌿',
    color: 'from-green-500 to-emerald-700',
    items: [
      { id: 'gar-001', sku: 'SHOVEL', name: 'Garden Shovel', nameSi: 'උද්‍යාන සවල', unitRate: 850, stock: 40, unit: 'piece' },
      { id: 'gar-002', sku: 'RAKE', name: 'Garden Rake', nameSi: 'උද්‍යාන කෝටුව', unitRate: 650, stock: 25, unit: 'piece' },
      { id: 'gar-003', sku: 'HOSE-50', name: 'Garden Hose 50ft', nameSi: 'උද්‍යාන හෝස් 50ft', unitRate: 2200, stock: 20, unit: 'piece' },
      { id: 'gar-004', sku: 'SPRINKLER', name: 'Lawn Sprinkler', nameSi: 'තණකොළ ඉසින යන්ත්‍රය', unitRate: 1200, stock: 30, unit: 'piece' },
      { id: 'gar-005', sku: 'PRUNER', name: 'Pruning Shears', nameSi: 'කප්පාදු කතුර', unitRate: 950, stock: 25, unit: 'piece' },
      { id: 'gar-006', sku: 'GLOVES-GARDEN', name: 'Garden Gloves (Pair)', nameSi: 'උද්‍යාන අත්වැසුම් (යුගල)', unitRate: 350, stock: 60, unit: 'pair' },
    ],
  },
  {
    id: 'cat-hardware',
    name: 'Hardware',
    nameSi: 'දෘඪාංග',
    icon: '🔩',
    color: 'from-rose-500 to-pink-600',
    items: [
      { id: 'hrd-001', sku: 'NAIL-2IN', name: 'Wire Nails 2" 1kg', nameSi: 'වයර් ඇණ 2" 1kg', unitRate: 270, stock: 300, unit: 'kg' },
      { id: 'hrd-002', sku: 'NAIL-3IN', name: 'Wire Nails 3" 1kg', nameSi: 'වයර් ඇණ 3" 1kg', unitRate: 260, stock: 250, unit: 'kg' },
      { id: 'hrd-003', sku: 'SCREW-2IN', name: 'Wood Screws 2" Box', nameSi: 'ලී ඉස්කුරුප්පු 2" බොක්ස්', unitRate: 480, stock: 90, unit: 'box' },
      { id: 'hrd-004', sku: 'BOLT-10MM', name: 'Hex Bolt 10mm x 50', nameSi: 'හෙක්ස් බෝල්ට් 10mm x 50', unitRate: 25, stock: 800, unit: 'piece' },
      { id: 'hrd-005', sku: 'LOCK-DOOR', name: 'Door Lock Set', nameSi: 'දොර අගුල් කට්ටලය', unitRate: 1800, stock: 35, unit: 'set' },
      { id: 'hrd-006', sku: 'HINGE-3IN', name: 'Door Hinge 3" Pair', nameSi: 'දොර hinge 3" යුගල', unitRate: 350, stock: 75, unit: 'pair' },
    ],
  },
];