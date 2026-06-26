import { Category } from './types';

const linear = (factor: number) => ({ 
  toBase: (v: number) => v * factor, 
  fromBase: (v: number) => v / factor 
});

export const initialCategories: Category[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { name: 'Meters', ...linear(1) },
      { name: 'Kilometers', ...linear(1000) },
      { name: 'Miles', ...linear(1609.34) },
    ],
  },
  {
    id: 'weight',
    name: 'Weight',
    units: [
      { name: 'Grams', ...linear(1) },
      { name: 'Kilograms', ...linear(1000) },
      { name: 'Pounds', ...linear(453.592) },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { name: 'Celsius', toBase: v => v + 273.15, fromBase: v => v - 273.15 },
      { name: 'Fahrenheit', toBase: v => (v - 32) * 5/9 + 273.15, fromBase: v => (v - 273.15) * 9/5 + 32 },
      { name: 'Kelvin', toBase: v => v, fromBase: v => v },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { name: 'Square Meters', ...linear(1) },
      { name: 'Square Kilometers', ...linear(1000000) },
      { name: 'Square Miles', ...linear(2589988) },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { name: 'Liters', ...linear(1) },
      { name: 'Milliliters', ...linear(0.001) },
      { name: 'Cubic Meters', ...linear(1000) },
      { name: 'Gallons', ...linear(3.785) },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { name: 'Meters/Sec', ...linear(1) },
      { name: 'Km/Hour', ...linear(1/3.6) },
      { name: 'Miles/Hour', ...linear(0.44704) },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { name: 'Seconds', ...linear(1) },
      { name: 'Minutes', ...linear(60) },
      { name: 'Hours', ...linear(3600) },
      { name: 'Days', ...linear(86400) },
    ],
  },
  {
    id: 'data',
    name: 'Data Storage',
    units: [
      { name: 'Bytes', ...linear(1) },
      { name: 'Kilobytes', ...linear(1024) },
      { name: 'Megabytes', ...linear(1024*1024) },
      { name: 'Gigabytes', ...linear(1024*1024*1024) },
      { name: 'Terabytes', ...linear(1024*1024*1024*1024) },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { name: 'Pascals', ...linear(1) },
      { name: 'Bar', ...linear(100000) },
      { name: 'PSI', ...linear(6894.76) },
    ],
  },
  {
    id: 'force',
    name: 'Force',
    units: [
      { name: 'Newtons', ...linear(1) },
      { name: 'Kilonewtons', ...linear(1000) },
    ],
  },
  {
    id: 'science',
    name: 'Science (Energy)',
    units: [
      { name: 'Joules', ...linear(1) },
      { name: 'Calories', ...linear(4.184) },
    ],
  },
  {
    id: 'currency',
    name: 'Currency',
    units: [],
    isCurrency: true,
  },
];
