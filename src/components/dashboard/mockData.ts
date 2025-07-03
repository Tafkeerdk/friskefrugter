// Mock data for the dashboard components
import { ShoppingCart, TrendingUp, Users, DollarSign } from "lucide-react";
import React from "react";

// Dashboard stats
export const dashboardStats = [
  {
    title: "Dagens ordrer",
    value: "26",
    description: "Ordrer modtaget i dag",
    icon: ShoppingCart, // Changed from <ShoppingCart /> to just the icon component
    trend: {
      value: 12,
      isPositive: true,
    },
  },
  {
    title: "Ugens omsætning",
    value: "142.568 kr",
    description: "Samlet salg denne uge",
    icon: DollarSign, // Changed from <DollarSign /> to just the icon component
    trend: {
      value: 8,
      isPositive: true,
    },
  },
  {
    title: "Nye kunder",
    value: "4",
    description: "Nye kunder denne uge",
    icon: Users, // Changed from <Users /> to just the icon component
    trend: {
      value: 5,
      isPositive: false,
    },
  },
  {
    title: "Vækst i salg",
    value: "18%",
    description: "Sammenlignet med sidste måned",
    icon: TrendingUp, // Changed from <TrendingUp /> to just the icon component
    trend: {
      value: 2,
      isPositive: true,
    },
  },
];

// Sales chart data
export const salesChartData = [
  {
    name: "Man",
    sales: 18500,
  },
  {
    name: "Tirs",
    sales: 22300,
  },
  {
    name: "Ons",
    sales: 28400,
  },
  {
    name: "Tors",
    sales: 24900,
  },
  {
    name: "Fre",
    sales: 31800,
  },
  {
    name: "Lør",
    sales: 19700,
  },
  {
    name: "Søn",
    sales: 15200,
  },
];

// Popular products
export const popularProducts = [
  {
    id: "1",
    name: "Økologiske æbler",
    image: "/placeholder.svg",
    sales: 128,
    status: "available" as const,
  },
  {
    id: "2",
    name: "Friske jordbær",
    image: "https://invalid-url-test.example/nonexistent.jpg",
    sales: 96,
    status: "low" as const,
  },
  {
    id: "3",
    name: "Grønne bananer",
    image: "/placeholder.svg",
    sales: 84,
    status: "available" as const,
  },
  {
    id: "4",
    name: "Avocado",
    image: "",
    sales: 72,
    status: "out" as const,
  },
];

// Order statuses
export const orderStatuses = [
  {
    status: "Kladde",
    count: 10,
    variant: "outline" as const,
  },
  {
    status: "Bekræftet",
    count: 25,
    variant: "secondary" as const,
  },
  {
    status: "Pakket",
    count: 18,
    variant: "default" as const,
  },
  {
    status: "Leveret",
    count: 47,
    variant: "default" as const,
  },
  {
    status: "Annulleret",
    count: 8,
    variant: "destructive" as const,
  },
];

// Recent activities
export const recentActivities = [
  {
    id: "1",
    type: "order" as const,
    title: "Ny ordre modtaget",
    description: "Restaurant Solskin (#12345)",
    time: "For 10 minutter siden",
  },
  {
    id: "2",
    type: "payment" as const,
    title: "Betaling modtaget",
    description: "Café Vest (#12340)",
    time: "For 45 minutter siden",
  },
  {
    id: "3",
    type: "shipping" as const,
    title: "Ordre klar til levering",
    description: "Hotel Nordlys (#12330)",
    time: "For 1 time siden",
  },
  {
    id: "4",
    type: "delivery" as const,
    title: "Ordre leveret",
    description: "Restaurant Havnefront (#12325)",
    time: "For 3 timer siden",
  },
];

