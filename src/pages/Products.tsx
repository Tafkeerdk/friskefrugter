import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState(productsList);
  const [totalProducts, setTotalProducts] = useState(productsList.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const loadMoreProducts = async () => {
    setIsLoadingMore(true);
    try {
      // Simulate loading more products
      const newProducts = [
        {
          id: "13",
          name: "Nytt produkt",
          image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=800",
          category: "fruit",
          price: 29.95,
          isLoggedIn: false,
        },
        {
          id: "14",
          name: "Nytt produkt",
          image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800",
          category: "vegetables",
          price: 12.95,
          isLoggedIn: false,
        },
      ];
      setDisplayedProducts([...displayedProducts, ...newProducts]);
      setTotalProducts(totalProducts + newProducts.length);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vores Produkter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Friske råvarer af højeste kvalitet til din virksomhed
            </p>
          </div>

          {/* Filters */}
          <ProductFilters 
            onFilterChange={setCategory}
            onSortChange={setSort}
            onSearchChange={setSearch}
          />

          {/* Results count */}
          {sortedProducts.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Viser {sortedProducts.length} af {totalProducts} produkter
                {category !== "all" && ` i ${category}`}
                {search && ` for "${search}"`}
              </p>
            </div>
          )}

          {/* Products Grid */}
          <div className="content-width">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ingen produkter fundet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {search || category !== "all"
                      ? "Prøv at ændre dine søgekriterier eller filtrer" 
                      : "Der er ingen produkter tilgængelige i øjeblikket"
                    }
                  </p>
                  {(search || category !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearch('');
                        setCategory('all');
                      }}
                    >
                      Ryd filtre
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    image={product.image}
                    category={product.category}
                    price={product.price}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {!isLoading && sortedProducts.length > 0 && sortedProducts.length < totalProducts && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
                className="btn-brand-primary"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Indlæser...
                  </>
                ) : (
                  <>
                    Indlæs flere produkter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
