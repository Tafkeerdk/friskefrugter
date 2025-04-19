
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

interface ProductFiltersProps {
  onFilterChange?: (category: string) => void;
  onSortChange?: (sort: string) => void;
  onSearchChange?: (search: string) => void;
}

export function ProductFilters({ 
  onFilterChange, 
  onSortChange, 
  onSearchChange 
}: ProductFiltersProps) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [search, setSearch] = useState("");

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (onFilterChange) onFilterChange(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    if (onSortChange) onSortChange(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Søg efter produkter..."
          className="pl-10"
          value={search}
          onChange={handleSearchChange}
        />
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Kategori:</span> 
              <span className="font-medium capitalize">{category}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup value={category} onValueChange={handleCategoryChange}>
              <DropdownMenuRadioItem value="all">Alle produkter</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="fruit">Frugt</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="vegetables">Grøntsager</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dairy">Mejeri</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="organic">Økologisk</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <span className="hidden sm:inline">Sortering:</span>
              <span className="font-medium capitalize">{sort}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup value={sort} onValueChange={handleSortChange}>
              <DropdownMenuRadioItem value="name">Navn (A-Å)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">Navn (Å-A)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price">Pris (Lav-Høj)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-desc">Pris (Høj-Lav)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="newest">Nyeste</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