// Product list
export const products = [
  {
    id: "1",
    name: "Økologiske æbler",
    category: "Frugt",
    price: "24,95 kr",
    stock: 128,
    status: "instock",
    image: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Friske jordbær",
    category: "Bær",
    price: "39,95 kr",
    stock: 12,
    status: "lowstock",
    image: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Grønne bananer",
    category: "Frugt",
    price: "19,95 kr",
    stock: 84,
    status: "instock",
    image: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Avocado",
    category: "Frugt",
    price: "15,95 kr",
    stock: 0,
    status: "outofstock",
    image: "/placeholder.svg",
  },
  {
    id: "5",
    name: "Økologisk mælk",
    category: "Mejeriprodukter",
    price: "12,95 kr",
    stock: 45,
    status: "instock",
    image: "/placeholder.svg",
  },
  {
    id: "6",
    name: "Økologisk yoghurt",
    category: "Mejeriprodukter",
    price: "18,95 kr",
    stock: 32,
    status: "instock",
    image: "/placeholder.svg",
  },
];

// Orders list
export const orders = [
  {
    id: "12345",
    customer: {
      name: "Restaurant Solskin",
      initials: "RS",
    },
    date: "19 Apr 2025",
    status: "Bekræftet",
    amount: "2.480 kr",
  },
  {
    id: "12344",
    customer: {
      name: "Café Vest",
      initials: "CV",
    },
    date: "18 Apr 2025",
    status: "Leveret",
    amount: "1.850 kr",
  },
  {
    id: "12343",
    customer: {
      name: "Hotel Nordlys",
      initials: "HN",
    },
    date: "17 Apr 2025",
    status: "Pakket",
    amount: "5.670 kr",
  },
  {
    id: "12342",
    customer: {
      name: "Restaurant Havnefront",
      initials: "RH",
    },
    date: "16 Apr 2025",
    status: "Betalt",
    amount: "3.290 kr",
  },
  {
    id: "12341",
    customer: {
      name: "Kantinen A/S",
      initials: "KA",
    },
    date: "15 Apr 2025",
    status: "Annulleret",
    amount: "1.350 kr",
  },
];

// Invoices
export const invoices = [
  {
    id: "INV-001",
    customer: "Restaurant Solskin",
    date: "19 Apr 2025",
    amount: "2.480 kr",
    status: "Betalt",
  },
  {
    id: "INV-002",
    customer: "Café Vest",
    date: "18 Apr 2025",
    amount: "1.850 kr",
    status: "Betalt",
  },
  {
    id: "INV-003",
    customer: "Hotel Nordlys",
    date: "17 Apr 2025",
    amount: "5.670 kr",
    status: "Afventer",
  },
  {
    id: "INV-004",
    customer: "Restaurant Havnefront",
    date: "16 Apr 2025",
    amount: "3.290 kr",
    status: "Afventer",
  },
  {
    id: "INV-005",
    customer: "Kantinen A/S",
    date: "15 Apr 2025",
    amount: "1.350 kr",
    status: "Fejlet",
  },
];

// Customers
export const customers = [
  {
    id: "1",
    name: "Restaurant Solskin",
    type: "A",
    email: "kontakt@restaurantsolskin.dk",
    phone: "+45 12 34 56 78",
    cvr: "12345678",
    lastOrder: "19 Apr 2025",
  },
  {
    id: "2",
    name: "Café Vest",
    type: "B",
    email: "info@cafevest.dk",
    phone: "+45 23 45 67 89",
    cvr: "23456789",
    lastOrder: "18 Apr 2025",
  },
  {
    id: "3",
    name: "Hotel Nordlys",
    type: "A",
    email: "reception@hotelnordlys.dk",
    phone: "+45 34 56 78 90",
    cvr: "34567890",
    lastOrder: "17 Apr 2025",
  },
  {
    id: "4",
    name: "Restaurant Havnefront",
    type: "A",
    email: "booking@havnefront.dk",
    phone: "+45 45 67 89 01",
    cvr: "45678901",
    lastOrder: "16 Apr 2025",
  },
  {
    id: "5",
    name: "Kantinen A/S",
    type: "C",
    email: "kantine@kantinen.dk",
    phone: "+45 56 78 90 12",
    cvr: "56789012",
    lastOrder: "15 Apr 2025",
  },
];
