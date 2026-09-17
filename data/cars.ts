// Mock fleet data for the Rawaes demo app. In production this would come
// from the Rawaes booking API — the shape here mirrors what the design's
// car cards and detail screen need.

// Widened to plain `string` (rather than a fixed literal union) because real
// fleet data from the backend has more category/fuel/transmission values than
// this demo's original 7-car mock set — see lib/api.ts for the live source.
export type FuelType = string;
export type Transmission = string;
export type CarCategory = string;

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  category: CarCategory;
  categoryLabel: string;
  seats: number;
  doors: number;
  bags: number;
  fuel: FuelType;
  fuelLabel: string;
  transmission: Transmission;
  transmissionLabel: string;
  pricePerDay: number;
  originalPricePerDay?: number;
  discountPercent?: number;
  hasAC: boolean;
  bodyStyle: 'hatchback' | 'sedan' | 'coupe' | 'van';
  tint: string; // accent color used for the car illustration
  image?: string; // real photo URL, when available — falls back to CarIllustration
  vatRatePercent?: number; // defaults to 15% (Saudi VAT) when not provided
}

// NOTE ON IMAGES
// The design references real product photos at assets/cars/*.png|jpg — those
// binary files weren't included in what was exported from Claude Design into
// this session, only the markup that points at them. Rather than ship broken
// <Image> requires, every car card renders a small flat-vector illustration
// (see components/ui/CarIllustration.tsx) tinted per body style.
//
// To use the real photos: drop them into assets/images/cars/ using the file
// names below, add an `image: require('../assets/images/cars/<name>')` field
// per car, and swap <CarIllustration> for <Image resizeMode="contain" />
// in components/ui/CarCard.tsx and app/car/[id].tsx.
//   toyota-yaris-2024.png, kia-pegas-2025.png, hyundai-elantra-2024.png,
//   hyundai-sonata-2024.jpg, toyota-camry-2023.jpeg, lexus-es250-2023.png,
//   hyundai-staria-2024.png

export const categoryLabels: Record<CarCategory, string> = {
  economy: 'اقتصادية',
  sedan: 'سيدان',
  luxury: 'فاخرة',
  van: 'عائلية',
};

export const cars: Car[] = [
  {
    id: 'toyota-yaris-2024',
    make: 'Toyota',
    model: 'Yaris',
    year: 2024,
    category: 'economy',
    categoryLabel: categoryLabels.economy,
    seats: 5,
    doors: 4,
    bags: 2,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 119,
    hasAC: true,
    bodyStyle: 'hatchback',
    tint: '#eef2ef',
  },
  {
    id: 'kia-pegas-2025',
    make: 'Kia',
    model: 'Pegas',
    year: 2025,
    category: 'economy',
    categoryLabel: categoryLabels.economy,
    seats: 5,
    doors: 4,
    bags: 2,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 99,
    hasAC: true,
    bodyStyle: 'sedan',
    tint: '#f0eee9',
  },
  {
    id: 'hyundai-elantra-2024',
    make: 'Hyundai',
    model: 'Elantra',
    year: 2024,
    category: 'sedan',
    categoryLabel: categoryLabels.sedan,
    seats: 5,
    doors: 4,
    bags: 2,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 149,
    originalPricePerDay: 175,
    discountPercent: 15,
    hasAC: true,
    bodyStyle: 'sedan',
    tint: '#eef2f4',
  },
  {
    id: 'hyundai-sonata-2024',
    make: 'Hyundai',
    model: 'Sonata',
    year: 2024,
    category: 'sedan',
    categoryLabel: categoryLabels.sedan,
    seats: 5,
    doors: 4,
    bags: 3,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 179,
    hasAC: true,
    bodyStyle: 'sedan',
    tint: '#eef1f0',
  },
  {
    id: 'toyota-camry-2023',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    category: 'luxury',
    categoryLabel: categoryLabels.luxury,
    seats: 5,
    doors: 4,
    bags: 2,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 235,
    hasAC: true,
    bodyStyle: 'sedan',
    tint: '#f1eee6',
  },
  {
    id: 'lexus-es250-2023',
    make: 'Lexus',
    model: 'ES 250',
    year: 2023,
    category: 'luxury',
    categoryLabel: categoryLabels.luxury,
    seats: 5,
    doors: 4,
    bags: 3,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 320,
    hasAC: true,
    bodyStyle: 'coupe',
    tint: '#efeee9',
  },
  {
    id: 'hyundai-staria-2024',
    make: 'Hyundai',
    model: 'Staria',
    year: 2024,
    category: 'van',
    categoryLabel: categoryLabels.van,
    seats: 8,
    doors: 4,
    bags: 6,
    fuel: 'petrol',
    fuelLabel: 'بنزين',
    transmission: 'automatic',
    transmissionLabel: 'أوتوماتيك',
    pricePerDay: 289,
    hasAC: true,
    bodyStyle: 'van',
    tint: '#eef0f1',
  },
];

export const featuredCarIds = ['hyundai-elantra-2024', 'toyota-camry-2023'];

export function getCarById(id: string): Car | undefined {
  return cars.find((c) => c.id === id);
}

export function formatSAR(amount: number): string {
  return amount.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
