
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { useState } from "react";

// Sample product data
const productsList = [
  {
    id: "1",
    name: "Økologiske Æbler",
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=800",
    category: "fruit",
    price: 29.95,
    isLoggedIn: false,
  },
  {
    id: "2",
    name: "Danske Gulerødder",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800",
    category: "vegetables",
    price: 12.95,
    isLoggedIn: false,
  },
  {
    id: "3",
    name: "Friske Jordbær",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=800",
    category: "fruit",
    price: 39.95,
    isLoggedIn: false,
  },
  {
    id: "4",
    name: "Økologisk Mælk",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=800",
    category: "dairy",
    price: 14.95,
    isLoggedIn: false,
  },
  {
    id: "5",
    name: "Økologiske Tomater",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800",
    category: "vegetables",
    price: 24.95,
    isLoggedIn: false,
  },
  {
    id: "6",
    name: "Danske Kartofler",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800",
    category: "vegetables",
    price: 19.95,
    isLoggedIn: false,
  },
  {
    id: "7",
    name: "Økologisk Ost",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=800",
    category: "dairy",
    price: 59.95,
    isLoggedIn: false,
  },
  {
    id: "8",
    name: "Frisk Spinat",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800",
    category: "vegetables",
    price: 17.95,
    isLoggedIn: false,
  },
  {
    id: "9",
    name: "Bananer",
    image: "https://images.unsplash.com/photo-1543218024-57a70143c369?auto=format&fit=crop&q=80&w=800",
    category: "fruit",
    price: 24.95,
    isLoggedIn: false,
  },
  {
    id: "10",
    name: "Økologisk Smør",
    image: "https://images.unsplash.com/photo-1589985270958-bf087fee9cc6?auto=format&fit=crop&q=80&w=800",
    category: "dairy",
    price: 39.95,
    isLoggedIn: false,
  },
  {
    id: "11",
    name: "Friske Agurker",
    image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&q=80&w=800",
    category: "vegetables",
    price: 14.95,
    isLoggedIn: false,
  },
  {
    id: "12",
    name: "Økologiske Appelsiner",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?auto=format&fit=crop&q=80&w=800",
    category: "fruit",
    price: 34.95,
    isLoggedIn: false,
  },
];

const Products = () => {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [search, setSearch] = useState("");

  // Filter products based on category and search
  const filteredProducts = productsList.filter(product => {
    const matchesCategory = category === "all" || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Produktkatalog</h1>
            <p className="text-gray-600">
              Udforsk vores brede udvalg af friske frugt, grønt og mejeriprodukter til din virksomhed.
            </p>
          </div>

          <ProductFilters 
            onFilterChange={setCategory}
            onSortChange={setSort}
            onSearchChange={setSearch}
          />

          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Ingen produkter fundet</h3>
              <p className="text-gray-600">Prøv at ændre dine filtreringsvalg eller søgning.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
